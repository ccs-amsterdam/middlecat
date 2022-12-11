import { useEffect, useState } from "react";
import { ApiKeySession, BrowserSession, SessionData } from "../types";

interface props {}

export default function AmcatSessions({}: props) {
  const [sessionData, setSessionData] = useState<SessionData>();

  useEffect(() => {
    fetch("/api/sessions")
      .then((res) => res.json())
      .then(setSessionData)
      .catch((e) => {
        setSessionData(undefined);
        console.error(e);
      });
  }, []);

  if (!sessionData) return null;

  return (
    <div className="SessionData">
      <div className="AmcatSessions">
        <h3>Browser sessions</h3>
        <p>
          These are all the (non-expired) browser session that your account
          authorized at some point. You can close them if you don't use them
          anymore or think they might be compromised.
        </p>
        {sessionData.browser.map((session) => {
          return <BrowserSession session={session} />;
        })}
      </div>
      <div className="AmcatSessions">
        <h3>API Keys</h3>

        {sessionData.apiKey.map((session) => {
          return <ApiKeySession session={session} />;
        })}
      </div>
    </div>
  );
}

function BrowserSession({ session }: { session: BrowserSession }) {
  return <div className={`AmcatSession`}>{session.resource}</div>;
}

function ApiKeySession({ session }: { session: ApiKeySession }) {
  return <div className={`AmcatSession`}>{session.resource}</div>;
}
