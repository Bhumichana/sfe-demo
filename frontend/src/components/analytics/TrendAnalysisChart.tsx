'use client';

import React, { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import type { TrendAnalysisData } from '@/mocks/analytics-mock';
import DetailModal from './DetailModal';

interface TrendAnalysisChartProps {
  data: TrendAnalysisData;
  loading?: boolean;
}

interface TrendPoint {
  month: string;
  actual?: number | null;
  forecast?: number | null;
}

const TrendAnalysisChart: React.FC<TrendAnalysisChartProps> = ({ data, loading }) => {
  const [selectedPoint, setSelectedPoint] = useState<TrendPoint | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handlePointClick = (entry: any) => {
    if (entry && entry.activePayload && entry.activePayload[0]) {
      setSelectedPoint(entry.activePayload[0].payload);
      setIsModalOpen(true);
    }
  };
  if (loading) {
    return (
      <div className="w-full h-[400px] bg-gray-100 rounded-lg animate-pulse flex items-center justify-center">
        <span className="text-gray-500">Loading...</span>
      </div>
    );
  }

  if (!data || !data.historical || data.historical.length === 0) {
    return (
      <div className="w-full h-[400px] bg-gray-50 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 text-lg mb-2">No data available</p>
          <p className="text-gray-400 text-sm">Trend analysis data will appear here</p>
        </div>
      </div>
    );
  }

  // Combine historical and forecast data for the chart
  const combinedData = [
    ...data.historical.map((item) => ({
      month: item.month,
      actual: item.count,
      forecast: null,
    })),
    ...data.forecast.map((item) => ({
      month: item.month,
      actual: null,
      forecast: item.count,
    })),
  ];

  // For smooth transition, add the last historical point to forecast
  if (data.historical.length > 0 && data.forecast.length > 0) {
    const lastHistorical = data.historical[data.historical.length - 1];
    combinedData[data.historical.length - 1].forecast = lastHistorical.count;
  }

  const getTrendIcon = () => {
    if (data.trendDirection === 'up') return '📈';
    if (data.trendDirection === 'down') return '📉';
    return '➡️';
  };

  const getTrendColor = () => {
    if (data.trendDirection === 'up') return 'text-green-600';
    if (data.trendDirection === 'down') return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="w-full">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-1">
          Trend Analysis & Forecast
        </h3>
        <p className="text-sm text-gray-500">
          Historical performance with {data.forecast.length}-month forecast
        </p>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={combinedData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          onClick={handlePointClick}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis dataKey="month" stroke="#6B7280" tick={{ fontSize: 12 }} />
          <YAxis stroke="#6B7280" />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
            }}
            formatter={(value: number) => value?.toLocaleString() || 'N/A'}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="actual"
            name="Actual"
            stroke="#3B82F6"
            strokeWidth={3}
            dot={{ fill: '#3B82F6', r: 4 }}
            activeDot={{ r: 6 }}
            cursor="pointer"
          />
          <Line
            type="monotone"
            dataKey="forecast"
            name="Forecast"
            stroke="#6366F1"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ fill: '#6366F1', r: 4 }}
            cursor="pointer"
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Trend Summary */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-3 rounded-lg">
          <p className="text-xs text-blue-600 mb-1">Total Calls</p>
          <p className="text-lg font-bold text-blue-700">
            {data.summary.totalCalls.toLocaleString()}
          </p>
        </div>
        <div className="bg-indigo-50 p-3 rounded-lg">
          <p className="text-xs text-indigo-600 mb-1">Avg per Month</p>
          <p className="text-lg font-bold text-indigo-700">
            {data.summary.avgPerMonth.toFixed(1)}
          </p>
        </div>
        <div className="bg-green-50 p-3 rounded-lg">
          <p className="text-xs text-green-600 mb-1">Highest Month</p>
          <p className="text-sm font-bold text-green-700">
            {data.summary.highestMonth.month}
          </p>
          <p className="text-xs text-green-600">
            {data.summary.highestMonth.count} calls
          </p>
        </div>
        <div className="bg-orange-50 p-3 rounded-lg">
          <p className="text-xs text-orange-600 mb-1 flex items-center gap-1">
            Trend <span>{getTrendIcon()}</span>
          </p>
          <p className={`text-lg font-bold capitalize ${getTrendColor()}`}>
            {data.trendDirection}
          </p>
        </div>
      </div>

      {/* Drill-down Modal */}
      <DetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Trend Analysis: ${selectedPoint?.month || ''}`}
      >
        {selectedPoint && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg">
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                {selectedPoint.month}
              </h3>
              <div className="grid grid-cols-2 gap-4 mt-4">
                {selectedPoint.actual !== null && selectedPoint.actual !== undefined && (
                  <div>
                    <p className="text-sm text-gray-600">Actual Calls</p>
                    <p className="text-3xl font-bold text-blue-600">
                      {selectedPoint.actual.toLocaleString()}
                    </p>
                  </div>
                )}
                {selectedPoint.forecast !== null && selectedPoint.forecast !== undefined && (
                  <div>
                    <p className="text-sm text-gray-600">Forecasted Calls</p>
                    <p className="text-3xl font-bold text-indigo-600">
                      {selectedPoint.forecast.toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">
                  Performance Metrics
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Month</span>
                    <span className="text-sm font-medium text-gray-800">
                      {selectedPoint.month}
                    </span>
                  </div>
                  {selectedPoint.actual && (
                    <>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-sm text-gray-600">Calls</span>
                        <span className="text-sm font-medium text-gray-800">
                          {selectedPoint.actual.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-sm text-gray-600">vs Average</span>
                        <span className={`text-sm font-medium ${
                          selectedPoint.actual > data.summary.avgPerMonth
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}>
                          {selectedPoint.actual > data.summary.avgPerMonth ? '+' : ''}
                          {(selectedPoint.actual - data.summary.avgPerMonth).toFixed(0)} calls
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-sm text-gray-600">Performance</span>
                        <span className={`text-sm font-medium px-3 py-1 rounded-full ${
                          selectedPoint.actual === data.summary.highestMonth.count
                            ? 'bg-green-100 text-green-700'
                            : selectedPoint.actual > data.summary.avgPerMonth
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-orange-100 text-orange-700'
                        }`}>
                          {selectedPoint.actual === data.summary.highestMonth.count
                            ? 'Best Month'
                            : selectedPoint.actual > data.summary.avgPerMonth
                            ? 'Above Average'
                            : 'Below Average'}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">
                  {selectedPoint.actual ? 'Historical Context' : 'Forecast Information'}
                </h4>
                <div className="space-y-3">
                  {selectedPoint.actual ? (
                    <>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-sm text-gray-600">Data Type</span>
                        <span className="text-sm font-medium text-gray-800">Actual</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-sm text-gray-600">Total Calls YTD</span>
                        <span className="text-sm font-medium text-gray-800">
                          {data.summary.totalCalls.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-sm text-gray-600">Avg per Month</span>
                        <span className="text-sm font-medium text-gray-800">
                          {data.summary.avgPerMonth.toFixed(0)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-sm text-gray-600">Trend Direction</span>
                        <span className="text-sm font-medium text-gray-800 capitalize flex items-center gap-1">
                          {data.trendDirection} {getTrendIcon()}
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-sm text-gray-600">Data Type</span>
                        <span className="text-sm font-medium text-gray-800">Forecast</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-sm text-gray-600">Predicted Calls</span>
                        <span className="text-sm font-medium text-gray-800">
                          {selectedPoint.forecast?.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-sm text-gray-600">Based on Trend</span>
                        <span className="text-sm font-medium text-gray-800 capitalize">
                          {data.trendDirection}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-sm text-gray-600">Confidence</span>
                        <span className="text-sm font-medium text-gray-800">
                          {data.forecast.findIndex((f) => f.month === selectedPoint.month) === 0
                            ? 'High'
                            : data.forecast.findIndex((f) => f.month === selectedPoint.month) === 1
                            ? 'Medium'
                            : 'Moderate'}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className={`border rounded-lg p-4 ${
              selectedPoint.actual
                ? 'bg-blue-50 border-blue-200'
                : 'bg-indigo-50 border-indigo-200'
            }`}>
              <div className="flex items-start gap-3">
                <svg
                  className={`w-5 h-5 mt-0.5 ${
                    selectedPoint.actual ? 'text-blue-600' : 'text-indigo-600'
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
                <div>
                  <h5 className={`text-sm font-semibold mb-1 ${
                    selectedPoint.actual ? 'text-blue-800' : 'text-indigo-800'
                  }`}>
                    {selectedPoint.actual ? 'Performance Insights' : 'Forecast Insights'}
                  </h5>
                  <p className={`text-xs ${
                    selectedPoint.actual ? 'text-blue-700' : 'text-indigo-700'
                  }`}>
                    {selectedPoint.actual
                      ? selectedPoint.actual > data.summary.avgPerMonth
                        ? `Strong performance for ${selectedPoint.month}! This month exceeded the average by ${(
                            selectedPoint.actual - data.summary.avgPerMonth
                          ).toFixed(0)} calls. Continue these successful strategies to maintain momentum.`
                        : `${selectedPoint.month} showed ${data.summary.avgPerMonth - selectedPoint.actual < 50 ? 'slightly' : 'significantly'} lower activity than average. Review team performance and identify opportunities for improvement in similar periods.`
                      : `Based on current trends, we forecast approximately ${selectedPoint.forecast?.toLocaleString()} calls for ${
                          selectedPoint.month
                        }. This projection uses historical patterns and should be reviewed as actual data becomes available.`}
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

export default TrendAnalysisChart;
