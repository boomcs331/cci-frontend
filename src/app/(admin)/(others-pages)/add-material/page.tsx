import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Add Material Components | TailAdmin - Next.js Dashboard Template",
  description: "Add and manage material design components with interactive forms",
};

export default function AddMaterialPage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Add Material Components" />
      
      {/* Header Section */}
      <div className="mb-8 rounded-2xl border border-gray-200 bg-gradient-to-r from-brand-50 via-blue-light-50 to-brand-50 px-6 py-8 dark:border-gray-800 dark:from-brand-500/10 dark:via-blue-light-500/10 dark:to-brand-500/10">
        <div className="mx-auto max-w-4xl">
          <div className="mb-4 inline-flex items-center rounded-full bg-brand-100 px-4 py-2 text-sm font-medium text-brand-700 dark:bg-brand-500/20 dark:text-brand-400">
            <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Material Design
          </div>
          <h1 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
            Add Material Components
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Create and customize material design components with interactive forms and real-time preview
          </p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        
        {/* Form Section */}
        <div className="space-y-6">
          
          {/* Component Creation Form */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
            <h2 className="mb-6 flex items-center text-xl font-semibold text-gray-900 dark:text-white">
              <svg className="mr-3 h-6 w-6 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
              </svg>
              Create Component
            </h2>
            
            <form className="space-y-6">
              
              {/* Component Type */}
              <div className="material-input-group">
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Component Type
                </label>
                <select className="material-select w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 transition-all duration-200 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-brand-400">
                  <option value="">Select component type</option>
                  <option value="button">Material Button</option>
                  <option value="card">Material Card</option>
                  <option value="input">Material Input</option>
                  <option value="chip">Material Chip</option>
                  <option value="fab">Floating Action Button</option>
                  <option value="progress">Progress Indicator</option>
                </select>
              </div>

              {/* Component Name */}
              <div className="material-input-group">
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Component Name
                </label>
                <input
                  type="text"
                  className="material-input w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 transition-all duration-200 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-brand-400"
                  placeholder="Enter component name..."
                />
              </div>

              {/* Color Scheme */}
              <div className="material-input-group">
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Color Scheme
                </label>
                <div className="grid grid-cols-4 gap-3">
                  <button type="button" className="material-color-option flex h-12 w-full items-center justify-center rounded-lg bg-brand-500 text-white transition-all duration-200 hover:bg-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-500/20">
                    <span className="text-xs font-medium">Primary</span>
                  </button>
                  <button type="button" className="material-color-option flex h-12 w-full items-center justify-center rounded-lg bg-success-500 text-white transition-all duration-200 hover:bg-success-600 focus:outline-none focus:ring-4 focus:ring-success-500/20">
                    <span className="text-xs font-medium">Success</span>
                  </button>
                  <button type="button" className="material-color-option flex h-12 w-full items-center justify-center rounded-lg bg-warning-500 text-white transition-all duration-200 hover:bg-warning-600 focus:outline-none focus:ring-4 focus:ring-warning-500/20">
                    <span className="text-xs font-medium">Warning</span>
                  </button>
                  <button type="button" className="material-color-option flex h-12 w-full items-center justify-center rounded-lg bg-error-500 text-white transition-all duration-200 hover:bg-error-600 focus:outline-none focus:ring-4 focus:ring-error-500/20">
                    <span className="text-xs font-medium">Error</span>
                  </button>
                </div>
              </div>

              {/* Component Properties */}
              <div className="material-input-group">
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Properties
                </label>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input type="checkbox" className="material-checkbox h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800" />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Enable elevation</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="material-checkbox h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800" />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Add ripple effect</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="material-checkbox h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800" />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Rounded corners</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="material-checkbox h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800" />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Animated transitions</span>
                  </label>
                </div>
              </div>

              {/* Description */}
              <div className="material-input-group">
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Description
                </label>
                <textarea
                  rows={4}
                  className="material-input w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 transition-all duration-200 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-brand-400"
                  placeholder="Describe your component..."
                ></textarea>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 pt-4">
                <button
                  type="submit"
                  className="material-btn-primary inline-flex items-center rounded-lg bg-brand-500 px-6 py-3 text-sm font-medium text-white transition-all duration-200 hover:bg-brand-600 hover:shadow-theme-md focus:outline-none focus:ring-4 focus:ring-brand-500/20"
                >
                  <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create Component
                </button>
                <button
                  type="button"
                  className="material-btn-secondary inline-flex items-center rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 transition-all duration-200 hover:bg-gray-50 hover:shadow-theme-sm focus:outline-none focus:ring-4 focus:ring-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  Preview
                </button>
                <button
                  type="reset"
                  className="material-btn-secondary inline-flex items-center rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 transition-all duration-200 hover:bg-gray-50 hover:shadow-theme-sm focus:outline-none focus:ring-4 focus:ring-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Reset
                </button>
              </div>

            </form>
          </div>

          {/* Quick Actions */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <button className="material-quick-action flex items-center rounded-lg border border-gray-200 p-4 text-left transition-all duration-200 hover:border-brand-300 hover:bg-brand-50 dark:border-gray-700 dark:hover:border-brand-600 dark:hover:bg-brand-500/10">
                <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">Templates</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Pre-built components</div>
                </div>
              </button>
              <button className="material-quick-action flex items-center rounded-lg border border-gray-200 p-4 text-left transition-all duration-200 hover:border-success-300 hover:bg-success-50 dark:border-gray-700 dark:hover:border-success-600 dark:hover:bg-success-500/10">
                <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-lg bg-success-100 text-success-600 dark:bg-success-500/20 dark:text-success-400">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">Import</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Load from file</div>
                </div>
              </button>
            </div>
          </div>

        </div>

        {/* Preview Section */}
        <div className="space-y-6">
          
          {/* Live Preview */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
            <h2 className="mb-6 flex items-center text-xl font-semibold text-gray-900 dark:text-white">
              <svg className="mr-3 h-6 w-6 text-success-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Live Preview
            </h2>
            
            <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center dark:border-gray-600 dark:bg-gray-800">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">
                <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
                Component Preview
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Your component will appear here as you build it
              </p>
              
              {/* Sample Preview Components */}
              <div className="mt-6 space-y-4">
                <button className="material-btn-primary inline-flex items-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:bg-brand-600 hover:shadow-theme-md">
                  <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Sample Button
                </button>
                
                <div className="material-card inline-block rounded-lg border border-gray-200 bg-white p-4 shadow-theme-sm dark:border-gray-700 dark:bg-gray-800">
                  <h4 className="mb-2 text-sm font-medium text-gray-900 dark:text-white">Sample Card</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">This is a preview card component</p>
                </div>
              </div>
            </div>
          </div>

          {/* Component Library */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Component Library
            </h3>
            <div className="space-y-3">
              
              <div className="flex items-center justify-between rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                <div className="flex items-center">
                  <div className="mr-3 h-8 w-8 rounded bg-brand-100 dark:bg-brand-500/20"></div>
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">Primary Button</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Material design button</div>
                  </div>
                </div>
                <button className="text-brand-600 hover:text-brand-700 dark:text-brand-400">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                <div className="flex items-center">
                  <div className="mr-3 h-8 w-8 rounded bg-success-100 dark:bg-success-500/20"></div>
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">Success Card</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Elevated card component</div>
                  </div>
                </div>
                <button className="text-brand-600 hover:text-brand-700 dark:text-brand-400">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                <div className="flex items-center">
                  <div className="mr-3 h-8 w-8 rounded bg-warning-100 dark:bg-warning-500/20"></div>
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">Input Field</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Material input with focus</div>
                  </div>
                </div>
                <button className="text-brand-600 hover:text-brand-700 dark:text-brand-400">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              </div>

            </div>
          </div>

        </div>

      </div>

    </div>
  );
}