import { getCsrfToken, signOut, useSession } from "next-auth/react";
import { useRouter } from "next/router";
import createClientID from "../util/createClientID";
import { DefaultSession } from "next-auth";
import { FaUser } from "react-icons/fa";

interface Props {
  csrfToken: string | undefined;
}

export default function Connect({ csrfToken }: Props) {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === "unauthenticated") {
    // basically what signIn does, but signIn redirects via API which give a blank page on transition
    const query = { callbackUrl: router.asPath };
    router.push({ pathname: "auth/signin", query });
  }

  //if (!session?.user) return null;
  return (
    <div className="Container Narrow">
      {!session ? (
        <div className="Loader" />
      ) : (
        <ConfirmConnectRequest session={session} csrfToken={csrfToken} />
      )}
    </div>
  );
}

export async function getServerSideProps(context: any) {
  const csrfToken = await getCsrfToken(context);
  return {
    props: { csrfToken },
  };
}

interface ConfirmConnectRequestProps {
  session: DefaultSession;
  csrfToken: string | undefined;
}

function ConfirmConnectRequest({
  session,
  csrfToken,
}: ConfirmConnectRequestProps) {
  const user = session.user;
  const router = useRouter();

  const q = router.query;
  if (!q.redirect_uri || !q.state || !q.code_challenge || !q.resource)
    return <div>Invalid request</div>;
  const redirect_uri = asSingleString(q.redirect_uri);
  const state = asSingleString(q.state);
  const code_challenge = asSingleString(q.code_challenge);
  const resource = asSingleString(q.resource);

  const clientURL = new URL(redirect_uri);
  const serverURL = new URL(resource);

  const acceptToken = () => {
    createAmcatSession(redirect_uri, resource, state, code_challenge, csrfToken)
      .then((response_url) => {
        router.push(response_url);
      })
      .catch((e) => console.error(e));
  };

  return (
    <div className="ConfirmConnection">
      <div className="ConnectionDetails">
        <div className="User">
          {user?.image ? (
            <img className="Image" src={user.image} alt="profile" />
          ) : (
            <FaUser className="MissingImage" />
          )}
          <div>
            {user?.name || user?.email}
            {user?.name ? (
              <>
                <br />
                <span style={{ fontSize: "1.2rem" }}>{user?.email}</span>
              </>
            ) : null}
          </div>
        </div>
        <div style={{ marginTop: "2rem" }}>
          The application <b className="SecondaryColor">{clientURL.host}</b>{" "}
          wants to connect to{" "}
          <b className="SecondaryColor">
            {serverURL.host + serverURL.pathname}
          </b>{" "}
          on your behalf
        </div>
      </div>
      <div className="ConnectionContainer" onClick={acceptToken}>
        <div className="Connection">Authorize</div>
      </div>

      <div className="ButtonGroup">
        <button onClick={() => signOut()}>Change user</button>
        <button onClick={() => router.push("/")}>Refuse connection</button>
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
  redirectUri: string,
  resource: string,
  state: string,
  codeChallenge: string,
  csrfToken: string | undefined
): Promise<string> {
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
      csrfToken,
      type: "browser",
      label: clientId,
    }),
  });

  const data = await res.json();
  // our authentication code is the id + secret
  const authCode = data.id + "." + data.secret;
  return `${redirectUri}?code=${authCode}&state=${state}`;
}

function asSingleString(stringOrArray: string | string[]): string {
  // url parameters are string | string[].
  return Array.isArray(stringOrArray) ? stringOrArray[0] : stringOrArray;
}
