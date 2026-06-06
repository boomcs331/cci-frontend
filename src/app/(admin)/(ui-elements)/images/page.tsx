import { PageContainer, PageHeader, ContentCard } from "@/components/shared";
import ResponsiveImage from "@/components/ui/images/ResponsiveImage";
import ThreeColumnImageGrid from "@/components/ui/images/ThreeColumnImageGrid";
import TwoColumnImageGrid from "@/components/ui/images/TwoColumnImageGrid";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Next.js Images | TailAdmin - Next.js Dashboard Template",
  description:
    "This is Next.js Images page for TailAdmin - Next.js Tailwind CSS Admin Dashboard Template",
  // other metadata
};

export default function Images() {
  return (
    <PageContainer>
      <PageHeader
        title="Images"
        description="Image component examples with different layouts"
      />
      <div className="space-y-5 sm:space-y-6">
        <ContentCard title="Responsive image">
          <ResponsiveImage />
        </ContentCard>
        <ContentCard title="Image in 2 Grid">
          <TwoColumnImageGrid />
        </ContentCard>
        <ContentCard title="Image in 3 Grid">
          <ThreeColumnImageGrid />
        </ContentCard>
      </div>
    </PageContainer>
  );
}
