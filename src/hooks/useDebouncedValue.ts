import { useEffect, useState } from "react";

/**
 * คืนค่า `value` หลังหยุดเปลี่ยนเป็นเวลา `delayMs` — ใช้กับช่องค้นหาเพื่อไม่ยิง API ทุก keystroke
 */
export function useDebouncedValue<T>(value: T, delayMs = 400): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
