"use client";

import React from "react";

const MaterialRequirementsPage: React.FC = () => {
  return (
    <div className="mx-auto max-w-7xl">
      <div className="rounded-lg bg-white p-6 shadow-theme-sm dark:bg-gray-900">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Material Requirements Planning
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 sm:text-base">
            Plan and manage material requirements for production processes. 
            Calculate material needs based on production schedules and inventory levels.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Current Requirements */}
          <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-800">
            <h3 className="mb-4 text-lg font-medium text-gray-900 dark:text-white">
              Current Requirements
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg dark:bg-gray-800">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Steel Sheets</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Grade A36, 2mm thickness</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900 dark:text-white">2,500 kg</p>
                  <p className="text-sm text-orange-600 dark:text-orange-400">Low Stock</p>
                </div>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg dark:bg-gray-800">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Aluminum Rods</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">6061-T6, 25mm diameter</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900 dark:text-white">1,200 pcs</p>
                  <p className="text-sm text-green-600 dark:text-green-400">In Stock</p>
                </div>
              </div>

              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg dark:bg-gray-800">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Plastic Pellets</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">ABS, Black color</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900 dark:text-white">800 kg</p>
                  <p className="text-sm text-red-600 dark:text-red-400">Critical</p>
                </div>
              </div>
            </div>
          </div>

          {/* Upcoming Requirements */}
          <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-800">
            <h3 className="mb-4 text-lg font-medium text-gray-900 dark:text-white">
              Upcoming Requirements (Next 7 Days)
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg dark:bg-blue-900/20">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Copper Wire</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Due: Dec 15, 2024</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900 dark:text-white">500 m</p>
                  <p className="text-sm text-blue-600 dark:text-blue-400">Planned</p>
                </div>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg dark:bg-yellow-900/20">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Rubber Gaskets</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Due: Dec 18, 2024</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900 dark:text-white">2,000 pcs</p>
                  <p className="text-sm text-yellow-600 dark:text-yellow-400">Pending</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-wrap gap-3">
          <button className="material-btn-primary rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2">
            Generate MRP Report
          </button>
          <button className="material-btn-secondary rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
            Export Requirements
          </button>
          <button className="material-btn-secondary rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
            Update Forecasts
          </button>
        </div>
      </div>
    </div>
  );
};

export default MaterialRequirementsPage;