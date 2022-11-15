import { Session } from "next-auth";
import { FunctionComponent, useEffect, useState } from "react";

interface Props {
  session: null | (Session & { middlecatToken: string });
}

const Demo: FunctionComponent<Props> = ({ session }) => {
  const [token, setToken] = useState("");

  useEffect(() => {
    if (session) {
      fetch(`/api/server_token?server=${"demo"}`)
        .then((res) => res.json())
        .then((data) => {
          setToken(data.token);
        })
        .catch((e) => {
          console.error(e);
          setToken("");
        });
    } else {
      setToken("");
    }
  }, [session]);

  return (
    <div className="Demo">
      <Token token={token} />
      <PublicKey />
    </div>
  );
};

const PublicKey: FunctionComponent = () => {
  const key = process.env.NEXT_PUBLIC_PUBLICKEY || "";
  const [hasCopied, setHasCopied] = useState(false);

  return (
    <div className="Keys">
      <h2>
        Public key <br />
        use to validate token
      </h2>
      <div className="Key">
        {key}
        <br />
        <br />
        <button
          onClick={() => {
            navigator.clipboard.writeText(key);
            setHasCopied(true);
            setTimeout(() => setHasCopied(false), 1000);
          }}
        >
          {hasCopied ? "Copied!" : "Copy"}
        </button>
      </div>
      <br />
    </div>
  );
};

interface TokenProps {
  token: string;
}

const Token: FunctionComponent<TokenProps> = ({ token }) => {
  if (!token) return <div className="Token" />;

  return (
    <div className="Token">
      <h2>
        JSON Web Token <br />
        signed with private key
      </h2>
      <div className="Key">{token}</div>
      <p>
        This token publicly contains the user credentials and sign date, and can
        be verified using only the public key. You can try it{"   "}
        <a href={`https://jwt.io/?token=${token}`} target="_blank">
          here
        </a>
      </p>
      <p>
        To verify the token, copy the public key into the first box in the
        VERIFY SIGNATURE field{" "}
      </p>
    </div>
  );
};

export default Demo;
