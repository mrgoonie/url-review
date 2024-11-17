import type { User } from "@prisma/client";
import { toBool } from "diginext-utils/dist/object";
import { z } from "zod";

import { WorkspacePermissionDefault, WorkspaceRoleDefault } from "@/config/constants";
import { prisma } from "@/lib/db";
import { makeUniqueSlug } from "@/lib/utils/string";

const GenerateWorkspaceInputSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  isPublic: z.string().optional(),
});
type GenerateWorkspaceByUserProps = z.infer<typeof GenerateWorkspaceInputSchema>;

export default async function generateWorkspaceByUser(
  user: User,
  input?: GenerateWorkspaceByUserProps
) {
  //
  try {
    // Validate input
    const validatedInput = input ? GenerateWorkspaceInputSchema.parse(input) : {};

    // Check if user already has a workspace
    const existingWorkspace = await prisma.workspace.findFirst({
      where: { creatorId: user.id },
    });

    if (existingWorkspace) {
      console.log(`Workspace already exists for user ${user.id}`);
      return existingWorkspace;
    }

    // Create new workspace
    const name = validatedInput.name || `${user.name}'s Workspace`;
    const description = validatedInput.description || `Amazing ${user.name} Workspace`;
    const isPublic =
      validatedInput.isPublic !== undefined ? toBool(validatedInput.isPublic) : false;

    const [fullControlPer, updatePer, invitePer, viewPer] = await Promise.all([
      prisma.workspacePermission.upsert({
        where: { name: WorkspacePermissionDefault.FULL_CONTROL },
        update: {},
        create: { name: WorkspacePermissionDefault.FULL_CONTROL },
      }),
      prisma.workspacePermission.upsert({
        where: { name: WorkspacePermissionDefault.UPDATE },
        update: {},
        create: { name: WorkspacePermissionDefault.UPDATE },
      }),
      prisma.workspacePermission.upsert({
        where: { name: WorkspacePermissionDefault.INVITE },
        update: {},
        create: { name: WorkspacePermissionDefault.INVITE },
      }),
      prisma.workspacePermission.upsert({
        where: { name: WorkspacePermissionDefault.VIEW },
        update: {},
        create: { name: WorkspacePermissionDefault.VIEW },
      }),
    ]);

    const slug = await makeUniqueSlug(prisma.workspace, input?.name || user.name);

    // Create some default role
    const workspace = await prisma.workspace.create({
      data: {
        slug,
        name,
        description,
        isPublic,
        creatorId: user.id,
        workspaceRoles: {
          create: [
            { name: WorkspaceRoleDefault.ADMIN },
            { name: WorkspaceRoleDefault.EDITOR },
            { name: WorkspaceRoleDefault.INVITER },
            { name: WorkspaceRoleDefault.VIEWER },
          ],
        },
      },
      include: {
        workspaceRoles: true,
      },
    });

    // Create permissions for each role
    const rolePermissions = [
      { role: WorkspaceRoleDefault.ADMIN, permissionId: fullControlPer!.id },
      { role: WorkspaceRoleDefault.EDITOR, permissionId: updatePer!.id },
      { role: WorkspaceRoleDefault.INVITER, permissionId: invitePer!.id },
      { role: WorkspaceRoleDefault.VIEWER, permissionId: viewPer!.id },
    ];

    for (const { role, permissionId } of rolePermissions) {
      const workspaceRole = workspace.workspaceRoles.find((r) => r.name === role);
      if (workspaceRole) {
        await prisma.workspaceRolePermission.create({
          data: {
            workspaceRole: { connect: { id: workspaceRole.id } },
            workspacePermission: { connect: { id: permissionId } },
          },
        });
      }
    }

    // Add User to the Admin role
    const adminRole = workspace.workspaceRoles.find(
      (role) => role.name === WorkspaceRoleDefault.ADMIN
    );

    if (adminRole) {
      await prisma.workspaceUserRole.create({
        data: {
          workspace: { connect: { id: workspace.id } },
          user: { connect: { id: user.id } },
          workspaceRole: { connect: { id: adminRole.id } },
        },
      });
    } else {
      throw new Error("Admin role not found in the created workspace");
    }

    return workspace;
  } catch (error) {
    console.error(`Error generating workspace for user ${user.id}:`, error);
    throw new Error(
      `Auto Generate Workspace By User failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
