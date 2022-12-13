import UAParser from "ua-parser-js";

export default function createdOnDetails(userAgent: string) {
  // create a string with user agent information
  const ua = UAParser(userAgent);
  let details: string[] = [];
  if (ua?.device?.vendor) details.push(ua.device.vendor);
  if (ua?.os?.name) details.push(ua.os.name);
  if (ua?.browser?.name) details.push(ua.browser.name);

  return details.join(", ");
}
