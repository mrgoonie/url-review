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
import { DEFAULT_LANG, i18nMiddleware, isSupportedLang } from "@/middlewares/i18n";
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
      // i18n
      t: (key: string, replacements?: Record<string, string>) => string;
      lang: string;
      altLangs: string[];
      supportedLangs: string[];
      localePath: (path: string) => string;
      altLangPath: (altLang: string) => string;
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

// Root redirect to preferred language
app.get("/", (req, res) => {
  const cookieLang = req.cookies?.lang;
  const headerLang = req.headers["accept-language"]?.slice(0, 2);
  const lang = isSupportedLang(cookieLang)
    ? cookieLang
    : isSupportedLang(headerLang || "")
      ? headerLang
      : DEFAULT_LANG;
  res.redirect(301, `/${lang}`);
});

// Legacy route redirects (301 for SEO)
const legacyRoutes = ["/pricing", "/login", "/profile", "/payment-success", "/privacy", "/404"];
for (const route of legacyRoutes) {
  app.get(route, (req, res) => {
    const lang = req.cookies?.lang || DEFAULT_LANG;
    res.redirect(301, `/${lang}${route}`);
  });
}
app.get("/review/:id", (req, res) => {
  const lang = req.cookies?.lang || DEFAULT_LANG;
  res.redirect(301, `/${lang}/review/${req.params.id}`);
});
app.get("/scan/:id", (req, res) => {
  const lang = req.cookies?.lang || DEFAULT_LANG;
  res.redirect(301, `/${lang}/scan/${req.params.id}`);
});
app.get("/checkout", (req, res) => {
  const lang = req.cookies?.lang || DEFAULT_LANG;
  res.redirect(
    301,
    `/${lang}/checkout${req.url.includes("?") ? req.url.substring(req.url.indexOf("?")) : ""}`
  );
});
app.get("/checkout/confirmation", (req, res) => {
  const lang = req.cookies?.lang || DEFAULT_LANG;
  res.redirect(
    301,
    `/${lang}/checkout/confirmation${req.url.includes("?") ? req.url.substring(req.url.indexOf("?")) : ""}`
  );
});

// Mount pageRouter under /:lang with i18n middleware
app.use("/:lang", i18nMiddleware, pageRouter);

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

  // test
  // console.log(await isUrlAlive("https://corp.commissaries.com/shopping/click-2-go"));

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
