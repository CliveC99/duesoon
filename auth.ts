import { PrismaAdapter } from "@auth/prisma-adapter";
import { compare } from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { signInSchema } from "@/lib/auth-validation";
import { prisma } from "@/lib/prisma";

const DUMMY_PASSWORD_HASH = "$2b$12$Y9xUNM.QOc.ZF1UsKloEPeVokXaDgYMTgTiIcTnxIUTXPmtTW/.aq";

export const { handlers, auth, signIn, signOut, unstable_update: updateSession } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: { signIn: "/sign-in" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(rawCredentials) {
        const parsed = signInSchema.safeParse(rawCredentials);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        });
        const passwordMatches = await compare(
          parsed.data.password,
          user?.passwordHash ?? DUMMY_PASSWORD_HASH,
        );

        if (!user?.passwordHash || !passwordMatches) return null;
        return { id: user.id, name: user.name, email: user.email, image: user.image };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user, trigger, session }) {
      if (user?.id) {
        token.sub = user.id;
        token.name = user.name;
        token.email = user.email;
      }
      if (trigger === "update" && session?.user) {
        if (typeof session.user.name === "string") token.name = session.user.name;
        if (typeof session.user.email === "string") token.email = session.user.email;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.name = token.name;
        session.user.email = token.email ?? "";
      }
      return session;
    },
    authorized({ auth: session, request }) {
      const isAuthenticated = Boolean(session?.user);
      const path = request.nextUrl.pathname;

      if (["/dashboard", "/modules", "/deadlines", "/profile"].some((route) => path.startsWith(route))) return isAuthenticated;
      if (isAuthenticated && (path === "/sign-in" || path === "/sign-up")) {
        return Response.redirect(new URL("/dashboard", request.nextUrl));
      }
      return true;
    },
  },
});
