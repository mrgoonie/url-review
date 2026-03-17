# Phase 3: Core Pages

## Context
- [plan.md](plan.md)
- Depends on: Phase 1 + Phase 2

## Overview
- **Priority**: High
- **Status**: pending
- **Effort**: 3h

Redesign the 4 most important pages: home, pricing, login, review/scan.

## Files to Modify
- `src/views/pages/home.ejs`
- `src/views/pages/pricing.ejs`
- `src/views/pages/login.ejs`
- `src/views/pages/review.ejs`
- `src/views/pages/scan.ejs`

## Implementation Steps

### 1. Home Page (`home.ejs`)
- [ ] Hero section: `bg-gray-950` with subtle gradient or glow effect
- [ ] Hero title: `text-white` bold, maybe with blue gradient text for emphasis
- [ ] Subtitle: `text-gray-400`
- [ ] Cards: `bg-gray-800 border-gray-700 rounded-2xl shadow-2xl` → swap from white
- [ ] Review form input: `bg-gray-700 border-gray-600 text-white`
- [ ] Submit buttons: `bg-blue-500 hover:bg-blue-400`
- [ ] Scan form: same dark input treatment
- [ ] CTA buttons at bottom: `bg-blue-500`, `bg-green-500` (keep green for API docs)
- [ ] Skeleton loaders: `bg-gray-700` instead of `bg-gray-200`
- [ ] Add light mode variants with `[data-mode="light"]` where needed

### 2. Pricing Page (`pricing.ejs`)
- [ ] Pricing cards: `bg-gray-800 border-gray-700`
- [ ] Featured/popular card: `border-blue-500 ring-2 ring-blue-500/30`
- [ ] Price text: `text-white` large
- [ ] Feature list: `text-gray-300` with `text-blue-400` check icons
- [ ] CTA buttons: `bg-blue-500 hover:bg-blue-400`
- [ ] Compare toggle: dark styling

### 3. Login Page (`login.ejs`)
- [ ] Container: `bg-gray-800 border-gray-700`
- [ ] OAuth buttons: dark variants with proper contrast
- [ ] Google button: keep brand colors but dark bg
- [ ] GitHub button: `bg-gray-700` on dark (was black on white)
- [ ] Dividers: `border-gray-700`
- [ ] Text: `text-gray-300`

### 4. Review Page (`review.ejs`)
- [ ] Result cards: `bg-gray-800 border-gray-700`
- [ ] Score indicators: electric blue accents
- [ ] Code blocks: already dark-friendly (github-dark-dimmed theme)
- [ ] Tables: `bg-gray-800` with `border-gray-700`
- [ ] Progress bars: `bg-blue-500`
- [ ] Badges: dark variants

### 5. Scan Page (`scan.ejs`)
- [ ] Form: dark input styling
- [ ] Results table: `bg-gray-800` rows
- [ ] Status indicators: colored badges on dark bg
- [ ] Progress: blue accent

## Success Criteria
- Home page looks bold and professional on dark bg
- Pricing cards clearly differentiate tiers with blue accents
- Login page clean and trustworthy
- Review/scan results readable on dark backgrounds
- All pages work with light mode toggle

## Next Steps
→ Phase 4: Secondary Pages
