---
name: frontend-redesign
description: Redesign or improve UI for CCI frontend pages and components. Use when updating layouts, styling, or visual presentation without changing business logic.
---

# Frontend Redesign Skill

## Purpose
Improve the visual design, UX, or layout of existing pages and components while preserving all business logic.

## When to Use
- Updating page layout or visual structure
- Improving mobile responsiveness
- Changing color scheme or component styling
- Adding new UI elements (charts, cards, badges)
- Improving table column layouts or form designs

## Workflow

1. **Read** `.project-ai/frontend-guide.md` — understand shared components and patterns
2. **Read** the target page/component file
3. **Identify** which shared components to use or extend
4. **Implement** UI changes only — zero changes to data fetching or business logic
5. **Verify** visual output in browser (`pnpm dev`)
6. **Check** dark mode (`dark:` classes) — all colors must have dark variant

## Checklist
- [ ] Uses shared components from `@/components/shared` where possible
- [ ] All colors use Tailwind classes — no inline styles
- [ ] Dark mode variants added for all color changes (`dark:`)
- [ ] Responsive classes used (`sm:`, `lg:`)
- [ ] No changes to data fetching, state logic, or service calls
- [ ] No changes to TypeScript types
- [ ] Mobile layout tested (375px viewport)
- [ ] `pnpm build` passes (no type errors from refactored JSX)

## Constraints
- Never modify business logic while redesigning
- Never change API call structure
- Never remove functional elements (buttons, forms, data)
- Prefer extending existing shared components over creating new ones
- TailwindCSS only — no inline `style={{}}` unless absolutely required

## Example Task
> "Improve the suppliers page to use a card grid instead of a table on mobile"

```tsx
// Use responsive DataTable or switch to card layout below lg breakpoint
<div className="hidden lg:block">
  <DataTable columns={columns} data={suppliers} />
</div>
<div className="block lg:hidden space-y-3">
  {suppliers.map(s => <SupplierCard key={s.id} supplier={s} />)}
</div>
```
