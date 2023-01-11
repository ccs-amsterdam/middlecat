import { Dispatch, SetStateAction, useRef, useState } from "react";
import { FaClipboard, FaWindowClose } from "react-icons/fa";
import { finished } from "stream";
import copyToClipboard from "../functions/copyToClipboard";
import getResourceConfig from "../functions/getResourceConfig";

export default function CreateApiKey({
  csrfToken,
  fetchSessions,
}: {
  csrfToken: string;
  fetchSessions: () => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);
  const [token, setToken] = useState<string>();

  function createdToken(token: string) {
    setToken(token);
    fetchSessions();
  }

  function start() {
    if (!container.current) return;
    container.current.style.maxHeight = "50rem";
    container.current.style.background = "var(--secondary)";

    setStarted(true);
  }

  function finish() {
    if (!container.current) return;
    const el = container.current;
    el.style.opacity = "0";
    el.style.maxHeight = "10rem";
    el.style.background = "white";
    setTimeout(() => {
      el.style.opacity = "1";

      setToken(undefined);
      setStarted(false);
    }, 400);
  }

  return (
    <div ref={container} className="NewKey">
      <style jsx>{`
        .NewKey {
          padding: 1rem;
          background: white;
          color: white;
          width: 35rem;
          max-width: 95vw;
          border-radius: 5px;
          margin: 2rem auto;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          font-size: 2rem;

          overflow: auto;
          transition: all 0.5s;
          max-height: 10rem;
        }
        .NewKey button {
          width: 20rem;
          border-radius: 7px;
          border-style: dotted;
        }
      `}</style>
      {!started ? (
        <button onClick={() => start()}>Create new key</button>
      ) : !token ? (
        <CreateKeyForm
          csrfToken={csrfToken}
          createdToken={createdToken}
          finish={finish}
        />
      ) : (
        <ShowAPIKey token={token} finish={finish} />
      )}
    </div>
  );
}

function ShowAPIKey({ token, finish }: { token: string; finish: () => void }) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="token">
      <style jsx>{`
        .token {
          text-align: center;
          border-radius: 5px;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          border: 1px dotted var(--secondary);
        }
        h4 {
          margin: 0rem;
        }
        p {
          color: white;
        }
        pre {
          color: var(--primary);

          padding: 1rem;
          overflow: auto;
          white-space: pre-wrap;
          word-wrap: break-word;
          margin: 0;
          font-size: 1.25rem;
          max-width: 20rem;
        }
        .copy {
          display: flex;
          gap: 1rem;
          padding: 0.5rem;
          cursor: pointer;
        }
        button {
          margin-top: 2rem;
        }
      `}</style>
      <h4>Your new API Key</h4>
      <p>You will only see it once, so copy it!</p>
      <pre>{token}</pre>
      <div
        className="copy"
        onClick={() => {
          copyToClipboard(token);
          setCopied(true);
          setTimeout(() => setCopied(false), 1000);
        }}
      >
        <FaClipboard size="2rem" color="var(--primary)" />
        <div>{copied ? "copied!" : "click to copy"}</div>
      </div>
      <button onClick={() => finish()}>Hide token</button>
    </div>
  );
}

function CreateKeyForm({
  csrfToken,
  createdToken,
  finish,
}: {
  csrfToken: string;
  createdToken: (token: string) => void;
  finish: () => void;
}) {
  const [error, setError] = useState<string>();
  const today = new Date(Date.now());
  const defaultDate = new Date(Date.now());
  defaultDate.setFullYear(defaultDate.getFullYear() + 1);

  async function onSubmit(e: any) {
    e.preventDefault();
    const formData = new FormData(e.target);

    const expires = new Date(String(formData.get("expires_date") || ""));
    const resource = formData.get("resource") as string;
    const resourceConfig = await getResourceConfig(resource);

    const body = {
      csrfToken,
      resource,
      resourceConfig,
      label: formData.get("label"),
      clientId: formData.get("label"),
      type: "apiKey",
      oauth: false,
      expiresIn: Math.floor((expires.getTime() - Date.now()) / 1000),
    };

    const res = await fetch(`/api/newAmcatSession`, {
      body: JSON.stringify(body),
      method: "post",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    if (res.ok) {
      setError(undefined);
      const data = await res.json();
      createdToken(data.refresh_token);
    } else {
      setError(await res.text());
    }
  }

  return (
    <>
      <style jsx>{`
        .field {
          margin-bottom: 1.5rem;
          text-align: center;
          width: 100%;
          max-width: 25rem;
        }
        label {
          margin: 0.5rem;
        }
        input {
          margin-top: 0.5rem;
          font-size: 1.5rem;
          width: 100%;
          padding: 0.5rem;
          border-radius: 5px;
          border: 1px solid white;
          text-align: center;
        }
        input:valid {
          background: var(--primary);
        }
        input:invalid {
          background: #ccc;
        }
        .checkbox {
          display: flex;
          justify-content: center;
        }
        .checkbox input {
          height: 1.8rem;
          width: 1.8rem;
        }
        .error {
          margin-top: 1rem;
          width: 100%;
          background: #813030;
          color: white;
          border-radius: 5px;
          padding: 0rem 1rem;
          text-align: center;
        }

        button {
          margin-top: 1rem;
        }
        .cancel {
          width: 100%;
          text-align: right;
        }
        .cancelIcon {
          cursor: pointer;
        }
      `}</style>
      <div className="cancel">
        <span onClick={() => finish()} className="cancelIcon">
          <FaWindowClose size="2rem" />
        </span>
      </div>
      <form onSubmit={onSubmit}>
        <div className="field">
          <label htmlFor="resource">Server</label>
          <input
            type="url"
            id="resource"
            name="resource"
            placeholder="https://amcat-server.com"
            required
            onChange={() => setError(undefined)}
          />
        </div>
        <div className="field">
          <label htmlFor="label">Label</label>
          <input
            type="text"
            id="label"
            name="label"
            title="Provide a label between 5 and 50 characters long"
            pattern=".{5,50}"
            placeholder="pick a label"
            required
          />
        </div>

        <div className="field">
          <label htmlFor="expires">Expires</label>
          <input
            type="datetime-local"
            id="expires"
            name="expires_date"
            required
            defaultValue={defaultDate.toISOString().slice(0, 16)}
            min={today.toISOString().slice(0, 16)}
          />
        </div>

        <div className="field checkbox">
          <label htmlFor="rotate">Rotate refresh tokens</label>
          <input type="checkbox" id="rotate" name="rotating" />
        </div>

        <button id="submit">create</button>
        <div className="error">{error}</div>
      </form>
    </>
  );
}
