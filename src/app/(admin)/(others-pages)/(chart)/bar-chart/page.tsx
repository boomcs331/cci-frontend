import BarChartOne from "@/components/charts/bar/BarChartOne";
import { PageContainer, PageHeader, ContentCard } from "@/components/shared";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Next.js Bar Chart | TailAdmin - Next.js Dashboard Template",
  description:
    "This is Next.js Bar Chart page for TailAdmin - Next.js Tailwind CSS Admin Dashboard Template",
};

export default function page() {
  return (
    <PageContainer>
      <PageHeader
        title="Bar Chart"
        description="Bar chart visualization examples"
      />
      <div className="space-y-6">
        <ContentCard title="Bar Chart 1">
          <BarChartOne />
        </ContentCard>
      </div>
    </PageContainer>
  );
}
