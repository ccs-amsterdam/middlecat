import { signIn, signOut, useSession, getCsrfToken } from "next-auth/react";
import Head from "next/head";
import AmcatSessions from "../components/AmcatSessions";
import { useState } from "react";

interface Props {
  csrfToken: string | undefined;
}

export default function IndexPage({ csrfToken }: Props) {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  if (status === "loading") return null;

  return (
    <>
      <Head>
        <title>MiddleCat</title>
        <meta
          name="description"
          content="MiddleCat Authentication for AmCAT servers"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/amcat-logo.svg" />
      </Head>
      <div>
        <div className="Container Narrow">
          <div className="Intro">
            <h2>Sessions and API keys</h2>
            <p>
              On this page you can see and disconnect your active AmCAT sessions
              and manage your API keys.
            </p>

            <div className="Login">
              {session?.user ? (
                <>
                  <button
                    className={loading ? "Loading" : ""}
                    onClick={() => {
                      setLoading(true);
                      signOut().catch(() => setLoading(false));
                    }}
                  >
                    sign out
                  </button>
                </>
              ) : (
                <>
                  <button
                    className={loading ? "Loading" : ""}
                    onClick={() => {
                      setLoading(true);
                      signIn().catch(() => setLoading(false));
                    }}
                  >
                    sign in
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="">
        <AmcatSessions session={session} csrfToken={csrfToken} />
      </div>
    </>
  );
}

export async function getServerSideProps(context: any) {
  const csrfToken = await getCsrfToken(context);
  return {
    props: { csrfToken },
  };
}
