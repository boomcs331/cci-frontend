import { PageContainer, PageHeader, ContentCard } from "@/components/shared";
import Alert from "@/components/ui/alert/Alert";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Next.js Alerts | TailAdmin - Next.js Dashboard Template",
  description:
    "This is Next.js Alerts page for TailAdmin - Next.js Tailwind CSS Admin Dashboard Template",
  // other metadata
};

export default function Alerts() {
  return (
    <PageContainer>
      <PageHeader
        title="Alerts"
        description="Alert component examples for different message types"
      />
      <div className="space-y-5 sm:space-y-6">
        <ContentCard title="Success Alert">
          <Alert
            variant="success"
            title="Success Message"
            message="Be cautious when performing this action."
            showLink={true}
            linkHref="/"
            linkText="Learn more"
          />
          <Alert
            variant="success"
            title="Success Message"
            message="Be cautious when performing this action."
            showLink={false}
          />
        </ContentCard>
        <ContentCard title="Warning Alert">
          <Alert
            variant="warning"
            title="Warning Message"
            message="Be cautious when performing this action."
            showLink={true}
            linkHref="/"
            linkText="Learn more"
          />
          <Alert
            variant="warning"
            title="Warning Message"
            message="Be cautious when performing this action."
            showLink={false}
          />
        </ContentCard>
        <ContentCard title="Error Alert">
          <Alert
            variant="error"
            title="Error Message"
            message="Be cautious when performing this action."
            showLink={true}
            linkHref="/"
            linkText="Learn more"
          />
          <Alert
            variant="error"
            title="Error Message"
            message="Be cautious when performing this action."
            showLink={false}
          />
        </ContentCard>
        <ContentCard title="Info Alert">
          <Alert
            variant="info"
            title="Info Message"
            message="Be cautious when performing this action."
            showLink={true}
            linkHref="/"
            linkText="Learn more"
          />
          <Alert
            variant="info"
            title="Info Message"
            message="Be cautious when performing this action."
            showLink={false}
          />
        </ContentCard>
      </div>
    </PageContainer>
  );
}
