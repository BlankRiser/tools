import { inflateSync, unzlibSync } from "fflate";
import {
  PDFArray,
  PDFBool,
  PDFCatalog,
  type PDFContext,
  PDFDict,
  PDFHexString,
  PDFInvalidObject,
  PDFName,
  PDFNumber,
  type PDFObject,
  PDFObjectParser,
  PDFPageLeaf,
  PDFPageTree,
  PDFParser,
  PDFRawStream,
  PDFRef,
  PDFString,
  PDFWriter,
  decodePDFRawStream,
} from "pdf-lib";

export type PdfEncryptionAlgorithm = "AES-256" | "AES-128" | "RC4";

export interface PdfEncryptionStatus {
  encrypted: boolean;
  algorithm?: PdfEncryptionAlgorithm;
  version?: number;
  revision?: number;
  keyLength?: number;
}

type CipherMethod = "None" | "V2" | "AESV2" | "AESV3";

interface EncryptParams {
  version: number;
  revision: number;
  algorithm: PdfEncryptionAlgorithm;
  keyLength: number; // in bytes
  candidateKeyLengths: number[]; // in bytes
  permissions: number;
  ownerKey: Uint8Array;
  userKey: Uint8Array;
  ownerEncryptKey?: Uint8Array;
  userEncryptKey?: Uint8Array;
  perms?: Uint8Array;
  fileId: Uint8Array;
  encryptMetadata: boolean;
  encryptRef: PDFRef | null;
  encryptDict: PDFDict;
  stmCipher: CipherMethod;
  strCipher: CipherMethod;
  effCipher: CipherMethod;
  cfDict?: PDFDict;
}

interface ParsedItem {
  kind: "direct" | "objstm";
  ref: PDFRef;
  obj: PDFObject;
}

interface ParsedEncryptedPdf {
  context: PDFContext;
  parsedItems: ParsedItem[];
  streamStartOffsets: WeakMap<PDFRawStream, number>;
  xrefTrailerDicts: PDFDict[];
}

// Standard 32-byte PDF encryption padding string (ISO 32000-1 §7.6.3.3)
const PADDING = new Uint8Array([
  0x28, 0xbf, 0x4e, 0x5e, 0x4e, 0x75, 0x8a, 0x41, 0x64, 0x00, 0x4e, 0x56, 0xff, 0xfa, 0x01, 0x08,
  0x2e, 0x2e, 0x00, 0xb6, 0xd0, 0x68, 0x3e, 0x80, 0x2f, 0x0c, 0xa9, 0xfe, 0x64, 0x53, 0x69, 0x7a,
]);

const KW_STREAM = [0x73, 0x74, 0x72, 0x65, 0x61, 0x6d]; // "stream"
const KW_ENDSTREAM = [0x65, 0x6e, 0x64, 0x73, 0x74, 0x72, 0x65, 0x61, 0x6d]; // "endstream"
const KW_CRLF_ENDSTREAM = [0x0d, 0x0a, ...KW_ENDSTREAM];
const KW_CR_ENDSTREAM = [0x0d, ...KW_ENDSTREAM];
const KW_LF_ENDSTREAM = [0x0a, ...KW_ENDSTREAM];
const KW_ENDOBJ = [0x65, 0x6e, 0x64, 0x6f, 0x62, 0x6a]; // "endobj"

// PDFDocEncoding differences from Latin-1 (ISO 32000-2 Table D.2)
const PDFDOC_DIFFS: Record<number, number> = {
  0x16: 0x0017,
  0x18: 0x02d8,
  0x19: 0x02c7,
  0x1a: 0x02c6,
  0x1b: 0x02d9,
  0x1c: 0x02dd,
  0x1d: 0x02db,
  0x1e: 0x02da,
  0x1f: 0x02dc,
  0x7f: -1,
  0x80: 0x2022,
  0x81: 0x2020,
  0x82: 0x2021,
  0x83: 0x2026,
  0x84: 0x2014,
  0x85: 0x2013,
  0x86: 0x0192,
  0x87: 0x2044,
  0x88: 0x2039,
  0x89: 0x203a,
  0x8a: 0x2212,
  0x8b: 0x2030,
  0x8c: 0x201e,
  0x8d: 0x201c,
  0x8e: 0x201d,
  0x8f: 0x2018,
  0x90: 0x2019,
  0x91: 0x201a,
  0x92: 0x2122,
  0x93: 0xfb01,
  0x94: 0xfb02,
  0x95: 0x0141,
  0x96: 0x0152,
  0x97: 0x0160,
  0x98: 0x0178,
  0x99: 0x017d,
  0x9a: 0x0131,
  0x9b: 0x0142,
  0x9c: 0x0153,
  0x9d: 0x0161,
  0x9e: 0x017e,
  0x9f: -1,
  0xa0: 0x20ac,
  0xad: -1,
};

const UNICODE_TO_PDFDOC = (() => {
  const map = new Map<number, number>();
  for (let byte = 0; byte < 256; byte++) {
    const cp = byte in PDFDOC_DIFFS ? PDFDOC_DIFFS[byte] : byte;
    if (cp < 0) continue;
    if (map.get(cp) === cp) continue;
    map.set(cp, byte);
  }
  return map;
})();

// ========== Low-Level Byte & Crypto Helpers ==========

function concat(...arrays: Uint8Array[]): Uint8Array {
  const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

function arraysEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function bytesToHex(bytes: Uint8Array): string {
  let out = "";
  for (let i = 0; i < bytes.length; i++) {
    out += bytes[i].toString(16).padStart(2, "0");
  }
  return out;
}

/**
 * Decodes a PDF hex string (ignoring any embedded whitespace per ISO 32000-1 §7.3.4.3).
 */
function hexStringToBytes(rawHex: string): Uint8Array {
  const cleaned = rawHex.replace(/[^0-9a-fA-F]/g, "");
  const padded = cleaned.length % 2 === 1 ? `${cleaned}0` : cleaned;
  const bytes = new Uint8Array(padded.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = Number.parseInt(padded.slice(i * 2, i * 2 + 2), 16) || 0;
  }
  return bytes;
}

/**
 * Decodes a PDF literal string `(...)`'s inner raw value into bytes per ISO 32000-1 §7.3.4.2,
 * properly handling `\<CR><LF>` two-byte line continuations and `\\` escapes.
 */
function literalStringValueToBytes(raw: string): Uint8Array {
  const bytes: number[] = [];
  let i = 0;
  const len = raw.length;

  while (i < len) {
    const code = raw.charCodeAt(i) & 0xff;
    if (code !== 0x5c) {
      // Unescaped CR or CRLF in literal string -> LF (0x0A) per ISO 32000-1 §7.3.4.2
      // Wait: for binary encrypted strings, preserve raw byte unless CRLF
      bytes.push(code);
      i++;
      continue;
    }

    // Backslash escape
    i++;
    if (i >= len) break;
    const esc = raw.charCodeAt(i) & 0xff;

    if (esc === 0x0d) {
      // \<CR> or \<CR><LF> line continuation
      i++;
      if (i < len && (raw.charCodeAt(i) & 0xff) === 0x0a) {
        i++;
      }
      continue;
    }
    if (esc === 0x0a) {
      // \<LF> line continuation
      i++;
      continue;
    }
    if (esc === 0x6e) {
      bytes.push(0x0a); // \n
      i++;
    } else if (esc === 0x72) {
      bytes.push(0x0d); // \r
      i++;
    } else if (esc === 0x74) {
      bytes.push(0x09); // \t
      i++;
    } else if (esc === 0x62) {
      bytes.push(0x08); // \b
      i++;
    } else if (esc === 0x66) {
      bytes.push(0x0c); // \f
      i++;
    } else if (esc === 0x28) {
      bytes.push(0x28); // \(
      i++;
    } else if (esc === 0x29) {
      bytes.push(0x29); // \)
      i++;
    } else if (esc === 0x5c) {
      bytes.push(0x5c); // \\
      i++;
    } else if (esc >= 0x30 && esc <= 0x37) {
      // 1 to 3 octal digits
      let octal = raw[i];
      i++;
      if (i < len && raw.charCodeAt(i) >= 0x30 && raw.charCodeAt(i) <= 0x37) {
        octal += raw[i];
        i++;
        if (i < len && raw.charCodeAt(i) >= 0x30 && raw.charCodeAt(i) <= 0x37) {
          octal += raw[i];
          i++;
        }
      }
      bytes.push(Number.parseInt(octal, 8) & 0xff);
    } else {
      bytes.push(esc);
      i++;
    }
  }

  return new Uint8Array(bytes);
}

/**
 * Encodes decrypted bytes into a safe escaped value for `PDFString.value`
 * so `pdf-lib` serializes balanced, valid literal strings `(...)`.
 */
function bytesToPdfLiteralStringValue(bytes: Uint8Array): string {
  let out = "";
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i];
    if (b === 0x5c) out += "\\\\";
    else if (b === 0x28) out += "\\(";
    else if (b === 0x29) out += "\\)";
    else if (b === 0x0d) out += "\\r";
    else if (b === 0x0a) out += "\\n";
    else out += String.fromCharCode(b);
  }
  return out;
}

/**
 * Extracts raw bytes from a `PDFHexString` or `PDFString`.
 */
