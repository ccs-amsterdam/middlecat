import { signIn, signOut, useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect } from "react";

export default function IndexPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;
    const client = router?.query?.client;
    const server = router?.query?.server;

    if (client && server) {
      if (session) {
        fetch(`/api/server_token?server=${server}`)
          .then((res) => res.json())
          .then((data) => {
            window.location.href = `${server}?client=${client}&token=${data.token}`;
          })
          .catch((e) => {
            console.error(e);
          });
      } else {
        signIn();
      }
    }
  }, [router, session, status]);

  const client = router?.query?.client;
  const server = router?.query?.server;
  const msg =
    !client || !server ? "Client and Server URL parameters are required" : "";
  return <div>{msg}</div>;
}
