## Cat-in-the-middle authentication

This is a proof of concept (and test...) for handling authentication
for AmCAT services via a lightweight NextJS app. The flow is as
follows.

- To authenticate a user, AmCAT redirects to <pre>[amcat-server]/middlecat/connect?client=[client-website]</pre>
- MiddleCat performs the authentication flow, and creates a short-lived JWT that tells the AmCAT server that the user is authenticated
- The user is redirected back to the AmCAT server, together with the
  token <pre>[amcat-server]/middlecat/token?client=[client-website]&token=[middlecat-token]</pre>
- AmCAT verifies the middlecat-token with the middlecat public key, creates an access token for the user, and sets it as a httponly cookie.

# DB

Annotinder uses a Postgres DB. For testing and development it's easiers to just fire up a docker image.

```bash
docker run --name postgres -e POSTGRES_USER="devuser" -e POSTGRES_PASSWORD="devpw" -p 5432:5432 -d postgres
```
