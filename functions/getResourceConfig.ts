export default async function getResourceConfig(url: string) {
  try {
    const resource = url.replace(/\/$/, ""); // standardize
    const config_res = await fetch(resource + "/middlecat");
    const config = await config_res.json();
    return config;
  } catch (e) {
    return null;
  }
}
