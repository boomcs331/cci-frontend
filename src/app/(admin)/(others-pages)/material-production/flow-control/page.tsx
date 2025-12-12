"use client";

import React from "react";

const MaterialFlowControlPage: React.FC = () => {
  return (
    <div className="mx-auto max-w-7xl">
      <div className="rounded-lg bg-white p-6 shadow-theme-sm dark:bg-gray-900">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Material Flow Control
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 sm:text-base">
            Monitor and control the flow of materials through production processes. 
            Track material movement from raw materials to finished products.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Material Flow Status */}
          <div className="lg:col-span-2">
            <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-800">
              <h3 className="mb-4 text-lg font-medium text-gray-900 dark:text-white">
                Production Flow Status
              </h3>
              
              {/* Flow Diagram */}
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border-l-4 border-green-500 dark:bg-green-900/20">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Raw Material Intake</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Station A1</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600 dark:text-green-400">Active</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">85% Capacity</p>
                  </div>
                </div>

                <div className="flex items-center justify-center">
                  <div className="w-0.5 h-8 bg-gray-300 dark:bg-gray-600"></div>
                </div>

                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500 dark:bg-blue-900/20">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Material Processing</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Station B1-B3</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-blue-600 dark:text-blue-400">Processing</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">72% Capacity</p>
                  </div>
                </div>

                <div className="flex items-center justify-center">
                  <div className="w-0.5 h-8 bg-gray-300 dark:bg-gray-600"></div>
                </div>

                <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-500 dark:bg-yellow-900/20">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Quality Control</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Station C1</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-yellow-600 dark:text-yellow-400">Queue</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">45% Capacity</p>
                  </div>
                </div>

                <div className="flex items-center justify-center">
                  <div className="w-0.5 h-8 bg-gray-300 dark:bg-gray-600"></div>
                </div>

                <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border-l-4 border-purple-500 dark:bg-purple-900/20">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Final Assembly</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Station D1-D2</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-purple-600 dark:text-purple-400">Active</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">90% Capacity</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Control Panel */}
          <div className="space-y-6">
            <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-800">
              <h3 className="mb-4 text-lg font-medium text-gray-900 dark:text-white">
                Flow Controls
              </h3>
              <div className="space-y-3">
                <button className="w-full material-btn-primary rounded-lg bg-green-500 px-4 py-2 text-sm font-medium text-white hover:bg-green-600">
                  Start Production Flow
                </button>
                <button className="w-full material-btn-warning rounded-lg bg-yellow-500 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-600">
                  Pause Flow
                </button>
                <button className="w-full material-btn-secondary rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300">
                  Emergency Stop
                </button>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-800">
              <h3 className="mb-4 text-lg font-medium text-gray-900 dark:text-white">
                Real-time Metrics
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Throughput</span>
                  <span className="font-medium text-gray-900 dark:text-white">245 units/hr</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Efficiency</span>
                  <span className="font-medium text-green-600 dark:text-green-400">87.3%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Bottleneck</span>
                  <span className="font-medium text-yellow-600 dark:text-yellow-400">Station C1</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Queue Time</span>
                  <span className="font-medium text-gray-900 dark:text-white">12.5 min</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="mt-6">
          <h3 className="mb-4 text-lg font-medium text-gray-900 dark:text-white">
            Recent Flow Activities
          </h3>
          <div className="rounded-lg border border-gray-200 dark:border-gray-800">
            <div className="divide-y divide-gray-200 dark:divide-gray-800">
              <div className="p-4 flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Material batch #MB-2024-1205 started processing</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Station B2 • 2 minutes ago</p>
                </div>
                <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/20 dark:text-green-400">
                  Active
                </span>
              </div>
              <div className="p-4 flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Quality check completed for batch #MB-2024-1204</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Station C1 • 8 minutes ago</p>
                </div>
                <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                  Completed
                </span>
              </div>
              <div className="p-4 flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Flow optimization applied to Station B1-B3</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">System • 15 minutes ago</p>
                </div>
                <span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800 dark:bg-purple-900/20 dark:text-purple-400">
                  Optimized
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaterialFlowControlPage;