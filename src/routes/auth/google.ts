import { generateState } from "arctic";
import { createHash, randomBytes } from "crypto";
import express from "express";
import { parseCookies, serializeCookie } from "oslo/cookie";
import { z } from "zod";

import { env } from "@/env";
import { google, lucia } from "@/lib/auth";
import { uploadFileBuffer } from "@/lib/cloud-storage";
import { prisma } from "@/lib/db";
import { createNewUser, type ICreateNewUserByAccount } from "@/modules/user";
import generateWorkspaceByUser from "@/modules/workspace/generateWorkspaceByUser";

interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture: string;
}

function generateCodeVerifier(): string {
  return base64URLEncode(randomBytes(32));
}

function base64URLEncode(buffer: Buffer): string {
  return buffer.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

// Optional:
// Generate code challenge (S256 method)
// This is used if you need to send a code challenge to the authorization server.
export function generateCodeChallenge(verifier: string): string {
  const hash = createHash("sha256").update(verifier).digest();
  return base64URLEncode(hash);
}

export const googleLoginRouter = express.Router();

googleLoginRouter.get("/login/google", async (req, res) => {
  /**
   * @example "/login/google?redirect_uri=/profile"
   */
  const redirectUri = req.query["redirect_uri"]?.toString() ?? null;

  const state = generateState();
  const customState = JSON.stringify({ state, redirectUri });
  const encodedState = Buffer.from(customState).toString("base64");
  const codeVerifier = generateCodeVerifier();

  const url = await google.createAuthorizationURL(encodedState, codeVerifier, {
    scopes: ["email", "profile"],
  });

  const cookieOptions = {
    path: "/",
    secure: env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 60 * 10,
    sameSite: "lax" as const,
  };

  res.setHeader("Set-Cookie", [
    serializeCookie("google_oauth_state", encodedState, cookieOptions),
    serializeCookie("google_oauth_code_verifier", codeVerifier, cookieOptions),
  ]);

  console.log("Setting cookies:", { state, codeVerifier });

  return res.redirect(url.toString());
});

googleLoginRouter.get("/api/auth/callback/google", async (req, res) => {
  const querySchema = z.object({
    code: z.string(),
    state: z.string(),
  });

  try {
    const { code, state } = querySchema.parse(req.query);

    const cookies = parseCookies(req.headers.cookie ?? "");
    const storedState = cookies.get("google_oauth_state");
    const codeVerifier = cookies.get("google_oauth_code_verifier");

    // console.log("Received callback:", { code, state, storedState, codeVerifier });

    if (!storedState || !codeVerifier) {
      throw new Error("Missing OAuth state or code verifier");
    }

    if (state !== storedState) {
      throw new Error("Invalid OAuth state");
    }
    const tokens = await google.validateAuthorizationCode(code, codeVerifier);

    // redirectUri
    const redirectUri = JSON.parse(Buffer.from(state, "base64").toString("utf-8")).redirectUri;

    // Fetch user info
    const userResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.accessToken}` },
    });

    const googleUser = (await userResponse.json()) as GoogleUser;

    const existingAccount = await prisma.account.findUnique({
      where: { providerAccountId: googleUser.id },
    });

    if (existingAccount) {
      const existingUser = await prisma.user.findUnique({
        where: { id: existingAccount.userId },
      });
      if (!existingUser) throw new Error(`User not existed.`);

      // check if no "image" field in user
      if (!existingUser.image && googleUser.picture) {
        // download image and upload to cloudflare
        const imageBuffer = await fetch(googleUser.picture).then((res) => res.arrayBuffer());
        const image = await uploadFileBuffer(
          Buffer.from(imageBuffer),
          `/avatars/${existingUser.id}-google-avatar.png`
        );

        // update user with image
        await prisma.user.update({
          where: { id: existingUser.id },
          data: { image: image.publicUrl },
        });
      }

      const session = await lucia.createSession(existingUser.id, {});

      res.header("Set-Cookie", lucia.createSessionCookie(session.id).serialize());
      return res.redirect(redirectUri || "/");
    }

    const user = await createNewUser({
      name: googleUser.name,
      email: googleUser.email,
    } as ICreateNewUserByAccount);

    // check if no "image" field in user
    if (googleUser.picture) {
      // download image and upload to cloudflare
      const imageBuffer = await fetch(googleUser.picture).then((res) => res.arrayBuffer());
      const image = await uploadFileBuffer(
        Buffer.from(imageBuffer),
        `/avatars/${user.id}-google-avatar.png`
      );

      // update user with image
      await prisma.user.update({
        where: { id: user.id },
        data: { image: image.publicUrl },
      });
    }

    // create "account" associated with this "user"
    const account = await prisma.account.create({
      data: {
        userId: user.id,
        provider: "google",
        providerAccountId: googleUser.id,
      },
    });

    // update user with account
    await prisma.user.update({
      where: { id: user.id },
      data: {
        accounts: {
          connect: { id: account.id },
        },
      },
    });

    // CREATE/SELECT WORKSPACE FOR USERS
    // if this user has only 1 workspace, set it as the active workspace
    const userWorkspaces = await prisma.workspace.count({ where: { creatorId: user.id } });
    if (userWorkspaces === 1) {
      const workspace = await prisma.workspace.findFirst({ where: { creatorId: user.id } });
      if (workspace) {
        await prisma.user.update({
          where: { id: user.id },
          data: { activeWorkspaceId: workspace.id },
        });
      }
    } else if (userWorkspaces > 1) {
      // if greater than 1 workspace, redirect to workspace selection page
      return res.redirect(
        `/workspace/select${redirectUri ? `?redirect_uri=${encodeURIComponent(redirectUri)}` : ""}`
      );
    } else {
      // if no workspace, generate 1 workspace
      const workspace = await generateWorkspaceByUser(user);
      if (workspace) {
        await prisma.user.update({
          where: { id: user.id },
          data: { activeWorkspaceId: workspace.id },
        });
      }
    }

    const userId = user.id;
    const session = await lucia.createSession(userId, {});
    console.log(`session :>>`, session);

    res.header("Set-Cookie", lucia.createSessionCookie(session.id).serialize());
    return res.redirect(redirectUri || "/");
  } catch (error) {
    console.error("Error in Google OAuth callback", error);
    return res.status(500).send("Authentication failed");
  }
});
