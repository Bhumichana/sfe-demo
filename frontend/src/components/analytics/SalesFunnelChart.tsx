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
  Cell,
} from 'recharts';
import type { SalesFunnelData } from '@/mocks/analytics-mock';
import DetailModal from './DetailModal';

interface SalesFunnelChartProps {
  data: SalesFunnelData;
  loading?: boolean;
}

const COLORS = ['#3B82F6', '#6366F1', '#8B5CF6', '#A855F7'];

const SalesFunnelChart: React.FC<SalesFunnelChartProps> = ({ data, loading }) => {
  const [selectedStage, setSelectedStage] = useState<{
    stage: string;
    count: number;
    percentage: number;
  } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleBarClick = (entry: any) => {
    setSelectedStage(entry);
    setIsModalOpen(true);
  };
  if (loading) {
    return (
      <div className="w-full h-[400px] bg-gray-100 rounded-lg animate-pulse flex items-center justify-center">
        <span className="text-gray-500">Loading...</span>
      </div>
    );
  }

  if (!data || !data.funnel || data.funnel.length === 0) {
    return (
      <div className="w-full h-[400px] bg-gray-50 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 text-lg mb-2">No data available</p>
          <p className="text-gray-400 text-sm">Sales funnel data will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-1">Sales Funnel</h3>
        <p className="text-sm text-gray-500">Conversion stages and metrics</p>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={data.funnel}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis type="number" stroke="#6B7280" />
          <YAxis dataKey="stage" type="category" stroke="#6B7280" />
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
            dataKey="count"
            name="Count"
            radius={[0, 8, 8, 0]}
            onClick={handleBarClick}
            cursor="pointer"
          >
            {data.funnel.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Metrics Summary */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-3 rounded-lg">
          <p className="text-xs text-blue-600 mb-1">Lead Conv. Rate</p>
          <p className="text-lg font-bold text-blue-700">
            {data.metrics.leadConversionRate.toFixed(1)}%
          </p>
        </div>
        <div className="bg-indigo-50 p-3 rounded-lg">
          <p className="text-xs text-indigo-600 mb-1">Opp. Conv. Rate</p>
          <p className="text-lg font-bold text-indigo-700">
            {data.metrics.opportunityConversionRate.toFixed(1)}%
          </p>
        </div>
        <div className="bg-purple-50 p-3 rounded-lg">
          <p className="text-xs text-purple-600 mb-1">Win Rate</p>
          <p className="text-lg font-bold text-purple-700">
            {data.metrics.winRate.toFixed(1)}%
          </p>
        </div>
        <div className="bg-violet-50 p-3 rounded-lg">
          <p className="text-xs text-violet-600 mb-1">Avg Deal Cycle</p>
          <p className="text-lg font-bold text-violet-700">
            {data.metrics.avgDealCycle.toFixed(1)} days
          </p>
        </div>
      </div>

      {/* Drill-down Modal */}
      <DetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Sales Funnel: ${selectedStage?.stage || ''} Details`}
      >
        {selectedStage && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg">
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                {selectedStage.stage}
              </h3>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <p className="text-sm text-gray-600">Total Count</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {selectedStage.count.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Percentage</p>
                  <p className="text-3xl font-bold text-indigo-600">
                    {selectedStage.percentage.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-4">
                Stage Information
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Stage Name</span>
                  <span className="text-sm font-medium text-gray-800">
                    {selectedStage.stage}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Total Leads/Opportunities</span>
                  <span className="text-sm font-medium text-gray-800">
                    {selectedStage.count.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Conversion Rate</span>
                  <span className="text-sm font-medium text-gray-800">
                    {selectedStage.percentage.toFixed(2)}%
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-gray-600">Stage Position</span>
                  <span className="text-sm font-medium text-gray-800">
                    {data.funnel.findIndex((f) => f.stage === selectedStage.stage) + 1} of {data.funnel.length}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-amber-600 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <h5 className="text-sm font-semibold text-amber-800 mb-1">
                    Insights
                  </h5>
                  <p className="text-xs text-amber-700">
                    {selectedStage.stage === 'Leads'
                      ? 'This is the entry point of your sales funnel. Focus on lead quality to improve conversion rates.'
                      : selectedStage.stage === 'Qualified Leads'
                      ? 'These leads have been vetted and show potential. Prioritize follow-ups to move them to opportunities.'
                      : selectedStage.stage === 'Opportunities'
                      ? 'Active deals in progress. Monitor closely and provide necessary support to close deals.'
                      : 'Closed deals! Maintain relationships for upselling and referrals.'}
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

export default SalesFunnelChart;
