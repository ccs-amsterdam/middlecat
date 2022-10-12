import { withAuth } from "next-auth/middleware";

// More on how NextAuth.js middleware works: https://next-auth.js.org/configuration/nextjs#middleware
export default withAuth({
  callbacks: {
    authorized(mw) {
      // `/admin` requires admin role
      if (mw.req.nextUrl.pathname === "/admin") {
        return mw.token?.userRole === "admin";
      }
      // `/me` only requires the user to be logged in
      return !!mw.token;
    },
  },
});

export const config = { matcher: ["/admin", "/me"] };
