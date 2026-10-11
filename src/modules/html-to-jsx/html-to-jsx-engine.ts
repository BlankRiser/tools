export type JsxOutputMode = "fragment" | "component-jsx" | "component-tsx" | "svg-icon-tsx";
export type JsxIndentOption = "2" | "4" | "tab";
export type JsxCommentMode = "convert" | "strip";

export interface HtmlToJsxOptions {
  outputMode: JsxOutputMode;
  componentName: string;
  indent: JsxIndentOption;
  useSingleQuotes: boolean;
  commentMode: JsxCommentMode;
  uncontrolledFormProps: boolean;
  numericStylePx: boolean;
  selfCloseEmptyElements: boolean;
  stripDataAttributes: boolean;
  spreadRootProps: boolean;
}

export const DEFAULT_HTML_TO_JSX_OPTIONS: HtmlToJsxOptions = {
  outputMode: "fragment",
  componentName: "ConvertedComponent",
  indent: "2",
  useSingleQuotes: false,
  commentMode: "convert",
  uncontrolledFormProps: true,
  numericStylePx: false,
  selfCloseEmptyElements: true,
  stripDataAttributes: false,
  spreadRootProps: true,
};

export interface AttributeTransformRecord {
  original: string;
  converted: string;
  category: "html-attr" | "svg-attr" | "style-obj" | "event-handler" | "boolean-attr" | "form-prop";
  count: number;
}

export interface HtmlToJsxStats {
  elementsCount: number;
  attributesConverted: number;
  stylesConverted: number;
  svgAttrsConverted: number;
  voidTagsClosed: number;
  commentsProcessed: number;
  inputBytes: number;
  outputBytes: number;
  outputLines: number;
}

export interface HtmlToJsxResult {
  jsx: string;
  isValid: boolean;
  error?: string;
  stats: HtmlToJsxStats;
  transformLog: AttributeTransformRecord[];
}

// ============================================================================
// Comprehensive HTML & SVG Attribute Mapping Tables
// ============================================================================

const HTML_ATTRIBUTE_MAP: Record<string, string> = {
  // Core HTML -> React props
  class: "className",
  for: "htmlFor",
  tabindex: "tabIndex",
  readonly: "readOnly",
  maxlength: "maxLength",
  minlength: "minLength",
  cellpadding: "cellPadding",
  cellspacing: "cellSpacing",
  rowspan: "rowSpan",
  colspan: "colSpan",
  usemap: "useMap",
  frameborder: "frameBorder",
  contenteditable: "contentEditable",
  spellcheck: "spellCheck",
  autocomplete: "autoComplete",
  autofocus: "autoFocus",
  autoplay: "autoPlay",
  autosave: "autoSave",
  crossorigin: "crossOrigin",
  datetime: "dateTime",
  enctype: "encType",
  formaction: "formAction",
  formenctype: "formEncType",
  formmethod: "formMethod",
  formnovalidate: "formNoValidate",
  formtarget: "formTarget",
  hreflang: "hrefLang",
  inputmode: "inputMode",
  novalidate: "noValidate",
  accesskey: "accessKey",
  charset: "charSet",
  "http-equiv": "httpEquiv",
  srcdoc: "srcDoc",
  srcset: "srcSet",
  srclang: "srcLang",
  enterkeyhint: "enterKeyHint",
  fetchpriority: "fetchPriority",
  popovertarget: "popoverTarget",
  popovertargetaction: "popoverTargetAction",
  playsinline: "playsInline",
  nomodule: "noModule",
   referrerpolicy: "referrerPolicy",
  allowfullscreen: "allowFullScreen",
  allowtransparency: "allowTransparency",
  marginheight: "marginHeight",
  marginwidth: "marginWidth",
  radiogroup: "radioGroup",
  contextmenu: "contextMenu",
  itemprop: "itemProp",
  itemscope: "itemScope",
  itemtype: "itemType",
  itemid: "itemID",
  itemref: "itemRef",
};

