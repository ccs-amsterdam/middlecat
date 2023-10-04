interface Params {
  clientId: string;
  clientSecret: string;
}

export const SurfConextProvider = ({ clientId, clientSecret }: Params) => {
  return {
    id: "surfconext",
    name: "SurfConext",
    type: "oauth",
    version: "2.0",
    //scope: "openid",
    wellKnown:
      "https://connect.test.surfconext.nl/.well-known/openid-configuration",
    authorization: { params: { scope: "openid email profile" } },
    //params: { grant_type: "authorization_code" },
    //token: "https://proxy.sram.surf.nl/OIDC/token",
    //authorization: "https://proxy.sram.surf.nl/saml2sp/OIDC/authorization",
    //userinfo: "https://proxy.sram.surf.nl/OIDC/userinfo",
    async profile(profile, tokens) {
      // You can use the tokens, in case you want to fetch more profile information
      // For example several OAuth providers do not return email by default.
      // Depending on your provider, will have tokens like `access_token`, `id_token` and or `refresh_token`
      return {
        id: profile.id || profile.uids || profile.email,
        name: profile.name,
        email: profile.email,
        image: profile.picture || "",
      };
    },
    clientId,
    clientSecret,
  };
};
