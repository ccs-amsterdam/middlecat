export default async function getResourceConfig(url: string | null) {
  if (!url) return null;
  try {
    const resource = url.replace(/\/$/, ""); // standardize
    const config_res = await fetch(resource + "/config");
    const config = await config_res.json();
    return config;
  } catch (e) {
    return null;
  }
}