const SVG_ATTRIBUTE_MAP: Record<string, string> = {
  viewbox: "viewBox",
  preserveaspectratio: "preserveAspectRatio",
  "accent-height": "accentHeight",
  "alignment-baseline": "alignmentBaseline",
  "arabic-form": "arabicForm",
  "baseline-shift": "baselineShift",
  "cap-height": "capHeight",
  "clip-path": "clipPath",
  "clip-rule": "clipRule",
  "color-interpolation": "colorInterpolation",
  "color-interpolation-filters": "colorInterpolationFilters",
  "color-profile": "colorProfile",
  "color-rendering": "colorRendering",
  "dominant-baseline": "dominantBaseline",
  "enable-background": "enableBackground",
  "fill-opacity": "fillOpacity",
  "fill-rule": "fillRule",
  "flood-color": "floodColor",
  "flood-opacity": "floodOpacity",
  "font-family": "fontFamily",
  "font-size": "fontSize",
  "font-size-adjust": "fontSizeAdjust",
  "font-stretch": "fontStretch",
  "font-style": "fontStyle",
  "font-variant": "fontVariant",
  "font-weight": "fontWeight",
  "glyph-name": "glyphName",
  "glyph-orientation-horizontal": "glyphOrientationHorizontal",
  "glyph-orientation-vertical": "glyphOrientationVertical",
  "horiz-adv-x": "horizAdvX",
  "horiz-origin-x": "horizOriginX",
  "image-rendering": "imageRendering",
  "letter-spacing": "letterSpacing",
  "lighting-color": "lightingColor",
  "marker-end": "markerEnd",
  "marker-mid": "markerMid",
  "marker-start": "markerStart",
  "overline-position": "overlinePosition",
  "overline-thickness": "overlineThickness",
  "paint-order": "paintOrder",
  "panose-1": "panose1",
  "pointer-events": "pointerEvents",
  "rendering-intent": "renderingIntent",
  "shape-rendering": "shapeRendering",
  "stop-color": "stopColor",
  "stop-opacity": "stopOpacity",
  "strikethrough-position": "strikethroughPosition",
  "strikethrough-thickness": "strikethroughThickness",
  "stroke-dasharray": "strokeDasharray",
  "stroke-dashoffset": "strokeDashoffset",
  "stroke-linecap": "strokeLinecap",
  "stroke-linejoin": "strokeLinejoin",
  "stroke-miterlimit": "strokeMiterlimit",
  "stroke-opacity": "strokeOpacity",
  "stroke-width": "strokeWidth",
  "text-anchor": "textAnchor",
  "text-decoration": "textDecoration",
  "text-rendering": "textRendering",
  "underline-position": "underlinePosition",
  "underline-thickness": "underlineThickness",
  "unicode-bidi": "unicodeBidi",
  "unicode-range": "unicodeRange",
  "units-per-em": "unitsPerEm",
  "v-alphabetic": "vAlphabetic",
  "v-hanging": "vHanging",
  "v-ideographic": "vIdeographic",
  "v-mathematical": "vMathematical",
  "vector-effect": "vectorEffect",
  "vert-adv-y": "vertAdvY",
  "vert-origin-x": "vertOriginX",
  "vert-origin-y": "vertOriginY",
  "word-spacing": "wordSpacing",
  "writing-mode": "writingMode",
  "x-height": "xHeight",
  "xlink:actuate": "xlinkActuate",
  "xlink:arcrole": "xlinkArcrole",
  "xlink:href": "xlinkHref",
  "xlink:role": "xlinkRole",
  "xlink:show": "xlinkShow",
  "xlink:title": "xlinkTitle",
  "xlink:type": "xlinkType",
  "xml:base": "xmlBase",
  "xml:lang": "xmlLang",
  "xml:space": "xmlSpace",
  "xmlns:xlink": "xmlnsXlink",
  gradientunits: "gradientUnits",
  gradienttransform: "gradientTransform",
  patternunits: "patternUnits",
  patterntransform: "patternTransform",
  patterncontentunits: "patternContentUnits",
  maskunits: "maskUnits",
  maskcontentunits: "maskContentUnits",
  clippathunits: "clipPathUnits",
  filterunits: "filterUnits",
  primitiveunits: "primitiveUnits",
  spreadmethod: "spreadMethod",
  stddeviation: "stdDeviation",
  basefrequency: "baseFrequency",
  numoctaves: "numOctaves",
  stitchtiles: "stitchTiles",
   surfaceScale: "surfaceScale",
  surfacescale: "surfaceScale",
  specularconstant: "specularConstant",
  specularexponent: "specularExponent",
  diffuseconstant: "diffuseConstant",
  kernelmatrix: "kernelMatrix",
  kernelunitlength: "kernelUnitLength",
  targetx: "targetX",
  targety: "targetY",
  edgemode: "edgeMode",
  preservealpha: "preserveAlpha",
  tablevalues: "tableValues",
  xchannelselector: "xChannelSelector",
  ychannelselector: "yChannelSelector",
  markerwidth: "markerWidth",
  markerheight: "markerHeight",
  markerunits: "markerUnits",
  refx: "refX",
  refy: "refY",
  pathlength: "pathLength",
  startoffset: "startOffset",
  textlength: "textLength",
  lengthadjust: "lengthAdjust",
};

