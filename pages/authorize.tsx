import { signIn, signOut, useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";
import createClientID from "../util/createClientID";

export default function IndexPage() {
  const { data: session, status } = useSession();
  const [msg, setMsg] = useState("");
  const router = useRouter();

  if (status !== "loading" && !session) signIn();

  const acceptToken = useCallback(() => {
    if (status === "loading" || !session) return;

    const q = router.query;
    if (!q.redirect_uri || !q.state || !q.code_challenge || !q.resource) {
      setMsg("Noooooooo invalid request");
      return;
    }

    createAmcatSession(q.redirect_uri, q.resource, q.state, q.code_challenge)
      .then((response_url) => {
        router.push(response_url);
        //window.location.href = response_url;
      })
      .catch((e) => {
        console.error(e);
        setMsg("Nooooooo something went wrong in creating the AmCAT session");
      });
  }, [router, session, status]);

  useEffect(() => {
    // here implement call to server to see if client is trusted.
    // if so, can immediately accept
    acceptToken();
  });

  const render = () => {
    const q = router.query;
    if (!q.redirect_uri || !q.state || !q.code_challenge || !q.resource) {
      return <div>Invalid request</div>;
    }

    if (session === "loading") return <div className="Loader" />;

    return <button></button>;
  };

  // would be cool to also list active sessions on this page, and
  // allow users to open or close them. Add notification that there
  // can be a 30 minute delay when closing a session that is currently active

  return (
    <div className="Page">
      <div className="Container">
        <div>
          <h1 className="Title">MiddleCat</h1>
          {status === "loading" ? <div className="Loader" /> : msg}
        </div>
      </div>
    </div>
  );
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