function extractBytes(pdfObj: unknown): Uint8Array | null {
  if (!pdfObj) return null;
  if (pdfObj instanceof PDFHexString) {
    return hexStringToBytes(pdfObj.asString());
  }
  if (pdfObj instanceof PDFString) {
    return literalStringValueToBytes(pdfObj.asString());
  }
  const str = String(pdfObj);
  if (str.startsWith("<") && str.endsWith(">")) {
    return hexStringToBytes(str.slice(1, -1));
  }
  if (str.startsWith("(") && str.endsWith(")")) {
    return literalStringValueToBytes(str.slice(1, -1));
  }
  return null;
}

/**
 * MD5 digest (RFC 1321) for PDF RC4 & AES-128 key derivation.
 */
function md5(data: Uint8Array): Uint8Array {
  const S = [
    7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9,
    14, 20, 5, 9, 14, 20, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 6, 10, 15,
    21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
  ];

  const K = new Uint32Array([
    0xd76aa478, 0xe8c7b756, 0x242070db, 0xc1bdceee, 0xf57c0faf, 0x4787c62a, 0xa8304613, 0xfd469501,
    0x698098d8, 0x8b44f7af, 0xffff5bb1, 0x895cd7be, 0x6b901122, 0xfd987193, 0xa679438e, 0x49b40821,
    0xf61e2562, 0xc040b340, 0x265e5a51, 0xe9b6c7aa, 0xd62f105d, 0x02441453, 0xd8a1e681, 0xe7d3fbc8,
    0x21e1cde6, 0xc33707d6, 0xf4d50d87, 0x455a14ed, 0xa9e3e905, 0xfcefa3f8, 0x676f02d9, 0x8d2a4c8a,
    0xfffa3942, 0x8771f681, 0x6d9d6122, 0xfde5380c, 0xa4beea44, 0x4bdecfa9, 0xf6bb4b60, 0xbebfbc70,
    0x289b7ec6, 0xeaa127fa, 0xd4ef3085, 0x04881d05, 0xd9d4d039, 0xe6db99e5, 0x1fa27cf8, 0xc4ac5665,
    0xf4292244, 0x432aff97, 0xab9423a7, 0xfc93a039, 0x655b59c3, 0x8f0ccc92, 0xffeff47d, 0x85845dd1,
    0x6fa87e4f, 0xfe2ce6e0, 0xa3014314, 0x4e0811a1, 0xf7537e82, 0xbd3af235, 0x2ad7d2bb, 0xeb86d391,
  ]);

  let a0 = 0x67452301;
  let b0 = 0xefcdab89;
  let c0 = 0x98badcfe;
  let d0 = 0x10325476;

  const msgLen = data.length;
  const msgBitLen = msgLen * 8;
  const msgLenPadded = (msgLen + 9 + 63) & ~63;
  const msg = new Uint8Array(msgLenPadded);
  msg.set(data);
  msg[msgLen] = 0x80;

  const dataView = new DataView(msg.buffer);
  dataView.setUint32(msgLenPadded - 8, msgBitLen >>> 0, true);
  dataView.setUint32(msgLenPadded - 4, Math.floor(msgBitLen / 0x100000000) >>> 0, true);

  for (let offset = 0; offset < msgLenPadded; offset += 64) {
    const chunk = new Uint32Array(msg.buffer, offset, 16);
    let a = a0;
    let b = b0;
    let c = c0;
    let d = d0;

    for (let i = 0; i < 64; i++) {
      let f: number;
      let g: number;
      if (i < 16) {
        f = (b & c) | (~b & d);
        g = i;
      } else if (i < 32) {
        f = (d & b) | (~d & c);
        g = (5 * i + 1) % 16;
      } else if (i < 48) {
        f = b ^ c ^ d;
        g = (3 * i + 5) % 16;
      } else {
        f = c ^ (b | ~d);
        g = (7 * i) % 16;
      }

      f = (f + a + K[i] + chunk[g]) >>> 0;
      a = d;
      d = c;
      c = b;
      b = (b + ((f << S[i]) | (f >>> (32 - S[i])))) >>> 0;
    }

    a0 = (a0 + a) >>> 0;
    b0 = (b0 + b) >>> 0;
    c0 = (c0 + c) >>> 0;
    d0 = (d0 + d) >>> 0;
  }

  const result = new Uint8Array(16);
  const view = new DataView(result.buffer);
  view.setUint32(0, a0, true);
  view.setUint32(4, b0, true);
  view.setUint32(8, c0, true);
  view.setUint32(12, d0, true);
  return result;
}

/**
 * RC4 symmetric stream cipher.
 */
class RC4 {
  private s = new Uint8Array(256);
  private i = 0;
  private j = 0;

  constructor(key: Uint8Array) {
    for (let i = 0; i < 256; i++) {
      this.s[i] = i;
    }
    let j = 0;
    for (let i = 0; i < 256; i++) {
      j = (j + this.s[i] + key[i % key.length]) & 0xff;
      const tmp = this.s[i];
      this.s[i] = this.s[j];
      this.s[j] = tmp;
    }
  }

  process(data: Uint8Array): Uint8Array {
    const result = new Uint8Array(data.length);
    for (let k = 0; k < data.length; k++) {
      this.i = (this.i + 1) & 0xff;
      this.j = (this.j + this.s[this.i]) & 0xff;
      const tmp = this.s[this.i];
      this.s[this.i] = this.s[this.j];
      this.s[this.j] = tmp;
      const t = (this.s[this.i] + this.s[this.j]) & 0xff;
      result[k] = data[k] ^ this.s[t];
    }
    return result;
  }
}

async function sha256(data: Uint8Array): Promise<Uint8Array> {
  const hash = await crypto.subtle.digest("SHA-256", data as unknown as BufferSource);
  return new Uint8Array(hash);
}

async function sha384(data: Uint8Array): Promise<Uint8Array> {
  const hash = await crypto.subtle.digest("SHA-384", data as unknown as BufferSource);
  return new Uint8Array(hash);
}

async function sha512(data: Uint8Array): Promise<Uint8Array> {
  const hash = await crypto.subtle.digest("SHA-512", data as unknown as BufferSource);
  return new Uint8Array(hash);
}

async function aes128CbcEncryptNoPad(data: Uint8Array, key: Uint8Array, iv: Uint8Array): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey("raw", key as unknown as BufferSource, "AES-CBC", false, ["encrypt"]);
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-CBC", iv: iv as unknown as BufferSource },
    cryptoKey,
    data as unknown as BufferSource,
  );
  return new Uint8Array(encrypted).slice(0, data.byteLength);
}

async function importAesDecryptKey(key: Uint8Array): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", key as unknown as BufferSource, "AES-CBC", false, ["encrypt", "decrypt"]);
}

/**
 * Decrypts AES-CBC without requiring PKCS#7 padding in the ciphertext by appending a forged PKCS#7 block.
 */
async function aesCbcDecryptNoPadWithKey(ciphertext: Uint8Array, cryptoKey: CryptoKey, iv: Uint8Array): Promise<Uint8Array> {
  if (ciphertext.length === 0) return new Uint8Array(0);
  const lastBlock = ciphertext.subarray(ciphertext.length - 16);
  const xored = new Uint8Array(16);
  for (let i = 0; i < 16; i++) {
    xored[i] = lastBlock[i] ^ 0x10;
  }
  const zeroIV = new Uint8Array(16);
  const encResult = await crypto.subtle.encrypt(
    { name: "AES-CBC", iv: zeroIV as unknown as BufferSource },
    cryptoKey,
    xored as unknown as BufferSource,
  );
  const cFake = new Uint8Array(encResult).subarray(0, 16);
  const extended = concat(ciphertext, cFake);
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-CBC", iv: iv as unknown as BufferSource },
    cryptoKey,
    extended as unknown as BufferSource,
  );
  return new Uint8Array(decrypted).slice(0, ciphertext.length);
}

async function aes256CbcDecryptNoPad(ciphertext: Uint8Array, key: Uint8Array, iv: Uint8Array): Promise<Uint8Array> {
  const cryptoKey = await importAesDecryptKey(key.subarray(0, 32));
  return aesCbcDecryptNoPadWithKey(ciphertext, cryptoKey, iv);
}

/**
 * Decrypts an AES-128-CBC or AES-256-CBC blob (16-byte IV prepended).
 * Falls back to unpadded AES-CBC decryption if the PDF creator omitted or mangled PKCS#7 padding.
 */
async function decryptAesCbcBlobWithKey(data: Uint8Array, cryptoKey: CryptoKey): Promise<Uint8Array> {
  if (data.length <= 16) {
    return new Uint8Array(0);
  }

  const iv = data.subarray(0, 16);
  let ciphertext = data.subarray(16);

  if (ciphertext.length % 16 !== 0) {
    const alignedLen = ciphertext.length - (ciphertext.length % 16);
    if (alignedLen <= 0) return new Uint8Array(0);
    ciphertext = ciphertext.subarray(0, alignedLen);
  }

  try {
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-CBC", iv: iv as unknown as BufferSource },
      cryptoKey,
      ciphertext as unknown as BufferSource,
    );
    return new Uint8Array(decrypted);
  } catch {
    // Fallback for streams/strings where the producer omitted PKCS#7 padding on block-aligned data
    try {
      const plain = await aesCbcDecryptNoPadWithKey(ciphertext, cryptoKey, iv);
      if (plain.length >= 16) {
        let psLen = plain[plain.length - 1];
        if (psLen >= 1 && psLen <= 16) {
          for (let i = plain.length - 1; i >= plain.length - psLen; i--) {
            if (plain[i] !== psLen) {
              psLen = 0;
              break;
            }
          }
          if (psLen > 0) {
            return plain.subarray(0, plain.length - psLen);
          }
        }
      }
      return plain;
    } catch {
      return data;
    }
  }
}

