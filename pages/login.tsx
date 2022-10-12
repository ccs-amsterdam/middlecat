import { signIn, signOut, useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect } from "react";

export default function IndexPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;
    const host = router?.query?.host;

    if (host) {
      if (session?.middlecatToken) {
        console.log(host);
        // if logged in, redirect to host
        window.location.href = host + "?token=" + session.middlecatToken;
      } else {
        // otherwise, go to login screen.
        // after login, you get redirected here with host + session
        signIn();
      }
    }
  }, [router, session, status]);

  return <div></div>;
}
