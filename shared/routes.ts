import { z } from 'zod';
import { insertPlanSchema, plans } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  plans: {
    list: {
      method: 'GET' as const,
      path: '/api/plans',
      responses: {
        200: z.array(z.custom<typeof plans.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/plans/:id',
      responses: {
        200: z.custom<typeof plans.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