/**
 * Algorithm 2.B (ISO 32000-2:2020) for AES-256 Revision 6.
 */
async function computeHash2B(password: Uint8Array, salt: Uint8Array, userKey: Uint8Array): Promise<Uint8Array> {
  const input = concat(password, salt, userKey);
  let K: Uint8Array = await sha256(input);

  let i = 0;
  let E: Uint8Array = new Uint8Array(0);

  while (true) {
    const block = concat(password, K, userKey);
    const K1 = new Uint8Array(block.length * 64);
    for (let j = 0; j < 64; j++) {
      K1.set(block, j * block.length);
    }

    const aesKey = K.subarray(0, 16);
    const aesIV = K.subarray(16, 32);
    E = await aes128CbcEncryptNoPad(K1, aesKey, aesIV);

    let byteSum = 0;
    for (let j = 0; j < 16; j++) {
      byteSum += E[j];
    }
    const hashSelect = byteSum % 3;

    if (hashSelect === 0) {
      K = await sha256(E);
    } else if (hashSelect === 1) {
      K = await sha384(E);
    } else {
      K = await sha512(E);
    }

    i++;
    if (i >= 64 && E[E.length - 1] <= i - 32) {
      break;
    }
  }

  return K.slice(0, 32);
}

/**
 * Algorithm 1 / 1.A — Per-object key derivation for RC4 (`isAes = false`) and AES-128 (`isAes = true`).
 */
function buildObjectKey(objectNum: number, generationNum: number, encryptionKey: Uint8Array, isAes: boolean): Uint8Array {
  const n = encryptionKey.length;
  const keyInput = new Uint8Array(n + (isAes ? 9 : 5));
  keyInput.set(encryptionKey, 0);
  let i = n;
  keyInput[i++] = objectNum & 0xff;
  keyInput[i++] = (objectNum >> 8) & 0xff;
  keyInput[i++] = (objectNum >> 16) & 0xff;
  keyInput[i++] = generationNum & 0xff;
  keyInput[i++] = (generationNum >> 8) & 0xff;
  if (isAes) {
    // Append 'sAlT' (0x73, 0x41, 0x6C, 0x54) per ISO 32000-1 §7.6.2 Algorithm 1 step b
    keyInput[i++] = 0x73;
    keyInput[i++] = 0x41;
    keyInput[i++] = 0x6c;
    keyInput[i++] = 0x54;
  }
  const digest = md5(keyInput);
  return digest.slice(0, Math.min(n + 5, 16));
}

// ========== Password Encoding Helpers ==========

function encodePasswordPdfDoc(password: string): Uint8Array | null {
  const bytes: number[] = [];
  for (const char of password) {
    const cp = char.codePointAt(0);
    if (cp === undefined) continue;
    const mapped = UNICODE_TO_PDFDOC.get(cp);
    if (mapped === undefined) return null;
    bytes.push(mapped);
  }
  return new Uint8Array(bytes);
}

function encodePasswordLatin1(password: string): Uint8Array {
  const bytes = new Uint8Array(password.length);
  for (let i = 0; i < password.length; i++) {
    bytes[i] = password.charCodeAt(i) & 0xff;
  }
  return bytes;
}

function encodePasswordUtf8(password: string): Uint8Array {
  return new TextEncoder().encode(password);
}

function getCandidatePasswordByteArraysLegacy(password: string): Uint8Array[] {
  const results: Uint8Array[] = [];
  const addUnique = (arr: Uint8Array | null) => {
    if (!arr) return;
    if (!results.some((existing) => arraysEqual(existing, arr))) {
      results.push(arr);
    }
  };

  const candidates = [password];
  if (password.trim() !== password && password.trim().length > 0) {
    candidates.push(password.trim());
  }

  for (const cand of candidates) {
    addUnique(encodePasswordPdfDoc(cand));
    addUnique(encodePasswordLatin1(cand));
    addUnique(encodePasswordUtf8(cand));
  }

  return results;
}

function getCandidatePasswordByteArraysAES256(password: string): Uint8Array[] {
  const results: Uint8Array[] = [];
  const addUnique = (arr: Uint8Array) => {
    const truncated = arr.length > 127 ? arr.slice(0, 127) : arr;
    if (!results.some((existing) => arraysEqual(existing, truncated))) {
      results.push(truncated);
    }
  };

  const candidates = [password];
  if (password.trim() !== password && password.trim().length > 0) {
    candidates.push(password.trim());
  }

  for (const cand of candidates) {
    try {
      const nfkc = cand.normalize("NFKC");
      addUnique(encodePasswordUtf8(nfkc));
    } catch {
      // Ignore NFKC normalization error
    }
    addUnique(encodePasswordUtf8(cand));
    addUnique(encodePasswordLatin1(cand));
  }

  return results;
}

// ========== Standard Security Handler (R = 2, 3, 4 — RC4 & AES-128) ==========

function padPasswordBytes(pwdBytes: Uint8Array): Uint8Array {
  const padded = new Uint8Array(32);
  if (pwdBytes.length >= 32) {
    padded.set(pwdBytes.subarray(0, 32));
  } else {
    padded.set(pwdBytes);
    padded.set(PADDING.subarray(0, 32 - pwdBytes.length), pwdBytes.length);
  }
  return padded;
}

/**
 * Algorithm 2 — Computing an encryption key (ISO 32000-1 §7.6.3.3).
 */
function computeEncryptionKeyStandard(
  pwdBytes: Uint8Array,
  ownerKey: Uint8Array,
  permissions: number,
  fileId: Uint8Array,
  revision: number,
  keyLengthBytes: number,
  encryptMetadata: boolean,
): Uint8Array {
  const paddedPwd = padPasswordBytes(pwdBytes);
  const owner32 = ownerKey.length >= 32 ? ownerKey.subarray(0, 32) : ownerKey;
  const includeMetaFlag = revision >= 4 && !encryptMetadata;
  const hashInput = new Uint8Array(paddedPwd.length + owner32.length + 4 + fileId.length + (includeMetaFlag ? 4 : 0));

  let offset = 0;
  hashInput.set(paddedPwd, offset);
  offset += paddedPwd.length;

  hashInput.set(owner32, offset);
  offset += owner32.length;

  hashInput[offset++] = permissions & 0xff;
  hashInput[offset++] = (permissions >> 8) & 0xff;
  hashInput[offset++] = (permissions >> 16) & 0xff;
  hashInput[offset++] = (permissions >>> 24) & 0xff;

  hashInput.set(fileId, offset);
  offset += fileId.length;

  if (includeMetaFlag) {
    hashInput.fill(0xff, offset, offset + 4);
  }

  let hash = md5(hashInput);

  if (revision >= 3) {
    for (let i = 0; i < 50; i++) {
      hash = md5(hash.subarray(0, keyLengthBytes));
    }
  }

  return hash.slice(0, keyLengthBytes);
}

/**
 * Validates user password for R = 2, 3, 4 (Algorithm 4 & Algorithm 5).
 */
function validateUserPasswordStandard(
  pwdBytes: Uint8Array,
  encryptParams: EncryptParams,
  keyLengthBytes: number,
  encryptMetadata: boolean,
): Uint8Array | null {
  const { ownerKey, userKey, permissions, fileId, revision } = encryptParams;
  const encryptionKey = computeEncryptionKeyStandard(
    pwdBytes,
    ownerKey,
    permissions,
    fileId,
    revision,
    keyLengthBytes,
    encryptMetadata,
  );

  if (revision === 2) {
    const computed = new RC4(encryptionKey).process(PADDING);
    const target = userKey.length >= 32 ? userKey.subarray(0, 32) : userKey;
    if (arraysEqual(computed.subarray(0, target.length), target)) {
      return encryptionKey;
    }
  } else {
    const hashInput = concat(PADDING, fileId);
    const hash = md5(hashInput);
    let result = new RC4(encryptionKey).process(hash);
    const iterKey = new Uint8Array(encryptionKey.length);
    for (let i = 1; i <= 19; i++) {
      for (let j = 0; j < encryptionKey.length; j++) {
        iterKey[j] = encryptionKey[j] ^ i;
      }
      result = new RC4(iterKey).process(result);
    }

    if (arraysEqual(result.subarray(0, 16), userKey.subarray(0, 16))) {
      return encryptionKey;
    }
  }

  return null;
}

/**
 * Validates owner password for R = 2, 3, 4 (Algorithm 7).
 */
