import { getCsrfToken, signOut, useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { DefaultSession } from "next-auth";
import { FaUser } from "react-icons/fa";
import getResourceConfig from "../functions/getResourceConfig";

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
  let client_id = asSingleString(q.client_id);
  const redirect_uri = asSingleString(q.redirect_uri);
  const state = asSingleString(q.state);
  const code_challenge = asSingleString(q.code_challenge);
  const resource = asSingleString(q.resource);
  const scope = asSingleString(q.scope || "");
  const session_type = asSingleString(q.session_type || "");
  const refresh_mode = asSingleString(q.refresh_mode || "");
  const expires_in = q.expires_in_sec
    ? Number(asSingleString(q.expires_in_sec))
    : null;

  const clientURL = new URL(redirect_uri);
  const serverURL = new URL(resource);

  const type = session_type === "api_key" ? "apiKey" : "browser";
  const refresh_rotate = refresh_mode !== "static";

  if (!redirect_uri)
    return <InvalidRequestMsg>Redirect URI is missing</InvalidRequestMsg>;
  if (!state) return <InvalidRequestMsg>State is missing</InvalidRequestMsg>;
  if (!code_challenge)
    return <InvalidRequestMsg>Code challenge is missing</InvalidRequestMsg>;
  if (!resource)
    return <InvalidRequestMsg>Resource is missing</InvalidRequestMsg>;

  if (!client_id) {
    if (type === "apiKey")
      return (
        <InvalidRequestMsg>
          API key request requires client id
        </InvalidRequestMsg>
      );
    client_id = clientURL.host;
  }

  const clientLabel = client_id;
  const localhost = /^localhost/.test(clientURL.host);
  let clientNote = "";
  if (localhost) {
    clientNote = `This authorization request comes from your own device, so we cannot verify its legitimacy. Only authorize if you yourself initiated this authorization request.`;
  } else {
    clientNote = `${clientLabel} is an unregistered web application. Only authorize if you know and trust this website.`;
  }

  if (type === "browser") {
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
  }

  const acceptToken = () => {
    createAmcatSession({
      clientId: client_id,
      redirectUri: redirect_uri,
      resource,
      state,
      codeChallenge: code_challenge,
      scope,
      type,
      refreshRotate: refresh_rotate,
      expiresIn: expires_in,
      csrfToken: csrfToken,
    })
      .then((response_url) => {
        router.push(response_url);
      })
      .catch((e) => {
        console.error(e);
        router.reload(); // harmless and refreshes csrf token (which is often the problem)
      });
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
        <button onClick={() => router.push("/")}>Manage connections</button>
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
      resourceConfig: await getResourceConfig(resource),
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

  const url = new URL(redirectUri);
  url.searchParams.set("code", data.authCode);
  url.searchParams.set("state", data.state);
  return url.toString();
}

function asSingleString(stringOrArray: string | string[] | undefined): string {
  // url parameters are string | string[].
  if (!stringOrArray) return "";
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
