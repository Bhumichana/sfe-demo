'use client';

import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { TerritoryComparisonData } from '@/mocks/analytics-mock';
import DetailModal from './DetailModal';

interface TerritoryComparisonChartProps {
  data: TerritoryComparisonData;
  loading?: boolean;
}

interface TerritoryData {
  territoryCode: string;
  territoryName: string;
  totalCalls: number;
  teamSize: number;
  avgCallsPerSR: number;
  abcCoverage: number;
}

const TerritoryComparisonChart: React.FC<TerritoryComparisonChartProps> = ({
  data,
  loading,
}) => {
  const [selectedTerritory, setSelectedTerritory] = useState<TerritoryData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleBarClick = (entry: any) => {
    setSelectedTerritory(entry);
    setIsModalOpen(true);
  };
  if (loading) {
    return (
      <div className="w-full h-[400px] bg-gray-100 rounded-lg animate-pulse flex items-center justify-center">
        <span className="text-gray-500">Loading...</span>
      </div>
    );
  }

  if (!data || !data.territories || data.territories.length === 0) {
    return (
      <div className="w-full h-[400px] bg-gray-50 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 text-lg mb-2">No data available</p>
          <p className="text-gray-400 text-sm">Territory comparison data will appear here</p>
        </div>
      </div>
    );
  }

  // Sort territories by totalCalls descending for better visualization
  const sortedTerritories = [...data.territories].sort(
    (a, b) => b.totalCalls - a.totalCalls
  );

  return (
    <div className="w-full">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-1">Territory Comparison</h3>
        <p className="text-sm text-gray-500">
          Performance across {data.total} territories
        </p>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={sortedTerritories}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis
            dataKey="territoryCode"
            stroke="#6B7280"
            tick={{ fontSize: 12 }}
          />
          <YAxis stroke="#6B7280" />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
            }}
            formatter={(value: number) => value.toLocaleString()}
          />
          <Legend />
          <Bar
            dataKey="totalCalls"
            name="Total Calls"
            fill="#3B82F6"
            radius={[8, 8, 0, 0]}
            onClick={handleBarClick}
            cursor="pointer"
          />
          <Bar
            dataKey="teamSize"
            name="Team Size"
            fill="#10B981"
            radius={[8, 8, 0, 0]}
            onClick={handleBarClick}
            cursor="pointer"
          />
        </BarChart>
      </ResponsiveContainer>

      {/* Territory Stats Summary */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 p-3 rounded-lg">
          <p className="text-xs text-blue-600 mb-1">Total Territories</p>
          <p className="text-lg font-bold text-blue-700">{data.total}</p>
        </div>
        <div className="bg-green-50 p-3 rounded-lg">
          <p className="text-xs text-green-600 mb-1">Total Calls</p>
          <p className="text-lg font-bold text-green-700">
            {sortedTerritories
              .reduce((sum, t) => sum + t.totalCalls, 0)
              .toLocaleString()}
          </p>
        </div>
        <div className="bg-orange-50 p-3 rounded-lg">
          <p className="text-xs text-orange-600 mb-1">Avg ABC Coverage</p>
          <p className="text-lg font-bold text-orange-700">
            {(
              sortedTerritories.reduce((sum, t) => sum + t.abcCoverage, 0) /
              sortedTerritories.length
            ).toFixed(1)}
            %
          </p>
        </div>
      </div>

      {/* Drill-down Modal */}
      <DetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Territory: ${selectedTerritory?.territoryName || ''} (${selectedTerritory?.territoryCode || ''})`}
      >
        {selectedTerritory && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-50 to-green-50 p-6 rounded-lg">
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                {selectedTerritory.territoryName}
              </h3>
              <p className="text-sm text-gray-600 mb-4">Code: {selectedTerritory.territoryCode}</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Total Calls</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {selectedTerritory.totalCalls.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Team Size</p>
                  <p className="text-3xl font-bold text-green-600">
                    {selectedTerritory.teamSize}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">
                  Performance Metrics
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Avg Calls per SR</span>
                    <span className="text-sm font-medium text-gray-800">
                      {selectedTerritory.avgCallsPerSR.toFixed(1)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">ABC Coverage</span>
                    <span className="text-sm font-medium text-gray-800">
                      {selectedTerritory.abcCoverage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-gray-600">Territory Rank</span>
                    <span className="text-sm font-medium text-gray-800">
                      #{sortedTerritories.findIndex((t) => t.territoryCode === selectedTerritory.territoryCode) + 1} of {sortedTerritories.length}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">
                  Team Information
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Total Sales Representatives</span>
                    <span className="text-sm font-medium text-gray-800">
                      {selectedTerritory.teamSize}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Total Calls Made</span>
                    <span className="text-sm font-medium text-gray-800">
                      {selectedTerritory.totalCalls.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-gray-600">Productivity Index</span>
                    <span className="text-sm font-medium text-gray-800">
                      {(selectedTerritory.avgCallsPerSR * selectedTerritory.abcCoverage / 100).toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-blue-600 mt-0.5"
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
                  <h5 className="text-sm font-semibold text-blue-800 mb-1">
                    Performance Insights
                  </h5>
                  <p className="text-xs text-blue-700">
                    {selectedTerritory.avgCallsPerSR > 50
                      ? 'Excellent productivity! This territory is performing above average.'
                      : selectedTerritory.avgCallsPerSR > 30
                      ? 'Good performance. Consider strategies to reach top-performing territories.'
                      : 'This territory may need additional support or resources to improve call volume.'}
                    {' '}
                    {selectedTerritory.abcCoverage > 70
                      ? 'ABC coverage is strong, maintaining good customer relationship quality.'
                      : 'Consider focusing on ABC customers to improve coverage metrics.'}
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

export default TerritoryComparisonChart;
