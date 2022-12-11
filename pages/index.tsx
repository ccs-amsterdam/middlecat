import { signIn, signOut, useSession } from "next-auth/react";
import AmcatSessions from "../components/AmcatSessions";

export default function IndexPage() {
  const { data: session, status } = useSession();

  if (status === "loading") return null;

  return (
    <div>
      <div className="Container Narrow">
        <div className="Intro">
          <h2>Sessions and API keys</h2>
          <p>
            On this page you can see and disconnect your active AmCAT sessions,
            and manage your API keys.
          </p>
          <div className="Login">
            {session?.user ? (
              <>
                <button onClick={() => signOut()}>sign out</button>
              </>
            ) : (
              <>
                <h3>To try it out, first login</h3>
                <button onClick={() => signIn()}>sign in</button>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="Container">
        <AmcatSessions />;
      </div>
    </div>
  );
}
