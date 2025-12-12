import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Material Design Components | TailAdmin - Next.js Dashboard Template",
  description: "Material Design Components showcase with modern UI elements",
};

export default function BlankPage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Material Design Components" />
      
      {/* Hero Section */}
      <div className="mb-8 rounded-2xl border border-gray-200 bg-gradient-to-br from-brand-50 to-blue-light-50 px-6 py-8 dark:border-gray-800 dark:from-brand-500/10 dark:to-blue-light-500/10">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-4 inline-flex items-center rounded-full bg-brand-100 px-4 py-2 text-sm font-medium text-brand-700 dark:bg-brand-500/20 dark:text-brand-400">
            <span className="mr-2 h-2 w-2 rounded-full bg-brand-500"></span>
            Material Design System
          </div>
          <h1 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
            Material Design Components
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Modern, accessible, and beautiful UI components following Material Design principles
          </p>
        </div>
      </div>

      {/* Material Cards Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        
        {/* Elevated Card */}
        <div className="material-card group cursor-pointer rounded-xl border border-gray-200 bg-white p-6 transition-all duration-300 hover:shadow-theme-lg dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
            Elevated Card
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Material Design elevation with hover effects and smooth transitions
          </p>
          <div className="mt-4 flex items-center text-sm font-medium text-brand-600 dark:text-brand-400">
            Learn more
            <svg className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>

        {/* Interactive Card */}
        <div className="material-card-interactive group cursor-pointer rounded-xl border border-gray-200 bg-white p-6 transition-all duration-300 hover:border-brand-300 hover:shadow-theme-lg dark:border-gray-800 dark:bg-gray-900 dark:hover:border-brand-600">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-success-100 text-success-600 dark:bg-success-500/20 dark:text-success-400">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
            Interactive Card
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Hover effects with border color changes and enhanced shadows
          </p>
          <div className="mt-4 flex items-center text-sm font-medium text-success-600 dark:text-success-400">
            Explore
            <svg className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>

        {/* Gradient Card */}
        <div className="material-card-gradient group cursor-pointer rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 p-6 text-white transition-all duration-300 hover:from-orange-600 hover:to-orange-700 hover:shadow-theme-lg">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-white/20 text-white">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <h3 className="mb-2 text-lg font-semibold">
            Gradient Card
          </h3>
          <p className="text-sm text-white/90">
            Beautiful gradient backgrounds with hover state transitions
          </p>
          <div className="mt-4 flex items-center text-sm font-medium">
            View details
            <svg className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>

      </div>

      {/* Material Buttons Section */}
      <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="mb-6 text-xl font-semibold text-gray-900 dark:text-white">
          Material Design Buttons
        </h2>
        <div className="flex flex-wrap gap-4">
          
          {/* Primary Button */}
          <button className="material-btn-primary inline-flex items-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:bg-brand-600 hover:shadow-theme-md focus:outline-none focus:ring-4 focus:ring-brand-500/20">
            <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Primary Action
          </button>

          {/* Secondary Button */}
          <button className="material-btn-secondary inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-all duration-200 hover:bg-gray-50 hover:shadow-theme-sm focus:outline-none focus:ring-4 focus:ring-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
            <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            Secondary
          </button>

          {/* Success Button */}
          <button className="material-btn-success inline-flex items-center rounded-lg bg-success-500 px-4 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:bg-success-600 hover:shadow-theme-md focus:outline-none focus:ring-4 focus:ring-success-500/20">
            <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Success
          </button>

          {/* Warning Button */}
          <button className="material-btn-warning inline-flex items-center rounded-lg bg-warning-500 px-4 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:bg-warning-600 hover:shadow-theme-md focus:outline-none focus:ring-4 focus:ring-warning-500/20">
            <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            Warning
          </button>

          {/* Floating Action Button */}
          <button className="material-fab flex h-12 w-12 items-center justify-center rounded-full bg-brand-500 text-white shadow-theme-lg transition-all duration-200 hover:bg-brand-600 hover:shadow-theme-xl focus:outline-none focus:ring-4 focus:ring-brand-500/20">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>

        </div>
      </div>

      {/* Material Form Elements */}
      <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="mb-6 text-xl font-semibold text-gray-900 dark:text-white">
          Material Form Elements
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          
          {/* Material Input */}
          <div className="material-input-group">
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Material Input
            </label>
            <div className="relative">
              <input
                type="text"
                className="material-input w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 transition-all duration-200 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-brand-400"
                placeholder="Enter your text here..."
              />
            </div>
          </div>

          {/* Material Select */}
          <div className="material-select-group">
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Material Select
            </label>
            <select className="material-select w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 transition-all duration-200 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-brand-400">
              <option>Choose an option</option>
              <option>Option 1</option>
              <option>Option 2</option>
              <option>Option 3</option>
            </select>
          </div>

        </div>
      </div>

      {/* Material Progress & Loading */}
      <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="mb-6 text-xl font-semibold text-gray-900 dark:text-white">
          Material Progress & Loading
        </h2>
        
        {/* Progress Bars */}
        <div className="mb-6 space-y-4">
          <div>
            <div className="mb-2 flex justify-between text-sm">
              <span className="text-gray-700 dark:text-gray-300">Progress</span>
              <span className="text-gray-500 dark:text-gray-400">75%</span>
            </div>
            <div className="material-progress h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
              <div className="material-progress-bar h-2 rounded-full bg-brand-500" style={{width: '75%'}}></div>
            </div>
          </div>
          
          <div>
            <div className="mb-2 flex justify-between text-sm">
              <span className="text-gray-700 dark:text-gray-300">Success</span>
              <span className="text-gray-500 dark:text-gray-400">100%</span>
            </div>
            <div className="material-progress h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
              <div className="material-progress-bar h-2 rounded-full bg-success-500" style={{width: '100%'}}></div>
            </div>
          </div>
        </div>

        {/* Loading Spinner */}
        <div className="flex items-center space-x-4">
          <div className="material-spinner h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-brand-500 dark:border-gray-700 dark:border-t-brand-400"></div>
          <span className="text-sm text-gray-600 dark:text-gray-400">Loading...</span>
        </div>
      </div>

    </div>
  );
}
