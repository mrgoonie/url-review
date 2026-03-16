# Planner Report: Website Revamp - ReviewWeb.site

**Date**: 2026-03-15
**Plan Dir**: `plans/260315-1102-website-revamp/`
**Branch**: dev/goon

## Summary

Created 7-phase implementation plan for complete website revamp covering i18n (EN/VI), professional SaaS redesign, and full SEO infrastructure. Total estimated effort: ~32h.

## Key Decisions

1. **i18n**: Lightweight JSON + Express middleware (NOT the existing AI-based `src/lib/translate/`). URL-based routing `/:lang/*`, cookie persistence, browser language detection.
2. **Dependencies removed**: jQuery, Slick carousel, GSAP - replaced with vanilla JS + CSS animations + Intersection Observer.
3. **Dependencies kept**: Tippy.js (works standalone), Day.js, marked.js, highlight.js (conditional), Chart.js (conditional).
4. **No new npm packages**: Everything achievable with built-in browser APIs and TailwindCSS.
5. **Font swap**: Fraunces -> Inter (body) + Plus Jakarta Sans (headings) via Google Fonts.
6. **Auth routes unchanged**: `/login/github/callback`, `/login/google` stay outside `/:lang` scope.
7. **API routes unchanged**: `/api/v1/*` completely unaffected.

## Phases

| Phase | Description | Effort | Blocks |
|-------|------------|--------|--------|
| 1. Foundation | i18n middleware, JSON translations, route restructuring | 6h | All others |
| 2. Design System | Tailwind config, fonts, colors, reusable components | 3h | 3-7 |
| 3. Layout & Nav | Master layout, header, footer, mobile menu, lang switcher | 5h | 4-5 |
| 4. Homepage | Hero, features, how-it-works, tool section, CTA | 5h | - |
| 5. Inner Pages | Pricing, login, profile, review, scan, 404, privacy | 6h | - |
| 6. SEO & Perf | Structured data, sitemap, robots.txt, preconnect | 4h | - |
| 7. Polish & QA | Animations, a11y, cross-browser, regression testing | 3h | - |

## Files Created/Modified Summary

**New files** (~25):
- `src/middlewares/i18n.ts`
- `src/locales/en.json`, `src/locales/vi.json`
- `src/views/components/` (6 component files)
- `src/views/sections/` (5 section files)
- `src/routes/seo/robots-route.ts` (robots.txt + sitemap.xml)
- `src/views/components/schema-*.ejs` (3 schema files)
- `public/js/scroll-animations.js`

**Modified files** (~15):
- `src/server.ts`, `tailwind.config.cjs`, `src/styles/global.css`
- `src/views/master.ejs`, `src/views/common/{head,header,footer,mobile-menu}.ejs`
- `src/views/pages/{home,pricing,login,404,privacy,review,scan}.ejs`
- `src/routes/pages/{home,pricing,profile,review,scan,checkout}.ts`

## Unresolved Questions

1. **review.js / scan-links.js jQuery dependency** - Need to audit these files before Phase 4. If jQuery-dependent, they need refactoring to vanilla JS.
2. **Vietnamese translations quality** - Initial translations will be ASCII approximations. Native speaker review recommended before production.
3. **IndieBoosting widget** - Currently in master.ejs, depends on Slick carousel? Need to verify if the external script bundles its own dependencies.
4. **Profile page complexity** - Not fully audited. May have dashboard elements needing more restyling than estimated.
5. **Auth redirect URIs** - OAuth callback URLs are hardcoded in GitHub/Google apps. Verify they don't need `/:lang` prefix (they shouldn't since auth routes mount outside `/:lang`).
