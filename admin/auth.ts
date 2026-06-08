import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

// Allow-list of Google account emails. Fail-closed: if the list is empty
// (env not configured), nobody can sign in. Keeps the deck-deleting,
// token-wielding admin behind known accounts only.
const ALLOWED = (process.env.ALLOWED_EMAILS ?? "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    signIn({ profile }) {
      const email = profile?.email?.toLowerCase();
      if (!email || !profile?.email_verified) return false;
      if (ALLOWED.length === 0) return false; // fail closed
      return ALLOWED.includes(email);
    },
  },
});
