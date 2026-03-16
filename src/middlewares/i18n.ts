import type { NextFunction, Request, Response } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPPORTED_LANGS = ["en", "vi"] as const;
type Lang = (typeof SUPPORTED_LANGS)[number];
const DEFAULT_LANG: Lang = "en";

// Cache loaded translations in memory
const translationCache: Record<string, Record<string, any>> = {};

function loadTranslations(lang: string): Record<string, any> {
  if (translationCache[lang]) return translationCache[lang];
  const filePath = path.join(__dirname, "..", "locales", `${lang}.json`);
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    translationCache[lang] = JSON.parse(raw);
  } catch {
    console.warn(`i18n: Missing translation file for "${lang}", falling back to "${DEFAULT_LANG}"`);
    translationCache[lang] = loadTranslations(DEFAULT_LANG);
  }
  return translationCache[lang];
}

function getNestedValue(obj: Record<string, any>, key: string): string {
  const parts = key.split(".");
  let current: any = obj;
  for (const part of parts) {
    if (current == null || typeof current !== "object") return key;
    current = current[part];
  }
  return typeof current === "string" ? current : key;
}

function createTranslator(lang: string) {
  const translations = loadTranslations(lang);
  return (key: string, replacements?: Record<string, string>): string => {
    let value = getNestedValue(translations, key);
    if (replacements) {
      for (const [k, v] of Object.entries(replacements)) {
        value = value.replace(new RegExp(`\\{\\{${k}\\}\\}`, "g"), v);
      }
    }
    return value;
  };
}

export function isSupportedLang(lang: string): lang is Lang {
  return SUPPORTED_LANGS.includes(lang as Lang);
}

/**
 * i18n middleware - extracts lang from URL param, sets t() on res.locals
 */
export function i18nMiddleware(req: Request, res: Response, next: NextFunction) {
  const lang = req.params.lang;

  if (!lang || !isSupportedLang(lang)) {
    const cookieLang = req.cookies?.lang;
    const headerLang = req.headers["accept-language"]?.slice(0, 2);
    const preferred = isSupportedLang(cookieLang)
      ? cookieLang
      : isSupportedLang(headerLang || "")
        ? headerLang
        : DEFAULT_LANG;
    return res.redirect(301, `/${preferred}${req.path === "/" ? "" : req.path}`);
  }

  // Set cookie for language preference (30 days)
  res.cookie("lang", lang, { maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: false });

  // Inject i18n helpers into res.locals for EJS
  res.locals.t = createTranslator(lang);
  res.locals.lang = lang;
  res.locals.altLangs = SUPPORTED_LANGS.filter((l) => l !== lang);
  res.locals.supportedLangs = [...SUPPORTED_LANGS];

  // URL helpers
  res.locals.localePath = (urlPath: string) => `/${lang}${urlPath}`;
  res.locals.altLangPath = (altLang: string) => {
    const currentPath = req.path;
    return `/${altLang}${currentPath}`;
  };

  next();
}

export { DEFAULT_LANG, SUPPORTED_LANGS };
