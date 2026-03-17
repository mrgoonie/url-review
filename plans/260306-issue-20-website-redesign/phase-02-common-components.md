# Phase 2: Common Components

## Context
- [plan.md](plan.md)
- Depends on: Phase 1 (foundation)

## Overview
- **Priority**: High
- **Status**: pending
- **Effort**: 2h

Restyle all shared components to dark-first with electric blue accents.

## Files to Modify
- `src/views/common/header.ejs`
- `src/views/common/header-dashboard.ejs`
- `src/views/common/footer.ejs`
- `src/views/common/mobile-menu.ejs`
- `src/views/common/button.ejs`
- `src/views/common/drawers.ejs`
- `src/views/common/input-tags.ejs`
- `src/views/common/input-upload.ejs`
- `src/views/common/link-copy.ejs`
- `src/views/common/create-link-form.ejs`
- `src/views/common/product-create-form.ejs`

## Implementation Steps

### 1. Header (`header.ejs`)
- [ ] Change `bg-white dark:bg-gray-900` → `bg-gray-900 dark:bg-gray-900` (dark default), add `[data-mode="light"] &` variant for light
- [ ] Nav links: swap `text-gray-600 hover:text-blue-600` → `text-gray-300 hover:text-blue-400`
- [ ] Active nav: `text-blue-500 font-semibold`
- [ ] Logo text: white/light color
- [ ] Login button: electric blue bg `bg-blue-500 hover:bg-blue-400`
- [ ] Shadow: `shadow-sm` → `shadow-lg shadow-black/20` for depth on dark

### 2. Dashboard Header (`header-dashboard.ejs`)
- [ ] Same dark treatment as main header
- [ ] Consistent nav styling

### 3. Footer (`footer.ejs`)
- [ ] Dark bg: `bg-gray-950` with `border-t border-gray-800`
- [ ] Text: `text-gray-400` for secondary, `text-gray-200` for links
- [ ] Hover: `hover:text-blue-400`

### 4. Mobile Menu (`mobile-menu.ejs`)
- [ ] Dark bg: `bg-gray-900`
- [ ] Menu items: `text-gray-200`
- [ ] Active: `text-blue-400`
- [ ] Dividers: `border-gray-700`

### 5. Button (`button.ejs`)
- [ ] Primary: `bg-blue-500 hover:bg-blue-400 text-white`
- [ ] Secondary: `bg-gray-700 hover:bg-gray-600 text-gray-200`
- [ ] Outline: `border-blue-500 text-blue-400 hover:bg-blue-500/10`

### 6. Form Components (drawers, input-tags, input-upload, link-copy, create-link-form, product-create-form)
- [ ] Input fields: `bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-500`
- [ ] Focus rings: `focus:ring-blue-500 focus:border-blue-500`
- [ ] Labels: `text-gray-300`
- [ ] Drawer overlays: darker backdrop

## Success Criteria
- Header renders dark with blue accents on all pages
- Footer consistent dark styling
- Mobile menu usable on dark bg
- All form inputs readable on dark bg
- Light mode toggle shows correct light variants

## Next Steps
→ Phase 3: Core Pages