function validateOwnerPasswordStandard(
  ownerPwdBytes: Uint8Array,
  encryptParams: EncryptParams,
  keyLengthBytes: number,
  encryptMetadata: boolean,
): Uint8Array | null {
  const { ownerKey, revision } = encryptParams;
  const owner32 = ownerKey.length >= 32 ? ownerKey.subarray(0, 32) : ownerKey;
  const paddedOwner = padPasswordBytes(ownerPwdBytes);

  // Try both spec-exact (slice to keyLengthBytes in 50-loop) and full 16-byte hash in 50-loop
  const sliceModes = keyLengthBytes === 16 ? [16] : [keyLengthBytes, 16];

  for (const sliceLen of sliceModes) {
    let hash = md5(paddedOwner);
    if (revision >= 3) {
      for (let i = 0; i < 50; i++) {
        hash = md5(hash.subarray(0, sliceLen));
      }
    }

    const ownerDecryptKey = hash.subarray(0, keyLengthBytes);
    let recoveredUserPwd: Uint8Array;

    if (revision === 2) {
      recoveredUserPwd = new RC4(ownerDecryptKey).process(owner32);
    } else {
      let result: Uint8Array = new Uint8Array(owner32);
      const iterKey = new Uint8Array(ownerDecryptKey.length);
      for (let i = 19; i >= 0; i--) {
        for (let j = 0; j < ownerDecryptKey.length; j++) {
          iterKey[j] = ownerDecryptKey[j] ^ i;
        }
        result = new RC4(iterKey).process(result);
      }
      recoveredUserPwd = result;
    }

    const validKey = validateUserPasswordStandard(recoveredUserPwd, encryptParams, keyLengthBytes, encryptMetadata);
    if (validKey) return validKey;
  }

  return null;
}

// ========== AES-256 (V = 5, R = 5 & R = 6) Validation ==========

async function validateUserPasswordAES256(
  pwdBytes: Uint8Array,
  encryptParams: EncryptParams,
  useHash2B: boolean,
): Promise<Uint8Array | null> {
  const { userKey, userEncryptKey } = encryptParams;
  if (!userEncryptKey || userKey.length < 48 || userEncryptKey.length < 32) return null;

  const validationSalt = userKey.subarray(32, 40);
  const hash = useHash2B
    ? await computeHash2B(pwdBytes, validationSalt, new Uint8Array(0))
    : await sha256(concat(pwdBytes, validationSalt));

  if (!arraysEqual(hash, userKey.subarray(0, 32))) {
    return null;
  }

  const keySalt = userKey.subarray(40, 48);
  const ueKey = useHash2B
    ? await computeHash2B(pwdBytes, keySalt, new Uint8Array(0))
    : await sha256(concat(pwdBytes, keySalt));
  const zeroIV = new Uint8Array(16);
  return aes256CbcDecryptNoPad(userEncryptKey.subarray(0, 32), ueKey, zeroIV);
}

async function validateOwnerPasswordAES256(
  pwdBytes: Uint8Array,
  encryptParams: EncryptParams,
  useHash2B: boolean,
): Promise<Uint8Array | null> {
  const { ownerKey, userKey, ownerEncryptKey } = encryptParams;
  if (!ownerEncryptKey || ownerKey.length < 48 || userKey.length < 48 || ownerEncryptKey.length < 32) return null;

  const uBytes48 = userKey.subarray(0, 48);
  const validationSalt = ownerKey.subarray(32, 40);
  const hash = useHash2B
    ? await computeHash2B(pwdBytes, validationSalt, uBytes48)
    : await sha256(concat(pwdBytes, validationSalt, uBytes48));

  if (!arraysEqual(hash, ownerKey.subarray(0, 32))) {
    return null;
  }

  const keySalt = ownerKey.subarray(40, 48);
  const oeKey = useHash2B
    ? await computeHash2B(pwdBytes, keySalt, uBytes48)
    : await sha256(concat(pwdBytes, keySalt, uBytes48));
  const zeroIV = new Uint8Array(16);
  return aes256CbcDecryptNoPad(ownerEncryptKey.subarray(0, 32), oeKey, zeroIV);
}

// ========== Custom PDF Parser that Preserves Encrypted Object Streams & XRef Trailers ==========

async function parsePdfForDecryption(pdfBytes: Uint8Array): Promise<ParsedEncryptedPdf> {
  const parser = PDFParser.forBytesWithOptions(pdfBytes, Infinity, false, false) as any;
  const parsedItems: ParsedItem[] = [];
  const streamStartOffsets = new WeakMap<PDFRawStream, number>();
  const xrefTrailerDicts: PDFDict[] = [];

  // Override findEndOfStreamFallback so it never misinterprets random "stream" bytes inside encrypted ciphertext as nested streams
  parser.findEndOfStreamFallback = function () {
    let end = this.bytes.offset();
    while (!this.bytes.done()) {
      end = this.bytes.offset();
      if (
        this.matchKeyword(KW_CRLF_ENDSTREAM) ||
        this.matchKeyword(KW_CR_ENDSTREAM) ||
        this.matchKeyword(KW_LF_ENDSTREAM) ||
        this.matchKeyword(KW_ENDSTREAM)
      ) {
        return end;
      }
      this.bytes.next();
    }
    return end;
  };

  // Override parseDictOrStream to handle `stream \n` (horizontal whitespace before newline) and record stream start offsets
  parser.parseDictOrStream = function () {
    const startPos = this.bytes.position();
    const dict: PDFDict = this.parseDict();
    this.skipWhitespaceAndComments();

    if (!this.matchKeyword(KW_STREAM)) {
      return dict;
    }

    // Consume optional spaces/tabs on the same line after `stream`, then consume EOL (\r\n, \n, or \r)
    while (!this.bytes.done()) {
      const b = this.bytes.peek();
      if (b === 0x20 || b === 0x09) {
        this.bytes.next();
      } else {
        break;
      }
    }
    if (!this.bytes.done()) {
      const b = this.bytes.peek();
      if (b === 0x0d) {
        this.bytes.next();
        if (!this.bytes.done() && this.bytes.peek() === 0x0a) {
          this.bytes.next();
        }
      } else if (b === 0x0a) {
        this.bytes.next();
      }
    }

    const start = this.bytes.offset();
    let end: number;

    let lengthObj = dict.get(PDFName.of("Length"));
    if (lengthObj instanceof PDFRef) {
      const resolved = this.context.lookup(lengthObj);
      if (resolved instanceof PDFNumber) {
        lengthObj = resolved;
      }
    }

    if (lengthObj instanceof PDFNumber) {
      const lenVal = lengthObj.asNumber();
      end = start + lenVal;
      if (lenVal >= 0 && end <= this.bytes.length) {
        this.bytes.moveTo(end);
        this.skipWhitespaceAndComments();
        if (!this.matchKeyword(KW_ENDSTREAM)) {
          this.bytes.moveTo(start);
          end = this.findEndOfStreamFallback(startPos);
        }
      } else {
        this.bytes.moveTo(start);
        end = this.findEndOfStreamFallback(startPos);
      }
    } else {
      end = this.findEndOfStreamFallback(startPos);
    }

    const contents = this.bytes.slice(start, end);
    const stream = PDFRawStream.of(dict, contents);
    streamStartOffsets.set(stream, start);
    return stream;
  };

  // Override parseIndirectObject so encrypted `/Type /ObjStm` streams are NOT decompressed before decryption
  // and `/Type /XRef` stream dicts always merge `Root`, `Encrypt`, `Info`, `ID` without wiping previous values.
  parser.parseIndirectObject = async function () {
    const ref: PDFRef = this.parseIndirectObjectHeader();
    this.skipWhitespaceAndComments();
    const object: PDFObject = this.parseObject();
    this.skipWhitespaceAndComments();
    this.matchKeyword(KW_ENDOBJ);

    if (object instanceof PDFRawStream) {
      const typeVal = object.dict.get(PDFName.of("Type")) || object.dict.lookup(PDFName.of("Type"));
      if (typeVal === PDFName.of("ObjStm")) {
        this.context.assign(ref, object);
        parsedItems.push({ kind: "objstm", ref, obj: object });
        return ref;
      }
      if (typeVal === PDFName.of("XRef")) {
        xrefTrailerDicts.push(object.dict);
        this.context.trailerInfo = {
          Root: object.dict.get(PDFName.of("Root")) || this.context.trailerInfo.Root,
          Encrypt: object.dict.get(PDFName.of("Encrypt")) || this.context.trailerInfo.Encrypt,
          Info: object.dict.get(PDFName.of("Info")) || this.context.trailerInfo.Info,
          ID: object.dict.get(PDFName.of("ID")) || this.context.trailerInfo.ID,
        };
        return ref;
      }
    }

    this.context.assign(ref, object);
    parsedItems.push({ kind: "direct", ref, obj: object });
    return ref;
  };

  const context: PDFContext = await parser.parseDocument();

  // Post-pass: resolve any indirect `/Length N 0 R` on streams so their byte slice is exact
  for (const item of parsedItems) {
    if (item.obj instanceof PDFRawStream) {
      const rawLen = item.obj.dict.get(PDFName.of("Length"));
      if (rawLen instanceof PDFRef) {
        const resolved = context.lookup(rawLen);
        if (resolved instanceof PDFNumber) {
          const exactLen = resolved.asNumber();
          const start = streamStartOffsets.get(item.obj);
          if (start !== undefined && exactLen >= 0 && start + exactLen <= pdfBytes.length) {
            item.obj.contents = pdfBytes.slice(start, start + exactLen);
          }
        }
      }
    }
  }

  return { context, parsedItems, streamStartOffsets, xrefTrailerDicts };
}

// ========== Reading Encryption Parameters ==========

