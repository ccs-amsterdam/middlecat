## Cat-in-the-middle authentication

This is a proof of concept (and test...) for handling authentication
for AmCAT services via a lightweight NextJS app. The flow is as
follows.

- A client asks a server for its middlecat config at the API endpoint **[server]/middlecat**
- The client performs an OAuth2.0 flow with the server's trusted MiddleCat server
- The client receives an **access_token** and **refresh_token**. The server can verify the access_token using **MiddleCat's public key**
- The most important claims in the access_token are the user's email address
  and the resource (the server URL). The server only needs to know whether the user gave the client access. What the user is authorized to do is determined by the server.

# Installation

This is not yet set up for easy deployment. The explanation provided here is primarily for ourselves.

To run a local install, first clone the repo and install the npm dependencies.

```
git clone git@github.com:ccs-amsterdam/middlecat
npm i
```

## DB

Next, set up a Postgres DB. For testing and development it's easiest to just fire up a docker image.

```bash
docker run --name postgres -e POSTGRES_USER="devuser" -e POSTGRES_PASSWORD="devpw" -p 5432:5432 -d postgres
```

Now create a .env file in your root directory that sets the DB url. For our demo docker database at port 5432, this would be:

```
DATABASE_URL=postgresql://devuser:devpw@localhost:5432/middlecat
```

## Set the environment variables

Now we create a .env.local file for our settings, Identity providers and secrets.
For now you'll need to generate the secrets yourself (or enter some unsafe placeholders).
Obtaining the GitHub and Google credentials and an SMTP server is fairly easy and google-able, but at some point we'll add some simple instructions as well.

```
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=[a big cryptographic pseudo random secret goes here]

NEXT_PUBLIC_PUBLICKEY="[public key goes here]"
PRIVATEKEY="[private key goes here]"

GITHUB_ID=
GITHUB_SECRET=

GOOGLE_ID=
GOOGLE_SECRET=

EMAIL_SERVER=smtp://user:password@smtp.gmail.com:587
EMAIL_FROM=MiddleCat <noreply@host.com>
```

# Server-side implementation

The server side of things is quite straightforward. You'll need to do the following:

- Create a **[server-api]/middlecat** GET endpoint that returns a JSON object with (at least) a 'middlecat_url'. By providing this url, the server indicates that it trusts this MiddleCat server to sign it's access_tokens
- Obtain the **public_key** from this MiddleCat server. This can be obtained from **[middlecat]/api/configuration**, which returns a JSON object with (among other things) a **public_key**. The public key could change, so make sure to re-check routinely
- Use the public key to validate tokens from authenticated users. Requests will have an **Authorization** header with the value: **Bearer [access_token]**
- Also (!!) verify that the **resource** claim in the access_token is the current server. The resource (sometimes called **audience**) specifies the server for which the user authorized the client.
- Optionally, other claims can be used, e.g., to determine scope or block/only-allow certain clients.

# React clients

The current web clients for AmCAT are all written in React. We therefore provide a hook that makes it easy to setup a MiddleCat login. If you're already running MiddleCat, you can test the hook at **[middlecat]/demo_client**

First install the middlecat-react NPM module

```
npm install middlecat-react
```

Then use the hook to get a user and AuthForm component.

```
function Component() {
  const { user, AuthForm } = useMiddlecat();

  return <AuthForm />
}
```

The user object contains basic user details (email, name, image) and an Axios instance called 'api'. The Axios instance already has the base_url set to the host that a user connected to, and the access_token is added securely (insofar as possible) by intercepting the requests. Refresh token rotation is handled behind
the scenes, so the user.api should be all that you really need.

The AuthForm is a component for a Login/Logout screen. It is also possible to make a custom screen, for which useMiddlecat returns the signIn and signOut methods and a loading state.

