---
name: database
description: Work with database-related concerns from the frontend perspective: types, API response shapes, and database-map documentation. Use when new data models are introduced or existing shapes change.
---

# Database Skill

## Purpose
Keep frontend types synchronized with backend database schemas and document data model changes.

## When to Use
- Backend adds a new table or column
- API response shape changes
- New relationship between entities
- Type definition needs updating in `src/types/*`
- `.project-ai/database-map.md` needs updating

## Important Note
The actual PostgreSQL database lives in the **NestJS backend** (separate repo).  
This skill covers the **frontend representation** of that schema via TypeScript types.

## Workflow

1. **Read** `.project-ai/database-map.md` — understand current schema
2. **Read** relevant `src/types/*.ts` file
3. **Identify** what changed in the API response (from backend team or API testing)
4. **Update** the TypeScript interface in `src/types/<domain>.ts`
5. **Update** any service functions using the changed type
6. **Update** `.project-ai/database-map.md` table definition
7. **Verify** no TypeScript errors: `pnpm build`

## Checklist
- [ ] Types updated in `src/types/<domain>.ts` — not in component files
- [ ] Optional fields marked with `?` if nullable from backend
- [ ] New enum values added as string union types
- [ ] Service return types updated to match new shape
- [ ] `.project-ai/database-map.md` updated with new columns/tables
- [ ] `pnpm build` passes with no type errors

## Constraints
- Never define data types in component or page files
- Never use `any` for unknown response shapes — use `unknown` and narrow
- Never assume non-null — mark optional fields as `field?: type`
- Never change existing field names in interfaces (breaks backward compatibility)
  - Add new optional fields instead

## Type Location Guide

| Domain | File |
|--------|------|
| Materials, Suppliers, Locations | `src/types/material.ts` |
| Receiving, Lots | `src/types/receiving.ts` |
| Users, Roles, Permissions | `src/types/user.ts` |
| Production Orders, Processes | `src/types/production.ts` |
| API response wrappers | `src/types/api.ts` |
| Common UI types | `src/types/common.ts` |
| Sales (inline in service) | `src/services/sales/salesOrderService.ts` |

## Example Task
> "Backend added a `note` field to the `Receiving` model"

```typescript
// src/types/receiving.ts
export interface Receiving {
  // ...existing fields...
  note?: string;  // ← add as optional
}
```
