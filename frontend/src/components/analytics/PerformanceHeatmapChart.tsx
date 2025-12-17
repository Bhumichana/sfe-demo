'use client';

import React, { useState } from 'react';
import DetailModal from './DetailModal';

interface HeatmapData {
  day: string;
  territories: {
    [key: string]: number;
  };
}

interface PerformanceHeatmapChartProps {
  data: {
    heatmapData: HeatmapData[];
    territoryList: string[];
  };
  loading?: boolean;
}

const PerformanceHeatmapChart: React.FC<PerformanceHeatmapChartProps> = ({
  data,
  loading,
}) => {
  const [selectedCell, setSelectedCell] = useState<{
    territory: string;
    day: string;
    value: number;
  } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (loading) {
    return (
      <div className="w-full h-[400px] bg-gray-100 rounded-lg animate-pulse flex items-center justify-center">
        <span className="text-gray-500">Loading...</span>
      </div>
    );
  }

  if (!data || !data.heatmapData || data.heatmapData.length === 0) {
    return (
      <div className="w-full h-[400px] bg-gray-50 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 text-lg mb-2">No data available</p>
          <p className="text-gray-400 text-sm">Heatmap data will appear here</p>
        </div>
      </div>
    );
  }

  // Calculate min and max for color scaling
  const allValues = data.heatmapData.flatMap((day) =>
    Object.values(day.territories)
  );
  const minValue = Math.min(...allValues);
  const maxValue = Math.max(...allValues);

  const getColorIntensity = (value: number): string => {
    if (!value) return 'bg-gray-100';
    const normalized = (value - minValue) / (maxValue - minValue);

    if (normalized >= 0.8) return 'bg-green-600';
    if (normalized >= 0.6) return 'bg-green-500';
    if (normalized >= 0.4) return 'bg-yellow-500';
    if (normalized >= 0.2) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const handleCellClick = (territory: string, day: string, value: number) => {
    setSelectedCell({ territory, day, value });
    setIsModalOpen(true);
  };

  return (
    <div className="w-full">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-1">
          Territory Performance Heatmap
        </h3>
        <p className="text-sm text-gray-500">
          Call activity by territory and day of week
        </p>
      </div>

      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* Heatmap Grid */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            {/* Header Row */}
            <div className="flex bg-gray-50">
              <div className="w-24 px-3 py-2 text-xs font-semibold text-gray-600 border-r border-gray-200">
                Territory
              </div>
              {data.heatmapData.map((dayData) => (
                <div
                  key={dayData.day}
                  className="flex-1 min-w-[80px] px-3 py-2 text-xs font-semibold text-gray-600 text-center border-r border-gray-200 last:border-r-0"
                >
                  {dayData.day}
                </div>
              ))}
            </div>

            {/* Data Rows */}
            {data.territoryList.map((territory, tIdx) => (
              <div key={territory} className="flex border-t border-gray-200">
                <div className="w-24 px-3 py-3 text-xs font-medium text-gray-700 bg-gray-50 border-r border-gray-200 flex items-center">
                  {territory}
                </div>
                {data.heatmapData.map((dayData, dIdx) => {
                  const value = dayData.territories[territory] || 0;
                  return (
                    <div
                      key={`${territory}-${dayData.day}`}
                      className={`flex-1 min-w-[80px] px-3 py-3 text-center border-r border-gray-200 last:border-r-0 cursor-pointer hover:opacity-80 transition ${getColorIntensity(
                        value
                      )}`}
                      onClick={() => handleCellClick(territory, dayData.day, value)}
                      title={`${territory} - ${dayData.day}: ${value} calls`}
                    >
                      <span className="text-xs font-semibold text-white">
                        {value}
                      </span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="mt-4 flex items-center justify-center gap-4">
            <span className="text-xs text-gray-600">Low</span>
            <div className="flex gap-1">
              <div className="w-8 h-4 bg-red-500 rounded"></div>
              <div className="w-8 h-4 bg-orange-500 rounded"></div>
              <div className="w-8 h-4 bg-yellow-500 rounded"></div>
              <div className="w-8 h-4 bg-green-500 rounded"></div>
              <div className="w-8 h-4 bg-green-600 rounded"></div>
            </div>
            <span className="text-xs text-gray-600">High</span>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-green-50 p-3 rounded-lg">
          <p className="text-xs text-green-600 mb-1">Peak Performance</p>
          <p className="text-lg font-bold text-green-700">
            {maxValue} calls
          </p>
        </div>
        <div className="bg-red-50 p-3 rounded-lg">
          <p className="text-xs text-red-600 mb-1">Lowest Activity</p>
          <p className="text-lg font-bold text-red-700">
            {minValue} calls
          </p>
        </div>
        <div className="bg-blue-50 p-3 rounded-lg">
          <p className="text-xs text-blue-600 mb-1">Average</p>
          <p className="text-lg font-bold text-blue-700">
            {(allValues.reduce((a, b) => a + b, 0) / allValues.length).toFixed(1)}
          </p>
        </div>
        <div className="bg-purple-50 p-3 rounded-lg">
          <p className="text-xs text-purple-600 mb-1">Total Territories</p>
          <p className="text-lg font-bold text-purple-700">
            {data.territoryList.length}
          </p>
        </div>
      </div>

      {/* Drill-down Modal */}
      <DetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Performance Details: ${selectedCell?.territory || ''}`}
      >
        {selectedCell && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg">
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                {selectedCell.territory}
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Performance on {selectedCell.day}
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Calls Made</p>
                  <p className="text-3xl font-bold text-green-600">
                    {selectedCell.value}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Performance Level</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {selectedCell.value >= maxValue * 0.8
                      ? 'Excellent'
                      : selectedCell.value >= maxValue * 0.6
                      ? 'Good'
                      : selectedCell.value >= maxValue * 0.4
                      ? 'Average'
                      : 'Below Average'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-4">
                Performance Metrics
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Territory</span>
                  <span className="text-sm font-medium text-gray-800">
                    {selectedCell.territory}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Day</span>
                  <span className="text-sm font-medium text-gray-800">
                    {selectedCell.day}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Total Calls</span>
                  <span className="text-sm font-medium text-gray-800">
                    {selectedCell.value}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">vs Max</span>
                  <span className="text-sm font-medium text-gray-800">
                    {((selectedCell.value / maxValue) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-gray-600">vs Average</span>
                  <span
                    className={`text-sm font-medium ${
                      selectedCell.value >
                      allValues.reduce((a, b) => a + b, 0) / allValues.length
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {selectedCell.value >
                    allValues.reduce((a, b) => a + b, 0) / allValues.length
                      ? '+'
                      : ''}
                    {(
                      selectedCell.value -
                      allValues.reduce((a, b) => a + b, 0) / allValues.length
                    ).toFixed(1)}{' '}
                    calls
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-green-600 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                <div>
                  <h5 className="text-sm font-semibold text-green-800 mb-1">
                    Insights
                  </h5>
                  <p className="text-xs text-green-700">
                    {selectedCell.value >= maxValue * 0.8
                      ? `Outstanding performance on ${selectedCell.day}! ${selectedCell.territory} is showing excellent activity levels. Keep up the great work and identify what's working well to replicate this success.`
                      : selectedCell.value >= maxValue * 0.6
                      ? `Good performance on ${selectedCell.day}. ${selectedCell.territory} is performing above average. Look for opportunities to reach peak performance levels.`
                      : selectedCell.value >= maxValue * 0.4
                      ? `Average performance on ${selectedCell.day}. ${selectedCell.territory} has room for improvement. Review team strategies and resource allocation.`
                      : `Below average activity on ${selectedCell.day}. ${selectedCell.territory} may benefit from additional support, training, or strategic planning to boost call volumes.`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </DetailModal>
    </div>
  );
};

export default PerformanceHeatmapChart;