// Case-sensitive SVG tag names that HTML parser lowercases
const SVG_TAG_CASE_MAP: Record<string, string> = {
  altglyph: "altGlyph",
  altglyphdef: "altGlyphDef",
  altglyphitem: "altGlyphItem",
  animatecolor: "animateColor",
  animatemotion: "animateMotion",
  animatetransform: "animateTransform",
  clippath: "clipPath",
  feblend: "feBlend",
  fecolormatrix: "feColorMatrix",
  fecomponenttransfer: "feComponentTransfer",
  fecomposite: "feComposite",
  feconvolvematrix: "feConvolveMatrix",
  fediffuselighting: "feDiffuseLighting",
  fedisplacementmap: "feDisplacementMap",
  fedistantlight: "feDistantLight",
  fedropshadow: "feDropShadow",
  feflood: "feFlood",
  fefunca: "feFuncA",
  fefuncb: "feFuncB",
  fefuncg: "feFuncG",
  fefuncr: "feFuncR",
  fegaussianblur: "feGaussianBlur",
  feimage: "feImage",
  femerge: "feMerge",
  femergenode: "feMergeNode",
  femorphology: "feMorphology",
  feoffset: "feOffset",
  fepointlight: "fePointLight",
  fespecularlighting: "feSpecularLighting",
  fespotlight: "feSpotLight",
  fetile: "feTile",
  feturbulence: "feTurbulence",
  foreignobject: "foreignObject",
  glyphref: "glyphRef",
  lineargradient: "linearGradient",
  radialgradient: "radialGradient",
  textpath: "textPath",
};

const EVENT_HANDLER_MAP: Record<string, string> = {
  onclick: "onClick",
  ondblclick: "onDoubleClick",
  onchange: "onChange",
  oninput: "onInput",
  onsubmit: "onSubmit",
  onreset: "onReset",
  onfocus: "onFocus",
  onblur: "onBlur",
  onkeydown: "onKeyDown",
  onkeypress: "onKeyPress",
  onkeyup: "onKeyUp",
  onmousedown: "onMouseDown",
  onmouseenter: "onMouseEnter",
  onmouseleave: "onMouseLeave",
  onmousemove: "onMouseMove",
  onmouseout: "onMouseOut",
  onmouseover: "onMouseOver",
  onmouseup: "onMouseUp",
  oncontextmenu: "onContextMenu",
  ondrag: "onDrag",
  ondragend: "onDragEnd",
  ondragenter: "onDragEnter",
  ondragexit: "onDragExit",
  ondragleave: "onDragLeave",
  ondragover: "onDragOver",
  ondragstart: "onDragStart",
  ondrop: "onDrop",
  onscroll: "onScroll",
  onwheel: "onWheel",
  ontouchcancel: "ontouchCancel",
  ontouchend: "onTouchEnd",
  ontouchmove: "onTouchMove",
  ontouchstart: "onTouchStart",
  onpointerdown: "onPointerDown",
  onpointermove: "onPointerMove",
  onpointerup: "onPointerUp",
  onpointercancel: "onPointerCancel",
  onpointerenter: "onPointerEnter",
  onpointerleave: "onPointerLeave",
  onpointerover: "onPointerOver",
  onpointerout: "onPointerOut",
  onload: "onLoad",
  onerror: "onError",
  onanimationstart: "onAnimationStart",
  onanimationend: "onAnimationEnd",
  onanimationiteration: "onAnimationIteration",
  ontransitionend: "onTransitionEnd",
  ontoggle: "onToggle",
};

