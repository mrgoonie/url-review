import { PrismaAdapter } from "@lucia-auth/adapter-prisma";
import { GitHub, Google } from "arctic";
import dotenv from "dotenv";
import type { RequestHandler } from "express";
import { Lucia, verifyRequestOrigin } from "lucia";

import { env } from "@/env";

import { prisma } from "./db";

dotenv.config();

const adapter = new PrismaAdapter(prisma.session, prisma.user);

// console.log("GITHUB_CLIENT_ID", process.env["GITHUB_CLIENT_ID"]);
// console.log("GITHUB_CLIENT_SECRET", process.env["GITHUB_CLIENT_SECRET"]);

export const github = new GitHub(env.GITHUB_CLIENT_ID, env.GITHUB_CLIENT_SECRET);

export const google = new Google(
  env.GOOGLE_CLIENT_ID,
  env.GOOGLE_CLIENT_SECRET,
  `${env.BASE_URL}/api/auth/callback/google`
);

export const lucia = new Lucia(adapter, {
  sessionCookie: {
    // this sets cookies with super long expiration
    expires: false,
    attributes: {
      // set to `true` when using HTTPS
      secure: process.env.NODE_ENV === "production",
    },
  },
  getUserAttributes: (attributes) => {
    return {
      // attributes has the type of DatabaseUserAttributes
      email: attributes.email,
    };
  },
});

declare module "lucia" {
  interface Register {
    Lucia: typeof Lucia;
    DatabaseUserAttributes: DatabaseUserAttributes;
  }
}

interface DatabaseUserAttributes {
  email: string;
}

export const verifyRequest: RequestHandler = (req, res, next) => {
  if (req.method === "GET") {
    return next();
  }
  const originHeader = req.headers.origin ?? null;
  const hostHeader = req.headers.host ?? null;
  if (!originHeader || !hostHeader || !verifyRequestOrigin(originHeader, [hostHeader])) {
    return res.status(403).end();
  }
  return next();
};

export const validateSession: RequestHandler = async (req, res, next) => {
  const sessionId = lucia.readSessionCookie(req.headers.cookie ?? "");
  if (!sessionId) {
    res.locals.user = null;
    res.locals.session = null;
    return next();
  }

  const { session, user } = await lucia.validateSession(sessionId);
  if (session && session.fresh) {
    res.appendHeader("Set-Cookie", lucia.createSessionCookie(session.id).serialize());
  }
  if (!session) {
    res.appendHeader("Set-Cookie", lucia.createBlankSessionCookie().serialize());
  }
  res.locals.session = session;
  res.locals.user = user;
  return next();
};
