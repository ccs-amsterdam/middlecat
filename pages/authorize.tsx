import { Session } from "next-auth";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useCallback } from "react";
import createClientID from "../util/createClientID";

export default function Connect() {
  return (
    <div className="Page">
      <div className="Container">
        <ConfirmConnectRequest />
      </div>
    </div>
  );
}

function ConfirmConnectRequest() {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status !== "loading" && !session) signIn();

  const acceptToken = useCallback(() => {
    if (status === "loading" || !session) return;

    const q = router.query;
    createAmcatSession(q.redirect_uri, q.resource, q.state, q.code_challenge)
      .then((response_url) => {
        router.push(response_url);
        //window.location.href = response_url;
      })
      .catch((e) => console.error(e));
  }, [router, session, status]);

  const q = router.query;
  if (!q.redirect_uri || !q.state || !q.code_challenge || !q.resource)
    return <div>Invalid request</div>;

  if (session === "loading") return <div className="Loader" />;

  const clientURL = new URL(q.redirect_uri);
  const serverURL = new URL(q.resource);

  return (
    <div className="ConfirmConnection">
      <div className="User">
        <img className="Image" src={session?.user?.image} />
        <span>{session?.user?.email}</span>
      </div>
      <p>
        <b className="SecondaryColor">{clientURL.host}</b> wants to sign in to{" "}
        <b className="PrimaryColor">{serverURL.host}</b>
      </p>
      <div className="ConnectionContainer" onClick={acceptToken}>
        <div className="Connection">
          <div className="Label Client">
            {/* <span>application</span>
            <br /> */}
            {clientURL.host}
          </div>
          <div className="zigzagClient" />

          <div className="Divider">
            <div>click to connect</div>
          </div>
          <div className="zigzagServer" />
          <div className="Label Server">{serverURL.host}</div>
        </div>
      </div>

      <button>I dont trust this connection</button>
    </div>
  );
}

/**
 * We're doing an adjusted oauth2 + PKCE flow.
 *
 * @param redirect_uri The redirect uri domain also serves as the client_id (a client
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
