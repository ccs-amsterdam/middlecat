import pkceChallenge from "pkce-challenge";
import safeURL from "../util/safeURL";
import { silentDeleteSearchParams } from "../util/searchparams";

export default async function middlecatOauth(
  amcatHost: string,
  setUser: Dispatch<SetStateAction<AmcatUser>>
) {
  const searchParams = new URLSearchParams(window.location.search);

  const middlecat = safeURL("http://localhost:3000");
  const redirect_uri = window.location.href;
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  const refreshToken = localStorage.getItem(amcatHost + "_" + "refreshToken");
  if (refreshToken) {
    const { access_token, refresh_token } = await refreshToken(
      middlecat,
      refreshToken
    );
  }

  if (!code) {
    // begin oauth2 + PKCE flow
    // create state and PKCE challenge, and redirect to /authorize
    authorize(middlecat, redirect_uri, amcatHost);
  } else {
    // continue oauth2 + PKCE flow
    // use the received authorization code to call the api/token endpoint
    const { amcat_user, access_token, refresh_token } = await authorizationCode(
      middlecat,
      redirect_uri,
      code,
      state,
      amcatHost
    );
    if (!amcat_user) return;

    localStorage.setItem(amcatHost + "_" + "refresh_token", refresh_token);
    setUser({ ...amcat_user, access_token });

    silentDeleteSearchParams(["code", "state"]);
  }
}

function authorize(middlecat: string, redirect_uri: string, amcatHost: string) {
  const pkce = pkceChallenge();
  const state = (Math.random() + 1).toString(36).substring(2);

  // need to remember code_verifier and state, and this needs to work across
  // sessions because auth with magic links continues in new window.
  localStorage.setItem(amcatHost + "_" + "code_verifier", pkce.code_verifier);
  localStorage.setItem(amcatHost + "_" + "state", state);
  window.location.href = `${middlecat}/authorize?state=${state}&redirect_uri=${redirect_uri}&resource=${amcatHost}&code_challenge=${pkce.code_challenge}`;
}

async function authorizationCode(
  middlecat: string,
  redirect_uri: string,
  code: string,
  state: string,
  amcatHost: string
) {
  if (localStorage.getItem(amcatHost + "_" + "state") !== state) {
    console.error("invalid oauth2 flow. Mismatching state");
    return;
  }
  const body = {
    grant_type: "authorization_code",
    code,
    code_verifier: localStorage.getItem(amcatHost + "_" + "code_verifier"),
  };

  const res = await fetch(`${middlecat}/api/token`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  // cleanup. Not strictly needed because they have now lost
  // their power, but still feels nice
  localStorage.removeItem(amcatHost + "_" + "code_verifier");
  localStorage.removeItem(amcatHost + "_" + "state");
  return await res.json();
}

function refreshToken(middlecat: string, refreshToken: string) {}