function lookupNumber(context: PDFContext, dict: PDFDict | undefined, key: string): number | undefined {
  if (!dict) return undefined;
  const raw = dict.get(PDFName.of(key));
  if (!raw) return undefined;
  const resolved = raw instanceof PDFRef ? context.lookup(raw) : raw;
  if (resolved instanceof PDFNumber) {
    return resolved.asNumber();
  }
  if (resolved) {
    const num = Number(resolved.toString());
    if (!Number.isNaN(num)) return num;
  }
  return undefined;
}

function lookupName(context: PDFContext, dict: PDFDict | undefined, key: string): string | undefined {
  if (!dict) return undefined;
  const raw = dict.get(PDFName.of(key));
  if (!raw) return undefined;
  const resolved = raw instanceof PDFRef ? context.lookup(raw) : raw;
  if (resolved instanceof PDFName) {
    return resolved.decodeText();
  }
  if (resolved) {
    return resolved.toString().replace(/^\//, "");
  }
  return undefined;
}

function lookupDict(context: PDFContext, dict: PDFDict | undefined, key: string): PDFDict | undefined {
  if (!dict) return undefined;
  const raw = dict.get(PDFName.of(key));
  if (!raw) return undefined;
  const resolved = raw instanceof PDFRef ? context.lookup(raw) : raw;
  return resolved instanceof PDFDict ? resolved : undefined;
}

function lookupBytes(context: PDFContext, dict: PDFDict | undefined, key: string): Uint8Array | null {
  if (!dict) return null;
  const raw = dict.get(PDFName.of(key));
  if (!raw) return null;
  const resolved = raw instanceof PDFRef ? context.lookup(raw) : raw;
  return extractBytes(resolved);
}

function extractFileIdFromIdEntry(context: PDFContext, idEntry: unknown): Uint8Array | null {
  if (!idEntry) return null;
  const resolved = idEntry instanceof PDFRef ? context.lookup(idEntry) : idEntry;
  if (Array.isArray(resolved) && resolved.length > 0) {
    const first = resolved[0] instanceof PDFRef ? context.lookup(resolved[0]) : resolved[0];
    return extractBytes(first);
  }
  if (resolved instanceof PDFArray && resolved.size() > 0) {
    const first = resolved.lookup(0);
    return extractBytes(first);
  }
  return null;
}

function extractFileIdFallbackFromRawBytes(pdfBytes: Uint8Array): Uint8Array {
  // Scan tail of PDF (up to last 64KB and first 16KB for linearized PDFs) for `/ID [ <...> <...> ]` or `/ID [(...) (...)]`
  const decoder = new TextDecoder("latin1");
  const regions: string[] = [];
  if (pdfBytes.length <= 80000) {
    regions.push(decoder.decode(pdfBytes));
  } else {
    regions.push(decoder.decode(pdfBytes.subarray(pdfBytes.length - 65536)));
    regions.push(decoder.decode(pdfBytes.subarray(0, 16384)));
  }

  for (const text of regions) {
    const hexMatch = /\/ID\s*\[\s*<([0-9a-fA-F\s]+)>/m.exec(text);
    if (hexMatch?.[1]) {
      return hexStringToBytes(hexMatch[1]);
    }
    const litMatch = /\/ID\s*\[\s*\(((?:\\.|[^\\)])*)\)/m.exec(text);
    if (litMatch?.[1]) {
      return literalStringValueToBytes(litMatch[1]);
    }
  }
  return new Uint8Array(0);
}

function resolveCryptFilterMethod(
  context: PDFContext,
  cfDict: PDFDict | undefined,
  filterName: string,
  version: number,
): { method: CipherMethod; keyLengthBits?: number } {
  if (!filterName || filterName === "Identity") {
    return { method: "None" };
  }
  const handlerDict = lookupDict(context, cfDict, filterName);
  const cfm = lookupName(context, handlerDict, "CFM");
  let rawLen = lookupNumber(context, handlerDict, "Length");
  if (rawLen !== undefined && rawLen > 0 && rawLen < 40) {
    rawLen = rawLen * 8;
  }

  if (cfm === "None") {
    return { method: "None", keyLengthBits: rawLen };
  }
  if (cfm === "AESV3" || version === 5) {
    return { method: "AESV3", keyLengthBits: 256 };
  }
  if (cfm === "AESV2") {
    return { method: "AESV2", keyLengthBits: rawLen || 128 };
  }
  if (cfm === "V2") {
    return { method: "V2", keyLengthBits: rawLen || 128 };
  }
  // Default when filter is named (e.g. StdCF) on V=4
  return { method: version >= 5 ? "AESV3" : "AESV2", keyLengthBits: rawLen || 128 };
}

function readEncryptParams(parsed: ParsedEncryptedPdf, pdfBytes: Uint8Array): EncryptParams | null {
  const { context, parsedItems, xrefTrailerDicts } = parsed;
  const trailer = context.trailerInfo;

  let encryptRef: PDFRef | null = null;
  let encryptDict: PDFDict | null = null;

  if (trailer.Encrypt instanceof PDFRef) {
    encryptRef = trailer.Encrypt;
    const lookedUp = context.lookup(trailer.Encrypt);
    if (lookedUp instanceof PDFDict) {
      encryptDict = lookedUp;
    }
  } else if (trailer.Encrypt instanceof PDFDict) {
    encryptDict = trailer.Encrypt;
  }

  // Fallback 1: check all XRef stream dicts recorded during parsing
  if (!encryptDict) {
    for (const xd of xrefTrailerDicts) {
      const enc = xd.get(PDFName.of("Encrypt"));
      if (enc instanceof PDFRef) {
        const lookedUp = context.lookup(enc);
        if (lookedUp instanceof PDFDict) {
          encryptRef = enc;
          encryptDict = lookedUp;
          break;
        }
      } else if (enc instanceof PDFDict) {
        encryptDict = enc;
        break;
      }
    }
  }

  // Fallback 2: scan indirect objects for a Standard security handler dictionary
  if (!encryptDict) {
    for (const item of parsedItems) {
      if (item.obj instanceof PDFDict && !(item.obj instanceof PDFRawStream)) {
        const filterName = lookupName(context, item.obj, "Filter");
        const hasO = item.obj.has(PDFName.of("O"));
        const hasU = item.obj.has(PDFName.of("U"));
        const hasP = item.obj.has(PDFName.of("P"));
        if (hasO && hasU && hasP && (filterName === "Standard" || item.obj.has(PDFName.of("V")) || item.obj.has(PDFName.of("R")))) {
          encryptRef = item.ref;
          encryptDict = item.obj;
          break;
        }
      }
    }
  }

  if (!encryptDict) {
    return null;
  }

  let version = lookupNumber(context, encryptDict, "V") ?? 0;
  let revision = lookupNumber(context, encryptDict, "R") ?? 0;

  if (version === 0 && revision > 0) {
    if (revision === 2) version = 1;
    else if (revision === 3) version = 2;
    else if (revision === 4) version = 4;
    else if (revision >= 5) version = 5;
  }
  if (revision === 0 && version > 0) {
    if (version === 1) revision = 2;
    else if (version <= 3) revision = 3;
    else if (version === 4) revision = 4;
    else if (version >= 5) revision = encryptDict.has(PDFName.of("Perms")) ? 6 : 5;
  }

  const permissions = (lookupNumber(context, encryptDict, "P") ?? 0) | 0;
  const ownerKey = lookupBytes(context, encryptDict, "O") ?? new Uint8Array(0);
  const userKey = lookupBytes(context, encryptDict, "U") ?? new Uint8Array(0);

  // Extract fileId from trailerInfo, XRef dicts, or raw bytes
  let fileId = extractFileIdFromIdEntry(context, trailer.ID);
  if (!fileId || fileId.length === 0) {
    for (const xd of xrefTrailerDicts) {
      fileId = extractFileIdFromIdEntry(context, xd.get(PDFName.of("ID")));
      if (fileId && fileId.length > 0) break;
    }
  }
  if (!fileId || fileId.length === 0) {
    fileId = extractFileIdFallbackFromRawBytes(pdfBytes);
  }

  // EncryptMetadata defaults to true per spec
  let encryptMetadata = true;
  const emRaw = encryptDict.get(PDFName.of("EncryptMetadata"));
  const emResolved = emRaw instanceof PDFRef ? context.lookup(emRaw) : emRaw;
  if (emResolved === PDFBool.False || emResolved?.toString() === "false") {
    encryptMetadata = false;
  }

  const cfDict = lookupDict(context, encryptDict, "CF");

  // Case 1: V=5 (or R=5/6) — AES-256
  if (version === 5 || revision === 5 || revision === 6) {
    const ownerEncryptKey = lookupBytes(context, encryptDict, "OE") ?? undefined;
    const userEncryptKey = lookupBytes(context, encryptDict, "UE") ?? undefined;
    const perms = lookupBytes(context, encryptDict, "Perms") ?? undefined;

    const stmfName = lookupName(context, encryptDict, "StmF") || "StdCF";
    const strfName = lookupName(context, encryptDict, "StrF") || "StdCF";
    const effName = lookupName(context, encryptDict, "EFF") || stmfName;

    const stmCipher: CipherMethod = stmfName === "Identity" ? "None" : "AESV3";
    const strCipher: CipherMethod = strfName === "Identity" ? "None" : "AESV3";
    const effCipher: CipherMethod = effName === "Identity" ? "None" : "AESV3";

    return {
      version: version || 5,
      revision: revision || 6,
      algorithm: "AES-256",
      keyLength: 32,
      candidateKeyLengths: [32],
      permissions,
      ownerKey,
      userKey,
      ownerEncryptKey,
      userEncryptKey,
      perms,
      fileId,
      encryptMetadata,
      encryptRef,
      encryptDict,
      stmCipher,
      strCipher,
      effCipher,
      cfDict,
    };
  }

  // Case 2: V=4 (Crypt Filters — AES-128 /AESV2, RC4 /V2, or /AESV3)
  if (version === 4 || (revision === 4 && cfDict)) {
    const stmfName = lookupName(context, encryptDict, "StmF") || "Identity";
    const strfName = lookupName(context, encryptDict, "StrF") || "Identity";
    const effName = lookupName(context, encryptDict, "EFF") || stmfName;

    const stmResolved = resolveCryptFilterMethod(context, cfDict, stmfName, 4);
    const strResolved = resolveCryptFilterMethod(context, cfDict, strfName, 4);
    const effResolved = resolveCryptFilterMethod(context, cfDict, effName, 4);

    let keyLengthBits = lookupNumber(context, encryptDict, "Length");
    if (keyLengthBits !== undefined && keyLengthBits > 0 && keyLengthBits < 40) {
      keyLengthBits *= 8;
    }
    if (!keyLengthBits) {
      keyLengthBits = stmResolved.keyLengthBits || strResolved.keyLengthBits || 128;
    }
    const keyLength = Math.max(5, Math.floor(keyLengthBits / 8));
    const candidateKeyLengths = keyLength === 16 ? [16] : [keyLength, 16];

    let algorithm: PdfEncryptionAlgorithm = "AES-128";
    if (stmResolved.method === "AESV3" || strResolved.method === "AESV3") {
      algorithm = "AES-256";
    } else if (stmResolved.method === "V2" && strResolved.method === "V2") {
      algorithm = "RC4";
    }

    return {
      version: 4,
      revision: revision || 4,
      algorithm,
      keyLength,
      candidateKeyLengths,
      permissions,
      ownerKey,
      userKey,
      fileId,
      encryptMetadata,
      encryptRef,
      encryptDict,
      stmCipher: stmResolved.method,
      strCipher: strResolved.method,
      effCipher: effResolved.method,
      cfDict,
    };
  }

  // Case 3: V=1, 2, 3 (RC4 40-bit to 128-bit)
  const rawLength = lookupNumber(context, encryptDict, "Length");
  let keyLengthBits: number;
  let candidateKeyLengths: number[];

  if (rawLength !== undefined && rawLength > 0) {
    keyLengthBits = rawLength < 40 ? rawLength * 8 : rawLength;
    const klBytes = Math.max(5, Math.floor(keyLengthBits / 8));
    candidateKeyLengths = [klBytes];
    if (klBytes !== 16 && klBytes !== 5) {
      candidateKeyLengths.push(16, 5);
    }
  } else if (version === 1 || revision === 2) {
    keyLengthBits = 40;
    candidateKeyLengths = [5, 16];
  } else {
    // When /Length is omitted on V=2, R=3: ISO 32000-1 default is 40 bits (5 bytes),
    // though some generators omit /Length intending 128 bits (16 bytes). Test both!
    keyLengthBits = 128;
    candidateKeyLengths = [16, 5];
  }

  return {
    version: version || 2,
    revision: revision || 3,
    algorithm: "RC4",
    keyLength: Math.max(5, Math.floor(keyLengthBits / 8)),
    candidateKeyLengths,
    permissions,
    ownerKey,
    userKey,
    fileId,
    encryptMetadata: true,
    encryptRef,
    encryptDict,
    stmCipher: "V2",
    strCipher: "V2",
    effCipher: "V2",
    cfDict,
  };
}

/**
 * Fallback raw-byte scan to detect `/Encrypt` in PDFs whose trailer or XRef was not parsed by `PDFParser`.
 */
function detectRawByteEncryptionFallback(pdfBytes: Uint8Array): PdfEncryptionStatus {
  const decoder = new TextDecoder("latin1");
  const tail =
    pdfBytes.length <= 131072
      ? decoder.decode(pdfBytes)
      : decoder.decode(pdfBytes.subarray(0, 32768)) + "\n" + decoder.decode(pdfBytes.subarray(pdfBytes.length - 98304));

  // Remove PDF comments (`%...`) before checking for `/Encrypt`
  const uncommented = tail.replace(/%[^\r\n]*/g, "");
  const hasEncryptRef = /\/Encrypt\s+\d+\s+\d+\s+R\b/.test(uncommented) || /\/Encrypt\s*<</.test(uncommented);
  if (!hasEncryptRef) {
    return { encrypted: false };
  }

  const fullText = pdfBytes.length <= 131072 ? uncommented : decoder.decode(pdfBytes);
  if (/\/CFM\s*\/AESV3\b/.test(fullText) || /\/V\s+5\b/.test(fullText)) {
    return { encrypted: true, algorithm: "AES-256", version: 5, revision: 6, keyLength: 256 };
  }
  if (/\/CFM\s*\/AESV2\b/.test(fullText) || /\/V\s+4\b/.test(fullText)) {
    return { encrypted: true, algorithm: "AES-128", version: 4, revision: 4, keyLength: 128 };
  }
  return { encrypted: true, algorithm: "RC4", version: 2, revision: 3, keyLength: 128 };
}

/**
 * Checks whether a PDF byte array is encrypted and identifies its encryption algorithm.
 */
export async function inspectPdfEncryption(pdfBytes: Uint8Array): Promise<PdfEncryptionStatus> {
  try {
    const parsed = await parsePdfForDecryption(pdfBytes);
    const params = readEncryptParams(parsed, pdfBytes);
    if (params) {
      return {
        encrypted: true,
        algorithm: params.algorithm,
        version: params.version,
        revision: params.revision,
        keyLength: params.keyLength * 8,
      };
    }
    if (parsed.context.trailerInfo.Encrypt) {
      return { encrypted: true };
    }
  } catch {
    // Fall through to raw-byte inspection
  }

  return detectRawByteEncryptionFallback(pdfBytes);
}

// ========== Object & Stream Decryption ==========

function isSignatureDict(dict: PDFDict): boolean {
  const type = dict.get(PDFName.of("Type"));
  if (type === PDFName.of("Sig") || type === PDFName.of("DocTimeStamp")) {
    return true;
  }
  if (dict.has(PDFName.of("ByteRange")) && dict.has(PDFName.of("Contents"))) {
    return true;
  }
  return false;
}

/**
 * Checks if a stream has a `/Filter /Crypt` override specifying a custom or `/Identity` crypt filter.
 */
function getStreamCryptFilterOverride(
  context: PDFContext,
  streamDict: PDFDict,
  encryptParams: EncryptParams,
): CipherMethod | null {
  const filterRaw = streamDict.get(PDFName.of("Filter"));
  const filter = filterRaw instanceof PDFRef ? context.lookup(filterRaw) : filterRaw;

  const checkDecodeParms = (parmsObj: unknown): CipherMethod => {
    const parms = parmsObj instanceof PDFRef ? context.lookup(parmsObj) : parmsObj;
    if (parms instanceof PDFDict) {
      const cfName = lookupName(context, parms, "Name") || "Identity";
      return resolveCryptFilterMethod(context, encryptParams.cfDict, cfName, encryptParams.version).method;
    }
    return "None";
  };

  if (filter === PDFName.of("Crypt")) {
    return checkDecodeParms(streamDict.get(PDFName.of("DecodeParms")));
  }

  if (filter instanceof PDFArray) {
    for (let i = 0; i < filter.size(); i++) {
      if (filter.lookup(i) === PDFName.of("Crypt")) {
        const dp = streamDict.lookup(PDFName.of("DecodeParms"));
        const itemParms = dp instanceof PDFArray ? dp.lookup(i) : dp;
        return checkDecodeParms(itemParms);
      }
    }
  }

  return null;
}

async function decryptDataWithCipher(
  data: Uint8Array,
  method: CipherMethod,
  objectNum: number,
  generationNum: number,
  encryptionKey: Uint8Array,
  aes256CryptoKey: CryptoKey | null,
): Promise<Uint8Array> {
  if (method === "None" || data.length === 0) {
    return data;
  }

  if (method === "V2") {
    const objKey = buildObjectKey(objectNum, generationNum, encryptionKey, false);
    return new RC4(objKey).process(data);
  }

  if (method === "AESV2") {
    const objKey = buildObjectKey(objectNum, generationNum, encryptionKey, true);
    const cryptoKey = await importAesDecryptKey(objKey);
    return decryptAesCbcBlobWithKey(data, cryptoKey);
  }

  if (method === "AESV3") {
    const key = aes256CryptoKey ?? (await importAesDecryptKey(encryptionKey.subarray(0, 32)));
    return decryptAesCbcBlobWithKey(data, key);
  }

  return data;
}

async function decryptStringsInObject(
  obj: unknown,
  method: CipherMethod,
  objectNum: number,
  generationNum: number,
  encryptionKey: Uint8Array,
  aes256CryptoKey: CryptoKey | null,
  visited: WeakSet<object>,
): Promise<void> {
  if (!obj || typeof obj !== "object" || method === "None") return;
  if (visited.has(obj)) return;
  visited.add(obj);

  if (obj instanceof PDFString) {
    const originalBytes = literalStringValueToBytes(obj.asString());
    if (originalBytes.length === 0) return;
    const decrypted = await decryptDataWithCipher(
      originalBytes,
      method,
      objectNum,
      generationNum,
      encryptionKey,
      aes256CryptoKey,
    );
    (obj as unknown as { value: string }).value = bytesToPdfLiteralStringValue(decrypted);
    return;
  }

  if (obj instanceof PDFHexString) {
    const originalBytes = hexStringToBytes(obj.asString());
    if (originalBytes.length === 0) return;
    const decrypted = await decryptDataWithCipher(
      originalBytes,
      method,
      objectNum,
      generationNum,
      encryptionKey,
      aes256CryptoKey,
    );
    (obj as unknown as { value: string }).value = bytesToHex(decrypted);
    return;
  }

  if (obj instanceof PDFDict) {
    if (isSignatureDict(obj)) {
      return;
    }
    const entries = obj.entries();
    for (const [key, value] of entries) {
      const keyName = key.asString();
      if (keyName === "/Length" || keyName === "/Filter" || keyName === "/DecodeParms") {
        continue;
      }
      await decryptStringsInObject(value, method, objectNum, generationNum, encryptionKey, aes256CryptoKey, visited);
    }
    return;
  }

  if (obj instanceof PDFArray) {
    const arr = obj.asArray();
    for (const element of arr) {
      await decryptStringsInObject(element, method, objectNum, generationNum, encryptionKey, aes256CryptoKey, visited);
    }
  }
}

/**
 * Applies PNG (10-15) or TIFF (2) predictor post-processing onto an inflated stream if specified in `/DecodeParms`.
 */
function applyPredictorIfPresent(context: PDFContext, data: Uint8Array, decodeParms: PDFDict | undefined): Uint8Array {
  if (!decodeParms) return data;
  const predictor = lookupNumber(context, decodeParms, "Predictor") ?? 1;
  if (predictor <= 1) return data;

  const colors = Math.max(1, lookupNumber(context, decodeParms, "Colors") ?? 1);
  const bitsPerComponent = lookupNumber(context, decodeParms, "BitsPerComponent") ?? 8;
  const columns = Math.max(1, lookupNumber(context, decodeParms, "Columns") ?? 1);
  const bytesPerPixel = Math.max(1, Math.ceil((colors * bitsPerComponent) / 8));
  const rowBytes = Math.ceil((columns * colors * bitsPerComponent) / 8);

  if (predictor === 2) {
    // TIFF Predictor 2
    const out = data.slice();
    const rows = Math.floor(out.length / rowBytes);
    for (let r = 0; r < rows; r++) {
      const rowOffset = r * rowBytes;
      for (let i = bytesPerPixel; i < rowBytes; i++) {
        out[rowOffset + i] = (out[rowOffset + i] + out[rowOffset + i - bytesPerPixel]) & 0xff;
      }
    }
    return out;
  }

  if (predictor >= 10 && predictor <= 15) {
    // PNG Predictors (each row has 1 filter byte + rowBytes)
    const stride = rowBytes + 1;
    const rows = Math.floor(data.length / stride);
    if (rows <= 0) return data;

    const out = new Uint8Array(rows * rowBytes);
    let prevRow = new Uint8Array(rowBytes);

    for (let r = 0; r < rows; r++) {
      const srcOffset = r * stride;
      const filterType = data[srcOffset];
      const dstOffset = r * rowBytes;
      const currRow = out.subarray(dstOffset, dstOffset + rowBytes);

      for (let i = 0; i < rowBytes; i++) {
        const raw = data[srcOffset + 1 + i];
        const left = i >= bytesPerPixel ? currRow[i - bytesPerPixel] : 0;
        const up = prevRow[i];
        const upLeft = i >= bytesPerPixel ? prevRow[i - bytesPerPixel] : 0;

        if (filterType === 0) {
          currRow[i] = raw;
        } else if (filterType === 1) {
          currRow[i] = (raw + left) & 0xff;
        } else if (filterType === 2) {
          currRow[i] = (raw + up) & 0xff;
        } else if (filterType === 3) {
          currRow[i] = (raw + Math.floor((left + up) / 2)) & 0xff;
        } else if (filterType === 4) {
          const p = left + up - upLeft;
          const pa = Math.abs(p - left);
          const pb = Math.abs(p - up);
          const pc = Math.abs(p - upLeft);
          const pr = pa <= pb && pa <= pc ? left : pb <= pc ? up : upLeft;
          currRow[i] = (raw + pr) & 0xff;
        } else {
          currRow[i] = raw;
        }
      }
      prevRow = currRow;
    }
    return out;
  }

  return data;
}

/**
 * Decodes a decrypted `PDFRawStream` (supporting `pdf-lib`'s `decodePDFRawStream` plus `fflate` fallbacks).
 */
function decodeStreamBytes(context: PDFContext, rawStream: PDFRawStream): Uint8Array {
  let decoded: Uint8Array;
  try {
    decoded = decodePDFRawStream(rawStream).decode();
  } catch {
    try {
      decoded = unzlibSync(rawStream.contents);
    } catch {
      decoded = inflateSync(rawStream.contents);
    }
  }

  const dp = lookupDict(context, rawStream.dict, "DecodeParms");
  return applyPredictorIfPresent(context, decoded, dp);
}

/**
 * Unpacks a decrypted `/Type /ObjStm` stream into `context`.
 */
function unpackDecryptedObjectStream(context: PDFContext, rawStream: PDFRawStream): void {
  const N = lookupNumber(context, rawStream.dict, "N") ?? 0;
  const First = lookupNumber(context, rawStream.dict, "First") ?? 0;
  if (N <= 0 || First < 0) return;

  const decodedBytes = decodeStreamBytes(context, rawStream);
  const objParser = PDFObjectParser.forBytes(decodedBytes, context, false) as any;

  const entries: Array<{ objectNumber: number; offset: number }> = [];
  for (let i = 0; i < N; i++) {
    objParser.skipWhitespaceAndComments();
    const objectNumber = objParser.parseRawInt();
    objParser.skipWhitespaceAndComments();
    const offset = objParser.parseRawInt();
    entries.push({ objectNumber, offset });
  }

  for (let i = 0; i < entries.length; i++) {
    const { objectNumber, offset } = entries[i];
    const targetOffset = First + offset;
    if (targetOffset < 0 || targetOffset >= decodedBytes.length) continue;

    try {
      objParser.bytes.moveTo(targetOffset);
      const parsedObj = objParser.parseObject();
      context.assign(PDFRef.of(objectNumber, 0), parsedObj);
    } catch {
      // Skip malformed entry inside ObjStm without aborting remaining objects
    }
  }
}

/**
 * Ensures `Root` (`PDFCatalog`), `Pages` (`PDFPageTree`), and `Page` (`PDFPageLeaf`) objects
 * in `context` have the specialized `pdf-lib` subclass prototypes required by `PDFDocument`.
 */
function normalizeDocumentStructure(context: PDFContext): void {
  // Remove object 0 if present so `PDFCrossRefSection` does not duplicate object 0
  context.delete(PDFRef.of(0));
  for (const [ref] of context.enumerateIndirectObjects()) {
    if (ref.objectNumber === 0) {
      context.delete(ref);
    }
  }

  // Deduplicate indirect objects that share the same objectNumber (keep highest generation or latest)
  const byObjNum = new Map<number, PDFRef>();
  for (const [ref] of context.enumerateIndirectObjects()) {
    const prev = byObjNum.get(ref.objectNumber);
    if (prev) {
      context.delete(prev);
    }
    byObjNum.set(ref.objectNumber, ref);
  }

  // Recover or normalize Catalog (`Root`)
  let rootRef = context.trailerInfo.Root;
  let rootObj = rootRef ? context.lookup(rootRef) : undefined;

  if (!(rootObj instanceof PDFDict)) {
    for (const [ref, obj] of context.enumerateIndirectObjects()) {
      if (obj instanceof PDFCatalog) {
        rootRef = ref;
        rootObj = obj;
        break;
      }
      if (obj instanceof PDFDict && !(obj instanceof PDFRawStream)) {
        const type = obj.get(PDFName.of("Type"));
        if (type === PDFName.of("Catalog") || obj.has(PDFName.of("Pages"))) {
          rootRef = ref;
          rootObj = obj;
          break;
        }
      }
    }
    if (rootRef) {
      context.trailerInfo.Root = rootRef;
    }
  }

  if (rootObj instanceof PDFDict && !(rootObj instanceof PDFCatalog) && rootRef instanceof PDFRef) {
    const map = (rootObj as unknown as { dict: Map<PDFName, PDFObject> }).dict;
    const catalog = PDFCatalog.fromMapWithContext(map, context);
    context.assign(rootRef, catalog);
    rootObj = catalog;
  }

  // Walk the page tree and ensure intermediate nodes are `PDFPageTree` and leaves are `PDFPageLeaf`
  if (rootObj instanceof PDFDict) {
    const pagesRef = rootObj.get(PDFName.of("Pages"));
    const visited = new Set<number>();

    const normalizePageNode = (nodeRef: unknown) => {
      if (!(nodeRef instanceof PDFRef)) return;
      if (visited.has(nodeRef.objectNumber)) return;
      visited.add(nodeRef.objectNumber);

      const node = context.lookup(nodeRef);
      if (!(node instanceof PDFDict) || node instanceof PDFRawStream) return;

      const kids = node.lookup(PDFName.of("Kids"));
      const map = (node as unknown as { dict: Map<PDFName, PDFObject> }).dict;

      if (kids instanceof PDFArray) {
        if (!(node instanceof PDFPageTree)) {
          const tree = PDFPageTree.fromMapWithContext(map, context);
          context.assign(nodeRef, tree);
        }
        for (let i = 0; i < kids.size(); i++) {
          normalizePageNode(kids.get(i));
        }
      } else {
        if (!(node instanceof PDFPageLeaf)) {
          const leaf = PDFPageLeaf.fromMapWithContext(map, context);
          context.assign(nodeRef, leaf);
        }
      }
    };

    normalizePageNode(pagesRef);
  }
}

/**
 * Resolves the file encryption key by validating the user or owner password against `encryptParams`.
 */
async function resolveEncryptionKey(password: string, encryptParams: EncryptParams): Promise<Uint8Array | null> {
  if (encryptParams.version === 5 || encryptParams.revision === 5 || encryptParams.revision === 6) {
    // If streams and strings are both Identity (EFOpen only), no password needed
    if (encryptParams.stmCipher === "None" && encryptParams.strCipher === "None") {
      return new Uint8Array(32);
    }

    const pwdCandidates = getCandidatePasswordByteArraysAES256(password);
    // Try primary revision mode first (R=6 -> Hash2B, R=5 -> SHA-256), then fallback
    const hashModes = encryptParams.revision === 5 ? [false, true] : [true, false];

    for (const useHash2B of hashModes) {
      for (const pwdBytes of pwdCandidates) {
        const userFileKey = await validateUserPasswordAES256(pwdBytes, encryptParams, useHash2B);
        if (userFileKey) return userFileKey;

        const ownerFileKey = await validateOwnerPasswordAES256(pwdBytes, encryptParams, useHash2B);
        if (ownerFileKey) return ownerFileKey;
      }
    }
    return null;
  }

  // Standard Security Handler (V = 1..4, R = 2..4 — RC4 & AES-128)
  if (encryptParams.version >= 4 && encryptParams.stmCipher === "None" && encryptParams.strCipher === "None") {
    return new Uint8Array(16);
  }

  const pwdCandidates = getCandidatePasswordByteArraysLegacy(password);
  const metaFlags = encryptParams.encryptMetadata ? [true, false] : [false, true];

  for (const keyLen of encryptParams.candidateKeyLengths) {
    for (const metaFlag of metaFlags) {
      for (const pwdBytes of pwdCandidates) {
        const userKey = validateUserPasswordStandard(pwdBytes, encryptParams, keyLen, metaFlag);
        if (userKey) {
          if (encryptParams.version === 4 && userKey.length < 16) {
            const padded = new Uint8Array(16);
            padded.set(userKey);
            return padded;
          }
          return userKey;
        }

        const ownerKey = validateOwnerPasswordStandard(pwdBytes, encryptParams, keyLen, metaFlag);
        if (ownerKey) {
          if (encryptParams.version === 4 && ownerKey.length < 16) {
            const padded = new Uint8Array(16);
            padded.set(ownerKey);
            return padded;
          }
          return ownerKey;
        }
      }
    }
  }

  return null;
}

/**
 * Decrypts a password-protected PDF byte array into an unencrypted PDF byte array.
 * Supports:
 * - AES-256 (V=5, R=6 and V=5, R=5)
 * - AES-128 (V=4, R=4 with /CFM /AESV2 Crypt Filters)
 * - RC4 128-bit & 40-bit (V=1..4, R=2..4 including /CFM /V2 Crypt Filters)
 * - Encrypted Object Streams (/Type /ObjStm) and Linearized / Cross-Reference Streams (/Type /XRef)
 */
export async function decryptPdfBytes(pdfBytes: Uint8Array, password: string): Promise<Uint8Array> {
  const parsed = await parsePdfForDecryption(pdfBytes);
  const { context, parsedItems, streamStartOffsets } = parsed;
  const encryptParams = readEncryptParams(parsed, pdfBytes);

  if (!encryptParams) {
    throw new Error("This PDF is not encrypted. No /Encrypt dictionary found.");
  }

  const encryptionKey = await resolveEncryptionKey(password, encryptParams);
  if (!encryptionKey) {
    throw new Error("Incorrect password. The provided password does not match the user or owner password.");
  }

  const encryptRefNum = encryptParams.encryptRef?.objectNumber ?? null;
  const isAES256 =
    encryptParams.stmCipher === "AESV3" ||
    encryptParams.strCipher === "AESV3" ||
    encryptParams.effCipher === "AESV3";
  const aes256CryptoKey = isAES256 ? await importAesDecryptKey(encryptionKey.subarray(0, 32)) : null;
  const visitedObjects = new WeakSet<object>();

  // 1. Decrypt all top-level indirect objects (including encrypted `/Type /ObjStm` streams!)
  for (const item of parsedItems) {
    const objectNum = item.ref.objectNumber;
    const generationNum = item.ref.generationNumber || 0;
    const obj = item.obj;

    if (encryptRefNum !== null && objectNum === encryptRefNum) {
      continue;
    }

    if (obj instanceof PDFInvalidObject) {
      continue;
    }

    if (obj instanceof PDFDict && !(obj instanceof PDFRawStream)) {
      if (isSignatureDict(obj)) continue;
      // Skip Linearized parameter dictionary
      if (obj.has(PDFName.of("Linearized"))) continue;

      await decryptStringsInObject(
        obj,
        encryptParams.strCipher,
        objectNum,
        generationNum,
        encryptionKey,
        aes256CryptoKey,
        visitedObjects,
      );
      continue;
    }

    if (obj instanceof PDFRawStream) {
      const dict = obj.dict;
      const typeVal = dict.get(PDFName.of("Type")) || dict.lookup(PDFName.of("Type"));

      if (typeVal === PDFName.of("XRef") || typeVal === PDFName.of("Sig") || isSignatureDict(dict)) {
        continue;
      }

      const isMetadataStream = typeVal === PDFName.of("Metadata");
      const shouldDecryptStream = !(isMetadataStream && !encryptParams.encryptMetadata);

      if (shouldDecryptStream) {
        const overrideMethod = getStreamCryptFilterOverride(context, dict, encryptParams);
        const isEmbeddedFile = typeVal === PDFName.of("EmbeddedFile");
        const streamMethod =
          overrideMethod ?? (isEmbeddedFile ? encryptParams.effCipher : encryptParams.stmCipher);

        let rawContents = obj.contents;

        // If AES stream was sliced by fallback and lost a trailing \r or \n byte (leaving length % 16 === 15), restore it
        if (
          (streamMethod === "AESV2" || streamMethod === "AESV3") &&
          rawContents.length >= 31 &&
          rawContents.length % 16 === 15
        ) {
          const startOffset = streamStartOffsets.get(obj);
          if (startOffset !== undefined && startOffset + rawContents.length + 1 <= pdfBytes.length) {
            rawContents = pdfBytes.slice(startOffset, startOffset + rawContents.length + 1);
          }
        }

        const decryptedStream = await decryptDataWithCipher(
          rawContents,
          streamMethod,
          objectNum,
          generationNum,
          encryptionKey,
          aes256CryptoKey,
        );
        obj.contents = decryptedStream;
        dict.set(PDFName.of("Length"), PDFNumber.of(decryptedStream.length));
      }

      // Decrypt strings inside the stream's dictionary
      await decryptStringsInObject(
        dict,
        encryptParams.strCipher,
        objectNum,
        generationNum,
        encryptionKey,
        aes256CryptoKey,
        visitedObjects,
      );
      continue;
    }

    // Top-level primitive/array indirect object
    await decryptStringsInObject(
      obj,
      encryptParams.strCipher,
      objectNum,
      generationNum,
      encryptionKey,
      aes256CryptoKey,
      visitedObjects,
    );
  }

  // 2. Rebuild `context` in file order and unpack all decrypted `/Type /ObjStm` streams
  for (const [ref] of context.enumerateIndirectObjects()) {
    context.delete(ref);
  }

  const linearizedHintStreamNums = new Set<number>();
  for (const item of parsedItems) {
    if (item.obj instanceof PDFDict && !(item.obj instanceof PDFRawStream) && item.obj.has(PDFName.of("Linearized"))) {
      // Linearized dicts are skipped
      continue;
    }
    if (encryptRefNum !== null && item.ref.objectNumber === encryptRefNum) {
      continue;
    }
    if (linearizedHintStreamNums.has(item.ref.objectNumber)) {
      continue;
    }

    if (item.kind === "objstm" && item.obj instanceof PDFRawStream) {
      try {
        unpackDecryptedObjectStream(context, item.obj);
      } catch {
        // Ignore broken object stream if any
      }
    } else {
      context.assign(item.ref, item.obj);
    }
  }

  // 3. Remove `/Encrypt` from trailer and normalize document catalog/page tree
  delete context.trailerInfo.Encrypt;
  if (encryptParams.encryptRef) {
    context.delete(encryptParams.encryptRef);
  }

  normalizeDocumentStructure(context);

  // 4. Serialize clean unencrypted PDF buffer
  const decryptedBytes = await PDFWriter.forContext(context, Infinity).serializeToBuffer();
  return new Uint8Array(decryptedBytes);
}
