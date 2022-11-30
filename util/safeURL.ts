export default function safeURL(url: string) {
  const u = new URL(url);
  const valid = ["http:", "https:"].includes(u.protocol);
  return valid ? url : "";
}
