"use client";

import React from "react";

const SteelMetalsPage: React.FC = () => {
  return (
    <div className="mx-auto max-w-7xl">
      <div className="rounded-lg bg-white p-6 shadow-theme-sm dark:bg-gray-900">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Steel & Metals Inventory
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 sm:text-base">
            Manage steel and metal materials inventory. Track grades, specifications, 
            and availability for production requirements.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          {/* Steel Inventory Cards */}
          <div className="material-card rounded-lg border border-gray-200 p-4 dark:border-gray-800">
            <div className="mb-3">
              <h3 className="font-medium text-gray-900 dark:text-white">Carbon Steel A36</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Structural Grade</p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Available:</span>
                <span className="font-medium text-gray-900 dark:text-white">2,450 kg</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Reserved:</span>
                <span className="font-medium text-yellow-600 dark:text-yellow-400">850 kg</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Status:</span>
                <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/20 dark:text-green-400">
                  In Stock
                </span>
              </div>
            </div>
            <button className="mt-3 w-full material-btn-secondary rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300">
              View Details
            </button>
          </div>

          <div className="material-card rounded-lg border border-gray-200 p-4 dark:border-gray-800">
            <div className="mb-3">
              <h3 className="font-medium text-gray-900 dark:text-white">Stainless Steel 304</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Corrosion Resistant</p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Available:</span>
                <span className="font-medium text-gray-900 dark:text-white">1,200 kg</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Reserved:</span>
                <span className="font-medium text-yellow-600 dark:text-yellow-400">300 kg</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Status:</span>
                <span className="inline-flex items-center rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-800 dark:bg-orange-900/20 dark:text-orange-400">
                  Low Stock
                </span>
              </div>
            </div>
            <button className="mt-3 w-full material-btn-secondary rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300">
              View Details
            </button>
          </div>

          <div className="material-card rounded-lg border border-gray-200 p-4 dark:border-gray-800">
            <div className="mb-3">
              <h3 className="font-medium text-gray-900 dark:text-white">Aluminum 6061-T6</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Heat Treated</p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Available:</span>
                <span className="font-medium text-gray-900 dark:text-white">3,800 kg</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Reserved:</span>
                <span className="font-medium text-yellow-600 dark:text-yellow-400">1,200 kg</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Status:</span>
                <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/20 dark:text-green-400">
                  In Stock
                </span>
              </div>
            </div>
            <button className="mt-3 w-full material-btn-secondary rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300">
              View Details
            </button>
          </div>

          <div className="material-card rounded-lg border border-gray-200 p-4 dark:border-gray-800">
            <div className="mb-3">
              <h3 className="font-medium text-gray-900 dark:text-white">Copper C101</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Electrical Grade</p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Available:</span>
                <span className="font-medium text-gray-900 dark:text-white">450 kg</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Reserved:</span>
                <span className="font-medium text-yellow-600 dark:text-yellow-400">200 kg</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Status:</span>
                <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900/20 dark:text-red-400">
                  Critical
                </span>
              </div>
            </div>
            <button className="mt-3 w-full material-btn-primary rounded-lg bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600">
              Reorder Now
            </button>
          </div>
        </div>

        {/* Material Specifications Table */}
        <div className="mt-8">
          <h3 className="mb-4 text-lg font-medium text-gray-900 dark:text-white">
            Material Specifications
          </h3>
          <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Material
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Grade/Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Dimensions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Unit Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Supplier
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-800 dark:bg-gray-900">
                <tr>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                    Carbon Steel Sheet
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    A36
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    2000x1000x2mm
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    $2.45/kg
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    Steel Corp Ltd.
                  </td>
                </tr>
                <tr>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                    Stainless Steel Rod
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    304
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    Ø20mm x 3000mm
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    $8.90/kg
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    Premium Metals Inc.
                  </td>
                </tr>
                <tr>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                    Aluminum Plate
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    6061-T6
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    1500x1000x10mm
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    $4.20/kg
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    Aluminum Solutions
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-wrap gap-3">
          <button className="material-btn-primary rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600">
            Add New Material
          </button>
          <button className="material-btn-secondary rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300">
            Export Inventory
          </button>
          <button className="material-btn-secondary rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300">
            Generate Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default SteelMetalsPage;