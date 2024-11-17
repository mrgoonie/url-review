import { toBool } from "diginext-utils/dist/object";

import { AppRoleDefault } from "@/config/constants";
import { prisma } from "@/lib/db";
import { makeUniqueSlug } from "@/lib/utils";

import generateWorkspaceByUser from "../workspace/generateWorkspaceByUser";

export interface ICreateNewUserByAccount {
  name: string;
  email?: string;
  image?: string;
  accountId?: string;
}

export interface ICreateNewUserByPassword {
  name: string;
  email: string;
  password: string;
  validEmail?: boolean;
}

export async function createNewUser(props: ICreateNewUserByAccount | ICreateNewUserByPassword) {
  // let urlRedirect = "/profile";

  try {
    let data: any;

    if ("accountId" in props) {
      const { accountId, email, ...rest } = props;
      data = {
        ...rest,
        ...(email ? { email } : {}),
        accounts: {
          connect: { id: accountId },
        },
        validEmail: toBool(email),
      };
    } else {
      data = { ...props };
    }

    // Check if user with this email already exists
    let user = data.email ? await prisma.user.findUnique({ where: { email: data.email } }) : null;

    if (user) {
      // User exists, update instead of create
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          ...data,
          accounts: {
            ...(data.accounts || {}),
          },
        },
        include: {
          userRoles: {
            include: {
              role: true,
            },
          },
        },
      });
      console.info(`Updated existing user with id ${user.id}`);
    } else {
      // generate username (slug)
      const slug = await makeUniqueSlug(prisma.user, data.name);
      data.slug = slug;

      // Find or create default role
      let defaultRole = await prisma.role.findFirst({
        where: { name: AppRoleDefault.VIEWER },
      });

      if (!defaultRole) {
        defaultRole = await prisma.role.create({
          data: { name: AppRoleDefault.VIEWER },
        });
      }

      // Create new user
      user = await prisma.user.create({
        data: {
          ...data,
          userRoles: {
            create: {
              role: {
                connect: {
                  id: defaultRole.id,
                },
              },
            },
          },
        },
        include: {
          userRoles: {
            include: {
              role: true,
            },
          },
        },
      });
      console.info(`Created new user with id ${user.id}`);
    }

    // Generate workspace for new users
    // const countWorkspace = await prisma.workspace.count({
    //   where: {
    //     creatorId: user.id,
    //   },
    // });
    // if (countWorkspace === 0) {
    //   try {
    //     const ws = await generateWorkspaceByUser(user);
    //     if (ws) {
    //       user = await prisma.user.update({
    //         where: { id: user.id },
    //         data: { activeWorkspaceId: ws.id },
    //       });
    //       console.info(`Generated workspace for user ${user.id}`);
    //     } else {
    //       console.warn(`Failed to generate workspace for user ${user.id}`);
    //     }
    //   } catch (wsError) {
    //     console.error(`Error generating workspace for user ${user.id}:`, wsError);
    //   }
    // }

    return user;
  } catch (error) {
    throw new Error(
      `Create New User failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
