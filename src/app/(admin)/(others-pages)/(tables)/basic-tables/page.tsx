import { PageContainer, PageHeader, ContentCard } from "@/components/shared";
import BasicTableOne from "@/components/tables/BasicTableOne";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Next.js Basic Table | TailAdmin - Next.js Dashboard Template",
  description:
    "This is Next.js Basic Table  page for TailAdmin  Tailwind CSS Admin Dashboard Template",
  // other metadata
};

export default function BasicTables() {
  return (
    <PageContainer>
      <PageHeader
        title="Basic Table"
        description="Basic table component examples"
      />
      <div className="space-y-6">
        <ContentCard title="Basic Table 1">
          <BasicTableOne />
        </ContentCard>
      </div>
    </PageContainer>
  );
}
