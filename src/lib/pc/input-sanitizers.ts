import { PO_NO_THAI_PATTERN } from './constants';

/** Strip Thai and non-printable ASCII while typing (keeps special characters). */
export function sanitizePoNoInput(value: string): string {
  return value
    .replace(PO_NO_THAI_PATTERN, '')
    .replace(/[^\x20-\x7E]/g, '');
}
