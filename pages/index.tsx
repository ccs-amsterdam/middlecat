import { signIn, signOut, useSession } from "next-auth/react";
import Demo from "../components/Demo";
import PrettyJsonField from "../components/PrettyJsonField";

export default function IndexPage() {
  const { data: session, status } = useSession();
  if (status === "loading") return null;

  return (
    <div className="Container">
      <div className="Intro">
        <h1>Middle Cat</h1>
        <p>
          This is a proof of concept (and test...) for handling authentication
          for AmCAT services via a lightweight NextJS app. The flow is as
          follows.
        </p>
        <ul>
          <li>
            To authenticate a user, AmCAT redirects to
            <pre>[middlecat-host]/login?host=[amcat-host]</pre>
          </li>
          <li>
            MiddleCat performs the authentication flow, and then signs a JWT
            with the user credentials with the MiddleCat Private key
          </li>
          <li>
            The user is redirected back to the AmCAT server, together with the
            token
            <pre>[amcat-host]?token=[middlecat-token]</pre>
          </li>
          <li>
            AmCAT can then verify the token with the MiddleCat Public Key.
          </li>
          <li>
            You could try this with the following link, which should open the
            token in jwt.io. You can use the public key below to verify the
            token
            <br />
            <a href="login?host=https://jwt.io">
              [middlecat-host]/login?host=https://jwt.io
            </a>
          </li>
        </ul>
        <p>
          Any AmCAT server that trusts MiddleCat and has the public key can then
          authenticate users.
        </p>
        <div className="Login">
          {session?.user ? (
            <>
              <h3>You are now logged in!</h3>
              <PrettyJsonField json={session.user} />
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
      {<Demo session={session} />}
    </div>
  );
}
