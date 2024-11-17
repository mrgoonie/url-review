import { generateState, OAuth2RequestError } from "arctic";
import express from "express";
import { parseCookies, serializeCookie } from "oslo/cookie";

import { env } from "@/env";
import { github, lucia } from "@/lib/auth";
import { uploadFileBuffer } from "@/lib/cloud-storage";
import { prisma } from "@/lib/db";
import { createNewUser, type ICreateNewUserByAccount } from "@/modules/user";
import generateWorkspaceByUser from "@/modules/workspace/generateWorkspaceByUser";

interface GitHubUser {
  id: number;
  name: string;
  login: string;
  email: string;
  avatar_url: string;
}

export const githubLoginRouter = express.Router();

githubLoginRouter.get("/login/github", async (req, res) => {
  const redirectUri = req.query["redirect_uri"]?.toString() ?? null;

  const state = generateState();
  const customState = JSON.stringify({ state, redirectUri });
  const encodedState = Buffer.from(customState).toString("base64");

  const url = await github.createAuthorizationURL(encodedState);
  res.setHeader(
    "Set-Cookie",
    serializeCookie("github_oauth_state", encodedState, {
      path: "/",
      secure: env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 60 * 10,
      sameSite: "lax",
    })
  );
  res.redirect(url.toString());
});

githubLoginRouter.get("/api/auth/callback/github", async (req, res) => {
  const code = req.query["code"]?.toString() ?? null;
  const state = req.query["state"]?.toString() ?? null;

  const storedState = parseCookies(req.headers.cookie ?? "").get("github_oauth_state") ?? null;

  if (!code || !state || !storedState || state !== storedState) {
    console.log({ code, state, storedState });
    return res.status(400).end();
  }

  try {
    // redirectUri
    const redirectUri = JSON.parse(Buffer.from(state, "base64").toString("utf-8")).redirectUri;

    // exchange code for tokens
    const tokens = await github.validateAuthorizationCode(code);

    const githubUserResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`,
      },
    });

    // get Github user info
    const githubUser = (await githubUserResponse.json()) as GitHubUser;

    // check if user already exists
    const existingAccount = await prisma.account.findUnique({
      where: { providerAccountId: `${githubUser.id}` },
    });

    if (existingAccount) {
      // user already exists
      const existingUser = await prisma.user.findUnique({
        where: { id: existingAccount.userId },
      });
      if (!existingUser) throw new Error(`User not existed.`);

      // check if no "image" field in user
      if (!existingUser.image && githubUser.avatar_url) {
        // download image and upload to cloudflare
        const imageBuffer = await fetch(githubUser.avatar_url).then((res) => res.arrayBuffer());
        const image = await uploadFileBuffer(
          Buffer.from(imageBuffer),
          `/avatars/${existingUser.id}-github-avatar.png`
        );

        // update user with image
        await prisma.user.update({
          where: { id: existingUser.id },
          data: { image: image.publicUrl },
        });
      }

      // create new session
      const session = await lucia.createSession(existingUser.id, {});

      return res
        .setHeader("Set-Cookie", lucia.createSessionCookie(session.id).serialize())
        .redirect(redirectUri || "/");
    }

    // create new user
    const user = await createNewUser({
      name: githubUser.name,
      email: githubUser.email,
    } as ICreateNewUserByAccount);

    // check if no "image" field in user
    if (githubUser.avatar_url) {
      // download image and upload to cloudflare
      const imageBuffer = await fetch(githubUser.avatar_url).then((res) => res.arrayBuffer());
      const image = await uploadFileBuffer(
        Buffer.from(imageBuffer),
        `/avatars/${user.id}-github-avatar.png`
      );

      // update user with image
      await prisma.user.update({
        where: { id: user.id },
        data: { image: image.publicUrl },
      });
    }

    // create account
    const account = await prisma.account.create({
      data: {
        userId: user.id,
        provider: "github",
        providerAccountId: `${githubUser.id}`,
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

    // create session
    const userId = user.id;
    const session = await lucia.createSession(userId, {});
    console.log(`session :>>`, session, account);

    // CREATE/SELECT WORKSPACE FOR USERS
    // if this user has only 1 workspace, set it as the active workspace
    const userWorkspaces = await prisma.workspace.count({ where: { creatorId: user.id } });
    console.log(`userWorkspaces :>>`, userWorkspaces);
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

    return res
      .setHeader("Set-Cookie", lucia.createSessionCookie(session.id).serialize())
      .redirect(redirectUri || "/");
  } catch (e) {
    console.log(e);
    if (e instanceof OAuth2RequestError && e.message === "bad_verification_code") {
      // invalid code
      res.status(400).end();
      return;
    }
    res.status(500).end();
    return;
  }
});
