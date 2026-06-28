# PC (Production Control) Module

Business logic library for Production Control (PC) — material income/outcome validation, error handling, and field utilities.

## Purpose

This module encapsulates all PC-specific business logic that was previously scattered across page components. It provides:
- Field validation (PO number, manufacturing date)
- Error code catalog and message mapping
- API error resolution with Thai message translation
- Input sanitization
- Toast/alert helpers

## File Structure

| File | Purpose |
|------|---------|
| `constants.ts` | PO number validation patterns (regex, max length) |
| `error-catalog.ts` | Error codes and fallback Thai messages (sync with backend) |
| `client-field-validation.ts` | Client-side validation logic (returns error codes) |
| `field-errors.ts` | Maps field + error code to Thai messages |
| `po-no-field.ts` | PO number specific helpers (validation, sanitization, paste handling) |
| `alerts.ts` | Toast/alert payload builders |
| `resolve-api-error.ts` | Parses API error bodies, translates English stock messages to Thai |
| `input-sanitizers.ts` | Input sanitization (strips Thai, non-printable chars) |
| `translate-stock-message.ts` | Translates legacy English stock messages to Thai |
| `index.ts` | Barrel export (import from `@/lib/pc`) |

## Usage

### Import

```typescript
import {
  // Validation
  getPoNoErrorMessage,
  isPoNoValid,
  applyPoNoInput,

  // Error handling
  pcErrorFromApiBody,
  pcConnectionError,
  pcSuccess,

  // Constants (if needed)
  PO_NO_MAX_LENGTH,
  PcErrorCode,
} from '@/lib/pc';
```

### PO Number Validation

```typescript
import { getPoNoErrorMessage } from '@/lib/pc';

const poNo = 'PO123';
const error = getPoNoErrorMessage(poNo);
if (error) {
  // Show error: error contains Thai message
  showToast({ variant: 'error', title: error });
}
```

### API Error Handling

```typescript
import { pcErrorFromApiBody } from '@/lib/pc';

const response = await apiFetch('/materials/transactions/receive', { ... });
if (!response.ok) {
  const body = await response.json();
  const alert = pcErrorFromApiBody(body);
  showToast(alert); // Shows Thai error message
}
```

### Input Sanitization (Typing)

```typescript
import { applyPoNoInput } from '@/lib/pc';

const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const sanitized = applyPoNoInput(e.target.value);
  setPoNo(sanitized); // Auto-strips Thai and non-printable chars
};
```

### Paste Handling

```typescript
import { mergePoNoPaste } from '@/lib/pc';

const handlePaste = (e: React.ClipboardEvent) => {
  e.preventDefault();
  const current = poNo;
  const clipboard = e.clipboardData.getData('text');
  setPoNo(mergePoNoPaste(current, clipboard));
};
```

## Error Codes

Error codes are defined in `error-catalog.ts` and must match backend codes:

```typescript
PcErrorCode.PC_PO_NO_REQUIRED
PcErrorCode.PC_PO_NO_INVALID
PcErrorCode.PC_PO_NO_TOO_LONG
PcErrorCode.PC_MFG_DATE_REQUIRED
PcErrorCode.PC_MFG_DATE_INVALID
PcErrorCode.PC_MFG_DATE_FUTURE
PcErrorCode.PC_MATERIAL_REQUIRED
PcErrorCode.PC_QUANTITY_INVALID
PcErrorCode.PC_MATERIAL_NOT_FOUND
PcErrorCode.PC_INSUFFICIENT_STOCK
```

## Backend Sync

When adding new error codes:
1. Add to `PcErrorCode` in `error-catalog.ts`
2. Add Thai fallback message to `PC_ERROR_FALLBACK_MESSAGES`
3. Ensure backend has matching code in `cci-backend/src/shared/errors/pc-error.codes.ts`

## Notes

- All messages are in Thai
- Thai input is automatically stripped from PO number fields
- Stock messages from legacy API (English) are auto-translated to Thai
- This module is domain-specific — do not add non-PC logic here