const BOOLEAN_ATTRIBUTES = new Set<string>([
  "allowFullScreen",
  "async",
  "autoFocus",
  "autoPlay",
  "checked",
  "defaultChecked",
  "controls",
  "default",
  "defer",
  "disabled",
  "formNoValidate",
  "hidden",
  "inert",
  "isMap",
  "itemScope",
  "loop",
  "multiple",
  "muted",
  "noModule",
  "noValidate",
  "open",
  "playsInline",
  "readOnly",
  "required",
  "reversed",
  "selected",
]);

const VOID_HTML_TAGS = new Set<string>([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
]);

// ============================================================================
// CSS Inline Style String -> JSX Style Object Converter
// ============================================================================

function cssPropertyToCamelCase(prop: string): string {
  const trimmed = prop.trim();
  // CSS custom properties (--variable) stay as strings
  if (trimmed.startsWith("--")) {
    return trimmed;
  }
  // Microsoft vendor prefix -ms- becomes lowercase ms
  if (trimmed.toLowerCase().startsWith("-ms-")) {
    return (
      "ms" +
      trimmed
        .slice(4)
        .replace(/-([a-zA-Z0-9])/g, (_, ch: string) => ch.toUpperCase())
    );
  }
  // Other vendor prefixes (-webkit-, -moz-, -o-) start with uppercase
  if (trimmed.startsWith("-")) {
    return trimmed
      .slice(1)
      .replace(/(^|-)([a-zA-Z0-9])/g, (_, _sep: string, ch: string) => ch.toUpperCase());
  }
  return trimmed
    .toLowerCase()
    .replace(/-([a-zA-Z0-9])/g, (_, ch: string) => ch.toUpperCase());
}

/**
 * Splits CSS declarations by `;` while respecting parentheses `url(...)` and quotes.
 */
function splitCssDeclarations(cssText: string): string[] {
  const result: string[] = [];
  let current = "";
  let parenDepth = 0;
  let quoteChar: string | null = null;

  for (let i = 0; i < cssText.length; i++) {
    const ch = cssText[i];
    if (quoteChar) {
      current += ch;
      if (ch === quoteChar && cssText[i - 1] !== "\\") {
        quoteChar = null;
      }
      continue;
    }

    if (ch === '"' || ch === "'") {
      quoteChar = ch;
      current += ch;
    } else if (ch === "(") {
      parenDepth++;
      current += ch;
    } else if (ch === ")") {
      parenDepth = Math.max(0, parenDepth - 1);
      current += ch;
    } else if (ch === ";" && parenDepth === 0) {
      if (current.trim()) {
        result.push(current.trim());
      }
      current = "";
    } else {
      current += ch;
    }
  }

  if (current.trim()) {
    result.push(current.trim());
  }

  return result;
}

export function formatInlineStyleToJsx(
  styleString: string,
  options: Pick<HtmlToJsxOptions, "useSingleQuotes" | "numericStylePx">,
): string {
  const declarations = splitCssDeclarations(styleString);
  if (declarations.length === 0) {
    return "{{}}";
  }

  const quote = options.useSingleQuotes ? "'" : '"';
  const entries: string[] = [];

  for (const decl of declarations) {
    const colonIdx = decl.indexOf(":");
    if (colonIdx === -1) continue;

    const rawProp = decl.slice(0, colonIdx).trim();
    const rawVal = decl.slice(colonIdx + 1).trim();
    if (!rawProp || !rawVal) continue;

    const jsKey = cssPropertyToCamelCase(rawProp);
    const formattedKey = jsKey.startsWith("--") ? `${quote}${jsKey}${quote}` : jsKey;

    // Check if value is a pure number or pixel value
    let formattedVal: string;
    if (/^-?\d+(\.\d+)?$/.test(rawVal)) {
      formattedVal = rawVal;
    } else if (options.numericStylePx && /^-?\d+(\.\d+)?px$/i.test(rawVal)) {
      formattedVal = rawVal.slice(0, -2);
    } else {
      const escapedVal = rawVal
        .replace(/\\/g, "\\\\")
        .replace(new RegExp(quote, "g"), `\\${quote}`);
      formattedVal = `${quote}${escapedVal}${quote}`;
    }

    entries.push(`${formattedKey}: ${formattedVal}`);
  }

  if (entries.length === 0) {
    return "{{}}";
  }

  return `{{ ${entries.join(", ")} }}`;
}

