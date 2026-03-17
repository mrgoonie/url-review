# Phase 1: Foundation - Layouts & CSS

## Context
- [plan.md](plan.md)
- Issue #20: Website Redesign

## Overview
- **Priority**: High (all other phases depend on this)
- **Status**: pending
- **Effort**: 2h

Set up dark-first defaults in master layouts and CSS. This establishes the foundation colors that all pages inherit.

## Key Insights
- Current `master.ejs` uses `data-mode` attribute for theme switching via JS
- `style.css` is compiled TailwindCSS output — custom overrides go at the end
- Body currently has no default bg color; pages set their own

## Files to Modify
- `src/views/master.ejs`
- `src/views/master-dashboard.ejs`
- `src/views/master-template.ejs`
- `src/views/common/head.ejs`
- `public/css/style.css` (custom section at end)

## Implementation Steps

### 1. Update `master.ejs`
- [ ] Change `<body>` class: add `bg-gray-950 text-gray-100` as defaults
- [ ] Add dark-first logic: change `getInitialTheme()` to default to `'dark'` when no saved preference
- [ ] Ensure `data-mode` attribute still toggles correctly

### 2. Update `master-dashboard.ejs`
- [ ] Same body class treatment: `bg-gray-950 text-gray-100`
- [ ] Verify dark bg propagates to dashboard pages

### 3. Update `master-template.ejs`
- [ ] Same body class treatment for share templates

### 4. Update `head.ejs`
- [ ] Check meta theme-color tag — set to dark color `#030712` (gray-950)
- [ ] Add/update any CSS custom properties for theme

### 5. Add CSS custom properties in `style.css`
- [ ] Add custom property overrides at end of file:
  ```css
  :root {
    --color-bg-primary: #030712;    /* gray-950 */
    --color-bg-surface: #1f2937;    /* gray-800 */
    --color-accent: #3B82F6;        /* blue-500 */
    --color-accent-hover: #60A5FA;  /* blue-400 */
    --color-text-primary: #f3f4f6;  /* gray-100 */
    --color-text-secondary: #9ca3af; /* gray-400 */
    --color-border: #374151;        /* gray-700 */
  }
  [data-mode="light"] {
    --color-bg-primary: #ffffff;
    --color-bg-surface: #f9fafb;
    --color-accent: #2563EB;
    --color-accent-hover: #1d4ed8;
    --color-text-primary: #111827;
    --color-text-secondary: #4b5563;
    --color-border: #e5e7eb;
  }
  ```
- [ ] Override loader/preloader colors for dark bg
- [ ] Check `.header--sticky` custom styles for dark compatibility

## Success Criteria
- All 3 master layouts render with dark bg by default
- Light mode toggle still switches correctly
- No flash of white on page load (dark theme loads immediately)
- CSS custom properties available for any custom styling needs

## Next Steps
→ Phase 2: Common Components (header, footer, mobile-menu, buttons, etc.)
