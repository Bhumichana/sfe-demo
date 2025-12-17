'use client';

import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import type { CustomerSegmentationData } from '@/mocks/analytics-mock';
import DetailModal from './DetailModal';

interface CustomerSegmentationChartProps {
  data: CustomerSegmentationData;
  loading?: boolean;
}

interface SegmentData {
  type: string;
  count: number;
  percentage: number;
}

const SEGMENT_COLORS: Record<string, string> = {
  A: '#10B981', // Green - VIP customers
  B: '#F59E0B', // Orange - Important customers
  C: '#3B82F6', // Blue - Standard customers
};

const CustomerSegmentationChart: React.FC<CustomerSegmentationChartProps> = ({
  data,
  loading,
}) => {
  const [selectedSegment, setSelectedSegment] = useState<SegmentData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handlePieClick = (entry: any) => {
    setSelectedSegment(entry);
    setIsModalOpen(true);
  };
  if (loading) {
    return (
      <div className="w-full h-[400px] bg-gray-100 rounded-lg animate-pulse flex items-center justify-center">
        <span className="text-gray-500">Loading...</span>
      </div>
    );
  }

  if (!data || !data.abcDistribution || data.abcDistribution.length === 0) {
    return (
      <div className="w-full h-[400px] bg-gray-50 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 text-lg mb-2">No data available</p>
          <p className="text-gray-400 text-sm">Customer segmentation data will appear here</p>
        </div>
      </div>
    );
  }

  const renderCustomLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
    const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="font-semibold"
      >
        {`${(percent * 100).toFixed(1)}%`}
      </text>
    );
  };

  return (
    <div className="w-full">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-1">
          Customer Segmentation
        </h3>
        <p className="text-sm text-gray-500">
          ABC classification of {data.totalCustomers} customers
        </p>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={data.abcDistribution as any}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomLabel}
            outerRadius={100}
            fill="#8884d8"
            dataKey="count"
            nameKey="type"
            onClick={handlePieClick}
            cursor="pointer"
          >
            {data.abcDistribution.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={SEGMENT_COLORS[entry.type] || '#6B7280'}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
            }}
            formatter={(value: number) => value.toLocaleString()}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>

      {/* ABC Breakdown */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        {data.abcDistribution.map((segment) => (
          <div
            key={segment.type}
            className="p-3 rounded-lg"
            style={{
              backgroundColor:
                SEGMENT_COLORS[segment.type] + '20' || '#F3F4F620',
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: SEGMENT_COLORS[segment.type] }}
              />
              <p className="text-xs font-semibold text-gray-600">Type {segment.type}</p>
            </div>
            <p className="text-lg font-bold text-gray-800">{segment.count}</p>
            <p className="text-xs text-gray-500">{segment.percentage.toFixed(1)}%</p>
          </div>
        ))}
      </div>

      {/* Visit Frequency */}
      <div className="mt-4 bg-gray-50 p-4 rounded-lg">
        <p className="text-xs font-semibold text-gray-600 mb-3">Visit Frequency</p>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-gray-500">High</p>
            <p className="text-lg font-bold text-green-600">
              {data.visitFrequency.high}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Medium</p>
            <p className="text-lg font-bold text-orange-600">
              {data.visitFrequency.medium}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Low</p>
            <p className="text-lg font-bold text-blue-600">
              {data.visitFrequency.low}
            </p>
          </div>
        </div>
      </div>

      {/* Drill-down Modal */}
      <DetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Customer Segment ${selectedSegment?.type || ''} Details`}
      >
        {selectedSegment && (
          <div className="space-y-6">
            <div
              className="p-6 rounded-lg"
              style={{
                background: `linear-gradient(135deg, ${SEGMENT_COLORS[selectedSegment.type]}20 0%, ${SEGMENT_COLORS[selectedSegment.type]}40 100%)`,
              }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white text-2xl font-bold"
                  style={{ backgroundColor: SEGMENT_COLORS[selectedSegment.type] }}
                >
                  {selectedSegment.type}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-800">
                    Customer Type {selectedSegment.type}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {selectedSegment.type === 'A'
                      ? 'VIP Customers - High Priority'
                      : selectedSegment.type === 'B'
                      ? 'Important Customers - Medium Priority'
                      : 'Standard Customers - Regular Priority'}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <p className="text-sm text-gray-600">Total Customers</p>
                  <p className="text-3xl font-bold text-gray-800">
                    {selectedSegment.count.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Percentage</p>
                  <p className="text-3xl font-bold text-gray-800">
                    {selectedSegment.percentage.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">
                  Segment Characteristics
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Classification</span>
                    <span className="text-sm font-medium text-gray-800">
                      Type {selectedSegment.type}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Customer Count</span>
                    <span className="text-sm font-medium text-gray-800">
                      {selectedSegment.count.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Share of Total</span>
                    <span className="text-sm font-medium text-gray-800">
                      {selectedSegment.percentage.toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-gray-600">Priority Level</span>
                    <span
                      className="text-sm font-medium px-3 py-1 rounded-full"
                      style={{
                        backgroundColor: SEGMENT_COLORS[selectedSegment.type] + '30',
                        color: SEGMENT_COLORS[selectedSegment.type],
                      }}
                    >
                      {selectedSegment.type === 'A'
                        ? 'High'
                        : selectedSegment.type === 'B'
                        ? 'Medium'
                        : 'Standard'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">
                  Recommended Actions
                </h4>
                <div className="space-y-3">
                  {selectedSegment.type === 'A' && (
                    <>
                      <div className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5"></div>
                        <p className="text-sm text-gray-700">Prioritize regular visits and engagement</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5"></div>
                        <p className="text-sm text-gray-700">Offer premium services and exclusive deals</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5"></div>
                        <p className="text-sm text-gray-700">Maintain strong personal relationships</p>
                      </div>
                    </>
                  )}
                  {selectedSegment.type === 'B' && (
                    <>
                      <div className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full mt-1.5"></div>
                        <p className="text-sm text-gray-700">Schedule consistent follow-up visits</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full mt-1.5"></div>
                        <p className="text-sm text-gray-700">Provide competitive pricing and promotions</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full mt-1.5"></div>
                        <p className="text-sm text-gray-700">Focus on upselling opportunities</p>
                      </div>
                    </>
                  )}
                  {selectedSegment.type === 'C' && (
                    <>
                      <div className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5"></div>
                        <p className="text-sm text-gray-700">Maintain regular contact and service</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5"></div>
                        <p className="text-sm text-gray-700">Optimize visit efficiency and coverage</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5"></div>
                        <p className="text-sm text-gray-700">Identify potential for upgrade to Type B</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div
              className="border rounded-lg p-4"
              style={{
                backgroundColor: SEGMENT_COLORS[selectedSegment.type] + '20',
                borderColor: SEGMENT_COLORS[selectedSegment.type] + '40',
              }}
            >
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 mt-0.5"
                  style={{ color: SEGMENT_COLORS[selectedSegment.type] }}
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
                  <h5 className="text-sm font-semibold mb-1" style={{ color: SEGMENT_COLORS[selectedSegment.type] }}>
                    Strategy Insights
                  </h5>
                  <p className="text-xs text-gray-700">
                    {selectedSegment.type === 'A'
                      ? 'Type A customers represent your most valuable relationships. These VIP customers should receive the highest level of attention, exclusive offerings, and personalized service. Focus on retention and maximizing lifetime value.'
                      : selectedSegment.type === 'B'
                      ? 'Type B customers show strong potential and contribute significantly to your business. Maintain consistent engagement and look for opportunities to upgrade their experience. These customers may become Type A with the right attention.'
                      : 'Type C customers form the broad base of your customer portfolio. While requiring standard service, efficient management of this segment is crucial for overall profitability. Focus on identifying high-potential customers who could be upgraded to Type B.'}
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

export default CustomerSegmentationChart;
