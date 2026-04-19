"use client";

import { useEffect } from "react";

let started = false;

export default function MswLoader() {
  useEffect(() => {
    if (started) return;
    if (process.env.NEXT_PUBLIC_MOCK_API !== "1") return;

    started = true;

    // Dynamically import to avoid bundling MSW in production if not used.
    void import("./browser").then(({ worker }) => worker.start({ quiet: true }));
  }, []);

  return null;
}

