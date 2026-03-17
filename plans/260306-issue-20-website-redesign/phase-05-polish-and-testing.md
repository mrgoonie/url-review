# Phase 5: Polish & Testing

## Context
- [plan.md](plan.md)
- Depends on: Phase 1-4

## Overview
- **Priority**: High
- **Status**: pending
- **Effort**: 1.5h

Final polish, third-party component fixes, toggle verification, and responsive testing.

## Implementation Steps

### 1. Dark/Light Toggle Verification
- [ ] Test toggle on every page — ensure bidirectional switch works
- [ ] Verify no FOUC (flash of unstyled content) on page load
- [ ] Check `localStorage` persistence works correctly
- [ ] Verify system preference detection still works as fallback

### 2. Third-Party Components
- [ ] **Chart.js**: Update chart options for dark bg
  - Grid lines: `gray-700`
  - Axis labels: `gray-400`
  - Legend text: `gray-300`
- [ ] **Slick Carousel**: Dark arrow/dot styling
- [ ] **Tippy.js**: Dark tooltip theme (may already be dark)
- [ ] **Highlight.js**: Using `github-dark-dimmed` — verify it works on new dark bg

### 3. Loader/Preloader
- [ ] Update `.loader-wrapper` bg to dark color
- [ ] Loader spinner: blue accent color

### 4. IndieBoosting Widget
- [ ] Check if external widget renders OK on dark bg
- [ ] Add wrapper styling if needed

### 5. Share Templates
- [ ] `share-template-01.ejs` and `share-template-01-random.ejs`
- [ ] These may have their own bg — verify consistency

### 6. Responsive Testing
- [ ] Mobile (375px): all pages readable, no overflow
- [ ] Tablet (768px): layout correct
- [ ] Desktop (1280px+): full width looks good
- [ ] Mobile menu: dark styling, touch targets visible

### 7. Accessibility Check
- [ ] Text contrast ratios meet WCAG AA (4.5:1 for body text)
- [ ] Focus states visible on dark bg (blue ring)
- [ ] Interactive elements have clear hover/active states

## Success Criteria
- Toggle works flawlessly on all pages
- No visual glitches with third-party widgets
- Responsive across all breakpoints
- Accessibility contrast compliance
- Professional, bold, trustworthy appearance

## Definition of Done
- All 25+ files updated
- Dark-first theme with electric blue accents
- Light mode toggle preserved and functional
- No functional/JS changes
- No backend changes
- Visual consistency across all pages
