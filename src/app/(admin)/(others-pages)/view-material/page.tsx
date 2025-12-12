import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "View Material Components | TailAdmin - Next.js Dashboard Template",
  description: "Browse and explore material design components library",
};

export default function ViewMaterialPage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="View Material Components" />
      
      {/* Header Section */}
      <div className="mb-8 rounded-2xl border border-gray-200 bg-gradient-to-r from-blue-light-50 via-brand-50 to-blue-light-50 px-6 py-8 dark:border-gray-800 dark:from-blue-light-500/10 dark:via-brand-500/10 dark:to-blue-light-500/10">
        <div className="mx-auto max-w-4xl">
          <div className="mb-4 inline-flex items-center rounded-full bg-blue-light-100 px-4 py-2 text-sm font-medium text-blue-light-700 dark:bg-blue-light-500/20 dark:text-blue-light-400">
            <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Component Library
          </div>
          <h1 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
            Material Components Library
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Explore our comprehensive collection of material design components with live examples and code snippets
          </p>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-3">
            <button className="material-filter-btn active rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-brand-600">
              All Components
            </button>
            <button className="material-filter-btn rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-all duration-200 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
              Buttons
            </button>
            <button className="material-filter-btn rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-all duration-200 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
              Cards
            </button>
            <button className="material-filter-btn rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-all duration-200 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
              Inputs
            </button>
            <button className="material-filter-btn rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-all duration-200 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
              Navigation
            </button>
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="Search components..."
              className="material-search w-full rounded-lg border border-gray-300 bg-white pl-10 pr-4 py-2.5 text-sm text-gray-900 transition-all duration-200 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-brand-400 sm:w-64"
            />
            <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Components Grid */}
      <div className="grid gap-8 lg:grid-cols-2 xl:grid-cols-3">
        
        {/* Material Buttons */}
        <div className="material-component-card rounded-2xl border border-gray-200 bg-white p-6 transition-all duration-300 hover:shadow-theme-lg dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Material Buttons</h3>
            <span className="rounded-full bg-brand-100 px-2.5 py-1 text-xs font-medium text-brand-700 dark:bg-brand-500/20 dark:text-brand-400">
              Interactive
            </span>
          </div>
          <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
            Various button styles with ripple effects and hover states
          </p>
          
          {/* Button Examples */}
          <div className="mb-6 space-y-3">
            <button className="material-btn-primary w-full rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:bg-brand-600 hover:shadow-theme-md">
              Primary Button
            </button>
            <button className="material-btn-secondary w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-all duration-200 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
              Secondary Button
            </button>
            <button className="material-fab mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-500 text-white shadow-theme-lg transition-all duration-200 hover:bg-brand-600 hover:shadow-theme-xl">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <button className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
              View Code
            </button>
            <button className="text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
              Copy
            </button>
          </div>
        </div>

        {/* Material Cards */}
        <div className="material-component-card rounded-2xl border border-gray-200 bg-white p-6 transition-all duration-300 hover:shadow-theme-lg dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Material Cards</h3>
            <span className="rounded-full bg-success-100 px-2.5 py-1 text-xs font-medium text-success-700 dark:bg-success-500/20 dark:text-success-400">
              Layout
            </span>
          </div>
          <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
            Elevated cards with shadows and hover effects
          </p>
          
          {/* Card Examples */}
          <div className="mb-6 space-y-4">
            <div className="material-card rounded-lg border border-gray-200 bg-white p-4 shadow-theme-sm transition-all duration-300 hover:shadow-theme-md dark:border-gray-700 dark:bg-gray-800">
              <h4 className="mb-2 text-sm font-medium text-gray-900 dark:text-white">Basic Card</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">Simple card with elevation</p>
            </div>
            <div className="material-card-gradient rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 p-4 text-white">
              <h4 className="mb-2 text-sm font-medium">Gradient Card</h4>
              <p className="text-xs text-white/90">Card with gradient background</p>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <button className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
              View Code
            </button>
            <button className="text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
              Copy
            </button>
          </div>
        </div>

        {/* Material Inputs */}
        <div className="material-component-card rounded-2xl border border-gray-200 bg-white p-6 transition-all duration-300 hover:shadow-theme-lg dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Material Inputs</h3>
            <span className="rounded-full bg-warning-100 px-2.5 py-1 text-xs font-medium text-warning-700 dark:bg-warning-500/20 dark:text-warning-400">
              Forms
            </span>
          </div>
          <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
            Form inputs with focus states and animations
          </p>
          
          {/* Input Examples */}
          <div className="mb-6 space-y-4">
            <input
              type="text"
              placeholder="Material Input"
              className="material-input w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 transition-all duration-200 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-brand-400"
            />
            <select className="material-select w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 transition-all duration-200 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-brand-400">
              <option>Select Option</option>
              <option>Option 1</option>
              <option>Option 2</option>
            </select>
          </div>
          
          <div className="flex items-center justify-between">
            <button className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
              View Code
            </button>
            <button className="text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
              Copy
            </button>
          </div>
        </div>

        {/* Material Progress */}
        <div className="material-component-card rounded-2xl border border-gray-200 bg-white p-6 transition-all duration-300 hover:shadow-theme-lg dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Progress Indicators</h3>
            <span className="rounded-full bg-orange-100 px-2.5 py-1 text-xs font-medium text-orange-700 dark:bg-orange-500/20 dark:text-orange-400">
              Feedback
            </span>
          </div>
          <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
            Loading states and progress indicators
          </p>
          
          {/* Progress Examples */}
          <div className="mb-6 space-y-4">
            <div>
              <div className="mb-2 flex justify-between text-xs">
                <span className="text-gray-700 dark:text-gray-300">Progress</span>
                <span className="text-gray-500 dark:text-gray-400">75%</span>
              </div>
              <div className="material-progress h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                <div className="material-progress-bar h-2 rounded-full bg-brand-500" style={{width: '75%'}}></div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="material-spinner h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-brand-500 dark:border-gray-700 dark:border-t-brand-400"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Loading...</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <button className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
              View Code
            </button>
            <button className="text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
              Copy
            </button>
          </div>
        </div>

        {/* Material Navigation */}
        <div className="material-component-card rounded-2xl border border-gray-200 bg-white p-6 transition-all duration-300 hover:shadow-theme-lg dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Navigation</h3>
            <span className="rounded-full bg-purple-100 px-2.5 py-1 text-xs font-medium text-purple-700 dark:bg-purple-500/20 dark:text-purple-400">
              Navigation
            </span>
          </div>
          <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
            Menu items with active states and animations
          </p>
          
          {/* Navigation Examples */}
          <div className="mb-6 space-y-2">
            <div className="menu-item menu-item-active menu-active-indicator rounded-lg px-3 py-2">
              <span className="menu-item-icon-active mr-3">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                </svg>
              </span>
              <span className="text-sm font-medium">Active Menu Item</span>
            </div>
            <div className="menu-item menu-item-inactive rounded-lg px-3 py-2">
              <span className="menu-item-icon-inactive mr-3">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </span>
              <span className="text-sm font-medium">Menu Item</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <button className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
              View Code
            </button>
            <button className="text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
              Copy
            </button>
          </div>
        </div>

        {/* Material Chips */}
        <div className="material-component-card rounded-2xl border border-gray-200 bg-white p-6 transition-all duration-300 hover:shadow-theme-lg dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Material Chips</h3>
            <span className="rounded-full bg-pink-100 px-2.5 py-1 text-xs font-medium text-pink-700 dark:bg-pink-500/20 dark:text-pink-400">
              Selection
            </span>
          </div>
          <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
            Compact elements for selections and filters
          </p>
          
          {/* Chip Examples */}
          <div className="mb-6 flex flex-wrap gap-2">
            <span className="material-chip inline-flex items-center rounded-full bg-brand-100 px-3 py-1 text-xs font-medium text-brand-700 dark:bg-brand-500/20 dark:text-brand-400">
              Primary Chip
            </span>
            <span className="material-chip inline-flex items-center rounded-full bg-success-100 px-3 py-1 text-xs font-medium text-success-700 dark:bg-success-500/20 dark:text-success-400">
              <svg className="mr-1 h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Success
            </span>
            <span className="material-chip inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300">
              Neutral
              <button className="ml-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600">
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <button className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400">
              View Code
            </button>
            <button className="text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
              Copy
            </button>
          </div>
        </div>

      </div>

      {/* Load More */}
      <div className="mt-12 text-center">
        <button className="material-btn-secondary inline-flex items-center rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 transition-all duration-200 hover:bg-gray-50 hover:shadow-theme-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
          <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Load More Components
        </button>
      </div>

    </div>
  );
}