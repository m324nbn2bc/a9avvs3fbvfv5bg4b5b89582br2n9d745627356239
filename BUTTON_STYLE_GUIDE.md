# Button Style Guide

This document defines the standardized button styling system for Twibbonize. **All buttons must use the `btn-base` class plus a variant class** for consistent appearance and behavior across the platform.

## Core Principle

```jsx
// ✅ CORRECT - Use btn-base + btn-{variant}
<button className="btn-base btn-primary py-3 px-6">
  Submit
</button>

// ❌ WRONG - Don't use inline Tailwind classes
<button className="bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-6 rounded-lg">
  Submit
</button>
```

## Available Button Variants

### 1. Primary Button (`btn-primary`)
**Use for:** Main actions, submit buttons, primary CTAs
```jsx
<button className="btn-base btn-primary py-3 px-6">
  Create Campaign
</button>
```
- **Colors:** Emerald gradient (emerald-600 to emerald-700)
- **Hover:** Darkens to emerald-700/emerald-800
- **When to use:** Primary user actions, form submissions, main CTAs

---

### 2. Secondary Button (`btn-secondary`)
**Use for:** Alternative actions, cancel buttons, secondary CTAs
```jsx
<button className="btn-base btn-secondary py-3 px-6">
  Cancel
</button>
```
- **Colors:** White background with gray border
- **Hover:** Light gray background (gray-50)
- **When to use:** Secondary actions, alternative options, cancel operations

---

### 3. Danger Button (`btn-danger`)
**Use for:** Destructive actions, delete buttons, permanent actions
```jsx
<button className="btn-base btn-danger py-3 px-6">
  Delete Campaign
</button>
```
- **Colors:** Red (red-600)
- **Hover:** Darker red (red-700)
- **When to use:** Delete, ban, reject, or other destructive actions

---

### 4. Warning Button (`btn-warning`)
**Use for:** Warning actions, caution buttons
```jsx
<button className="btn-base btn-warning py-3 px-6">
  Pending Review
</button>
```
- **Colors:** Yellow (yellow-500)
- **Hover:** Darker yellow (yellow-600)
- **When to use:** Warning states, caution actions, pending states

---

### 5. Info Button (`btn-info`)
**Use for:** Informational actions, refresh, reload, help
```jsx
<button className="btn-base btn-info py-3 px-6">
  Refresh Page
</button>
```
- **Colors:** Blue (blue-500)
- **Hover:** Darker blue (blue-600)
- **When to use:** Refresh, reload, retry, informational actions

---

### 6. Neutral Button (`btn-neutral`)
**Use for:** Utility actions, change, reset, minor actions
```jsx
<button className="btn-base btn-neutral py-3 px-6">
  Change Photo
</button>
```
- **Colors:** Light gray (gray-200)
- **Hover:** Medium gray (gray-300)
- **When to use:** Utility functions, change photo, reset, zoom controls

---

### 7. Google/Social Button (`btn-google`)
**Use for:** Google sign-in, social authentication
```jsx
<button className="btn-base btn-google py-3 px-6">
  Sign in with Google
</button>
```
- **Colors:** White with border and shadow
- **Hover:** Yellow tint (yellow-50)
- **When to use:** Google authentication, social login

---

### 8. Link Button (`btn-link`)
**Use for:** Text-only buttons, inline links
```jsx
<button className="btn-link">
  Learn More
</button>
```
- **Colors:** Emerald text (emerald-600)
- **Hover:** Darker emerald with underline
- **When to use:** Text-only actions, inline links, subtle navigation

---

### 9. Social Media Share Buttons

#### Twitter Button (`btn-twitter`)
```jsx
<button className="btn-base btn-twitter py-3 px-6">
  Share on Twitter
</button>
```
- **Colors:** Twitter blue (blue-400)
- **Hover:** Darker blue (blue-500)

#### Facebook Button (`btn-facebook`)
```jsx
<button className="btn-base btn-facebook py-3 px-6">
  Share on Facebook
</button>
```
- **Colors:** Facebook blue (blue-600)
- **Hover:** Darker blue (blue-700)

#### WhatsApp Button (`btn-whatsapp`)
```jsx
<button className="btn-base btn-whatsapp py-3 px-6">
  Share on WhatsApp
</button>
```
- **Colors:** WhatsApp green (green-500)
- **Hover:** Darker green (green-600)

---

## Button Features

### Automatic Hover Effect
All buttons using `btn-base` get a **1.03x scale on hover** for visual feedback.

### Focus States
All variants include accessible focus rings that match their color scheme.

### Disabled State
```jsx
<button className="btn-base btn-primary py-3 px-6" disabled>
  Loading...
</button>
```
- Automatically reduces opacity to 50%
- Removes cursor pointer
- Disables hover effects

---

## Common Patterns

### Full Width Button
```jsx
<button className="btn-base btn-primary w-full py-3">
  Continue
</button>
```

### Small Button
```jsx
<button className="btn-base btn-secondary py-2 px-4 text-sm">
  Edit
</button>
```

### Icon Button
```jsx
<button className="btn-base btn-info w-10 h-10 rounded-full">
  <Icon />
</button>
```

### Button Group
```jsx
<div className="flex gap-2">
  <button className="btn-base btn-secondary flex-1 py-3">Cancel</button>
  <button className="btn-base btn-primary flex-1 py-3">Submit</button>
</div>
```

---

## Migration Checklist

When updating old buttons:
1. ✅ Add `btn-base` class
2. ✅ Add appropriate `btn-{variant}` class
3. ✅ Remove all inline `bg-*`, `hover:*`, `transition-*` classes
4. ✅ Keep sizing classes (`py-*`, `px-*`, `w-*`, `h-*`)
5. ✅ Keep layout classes (`flex`, `block`, `inline-flex`)
6. ✅ Keep text classes (`text-sm`, etc.) only if needed for exceptions

---

## Design Benefits

✅ **Consistency:** All buttons look and behave the same way  
✅ **Maintainability:** Update one CSS class to change all buttons  
✅ **Accessibility:** Built-in focus states and ARIA support  
✅ **Performance:** Shared CSS classes reduce bundle size  
✅ **Developer Experience:** Clear naming makes code more readable  

---

## Questions?

If you need a new button variant or have questions about which variant to use, refer to this guide or check `src/app/globals.css` for implementation details.

**Last Updated:** October 28, 2025
