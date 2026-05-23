'use client';

import { useSyncExternalStore } from 'react';

const subscribe = () => () => undefined;

/** true หลัง hydrate — ใช้ก่อนอ่าน session/localStorage ใน render */
export function useClientHydrated(): boolean {
  return useSyncExternalStore(subscribe, () => true, () => false);
}
