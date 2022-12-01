export function silentDeleteSearchParams(items: string[]) {
  // remove url parameters without refresh
  const searchParams = new URLSearchParams(window.location.search);
  for (let item of items) searchParams.delete(item);
  let paramstring = searchParams.toString();
  let url = window.location.pathname;
  if (paramstring) url += "?" + paramstring;
  window.history.replaceState(null, null, url);
}
