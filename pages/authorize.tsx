import { signIn, signOut, useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import createClientID from "../util/createClientID";

export default function IndexPage() {
  const { data: session, status } = useSession();
  const [msg, setMsg] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    const q = router.query;
    if (!q.redirect_uri || !q.state || !q.code_challenge || !q.resource) {
      setMsg("Noooooooo invalid request");
      return;
    }

    if (!session) {
      signIn();
      return; // remove the url parameters
    }

    // if we have a MiddleCat session, we can create an AmCAT session
    createAmcatSession(q.redirect_uri, q.resource, q.state, q.code_challenge)
      .then((response_url) => {
        window.location.href = response_url;
      })
      .catch((e) => {
        console.error(e);
        setMsg("Nooooooo something went wrong in creating the AmCAT session");
      });
  }, [router, session, status]);

  if (status === "loading") return <div>Loading</div>;
  return <div>{msg}</div>;
}

/**
 * We're doing an adjusted oauth2 + PKCE flow.
 *
 * @param redirect_uri The redirect uri also define the client_id (a client
 *                     such as AmCAT4 react that wants to access an AmCAT resource server). Unlike
 *                     common auth servers, the client_id is not registered in MiddleCat, but
 *                     in the resource server (which should have a /clients endpoint). (MiddleCat
 *                     instead can require resource servers to register)
 * @param resource     The AmCAT resource server.
 * @param state        We use a random state as CSRF protection
 * @param codeChallenge PKCE code challenge
 */
async function createAmcatSession(
  redirectUri: string | string[],
  resource: string | string[],
  state: string | string[],
  codeChallenge: string | string[]
): string {
  redirectUri = asSingleString(redirectUri);
  resource = asSingleString(resource);
  state = asSingleString(state);
  codeChallenge = asSingleString(codeChallenge);

  const clientId = createClientID(redirectUri);

  const res = await fetch(`/api/newAmcatSession`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      clientId,
      resource,
      state,
      codeChallenge,
      redirectUri,
    }),
  });

  const data = await res.json();
  return `${redirectUri}?code=${data.authCode}&state=${state}`;
}

function asSingleString(stringOrArray: string | string[]): string {
  // url parameters are string | string[].
  return Array.isArray(stringOrArray) ? stringOrArray[0] : stringOrArray;
}
