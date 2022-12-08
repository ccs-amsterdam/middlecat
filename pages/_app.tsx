import { SessionProvider } from "next-auth/react";

import type { AppProps } from "next/app";
import type { Session } from "next-auth";
import "../styles.css";

import { Poppins } from "@next/font/google";
import Header from "../components/Header";

const font = Poppins({
  weight: "500",
  subsets: "devanagari",
});

// Use of the <SessionProvider> is mandatory to allow components that call
// `useSession()` anywhere in your application to access the `session` object.
export default function App({
  Component,
  pageProps: { session, ...pageProps },
}: AppProps<{ session: Session }>) {
  return (
    <>
      <style jsx global>{`
        html {
          font-family: ${font.style.fontFamily};
        }
      `}</style>
      <SessionProvider session={session}>
        <div className="Page">
          <Header />
          <Component {...pageProps} />
        </div>
      </SessionProvider>
    </>
  );
}
