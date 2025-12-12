import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Edit Material | TailAdmin - Next.js Dashboard Template",
  description: "Edit and modify existing material components",
};

export default function EditMaterialPage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Edit Material" />
      
      <div className="rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12">
        <div className="mx-auto w-full max-w-[630px] text-center">
          <h3 className="mb-4 font-semibold text-gray-800 text-theme-xl dark:text-white/90 sm:text-2xl">
            Edit Material Components
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 sm:text-base">
            This is the Edit Material page from the Productions → Material Management menu.
            You can modify and update existing material components here.
          </p>
        </div>
      </div>
    </div>
  );
}