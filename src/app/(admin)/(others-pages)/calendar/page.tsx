import Calendar from "@/components/calendar/Calendar";
import { PageContainer, PageHeader } from "@/components/shared";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Next.js Calender | TailAdmin - Next.js Dashboard Template",
  description:
    "This is Next.js Calender page for TailAdmin  Tailwind CSS Admin Dashboard Template",
  // other metadata
};
export default function page() {
  return (
    <PageContainer>
      <PageHeader
        title="Calendar"
        description="Calendar component for scheduling"
      />
      <Calendar />
    </PageContainer>
  );
}
