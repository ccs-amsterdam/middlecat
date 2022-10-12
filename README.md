## Cat-in-the-middle authentication

This is a proof of concept (and test...) for handling authentication
for AmCAT services via a lightweight NextJS app. The flow is as
follows.

- To authenticate a user, AmCAT redirects to <pre>[middlecat-host]/login?host=[amcat-host]</pre>
- MiddleCat performs the authentication flow, and then signs a JWT
  with the user credentials with the MiddleCat Private key
- The user is redirected back to the AmCAT server, together with the
  token <pre>[amcat-host]?token=[middlecat-token]</pre>
- AmCAT can then verify the token with the MiddleCat Public Key.
