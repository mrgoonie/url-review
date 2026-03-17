import { lucia } from "@/lib/auth";
import { prisma } from "@/lib/db";

import { authRouter } from ".";

authRouter.get("/logout", async (_, res) => {
  try {
    if (res.locals.session) {
      await lucia.invalidateSession(res.locals.session.id);
    }

    // set user.activeWorkspaceId to null
    await prisma.user.update({
      where: { id: res.locals.user?.id },
      data: { activeWorkspaceId: null },
    });

    return res.setHeader("Set-Cookie", lucia.createBlankSessionCookie().serialize()).redirect("/");
  } catch (error) {
    console.error(`Error logging out:`, error);
    return res.redirect("/");
  }
});

authRouter.post("/", async (_, res) => {
  try {
    if (!res.locals.session) {
      return res.status(401).end();
    }
    await lucia.invalidateSession(res.locals.session.id);

    // set user.activeWorkspaceId to null
    await prisma.user.update({
      where: { id: res.locals.user?.id },
      data: { activeWorkspaceId: null },
    });

    return res
      .setHeader("Set-Cookie", lucia.createBlankSessionCookie().serialize())
      .redirect("/login");
  } catch (error) {
    console.error(`Error logging out:`, error);
    return res.redirect("/");
  }
});
