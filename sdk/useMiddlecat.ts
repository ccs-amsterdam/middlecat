import { useCallback, useEffect, useRef, useState } from "react";
import safeURL from "../util/safeURL";
import middlecatOauth from "./middlecatOauth";

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

// This hook is to be used in React applications using middlecat

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
    //return;
    if (user || busy.current) return;
    busy.current = true;
    middlecatOauth(amcatHost, setUser).finally(() => {
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
