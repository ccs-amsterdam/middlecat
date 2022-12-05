export default function createClientID(redirect_uri: string) {
  // we don't have clients register at middleCat. Instead, the resource server should
  // be able to tell which clients to trust. As client id we therefore use the client host domain
  const clientURL = new URL(redirect_uri);
  return clientURL.host;
}
