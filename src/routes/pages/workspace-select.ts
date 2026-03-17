import AppConfig from "@/config/AppConfig";
import { clientEnv } from "@/env";
import { validateSession, verifyRequest } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { maskUser } from "@/modules/user";
import { getUser } from "@/modules/user/get-user";

import { authRouter } from "../auth/router";

authRouter.get("/workspace/select", verifyRequest, validateSession, async (_, res) => {
  if (!res.locals.user) return res.redirect("/login");
  const { id } = res.locals.user;
  const user = await getUser(id);
  if (!user) return res.redirect("/login");

  const workspaces = await prisma.workspace.findMany({
    where: {
      creatorId: id,
    },
  });

  return res.render("master", {
    page: "pages/workspace-select",
    path_name: "/workspace/select",
    clientEnv,
    site_name: AppConfig.siteName,
    page_title: "Select Workspace",
    workspaces,
    user: user ? maskUser(user) : null,
  });
});
