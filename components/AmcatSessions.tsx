import { Session } from "next-auth";
import { useEffect, useState } from "react";
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
      },
      body: JSON.stringify({ amcatSessionIds, csrfToken }),
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
        <div className="NewKey">
          <style jsx>
            {`
              .NewKey {
                margin-top: 2rem;
                display: flex;
                justify-content: center;
              }
              .NewKey button {
                width: 20rem;
                border-radius: 7px;
                border-style: dotted;
                border-color: var(--secondary);
              }
            `}
          </style>
          <Popup trigger={<button>- Create API key -</button>}>
            <CreateApiKey csrfToken={csrfToken} fetchSessions={fetchSessions} />
          </Popup>
        </div>
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
  const [expiresIn, setExpiresIn] = useState(
    new Date(session.expires) - Date.now()
  );
  const date = new Date(session.createdAt);

  const expiresInMinutes = expiresIn / (1000 * 60);
  const threshold = expiresInMinutes > 60 * 24 * 2;
  const expiresInLabel = threshold ? "days" : "minutes";
  const expiresInValue = threshold
    ? Math.floor(expiresInMinutes / 60 / 24)
    : Math.floor(expiresInMinutes);

  useEffect(() => {
    const expiresIn = new Date(session.expires) - Date.now();
    const expiresInChanges = expiresIn % (1000 * 60);
    const timer = setTimeout(() => setExpiresIn(expiresIn), expiresInChanges);
    return () => clearTimeout(timer);
  });

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
              <div style={{ minWidth: "4rem" }}>{expiresInValue}</div>
              <div>{expiresInLabel}</div>
            </button>
          }
        >
          <h4>Add a form to change the expiration date</h4>
        </Popup>
        <Popup trigger={<button>delete</button>}>
          <h4>Are you certain?</h4>
          <button
            style={{ borderColor: "var(--secondary)" }}
            onClick={() => closeSessions([session.id])}
          >
            Delete
          </button>
        </Popup>
      </div>
    </div>
  );
}

function CreateApiKey({
  csrfToken,
  fetchSessions,
}: {
  csrfToken: string;
  fetchSessions: () => void;
}) {
  return (
    <div>
      <style jsx>{`
        form {
          min-width: 30rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          margin: 2rem;
        }
        label {
          margin: 0.2rem;
        }
        input {
          width: 100%;
          max-width: 25rem;
          padding: 0.3rem;
          border-radius: 5px;
          margin-bottom: 1.5rem;
          border: 1px solid white;
          text-align: center;
        }
        input:valid {
          background: white;
        }
        input:invalid {
          background: #ccc;
        }
        .checkbox {
          display: flex;
        }
        .checkbox input {
          height: 1.8rem;
          width: 1.8rem;
        }
      `}</style>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.target);
          console.log(formData);
        }}
      >
        <input name="csrfToken" type="hidden" defaultValue={csrfToken} />
        <label htmlFor="label">Label</label>
        <input
          type="text"
          id="label"
          name="label"
          title="URL should start with http or https"
          pattern=".{5,50}"
          placeholder="A label to remember it by"
          required
        />
        <label htmlFor="resource">Server</label>
        <input
          type="url"
          id="resource"
          name="resource"
          placeholder="https://amcat-server.com"
          required
          onBlur={(e) => {
            if (e.target.checkValidity()) {
            }
          }}
        />
        <div className="checkbox">
          <label htmlFor="rotate">Rotate refresh tokens</label>
          <input type="checkbox" id="rotate" name="rotating" />
        </div>
        <button>submit</button>
      </form>
    </div>
  );
}

// clientId,
// resource,
// state,
// codeChallenge,
// label,
// type,
// scope,
// refreshRotate,
// expiresIn,
