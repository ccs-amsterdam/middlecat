interface Params {
  clientId?: string;
  clientSecret?: string;
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
    async profile(profile: any) {
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
