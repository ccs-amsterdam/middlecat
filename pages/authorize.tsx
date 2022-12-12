import { getCsrfToken, signOut, useSession } from "next-auth/react";
import { useRouter } from "next/router";
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
  if (
    !q.client_id ||
    !q.redirect_uri ||
    !q.state ||
    !q.code_challenge ||
    !q.resource
  )
    return <div style={{ textAlign: "center" }}>Invalid request</div>;

  const client_id = asSingleString(q.client_id);
  const redirect_uri = asSingleString(q.redirect_uri);
  const state = asSingleString(q.state);
  const code_challenge = asSingleString(q.code_challenge);
  const resource = asSingleString(q.resource);
  const scope = asSingleString(q.scope || "");
  let refresh_rotate = q.static_refresh !== "static";

  const clientURL = new URL(redirect_uri);
  const serverURL = new URL(resource);

  // if client is not localhost, the clientID must be identical to
  // the client host as based on the redirect_uri. This is so at
  // some point we can still decide to use client id. The link between
  // client id and redirect_uri is important because the client id
  // is shown to users to authorize, and should not be fake-able.

  let clientLabel = client_id;
  let clientNote = "";
  if (!/^localhost/.test(clientURL.host)) {
    // if browserclient
    if (client_id !== clientURL.host) {
      return <div>Invalid request</div>;
    }
    refresh_rotate = true; // browser client must use refresh rotation
    clientNote = `This is a web application. Any website can access your account on AmCAT servers
    if you let them. Only authorize if you were using and trust this website.`;
  } else {
    // if local application
    clientLabel = `${client_id}`;
    clientNote = `This is an application running on your own device. The name (${clientLabel}) is
      set by this application, and we cannot verify its legitimacy. Only authorize if you were
      using and trust this application`;
    // When client is localhost, the given client ID will be shown together
    // with the notification that an application on the user's own device wants to connect
  }

  const acceptToken = () => {
    createAmcatSession(
      client_id,
      redirect_uri,
      resource,
      state,
      code_challenge,
      scope,
      refresh_rotate,
      csrfToken
    )
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
        <div className="ConfirmMessage">
          The application <b className="SecondaryColor">{clientLabel}</b>*
          <br /> wants to connect to server <br />
          <b className="SecondaryColor">
            {serverURL.host + serverURL.pathname}
          </b>{" "}
        </div>
      </div>
      <div className="ConnectionContainer" onClick={acceptToken}>
        <div className="Connection">Authorize</div>
        <p className="ClientNote">* {clientNote}</p>
      </div>

      <div className="ButtonGroup">
        <button onClick={() => signOut()}>Change user</button>
        <button onClick={() => router.push("/")}>I did not request this</button>
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
  clientId: string,
  redirectUri: string,
  resource: string,
  state: string,
  codeChallenge: string,
  scope: string,
  refreshRotate: boolean,
  csrfToken: string | undefined
): Promise<string> {
  const res = await fetch(`/api/newAmcatSession`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "x-csrf-token": csrfToken || "",
    },
    body: JSON.stringify({
      clientId,
      resource,
      state,
      codeChallenge,
      scope,
      refreshRotate,
      redirectUri,
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
