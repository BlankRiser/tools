export const TRACKING_PARAMS = [
  // Google Analytics / Ads
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "utm_id",
  "gclid",
  "gclsrc",
  "wbraid",
  "gbraid",
  "_gl",
  
  // Facebook / Instagram
  "fbclid",
  "igshid",
  
  // Twitter / X
  "twclid",
  
  // Microsoft / Bing
  "msclkid",
  
  // LinkedIn
  "li_fat_id",
  
  // TikTok
  "ttclid",
  
  // HubSpot
  "_hsenc",
  "_hsmi",
  
  // Mailchimp
  "mc_cid",
  "mc_eid",
  
  // Marketo
  "mkt_tok",
  
  // Omeda
  "oly_enc_id",
  "oly_anon_id"
];

export function isTrackingParam(paramName: string): boolean {
  return TRACKING_PARAMS.includes(paramName.toLowerCase());
}
