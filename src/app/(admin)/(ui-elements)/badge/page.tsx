import { PageContainer, PageHeader, ContentCard } from "@/components/shared";
import Badge from "@/components/ui/badge/Badge";
import { PlusIcon } from "@/icons";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Next.js Badge | TailAdmin - Next.js Dashboard Template",
  description:
    "This is Next.js Badge page for TailAdmin - Next.js Tailwind CSS Admin Dashboard Template",
  // other metadata
};

export default function BadgePage() {
  return (
    <PageContainer>
      <PageHeader
        title="Badges"
        description="Badge component examples with different variants and icons"
      />
      <div className="space-y-5 sm:space-y-6">
        <ContentCard title="With Light Background">
          <div className="flex flex-wrap gap-4 sm:items-center sm:justify-center">
            {/* Light Variant */}
            <Badge variant="light" color="primary">
              Primary
            </Badge>
            <Badge variant="light" color="success">
              Success
            </Badge>{" "}
            <Badge variant="light" color="error">
              Error
            </Badge>{" "}
            <Badge variant="light" color="warning">
              Warning
            </Badge>{" "}
            <Badge variant="light" color="info">
              Info
            </Badge>
            <Badge variant="light" color="light">
              Light
            </Badge>
            <Badge variant="light" color="dark">
              Dark
            </Badge>
          </div>
        </ContentCard>

        <ContentCard title="With Solid Background">
          <div className="flex flex-wrap gap-4 sm:items-center sm:justify-center">
            {/* Light Variant */}
            <Badge variant="solid" color="primary">
              Primary
            </Badge>
            <Badge variant="solid" color="success">
              Success
            </Badge>{" "}
            <Badge variant="solid" color="error">
              Error
            </Badge>{" "}
            <Badge variant="solid" color="warning">
              Warning
            </Badge>{" "}
            <Badge variant="solid" color="info">
              Info
            </Badge>
            <Badge variant="solid" color="light">
              Light
            </Badge>
            <Badge variant="solid" color="dark">
              Dark
            </Badge>
          </div>
        </ContentCard>

        <ContentCard title="Light Background with Left Icon">
          <div className="flex flex-wrap gap-4 sm:items-center sm:justify-center">
            <Badge variant="light" color="primary" startIcon={<PlusIcon />}>
              Primary
            </Badge>
            <Badge variant="light" color="success" startIcon={<PlusIcon />}>
              Success
            </Badge>{" "}
            <Badge variant="light" color="error" startIcon={<PlusIcon />}>
              Error
            </Badge>{" "}
            <Badge variant="light" color="warning" startIcon={<PlusIcon />}>
              Warning
            </Badge>{" "}
            <Badge variant="light" color="info" startIcon={<PlusIcon />}>
              Info
            </Badge>
            <Badge variant="light" color="light" startIcon={<PlusIcon />}>
              Light
            </Badge>
            <Badge variant="light" color="dark" startIcon={<PlusIcon />}>
              Dark
            </Badge>
          </div>
        </ContentCard>

        <ContentCard title="Solid Background with Left Icon">
          <div className="flex flex-wrap gap-4 sm:items-center sm:justify-center">
            <Badge variant="solid" color="primary" startIcon={<PlusIcon />}>
              Primary
            </Badge>
            <Badge variant="solid" color="success" startIcon={<PlusIcon />}>
              Success
            </Badge>{" "}
            <Badge variant="solid" color="error" startIcon={<PlusIcon />}>
              Error
            </Badge>{" "}
            <Badge variant="solid" color="warning" startIcon={<PlusIcon />}>
              Warning
            </Badge>{" "}
            <Badge variant="solid" color="info" startIcon={<PlusIcon />}>
              Info
            </Badge>
            <Badge variant="solid" color="light" startIcon={<PlusIcon />}>
              Light
            </Badge>
            <Badge variant="solid" color="dark" startIcon={<PlusIcon />}>
              Dark
            </Badge>
          </div>
        </ContentCard>

        <ContentCard title="Light Background with Right Icon">
          <div className="flex flex-wrap gap-4 sm:items-center sm:justify-center">
            <Badge variant="light" color="primary" endIcon={<PlusIcon />}>
              Primary
            </Badge>
            <Badge variant="light" color="success" endIcon={<PlusIcon />}>
              Success
            </Badge>{" "}
            <Badge variant="light" color="error" endIcon={<PlusIcon />}>
              Error
            </Badge>{" "}
            <Badge variant="light" color="warning" endIcon={<PlusIcon />}>
              Warning
            </Badge>{" "}
            <Badge variant="light" color="info" endIcon={<PlusIcon />}>
              Info
            </Badge>
            <Badge variant="light" color="light" endIcon={<PlusIcon />}>
              Light
            </Badge>
            <Badge variant="light" color="dark" endIcon={<PlusIcon />}>
              Dark
            </Badge>
          </div>
        </ContentCard>

        <ContentCard title="Solid Background with Right Icon">
          <div className="flex flex-wrap gap-4 sm:items-center sm:justify-center">
            <Badge variant="solid" color="primary" endIcon={<PlusIcon />}>
              Primary
            </Badge>
            <Badge variant="solid" color="success" endIcon={<PlusIcon />}>
              Success
            </Badge>{" "}
            <Badge variant="solid" color="error" endIcon={<PlusIcon />}>
              Error
            </Badge>{" "}
            <Badge variant="solid" color="warning" endIcon={<PlusIcon />}>
              Warning
            </Badge>{" "}
            <Badge variant="solid" color="info" endIcon={<PlusIcon />}>
              Info
            </Badge>
            <Badge variant="solid" color="light" endIcon={<PlusIcon />}>
              Light
            </Badge>
            <Badge variant="solid" color="dark" endIcon={<PlusIcon />}>
              Dark
            </Badge>
          </div>
        </ContentCard>
      </div>
    </PageContainer>
  );
}