By default, the refresh_token is not stored. This is safer, but has the downside that a user will have to authenticate for every new session (including refreshing the page and opening other tabs). A more convenient alternative is to set `useMiddlecat({storeToken: true})`. This stores the refresh token in localstorage. This is less secure because the tokens could be more easily stolen in case of a XSS attack, so it is not recommended if data is very sensitive. Also see the excellent explanation on [Auth0](https://auth0.com/docs/secure/tokens/refresh-tokens/refresh-token-rotation) for some details on how refresh token rotation mitigates the risk somewhat. If you want both convenience and security, read on about using React with a (small, optionally stateless) backend.

## React with a samesite backend (e.g. NextJS)

We recommend that AmCAT clients use a fullstack framework like NextJS. Next to other (obvious?) benefits, this enables a third, more secure option that uses the backend as a proxy for the OAuth flow, and stores the refresh_token as a samesite httponly cookie. This means it won't be accessible from JS, and thereby safe(r) from XSS. To use this option, an API endpoint has to be made with the bffAuthHandler. In NextJS this would look as follows:

```
import { bffAuthHandler } from "middlecat-react";

export default async function handler(req, res) {
  return await bffAuthHandler(req, res);
}
```

In the hook, you then set bff (backend-for-frontend) to the path of the endpoint: `useMiddlecat({bff: "/api/bffAuth"})`

# Building new clients (R, Python, etc.)

MiddleCat follows the OAuth2.0 protocol, which should have built in support in most programming environments. As an example we'll show how to do this with the httr2 package in R.

```
library(httr2)
library(glue)
```

The main input is the URL of the API server that we want to connect to.
The server will then provide all the details about what MiddleCat server to user.
If you do not have a server, you can user a demo server thats included in MiddleCat.

```
server = "https://middlecat.up.railway.app/api/demo_resource"
```

To get the middlecat config, simply GET the middlecat endpoint.

```
middlecat_config = glue("{server}/middlecat") |>
  request() |>
  req_perform() |>
  resp_body_json()

middlecat = middlecat_config$middlecat_url
```

Now we can start the OAuth flow. The key information to provide is the
token and authentication endpoints. For middlecat these are:

- authorization: [middlecat_url]/authorize
- tokens: [middlecat_url]/api/token

```
auth_url = glue("{middlecat}/authorize")
token_url = glue("{middlecat}/api/token")
```

There are three main parameters/settings to set:

- **client_id**. The client ID is free to choose, and will be the name of the application shown
  to the user in the authentication flow. Since we support third-party clients, it is up to the user to determine whether they trust the authentication request (though we'll add ways for servers to indicate trusted clients).
- **pkce**. MiddleCat requires using PKCE with the (standard) base64url encoded sha256 hash. httr2 supports this out of the box.
- **resource**. The call to auth_url should include the 'resource' parameter, which should be the
  URL of the AmCAT server.
  **refresh = "static"**. This disables refresh token rotation, which does not yet seem to be supported by httr2.

```
client_id = 'Some R package'
auth_params = list(resource=server, refresh="static")

client = oauth_client(id = client_id,
                      token_url = token_url)
tokens = oauth_flow_auth_code(client = client,
                              auth_url = auth_url,
                              pkce = TRUE,
                              auth_params = auth_params)
```

After completing the flow you should have an access_token and refresh_token.
You can use the access token as a bearer token to access the server API.
If you're using the MiddleCat Demo resource, you can use the /test endpoint.

```
glue("{server}/test") |>
  request() |>
  req_auth_bearer_token(tokens$access_token) |>
  req_perform() |>
  resp_body_string()
```

Finally, you will need to refresh your access_token when (or before) it expires.
This is also a standardized flow, and httr2 has a special function for it.

```
tokens = oauth_flow_refresh(client, tokens$refresh_token)
```

Note that this only works if refresh token rotation is disabled. Alternatively,
this step can be done manually, so that it does support token rotation.

```
body = list(grant_type = 'refresh_token',
            refresh_token = tokens$refresh_token)

tokens = request(token_url) |>
  req_body_json(body) |>
  req_perform() |>
  resp_body_json()
```
