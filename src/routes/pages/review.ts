import AppConfig from "@/config/AppConfig";
import { clientEnv } from "@/env";
import { validateSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

import { pageRouter } from "./router";

// Get review by ID
pageRouter.get("/review/:reviewId", validateSession, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = res.locals["userId"];

    if (!reviewId) {
      return res.status(400).render("pages/error", {
        error: "Review ID is required",
      });
    }

    const review = await prisma.review.findUnique({
      where: {
        id: reviewId,
      },
      include: {
        screenshots: true,
        categories: {
          include: {
            category: true,
          },
        },
      },
    });
    console.log("review :>>", JSON.stringify(review, null, 2));

    if (!review) {
      return res.status(404).render("pages/error", {
        error: "Review not found",
      });
    }

    // Check if user has access to this review
    // if (review.userId !== userId && !review.workspaceId) {
    //   return res.status(403).render("pages/error", {
    //     error: "You don't have permission to view this review",
    //   });
    // }

    // If review is in workspace, check if user has access to workspace
    // if (review.workspaceId) {
    //   const workspace = await prisma.workspace.findFirst({
    //     where: {
    //       id: review.workspaceId,
    //       OR: [
    //         { isPublic: true },
    //         { creatorId: userId },
    //         {
    //           workspaceUserRoles: {
    //             some: {
    //               userId,
    //             },
    //           },
    //         },
    //       ],
    //     },
    //   });

    //   if (!workspace) {
    //     return res.status(403).render("pages/error", {
    //       error: "You don't have permission to view this review",
    //     });
    //   }
    // }

    return res.render("master", {
      page: "pages/review",
      path_name: "/review",
      page_name: "Review Result",
      review,
      site_name: AppConfig.siteName,
      clientEnv,
    });
  } catch (error) {
    console.error("review.ts > GET /:reviewId > Error :>>", error);
    return res.status(500).render("pages/error", {
      error: "Failed to fetch review",
    });
  }
});
