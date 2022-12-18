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
    !q.resource ||
    (q.session_type &&
      !["api_key", "browser"].includes(asSingleString(q.session_type))) ||
    (q.refresh_mode &&
      !["static", "rotate"].includes(asSingleString(q.refresh_mode)))
  ) {
    return <div style={{ textAlign: "center" }}>Invalid request</div>;
  }

  const client_id = asSingleString(q.client_id);
  const redirect_uri = asSingleString(q.redirect_uri);
  const state = asSingleString(q.state);
  const code_challenge = asSingleString(q.code_challenge);
  const resource = asSingleString(q.resource);
  const scope = asSingleString(q.scope || "");
  const session_type = asSingleString(q.session_type || "");
  const refresh_mode = asSingleString(q.session_type || "");
  const expires_in = q.expires_in_sec
    ? Number(asSingleString(q.expires_in_sec))
    : null;

  const clientURL = new URL(redirect_uri);
  const serverURL = new URL(resource);
  const type = session_type === "api_key" ? "apiKey" : "browser";
  const refresh_rotate = refresh_mode !== "static";
  const localhost = /^localhost/.test(clientURL.host);

  // api_key session have more freedom to specify settings,
  // but this is only allowed if requested from localhost
  if (!localhost && type === "apiKey") {
    return (
      <InvalidRequestMsg>
        An API key can only be created via OAuth if the redirect_uri is on
        localhost. Note that you can also create API keys manually on the
        MiddleCat website.
      </InvalidRequestMsg>
    );
  }

  const clientLabel = client_id;
  let clientNote = "";
  if (type === "apiKey") {
    // When client is localhost, the given client ID will be shown together
    // with the notification that an application on the user's own device wants to connect
    clientNote = `This is an application running on your own device. The name (${clientLabel}) is
      set by this application, and we cannot verify its legitimacy. Only authorize if you were
      using and trust this application`;
  } else {
    // if type === 'browser'
    if (client_id !== clientURL.host) {
      // for browserSessions, the clientID must be identical to
      // the client host as based on the redirect_uri. This is so at
      // some point we can still decide to use client id. The link between
      // client id and redirect_uri is important because the client id
      // is shown to users to authorize, and should not be fake-able.

      if (localhost)
        return (
          <InvalidRequestMsg>
            No <b>session_type</b> was specified, so it defaults to "browser".
            For a browser session the client_id needs to be identical to the
            origin of the redirect_uri. To create an API key, set{" "}
            <b>session_type=api_key</b>. (this is only possible for localhost
            clients)
          </InvalidRequestMsg>
        );
      return (
        <InvalidRequestMsg>
          For browser sessions the client_id must be identical to the origin of
          the redirect_uri.
        </InvalidRequestMsg>
      );
    }
    if (!refresh_rotate)
      return (
        <InvalidRequestMsg>
          Browser sessions cannot disable refresh token rotation.
        </InvalidRequestMsg>
      );
    if (expires_in)
      return (
        <InvalidRequestMsg>
          Browser sessions cannot set custom expire_in time
        </InvalidRequestMsg>
      );
    clientNote = `This is a web application. Any website can access your account on AmCAT servers
    if you let them. Only authorize if you were using and trust this website.`;
  }

  const acceptToken = () => {
    const label = createAmcatSession({
      clientId: client_id,
      redirectUri: redirect_uri,
      resource,
      state,
      codeChallenge: code_challenge,
      scope,
      type,
      refreshRotate: refresh_rotate,
      expiresIn: expires_in,
      csrfToken,
    })
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
            <img
              className="Image"
              src={user.image}
              referrer-policy="no-referrer"
              alt=""
            />
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

interface AmcatSessionParams {
  clientId: string;
  redirectUri: string;
  resource: string;
  state: string;
  codeChallenge: string;
  scope: string;
  type: string;
  refreshRotate: boolean;
  expiresIn: number | null;
  csrfToken: string | undefined;
}

/**
 * Set up oauth2 + PKCE flow.
 */
async function createAmcatSession({
  clientId,
  redirectUri,
  resource,
  state,
  codeChallenge,
  scope,
  type,
  refreshRotate,
  expiresIn,
  csrfToken,
}: AmcatSessionParams): Promise<string> {
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
      scope,
      type,
      refreshRotate,
      expiresIn,
      redirectUri,
      label: clientId,
      csrfToken,
    }),
  });

  const data = await res.json();
  // our authentication code is the id + secret
  return `${redirectUri}?code=${data.authCode}&state=${data.state}`;
}

function asSingleString(stringOrArray: string | string[]): string {
  // url parameters are string | string[].
  return Array.isArray(stringOrArray) ? stringOrArray[0] : stringOrArray;
}

function InvalidRequestMsg({ children }: { children: any }) {
  return (
    <div>
      <h4>Invalid authentication request</h4>
      {children}
    </div>
  );
}