// ============================================================================
// Text & Attribute Escaping Helpers
// ============================================================================

function escapeJsxText(text: string): string {
  return text
    .replace(/\{/g, "&#123;")
    .replace(/\}/g, "&#125;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function formatAttributeStringValue(value: string, useSingleQuotes: boolean): string {
  // If string has newlines, wrap in JSX expression string literal
  if (value.includes("\n")) {
    return `{${JSON.stringify(value)}}`;
  }
  if (useSingleQuotes) {
    if (!value.includes("'")) {
      return `'${value}'`;
    }
    return `{${JSON.stringify(value)}}`;
  } else {
    if (!value.includes('"')) {
      return `"${value}"`;
    }
    return `{'${value.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'}`;
  }
}

function getIndentUnit(indent: JsxIndentOption): string {
  if (indent === "tab") return "\t";
  if (indent === "4") return "    ";
  return "  ";
}

function sanitizeComponentName(name: string): string {
  const cleaned = name.replace(/[^a-zA-Z0-9_$]/g, "");
  if (!cleaned) return "ConvertedComponent";
  return cleaned[0].toUpperCase() + cleaned.slice(1);
}

// ============================================================================
// Main HTML -> JSX AST Serializer
// ============================================================================

interface ConversionContext {
  options: HtmlToJsxOptions;
  indentUnit: string;
  stats: HtmlToJsxStats;
  transformMap: Map<string, AttributeTransformRecord>;
}

function recordTransform(
  ctx: ConversionContext,
  original: string,
  converted: string,
  category: AttributeTransformRecord["category"],
) {
  const key = `${category}:${original}->${converted}`;
  const existing = ctx.transformMap.get(key);
  if (existing) {
    existing.count += 1;
  } else {
    ctx.transformMap.set(key, {
      original,
      converted,
      category,
      count: 1,
    });
  }
}

function resolveTagName(el: Element): string {
  const rawLower = el.tagName.toLowerCase();
  if (SVG_TAG_CASE_MAP[rawLower]) {
    return SVG_TAG_CASE_MAP[rawLower];
  }
  return rawLower;
}

function convertElementAttributes(
  el: Element,
  tagName: string,
  isRootElement: boolean,
  ctx: ConversionContext,
): string[] {
  const attrs: string[] = [];
  const isFormControl =
    tagName === "input" || tagName === "textarea" || tagName === "select";

  for (let i = 0; i < el.attributes.length; i++) {
    const attr = el.attributes[i];
    const rawName = attr.name;
    const lowerName = rawName.toLowerCase();
    const rawValue = attr.value;

    // Strip data-* attributes if requested
    if (ctx.options.stripDataAttributes && lowerName.startsWith("data-")) {
      ctx.stats.attributesConverted++;
      recordTransform(ctx, rawName, "(stripped)", "html-attr");
      continue;
    }

    // 1. Inline style attribute
    if (lowerName === "style") {
      ctx.stats.stylesConverted++;
      ctx.stats.attributesConverted++;
      const styleObj = formatInlineStyleToJsx(rawValue, ctx.options);
      recordTransform(ctx, 'style="..."', `style=${styleObj}`, "style-obj");
      attrs.push(`style=${styleObj}`);
      continue;
    }

    // 2. Inline event handler (onclick, onchange, etc.)
    if (EVENT_HANDLER_MAP[lowerName]) {
      const jsxEvent = EVENT_HANDLER_MAP[lowerName];
      ctx.stats.attributesConverted++;
      recordTransform(ctx, rawName, jsxEvent, "event-handler");
      const trimmedBody = rawValue.trim().replace(/;$/, "");
      attrs.push(`${jsxEvent}={() => { ${trimmedBody}; }}`);
      continue;
    }

    // 3. Preserve data-* and aria-* attributes as-is
    if (lowerName.startsWith("data-") || lowerName.startsWith("aria-")) {
      attrs.push(
        `${lowerName}=${formatAttributeStringValue(rawValue, ctx.options.useSingleQuotes)}`,
      );
      continue;
    }

    // 4. Form uncontrolled default props (value -> defaultValue, checked -> defaultChecked)
    if (ctx.options.uncontrolledFormProps && isFormControl) {
      if (lowerName === "value" && tagName !== "option") {
        ctx.stats.attributesConverted++;
        recordTransform(ctx, "value", "defaultValue", "form-prop");
        attrs.push(
          `defaultValue=${formatAttributeStringValue(rawValue, ctx.options.useSingleQuotes)}`,
        );
        continue;
      }
      if (lowerName === "checked") {
        ctx.stats.attributesConverted++;
        recordTransform(ctx, "checked", "defaultChecked", "form-prop");
        attrs.push("defaultChecked");
        continue;
      }
    }

    // 5. Map HTML / SVG attributes
    let targetName = rawName;
    if (HTML_ATTRIBUTE_MAP[lowerName]) {
      targetName = HTML_ATTRIBUTE_MAP[lowerName];
      if (targetName !== rawName) {
        ctx.stats.attributesConverted++;
        recordTransform(ctx, rawName, targetName, "html-attr");
      }
    } else if (SVG_ATTRIBUTE_MAP[lowerName]) {
      targetName = SVG_ATTRIBUTE_MAP[lowerName];
      if (targetName !== rawName) {
        ctx.stats.svgAttrsConverted++;
        ctx.stats.attributesConverted++;
        recordTransform(ctx, rawName, targetName, "svg-attr");
      }
    } else if (rawName.includes("-") || rawName.includes(":")) {
      // Fallback camelCasing for any unmapped SVG/XML hyphenated or namespaced attribute
      const camelCased = rawName.replace(/[-:]([a-zA-Z])/g, (_, ch: string) =>
        ch.toUpperCase(),
      );
      if (camelCased !== rawName) {
        targetName = camelCased;
        ctx.stats.svgAttrsConverted++;
        ctx.stats.attributesConverted++;
        recordTransform(ctx, rawName, targetName, "svg-attr");
      }
    }

    // 6. Boolean attributes
    if (BOOLEAN_ATTRIBUTES.has(targetName)) {
      if (rawValue === "" || rawValue.toLowerCase() === lowerName || rawValue === "true") {
        if (rawValue !== "") {
          ctx.stats.attributesConverted++;
          recordTransform(ctx, `${rawName}="${rawValue}"`, targetName, "boolean-attr");
        }
        attrs.push(targetName);
        continue;
      }
      if (rawValue === "false") {
        attrs.push(`${targetName}={false}`);
        continue;
      }
    }

    attrs.push(
      `${targetName}=${formatAttributeStringValue(rawValue, ctx.options.useSingleQuotes)}`,
    );
  }

  // Spread props on root element when generating a typed component
  if (
    isRootElement &&
    ctx.options.spreadRootProps &&
    (ctx.options.outputMode === "component-tsx" ||
      ctx.options.outputMode === "svg-icon-tsx")
  ) {
    attrs.push("{...props}");
  }

  return attrs;
}

function serializeNode(
  node: Node,
  depth: number,
  isRootElement: boolean,
  ctx: ConversionContext,
): string | null {
  const pad = ctx.indentUnit.repeat(depth);

  // Text Node
  if (node.nodeType === Node.TEXT_NODE) {
    const rawText = node.nodeValue ?? "";
    if (!rawText.trim()) {
      return null;
    }
    // Collapse excessive internal indentation whitespace on multiline text nodes
    const normalized = rawText.replace(/\s+/g, " ");
    return `${pad}${escapeJsxText(normalized.trim())}`;
  }

  // Comment Node
  if (node.nodeType === Node.COMMENT_NODE) {
    const commentText = (node.nodeValue ?? "").trim();
    ctx.stats.commentsProcessed++;
    if (ctx.options.commentMode === "strip") {
      return null;
    }
    const safeComment = commentText.replace(/\*\//g, "* /");
    return `${pad}{/* ${safeComment} */}`;
  }

  // Element Node
  if (node.nodeType === Node.ELEMENT_NODE) {
    const el = node as Element;
    ctx.stats.elementsCount++;
    const tagName = resolveTagName(el);
    const attrs = convertElementAttributes(el, tagName, isRootElement, ctx);
    const attrStr = attrs.length > 0 ? " " + attrs.join(" ") : "";

    // Special handling for <textarea> defaultValue in React
    if (tagName === "textarea" && el.textContent && el.textContent.trim().length > 0) {
      const textVal = el.textContent;
      const valAttr = `defaultValue=${formatAttributeStringValue(textVal, ctx.options.useSingleQuotes)}`;
      ctx.stats.attributesConverted++;
      recordTransform(ctx, "<textarea>...</textarea>", `<textarea ${valAttr} />`, "form-prop");
      return `${pad}<textarea${attrStr} ${valAttr} />`;
    }

    // Special handling for raw <style> or <script> tags
    if ((tagName === "style" || tagName === "script") && el.textContent?.trim()) {
      const content = el.textContent.trim();
      return `${pad}<${tagName}${attrStr} dangerouslySetInnerHTML={{ __html: ${JSON.stringify(content)} }} />`;
    }

    const isVoid = VOID_HTML_TAGS.has(tagName);
    if (isVoid) {
      ctx.stats.voidTagsClosed++;
      return `${pad}<${tagName}${attrStr} />`;
    }

    // Process children
    const childNodes = Array.from(el.childNodes);

    // Check if element has only a single inline text child
    if (
      childNodes.length === 1 &&
      childNodes[0].nodeType === Node.TEXT_NODE &&
      (childNodes[0].nodeValue ?? "").trim().length > 0 &&
      !(childNodes[0].nodeValue ?? "").includes("\n") &&
      (childNodes[0].nodeValue ?? "").trim().length <= 64
    ) {
      const singleText = escapeJsxText((childNodes[0].nodeValue ?? "").trim());
      return `${pad}<${tagName}${attrStr}>${singleText}</${tagName}>`;
    }

    const serializedChildren: string[] = [];
    for (const child of childNodes) {
      const rendered = serializeNode(child, depth + 1, false, ctx);
      if (rendered !== null) {
        serializedChildren.push(rendered);
      }
    }

    if (serializedChildren.length === 0) {
      if (ctx.options.selfCloseEmptyElements) {
        ctx.stats.voidTagsClosed++;
        return `${pad}<${tagName}${attrStr} />`;
      }
      return `${pad}<${tagName}${attrStr}></${tagName}>`;
    }

    return [
      `${pad}<${tagName}${attrStr}>`,
      ...serializedChildren,
      `${pad}</${tagName}>`,
    ].join("\n");
  }

  return null;
}

/**
 * Parses HTML string into top-level DOM nodes using `<template>` so fragments
 * (`<tr>`, `<svg>`, multiple root `<div>`s) are preserved cleanly without extra `<html><body>` wrappers.
 */
function parseHtmlFragmentNodes(rawHtml: string): Node[] {
  const trimmed = rawHtml.trim();
  if (!trimmed) return [];

  // If the user pasted a full HTML document (`<!DOCTYPE` or `<html`), extract body children
  if (/^<!doctype\s+html/i.test(trimmed) || /^<html[\s>]/i.test(trimmed)) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(trimmed, "text/html");
    return Array.from(doc.body.childNodes);
  }

  const template = document.createElement("template");
  template.innerHTML = trimmed;
  return Array.from(template.content.childNodes);
}

export function convertHtmlToJsx(
  rawHtml: string,
  options: HtmlToJsxOptions = DEFAULT_HTML_TO_JSX_OPTIONS,
): HtmlToJsxResult {
  const inputBytes = new TextEncoder().encode(rawHtml).length;
  const indentUnit = getIndentUnit(options.indent);

  const ctx: ConversionContext = {
    options,
    indentUnit,
    stats: {
      elementsCount: 0,
      attributesConverted: 0,
      stylesConverted: 0,
      svgAttrsConverted: 0,
      voidTagsClosed: 0,
      commentsProcessed: 0,
      inputBytes,
      outputBytes: 0,
      outputLines: 0,
    },
    transformMap: new Map(),
  };

  if (!rawHtml.trim()) {
    return {
      jsx: "",
      isValid: true,
      stats: ctx.stats,
      transformLog: [],
    };
  }

  try {
    const rawNodes = parseHtmlFragmentNodes(rawHtml);

    // Filter meaningful top-level nodes
    const meaningfulNodes = rawNodes.filter((n) => {
      if (n.nodeType === Node.TEXT_NODE) {
        return (n.nodeValue ?? "").trim().length > 0;
      }
      if (n.nodeType === Node.COMMENT_NODE) {
        return options.commentMode !== "strip";
      }
      return n.nodeType === Node.ELEMENT_NODE;
    });

    const elementNodes = meaningfulNodes.filter((n) => n.nodeType === Node.ELEMENT_NODE);
    const needsFragmentWrapper = meaningfulNodes.length > 1 || elementNodes.length === 0;

    const baseDepth =
      options.outputMode === "fragment"
        ? needsFragmentWrapper
          ? 1
          : 0
        : needsFragmentWrapper
          ? 3
          : 2;

    const renderedRoots: string[] = [];
    for (const node of meaningfulNodes) {
      const isSingleRootElement =
        !needsFragmentWrapper && node.nodeType === Node.ELEMENT_NODE;
      const line = serializeNode(node, baseDepth, isSingleRootElement, ctx);
      if (line !== null) {
        renderedRoots.push(line);
      }
    }

    let bodyMarkup = renderedRoots.join("\n");

    if (needsFragmentWrapper && renderedRoots.length > 0) {
      const fragPad =
        options.outputMode === "fragment" ? "" : indentUnit.repeat(2);
      bodyMarkup = `${fragPad}<>\n${bodyMarkup}\n${fragPad}</>`;
    }

    const compName = sanitizeComponentName(options.componentName);
    const quote = options.useSingleQuotes ? "'" : '"';
    let finalOutput = bodyMarkup;

    if (options.outputMode === "component-jsx") {
      finalOutput = [
        `export function ${compName}() {`,
        `${indentUnit}return (`,
        bodyMarkup,
        `${indentUnit});`,
        `}`,
      ].join("\n");
    } else if (options.outputMode === "component-tsx") {
      const rootTag =
        !needsFragmentWrapper && elementNodes.length === 1
          ? resolveTagName(elementNodes[0] as Element)
          : "div";
      finalOutput = [
        `import * as React from ${quote}react${quote};`,
        ``,
        `export type ${compName}Props = React.ComponentProps<${quote}${rootTag}${quote}>;`,
        ``,
        `export function ${compName}(props: ${compName}Props) {`,
        `${indentUnit}return (`,
        bodyMarkup,
        `${indentUnit});`,
        `}`,
      ].join("\n");
    } else if (options.outputMode === "svg-icon-tsx") {
      finalOutput = [
        `import * as React from ${quote}react${quote};`,
        ``,
        `export function ${compName}(props: React.SVGProps<SVGSVGElement>) {`,
        `${indentUnit}return (`,
        bodyMarkup,
        `${indentUnit});`,
        `}`,
      ].join("\n");
    }

    ctx.stats.outputBytes = new TextEncoder().encode(finalOutput).length;
    ctx.stats.outputLines = finalOutput ? finalOutput.split(/\r?\n/).length : 0;

    return {
      jsx: finalOutput,
      isValid: true,
      stats: ctx.stats,
      transformLog: Array.from(ctx.transformMap.values()).sort(
        (a, b) => b.count - a.count,
      ),
    };
  } catch (err) {
    return {
      jsx: "",
      isValid: false,
      error: err instanceof Error ? err.message : "Failed to parse HTML input",
      stats: ctx.stats,
      transformLog: [],
    };
  }
}
