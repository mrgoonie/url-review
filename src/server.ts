/* eslint-disable no-unused-vars */
import type { ApiKey } from "@prisma/client";
import chalk from "chalk";
import cookieParser from "cookie-parser";
import express from "express";
import type { Session, User } from "lucia";
import path from "path";
import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { fileURLToPath } from "url";

import { env } from "@/env";
import { validateSession, verifyRequest } from "@/lib/auth";
import { browserPool } from "@/lib/playwright";
import { createInitialPlans } from "@/modules/plan/plans";
import { initWorkspacePermissions } from "@/modules/workspace";
import { apiRouter } from "@/routes/api";
import { authRouter } from "@/routes/auth";
import { pageRouter } from "@/routes/pages";

import { swaggerOptions } from "./config";
import { fetchListAIModels } from "./lib/ai/models";
import { createInitialCategories } from "./modules/category";
import { polarWebhookRouter } from "./routes/webhooks/polar-webhook";

declare global {
  namespace Express {
    interface Locals {
      user: User | null;
      userId: string | null;
      apiKey: ApiKey | null;
      session: Session | null;
      csrfToken: string;
    }
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// trust cloudflare proxy
app.set("trust proxy", ["loopback", "linklocal", "uniquelocal"]);

// webhooks
// NOTE: webhooks should be the first middleware because it handles raw request body
app.use(polarWebhookRouter);

// url encoded & body parser
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// template engine: EJS
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// assets
app.use(express.static(path.join(__dirname, "../public")));

// API routes
app.use(apiRouter);

// auth middleware: verify request origin & validate session
app.use(verifyRequest);
app.use(validateSession);

// routes
app.use(authRouter);
app.use(pageRouter);

// swagger
const specs = swaggerJSDoc(swaggerOptions());
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

// error handler
app.use((error: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(chalk.red(`server.ts > error handler > Server error:`, error));
  return res.status(500).json({ error: "Internal server error" });
});

// start server
async function startServer() {
  await createInitialPlans();
  await initWorkspacePermissions();
  await browserPool.initialize();
  await createInitialCategories();
  await fetchListAIModels({ debug: true });

  app.listen(env.PORT, () => {
    console.log(chalk.green(`🚀 Server running on port ${env.PORT}`));
  });

  // Handle graceful shutdown
  process.on("SIGTERM", async () => {
    console.log("SIGTERM received. Closing browser pool and shutting down gracefully");
    // ... (other cleanup tasks)
    process.exit(0);
  });
}

// start server
startServer().catch(console.error);
