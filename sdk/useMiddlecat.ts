import { useEffect, useState } from "react";
import pkceChallenge from "pkce-challenge";
import jwtDecode from "jwt-decode";

interface AmcatUser {
  /** hostname (e.g. "https://vu.amcat.nl/api") */
  host: string;
  /** user login email */
  email: string;
  /** user name */
  name: string;
  /** image */
  image: string;
  /** amcat resource access_token */
  token: string;
  /** Middlecat host */
  middlecat: string;
}

export default function useMiddlecat(amcatHost: string) {
  const [user, setUser] = useState<AmcatUser>();

  function logout() {
    if (!user) return;

    fetch(`${user.middlecat}/logout?redirect_uri=${window.location.href}`);
    setUser(null);
  }

  useEffect(() => {
    if (user) return;
    oauthMiddlecat(amcatHost, setUser);
  }, [user]);

  return [user, logout];
}

async function oauthMiddlecat(
  amcatHost: string,
  setUser: Dispatch<SetStateAction<AmcatUser>>
) {
  const searchParams = new URLSearchParams(document.location.search);

  // eventually: middlecat = getMiddlecatHost(amcatHost)
  const middlecat = "http://localhost:3000";
  const redirect_uri = window.location.href;
  const resource = amcatHost;
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  const refreshToken = localStorage.getItem("refreshToken");
  if (refreshToken) {
    const { access_token, refresh_token } = await oauthRefreshToken(
      middlecat,
      refreshToken
    );
  }

  if (!code) {
    // begin oauth2 + PKCE flow
    // create state and PKCE challenge, and redirect to /authorize
    oauthAuthorize(middlecat, redirect_uri, resource);
  } else {
    // continue oauth2 + PKCE flow
    // use the received authorization code to call the api/token endpoint
    const { amcat_user, access_token, refresh_token } =
      await oauthAuthorizationCode(middlecat, redirect_uri, code, state);
    //localStorage.setItem("refresh_token", refresh_token);
    setUser({ ...amcat_user, access_token });
    window.history.replaceState(null, null, window.location.pathname);
  }
}

function oauthAuthorize(
  middlecat: string,
  redirect_uri: string,
  resource: string
) {
  const pkce = pkceChallenge();
  const state = (Math.random() + 1).toString(36).substring(2);
  sessionStorage.setItem("code_verifier", pkce.code_verifier);
  sessionStorage.setItem("state", state);
  window.location.href = `${middlecat}/authorize?state=${state}&redirect_uri=${redirect_uri}&resource=${resource}&code_challenge=${pkce.code_challenge}`;
}

async function oauthAuthorizationCode(
  middlecat: string,
  redirect_uri: string,
  code: string,
  state: string
) {
  if (sessionStorage.getItem("state") !== state) {
    console.error("invalid oauth2 flow. Mismatching state");
    return;
  }
  const body = {
    grant_type: "authorization_code",
    code,
    code_verifier: sessionStorage.getItem("code_verifier"),
  };

  const res = await fetch(`${middlecat}/api/token`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  return await res.json();
}

function oauthRefreshToken(middlecat: string, refreshToken: string) {}
