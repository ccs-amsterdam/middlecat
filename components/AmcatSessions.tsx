import { Session } from "next-auth";
import { useEffect, useRef, useState } from "react";
import { ApiKeySession, BrowserSession, SessionData } from "../types";
import Popup from "./Popup";

interface props {
  session: Session | null;
  csrfToken: string | undefined;
}

export default function AmcatSessions({ session, csrfToken }: props) {
  const [sessionData, setSessionData] = useState<SessionData>();

  async function fetchSessions() {
    await fetch("/api/sessions")
      .then((res) => res.json())
      .then(setSessionData)
      .catch((e) => {
        setSessionData(undefined);
        console.error(e);
      });
  }

  async function closeSessions(amcatSessionIds: string[]) {
    const config = {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "x-csrf-token": csrfToken || "",
      },
      body: JSON.stringify({ amcatSessionIds }),
    };

    fetch(`/api/closeSessions`, config)
      .then(fetchSessions)
      .catch((e) => console.error(e));
  }

  useEffect(() => {
    fetchSessions();
  }, [session]);

  if (!sessionData) return null;

  return (
    <div className="SessionData">
      <div className="AmcatSessions Dark">
        <div className="Header">
          <h3>Browser sessions</h3>
          <h4 className="PrimaryColor">
            Monitor connections across browsers and devices
          </h4>
          {sessionData?.browser?.length ? null : (
            <h4>- No active sessions -</h4>
          )}
        </div>
        {sessionData.browser.map((session) => {
          return (
            <BrowserSessionRow
              key={session.id}
              session={session}
              closeSessions={closeSessions}
            />
          );
        })}
      </div>
      <div className="AmcatSessions">
        <div className="Header">
          <h3>API Keys</h3>
          <h4 className="SecondaryColor">Manage and create API keys</h4>
          {sessionData?.apiKey?.length ? null : <h4>- No active API Keys -</h4>}
        </div>

        {sessionData.apiKey.map((session) => {
          return (
            <ApiKeySessionRow
              key={session.id}
              session={session}
              closeSessions={closeSessions}
            />
          );
        })}
      </div>
    </div>
  );
}

function BrowserSessionRow({
  session,
  closeSessions,
}: {
  session: BrowserSession;
  closeSessions: (ids: string[]) => void;
}) {
  const date = new Date(session.createdAt);

  return (
    <div className={`AmcatSession`}>
      <div className="Details">
        <div className="Context">
          {date.toDateString()} - {session.createdOn}
        </div>
        <div className="Label">{session.label}</div>
      </div>
      <div className="Buttons">
        <button
          className="PrimaryColor"
          onClick={() => closeSessions([session.id])}
        >
          close
        </button>
      </div>
    </div>
  );
}

function ApiKeySessionRow({
  session,
  closeSessions,
}: {
  session: ApiKeySession;
  closeSessions: (ids: string[]) => void;
}) {
  const date = new Date(session.createdAt);

  return (
    <div className={`AmcatSession`}>
      <div className="Details">
        <div className="Context">
          {date.toDateString()} - {session.createdOn}
        </div>
        <div className="Label">{session.label}</div>
      </div>
      <div className="Buttons">
        <Popup
          trigger={
            <button>
              <div>Valid until</div>
              <div>{String(session.expires).split("T")[0]}</div>
            </button>
          }
        >
          <h4>Add a form to change the expiration date</h4>
        </Popup>
        <Popup trigger={<button>delete</button>}>
          <h4>Are you certain?</h4>
          <button onClick={() => closeSessions([session.id])}>Delete</button>
        </Popup>
      </div>
    </div>
  );
}
