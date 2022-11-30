import { useCallback, useEffect, useRef, useState } from "react";
import pkceChallenge from "pkce-challenge";
import safeURL from "../util/safeURL";

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
  /** Access token expiration time */
  exp: number;
  /** Middlecat host */
  middlecat: string;
}

/**
 * How to make this as secure as possible?
 * - Let AmcatUser carry a method that wraps the axios call with the token in a closure
 * - We can refresh the access token silently very frequently (but if we put it in a closure, this requires state update of the method)
 * - Kill the session when a user closes the tab or refreshes. Show warning when trying to do so
 */

/**
 * Sign-in to an AmCAT family server using MiddleCat.
 *
 * @param amcatHost
 * @param autoLogin
 * @returns
 */
export default function useMiddlecat(
  amcatHost: string,
  autoLogin: boolean = true
) {
  amcatHost = safeURL(amcatHost);
  const [user, setUser] = useState<AmcatUser>();
  const busy = useRef(false); // to prevent double calls, which could invalidate tokens

  const login = useCallback(() => {
    if (user || busy.current) return;
    busy.current = true;
    oauthMiddlecat(amcatHost, setUser).finally(() => {
      busy.current = false;
    });
  }, [user, amcatHost]);

  const logout = useCallback(() => {
    const refreshToken = localStorage.getItem(amcatHost + "_" + "refreshToken");
    if (refreshToken)
      fetch(`${user.middlecat}/logout?refresh_token=${refreshToken}`);
    if (user) setUser(null);
  }, []);

  useEffect(() => {
    if (!user) {
      // if not logged in, log in automatically if there is a refreshToken
      // of if autoLogin is true
      const refreshToken = localStorage.getItem(
        amcatHost + "_" + "refreshToken"
      );
      if (autoLogin || refreshToken) login();
      return;
    }

    // if already logged in, keep track of expiration time to refresh token
    const secondsLeft = user.exp - Math.floor(Date.now() / 1000);
    const waitSeconds = secondsLeft - 61; // don't do it last minute
    const waitMilliseconds = waitSeconds > 0 ? waitSeconds * 1000 : 0;
    const timer = setTimeout(login, waitMilliseconds);
    return () => clearTimeout(timer);
  }, [user, amcatHost]);

  return [user, login, logout];
}

async function oauthMiddlecat(
  amcatHost: string,
  setUser: Dispatch<SetStateAction<AmcatUser>>
) {
  const searchParams = new URLSearchParams(document.location.search);

  // eventually: middlecat = getMiddlecatHost(amcatHost)
  const middlecat = safeURL("http://localhost:3000");
  const redirect_uri = window.location.href;
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  const refreshToken = localStorage.getItem(amcatHost + "_" + "refreshToken");
  if (refreshToken) {
    const { access_token, refresh_token } = await oauthRefreshToken(
      middlecat,
      refreshToken
    );
  }

  if (!code) {
    // begin oauth2 + PKCE flow
    // create state and PKCE challenge, and redirect to /authorize
    oauthAuthorize(middlecat, redirect_uri, amcatHost);
  } else {
    // continue oauth2 + PKCE flow
    // use the received authorization code to call the api/token endpoint
    const { amcat_user, access_token, refresh_token } =
      await oauthAuthorizationCode(
        middlecat,
        redirect_uri,
        code,
        state,
        amcatHost
      );

    localStorage.setItem(amcatHost + "_" + "refresh_token", refresh_token);
    setUser({ ...amcat_user, access_token });
    // should delete code url param, but not the rest
    //window.history.replaceState(null, null, window.location.pathname);
  }
}

function oauthAuthorize(
  middlecat: string,
  redirect_uri: string,
  amcatHost: string
) {
  const pkce = pkceChallenge();
  const state = (Math.random() + 1).toString(36).substring(2);
  sessionStorage.setItem(amcatHost + "_" + "code_verifier", pkce.code_verifier);
  sessionStorage.setItem(amcatHost + "_" + "state", state);
  window.location.href = `${middlecat}/authorize?state=${state}&redirect_uri=${redirect_uri}&resource=${amcatHost}&code_challenge=${pkce.code_challenge}`;
}

async function oauthAuthorizationCode(
  middlecat: string,
  redirect_uri: string,
  code: string,
  state: string,
  amcatHost: string
) {
  if (sessionStorage.getItem(amcatHost + "_" + "state") !== state) {
    console.error("invalid oauth2 flow. Mismatching state");
    return;
  }
  const body = {
    grant_type: "authorization_code",
    code,
    code_verifier: sessionStorage.getItem(amcatHost + "_" + "code_verifier"),
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
