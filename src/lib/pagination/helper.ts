import { z } from "zod";

export const PaginationSchema = z.object({
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  totalCount: z.number().int().nonnegative(),
  totalPages: z.number().int().positive(),
});

export type Pagination = z.infer<typeof PaginationSchema>;

export const getPagination = (page: number, totalCount: number, pageSize: number) => {
  // const total = Math.ceil(totalCount / pageSize);
  return {
    current: page,
    total: totalCount,
    pageSize,
  };
};
