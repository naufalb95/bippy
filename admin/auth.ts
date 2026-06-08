import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { isAdmin } from "@/lib/db";

// Allow-list lives in the Neon `admins` table (not env). Fail-closed: an
// unknown or unverified email can't sign in. Seed the first admin with
// `npm run seed` — an empty table means nobody gets in.
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ profile }) {
      const email = profile?.email?.toLowerCase();
      if (!email || !profile?.email_verified) return false;
      return isAdmin(email);
    },
  },
});
