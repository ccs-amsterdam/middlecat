import { Session } from "next-auth";
import { signIn, signOut, useSession } from "next-auth/react";
import { useRouter } from "next/router";
import createClientID from "../util/createClientID";

export default function Connect() {
  const { data: session, status } = useSession();

  if (status === "unauthenticated") signIn();
  if (!session?.user) return null;

  return (
    <div className="Page">
      <div className="Container">
        {!session ? (
          <div className="Loader" />
        ) : (
          <ConfirmConnectRequest user={session.user} />
        )}
      </div>
    </div>
  );
}

interface User {
  name: string;
  email: string;
  image: string;
}

function ConfirmConnectRequest({ user }: { user: User }) {
  const router = useRouter();
  const q = router.query;
  if (!q.redirect_uri || !q.state || !q.code_challenge || !q.resource)
    return <div>Invalid request</div>;

  const acceptToken = () => {
    createAmcatSession(q.redirect_uri, q.resource, q.state, q.code_challenge)
      .then((response_url) => {
        router.push(response_url);
      })
      .catch((e) => console.error(e));
  };

  const clientURL = new URL(q.redirect_uri);
  const serverURL = new URL(q.resource);

  return (
    <div className="ConfirmConnection">
      <div className="ConnectionDetails">
        <div className="User">
          <img className="Image" src={user?.image} />
          <div>
            {user?.name}
            <br />
            <span style={{ fontSize: "1.2rem" }}>{user?.email}</span>
          </div>
        </div>
        <div style={{ marginTop: "2rem" }}>
          The application <b className="SecondaryColor">{clientURL.host}</b>{" "}
          wants to access your account on{" "}
          <b className="SecondaryColor">{serverURL.host}</b>
        </div>
      </div>
      <div className="ConnectionContainer" onClick={acceptToken}>
        <div className="Connection">Authorize</div>
      </div>

      <div className="ButtonGroup">
        <button onClick={() => signOut()}>Change user</button>
        <button
          onClick={() => router.push(q.redirect_uri)}
          style={{ marginTop: "10px" }}
          onClick={() => signOut()}
        >
          Refuse connection
        </button>
      </div>
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
