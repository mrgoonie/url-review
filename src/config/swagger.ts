import pkg from "package.json";
import type { Options } from "swagger-jsdoc";

import { env } from "@/env";

export const swaggerOptions = (options?: Options) => ({
  definition: {
    openapi: "3.1.0",
    info: {
      title:
        options?.title || env.SITE_NAME
          ? `${env.SITE_NAME} API with Swagger`
          : "Express API with Swagger",
      version: options?.version || pkg.version,
      description:
        options?.description ||
        "This is a simple CRUD API application made with Express and documented with Swagger",
      license: {
        name: "MIT",
        url: "https://spdx.org/licenses/MIT.html",
      },
      contact: {
        name: options?.contact?.name || "Goon Nguyen",
        url: options?.contact?.url || "https://x.com/goon_nguyen",
        email: options?.contact?.email || "goon@wearetopgroup.com",
      },
    },
    servers: [
      {
        url: options?.server?.url || env.BASE_URL || "http://localhost:3000",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
        ApiKeyAuth: {
          type: "apiKey",
          in: "header",
          name: "X-API-Key",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
        ApiKeyAuth: [],
      },
    ],
  },
  apis: ["./src/routes/api/*.ts"],
});
