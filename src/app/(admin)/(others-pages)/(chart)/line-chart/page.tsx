import LineChartOne from "@/components/charts/line/LineChartOne";
import { PageContainer, PageHeader, ContentCard } from "@/components/shared";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Next.js Line Chart | TailAdmin - Next.js Dashboard Template",
  description:
    "This is Next.js Line Chart page for TailAdmin - Next.js Tailwind CSS Admin Dashboard Template",
};
export default function LineChart() {
  return (
    <PageContainer>
      <PageHeader
        title="Line Chart"
        description="Line chart visualization examples"
      />
      <div className="space-y-6">
        <ContentCard title="Line Chart 1">
          <LineChartOne />
        </ContentCard>
      </div>
    </PageContainer>
  );
}
