# Issue #20: Website Redesign - Dark Theme with Electric Blue

## Meta
- **Issue**: #20 (refactor: website redesign)
- **Branch**: `dev/issue-20-website-redesign`
- **Status**: planned
- **Created**: 2026-03-06
- **blockedBy**: []
- **blocks**: []

## Overview

Pure visual redesign of ReviewWeb.site from light-first to **dark-first theme** with **electric blue** accent. Keep dark/light toggle. No functional changes.

**Approach**: In-place Tailwind class swap (Option A) — replace classes directly in EJS files.

## Color System

| Role | Light Mode | Dark Mode (Primary) |
|------|-----------|-------------------|
| Background | `white` / `gray-50` | `gray-900` / `gray-950` |
| Surface/Cards | `white` / `gray-100` | `gray-800` |
| Text Primary | `gray-900` | `white` / `gray-100` |
| Text Secondary | `gray-600` | `gray-400` |
| Accent | `blue-600` | `blue-500` |
| Border | `gray-200` | `gray-700` |

## Files to Modify (~25 files)

**Master layouts (3)**:
- `src/views/master.ejs`
- `src/views/master-dashboard.ejs`
- `src/views/master-template.ejs`

**Common components (12)**:
- `src/views/common/header.ejs`
- `src/views/common/header-dashboard.ejs`
- `src/views/common/footer.ejs`
- `src/views/common/mobile-menu.ejs`
- `src/views/common/head.ejs`
- `src/views/common/button.ejs`
- `src/views/common/drawers.ejs`
- `src/views/common/input-tags.ejs`
- `src/views/common/input-upload.ejs`
- `src/views/common/link-copy.ejs`
- `src/views/common/create-link-form.ejs`
- `src/views/common/product-create-form.ejs`

**Pages (10)**:
- `src/views/pages/home.ejs`
- `src/views/pages/pricing.ejs`
- `src/views/pages/login.ejs`
- `src/views/pages/profile.ejs`
- `src/views/pages/review.ejs`
- `src/views/pages/scan.ejs`
- `src/views/pages/404.ejs`
- `src/views/pages/privacy.ejs`
- `src/views/pages/checkout-success.ejs`
- `src/views/pages/checkout-confirmation.ejs`
- `src/views/pages/payment-success.ejs`
- `src/views/pages/workspace-select.ejs`

**CSS**:
- `public/css/style.css`

## Phases

| # | Phase | Status | Effort |
|---|-------|--------|--------|
| 1 | [Foundation - Layouts & CSS](phase-01-foundation-layouts-css.md) | pending | 2h |
| 2 | [Common Components](phase-02-common-components.md) | pending | 2h |
| 3 | [Core Pages](phase-03-core-pages.md) | pending | 3h |
| 4 | [Secondary Pages](phase-04-secondary-pages.md) | pending | 1.5h |
| 5 | [Polish & Testing](phase-05-polish-and-testing.md) | pending | 1.5h |

**Total estimated effort**: ~10h

## Key Decisions
- Dark-first: `body` gets dark bg by default, light mode via `data-mode="light"` toggle
- Electric blue accent: Tailwind `blue-500` (`#3B82F6`) primary, `blue-400` for hover states
- Keep existing dark/light toggle JS logic in `master.ejs`
- No JS logic changes, no backend changes
- Same structure, layout, and features

## Risk Assessment
- **Low**: Pure class swaps, no structural changes
- **Toggle**: Must verify light mode still renders correctly
- **Third-party**: Chart.js, Slick, Tippy may need dark-bg overrides
- **Contrast**: Verify WCAG AA compliance on dark backgrounds
