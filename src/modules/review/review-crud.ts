import { type Prisma, ReviewStatus } from "@prisma/client";
import { z } from "zod";

import { prisma } from "@/lib/db";

export const ReviewCreateDataSchema = z.object({
  url: z.string().url(),
  model: z.string(),
  instructions: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  status: z.nativeEnum(ReviewStatus).optional(),
  errorMessage: z.string().optional(),
  userId: z.string(),
  workspaceId: z.string().optional(),
  categories: z.array(z.string()).optional(),
  aiAnalysis: z.record(z.any()).optional(),
  seoScore: z.number().optional(),
  securityScore: z.number().optional(),
  securityRisk: z.boolean().optional(),
  mobileFriendly: z.boolean().optional(),
  adultContent: z.boolean().optional(),
  gambling: z.boolean().optional(),
});

export type ReviewCreateData = z.infer<typeof ReviewCreateDataSchema>;

export async function createReview(input: ReviewCreateData) {
  const validatedInput = ReviewCreateDataSchema.parse(input);

  const { categories, userId, workspaceId, ...reviewData } = validatedInput;

  return prisma.review.create({
    data: {
      ...reviewData,
      ...(categories && {
        categories: {
          create: categories.map((categoryId) => ({
            category: { connect: { id: categoryId } },
          })),
        },
      }),
      user: { connect: { id: userId } },
      ...(workspaceId && { workspace: { connect: { id: workspaceId } } }),
    },
  });
}

export async function updateReview(
  id: string,
  data: Partial<ReviewCreateData>,
  options?: { include?: Prisma.ReviewInclude }
) {
  const validatedInput = ReviewCreateDataSchema.partial().parse(data);

  const { categories, userId, workspaceId, ...reviewData } = validatedInput;

  return prisma.review.update({
    where: { id },
    data: {
      ...reviewData,
      ...(categories && {
        categories: {
          deleteMany: {}, // Remove existing categories
          create: categories.map((categoryId) => ({
            category: { connect: { id: categoryId } },
          })),
        },
      }),
      user: userId ? { connect: { id: userId } } : undefined,
      workspace: workspaceId ? { connect: { id: workspaceId } } : undefined,
    },
    include: options?.include,
  });
}

export async function deleteReview(id: string) {
  return prisma.review.delete({
    where: { id },
    include: {
      categories: true, // Ensure related categories are also cleaned up
      user: true,
      workspace: true,
      screenshots: true,
    },
  });
}

export async function getReviewById(
  reviewId: string,
  userId: string,
  options?: { include?: Prisma.ReviewInclude }
) {
  try {
    console.log("review-crud.ts > getReviewById() > Fetching review :>>", { reviewId, userId });

    const review = await prisma.review.findUnique({
      where: {
        id: reviewId,
        userId: userId,
      },
      include: {
        categories: {
          include: {
            category: true,
          },
        },
        screenshots: true,
        user: true,
        workspace: true,
        ...options?.include,
      },
    });

    return review;
  } catch (error) {
    console.error("review-crud.ts > getReviewById() > Error :>>", error);
    throw error;
  }
}

export async function getUserReviews(userId: string, page: number = 1, limit: number = 10) {
  try {
    console.log("review-crud.ts > getUserReviews() > Fetching user reviews :>>", {
      userId,
      page,
      limit,
    });

    const offset = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { userId },
        take: limit,
        skip: offset,
        orderBy: { createdAt: "desc" },
        include: {
          categories: {
            include: {
              category: true,
            },
          },
          screenshots: true,
          workspace: true,
        },
      }),
      prisma.review.count({ where: { userId } }),
    ]);

    return { reviews, total };
  } catch (error) {
    console.error("review-crud.ts > getUserReviews() > Error :>>", error);
    throw error;
  }
}
