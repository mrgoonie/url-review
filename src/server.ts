/* eslint-disable no-unused-vars */
import chalk from "chalk";
import cookieParser from "cookie-parser";
import express from "express";
import type { Session, User } from "lucia";
import path from "path";
import { fileURLToPath } from "url";

import { env } from "@/env";
import { validateSession, verifyRequest } from "@/lib/auth";
import { createInitialPlans } from "@/modules/plan/plans";
import { initWorkspacePermissions } from "@/modules/workspace/initWorkspacePermissions";
import { apiRouter } from "@/routes/api";
import { authRouter } from "@/routes/auth";
import { pageRouter } from "@/routes/pages";

import { createInitialCategories } from "./modules/user-products/category";
// import { doubleCsrfProtection } from "./middlewares/csrf";
import { polarWebhookRouter } from "./routes/webhooks/polar-webhook";

// import { syncPlans } from "./modules/plan/plans.js";

declare global {
  namespace Express {
    interface Locals {
      user: User | null;
      session: Session | null;
      csrfToken: string;
    }
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// sync subscription plans in database with Polar
createInitialPlans();
// syncPlans();

const app = express();

// trust cloudflare proxy
app.set("trust proxy", ["loopback", "linklocal", "uniquelocal"]);

// webhooks
app.use(polarWebhookRouter);

// url encoded & body parser
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// CSRF protection
// app.use((req, res, next) => {
//   if (req.path === "/api/v1/link" && req.method === "POST") {
//     console.log("req.path :>> ", req.path);
//     // Skip CSRF for this specific route
//     next();
//   } else {
//     doubleCsrfProtection(req, res, next);
//   }
// });

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

// error handler
app.use((error: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(chalk.red(`server.ts > error handler > Server error:`, error));
  return res.status(500).json({ error: "Internal server error" });
});

// start server
async function startServer() {
  await initWorkspacePermissions();
  await createInitialCategories();

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
