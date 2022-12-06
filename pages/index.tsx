import { signIn, signOut, useSession } from "next-auth/react";

export default function IndexPage() {
  const { data: session, status } = useSession();
  if (status === "loading") return null;

  return (
    <div className="Container">
      <div className="Intro">
        <h1>Middle Cat</h1>

        <div className="Login">
          {session?.user ? (
            <>
              <p>
                Not sure what to do yet if people refuse a connection. We could
                direct them to the main page (this empty thing you're looking
                at) and maybe add a dashboard here that shows all their current
                connections
              </p>
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
  );
}
