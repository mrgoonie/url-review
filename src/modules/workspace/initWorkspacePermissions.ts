import { WorkspacePermissionDefault } from "@/config/constants";
import { prisma } from "@/lib/db";

export async function initWorkspacePermissions() {
  const permissions = Object.values(WorkspacePermissionDefault);

  const results = [];
  for (const permission of permissions) {
    const result = await prisma.workspacePermission.upsert({
      where: { name: permission },
      update: {},
      create: { name: permission },
    });
    results.push(result);
  }
  console.log(
    "✅ Workspace permissions initialized:",
    results.map((r) => r.name)
  );
}
