---
name: backend-api
description: Add, modify, or consume backend API endpoints in the CCI frontend. Use when creating new service functions, updating API calls, or integrating new backend features.
---

# Backend API Skill

## Purpose
Connect the frontend to new or modified NestJS backend endpoints safely and consistently.

## When to Use
- Adding a new API call to an existing or new endpoint
- Creating or extending a service file in `src/services/`
- Handling new response shapes from the backend
- Adding new query parameters or request payloads

## Workflow

1. **Read** `.project-ai/api-map.md` — find the endpoint or confirm it's new
2. **Read** `.project-ai/domain-rules.md` — understand response envelope format
3. **Identify** the right service file in `src/services/`
4. **Add** the function using the **object pattern** with `apiFetchJson`
5. **Add types** to `src/types/<domain>.ts` if new shapes needed
6. **Export** from `src/services/index.ts` barrel if new service
7. **Update** `.project-ai/api-map.md` with the new endpoint

## Checklist
- [ ] Uses `apiFetch` or `apiFetchJson` — no direct `fetch()`
- [ ] Object pattern in service file
- [ ] Types defined in `src/types/*` — no inline interfaces
- [ ] `try/catch` if called directly from a component
- [ ] Handles both response envelope formats (see domain-rules.md §9)
- [ ] Auth headers attached automatically by `apiFetch`
- [ ] New endpoint documented in `.project-ai/api-map.md`

## Constraints
- Never hardcode `http://localhost:3006` — use `apiFetch(endpoint)` only
- Never change existing endpoint paths (backward compatibility)
- Never remove error handling from existing service functions
- Never bypass auth on protected endpoints

## Example Task
> "Add a service function to fetch production lot history by lot ID"

```typescript
// src/services/productionOrdersService.ts
export const productionOrdersService = {
  // ...existing functions...
  getLotHistory: async (lotId: number) =>
    apiFetchJson<ApiResponse<LotHistoryRow[]>>(`/production/lots/${lotId}/history`),
};
```
