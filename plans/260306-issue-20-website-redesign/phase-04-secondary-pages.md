# Phase 4: Secondary Pages

## Context
- [plan.md](plan.md)
- Depends on: Phase 1 + Phase 2

## Overview
- **Priority**: Medium
- **Status**: pending
- **Effort**: 1.5h

Apply dark theme to remaining pages. These follow patterns established in Phase 3.

## Files to Modify
- `src/views/pages/profile.ejs`
- `src/views/pages/404.ejs`
- `src/views/pages/privacy.ejs`
- `src/views/pages/checkout-success.ejs`
- `src/views/pages/checkout-confirmation.ejs`
- `src/views/pages/payment-success.ejs`
- `src/views/pages/workspace-select.ejs`

## Implementation Steps

### 1. Profile Page (`profile.ejs`)
- [ ] Dashboard cards: `bg-gray-800 border-gray-700`
- [ ] Stats/metrics: electric blue highlights
- [ ] Tables: dark rows with `hover:bg-gray-700`
- [ ] Forms: dark input styling
- [ ] Chart.js: update chart colors for dark bg (grid lines, labels, etc.)

### 2. 404 Page (`404.ejs`)
- [ ] Dark bg, white text
- [ ] Blue accent CTA to go home

### 3. Privacy Page (`privacy.ejs`)
- [ ] Dark bg, `text-gray-300` body text
- [ ] Headings: `text-white`
- [ ] Links: `text-blue-400`

### 4. Checkout Pages (`checkout-success.ejs`, `checkout-confirmation.ejs`)
- [ ] Dark cards: `bg-gray-800`
- [ ] Success indicators: green on dark
- [ ] Order details: readable on dark bg

### 5. Payment Success (`payment-success.ejs`)
- [ ] Dark card with green success accent
- [ ] Blue CTA buttons

### 6. Workspace Select (`workspace-select.ejs`)
- [ ] Dark selection cards
- [ ] Blue hover/selected states

## Success Criteria
- All secondary pages consistent with core pages
- Profile dashboard Chart.js renders correctly on dark bg
- Checkout flow looks trustworthy
- No white-bg flashes on any page

## Next Steps
→ Phase 5: Polish & Testing
