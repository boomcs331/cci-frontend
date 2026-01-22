// Status constants

export const MATERIAL_STATUS = {
  ACTIVE: 'ACTIVE',
  USED_UP: 'USED_UP',
  PARTIAL_USED: 'PARTIAL_USED'
} as const;

export const STATUS_COLORS = {
  ACTIVE: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  USED_UP: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
  PARTIAL_USED: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
} as const;

export const STATUS_LABELS_TH = {
  ACTIVE: 'ใช้งานได้',
  USED_UP: 'ใช้หมดแล้ว',
  PARTIAL_USED: 'ใช้บางส่วน'
} as const;

export const STATUS_LABELS_EN = {
  ACTIVE: 'Active',
  USED_UP: 'Used Up',
  PARTIAL_USED: 'Partial Used'
} as const;

// Helper function
export function getStatusBadgeClass(status: string): string {
  return STATUS_COLORS[status as keyof typeof STATUS_COLORS] || STATUS_COLORS.ACTIVE;
}

export function getStatusLabel(status: string, lang: 'th' | 'en' = 'th'): string {
  const labels = lang === 'th' ? STATUS_LABELS_TH : STATUS_LABELS_EN;
  return labels[status as keyof typeof labels] || status;
}
