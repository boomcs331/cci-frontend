import { PageContainer, PageHeader, ContentCard } from "@/components/shared";
import Button from "@/components/ui/button/Button";
import { BoxIcon } from "@/icons";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Next.js Buttons | TailAdmin - Next.js Dashboard Template",
  description:
    "This is Next.js Buttons page for TailAdmin - Next.js Tailwind CSS Admin Dashboard Template",
};

export default function Buttons() {
  return (
    <PageContainer>
      <PageHeader
        title="Buttons"
        description="Button component examples with different variants and icons"
      />
      <div className="space-y-5 sm:space-y-6">
        {/* Primary Button */}
        <ContentCard title="Primary Button">
          <div className="flex items-center gap-5">
            <Button size="sm" variant="primary">
              Button Text
            </Button>
            <Button size="md" variant="primary">
              Button Text
            </Button>
          </div>
        </ContentCard>
        {/* Primary Button with Start Icon */}
        <ContentCard title="Primary Button with Left Icon">
          <div className="flex items-center gap-5">
            <Button size="sm" variant="primary" startIcon={<BoxIcon />}>
              Button Text
            </Button>
            <Button size="md" variant="primary" startIcon={<BoxIcon />}>
              Button Text
            </Button>
          </div>
        </ContentCard>
        {/* Primary Button with Start Icon */}
        <ContentCard title="Primary Button with Right Icon">
          <div className="flex items-center gap-5">
            <Button size="sm" variant="primary" endIcon={<BoxIcon />}>
              Button Text
            </Button>
            <Button size="md" variant="primary" endIcon={<BoxIcon />}>
              Button Text
            </Button>
          </div>
        </ContentCard>
        {/* Outline Button */}
        <ContentCard title="Secondary Button">
          <div className="flex items-center gap-5">
            {/* Outline Button */}
            <Button size="sm" variant="outline">
              Button Text
            </Button>
            <Button size="md" variant="outline">
              Button Text
            </Button>
          </div>
        </ContentCard>
        {/* Outline Button with Start Icon */}
        <ContentCard title="Outline Button with Left Icon">
          <div className="flex items-center gap-5">
            <Button size="sm" variant="outline" startIcon={<BoxIcon />}>
              Button Text
            </Button>
            <Button size="md" variant="outline" startIcon={<BoxIcon />}>
              Button Text
            </Button>
          </div>
        </ContentCard>
        {/* Outline Button with Start Icon */}
        <ContentCard title="Outline Button with Right Icon">
          <div className="flex items-center gap-5">
            <Button size="sm" variant="outline" endIcon={<BoxIcon />}>
              Button Text
            </Button>
            <Button size="md" variant="outline" endIcon={<BoxIcon />}>
              Button Text
            </Button>
          </div>
        </ContentCard>
      </div>
    </PageContainer>
  );
}
