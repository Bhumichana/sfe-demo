'use client';

import React, { useState } from 'react';
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import DetailModal from './DetailModal';

interface RadarDataPoint {
  metric: string;
  [key: string]: string | number;
}

interface TeamComparisonRadarChartProps {
  data: {
    radarData: RadarDataPoint[];
    teams: string[];
  };
  loading?: boolean;
}

const TEAM_COLORS: Record<string, string> = {
  'Team A': '#3B82F6',
  'Team B': '#10B981',
  'Team C': '#F59E0B',
  'Team D': '#EF4444',
  'Team E': '#8B5CF6',
};

const TeamComparisonRadarChart: React.FC<TeamComparisonRadarChartProps> = ({
  data,
  loading,
}) => {
  const [selectedMetric, setSelectedMetric] = useState<{
    metric: string;
    values: Record<string, number>;
  } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (loading) {
    return (
      <div className="w-full h-[400px] bg-gray-100 rounded-lg animate-pulse flex items-center justify-center">
        <span className="text-gray-500">Loading...</span>
      </div>
    );
  }

  if (!data || !data.radarData || data.radarData.length === 0) {
    return (
      <div className="w-full h-[400px] bg-gray-50 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 text-lg mb-2">No data available</p>
          <p className="text-gray-400 text-sm">
            Team comparison radar data will appear here
          </p>
        </div>
      </div>
    );
  }

  const handleRadarClick = (entry: any) => {
    if (entry && entry.payload) {
      const { metric, ...values } = entry.payload;
      setSelectedMetric({ metric, values });
      setIsModalOpen(true);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-1">
          Team Performance Radar
        </h3>
        <p className="text-sm text-gray-500">
          Multi-dimensional comparison of {data.teams.length} teams
        </p>
      </div>

      <ResponsiveContainer width="100%" height={350}>
        <RadarChart data={data.radarData} onClick={handleRadarClick}>
          <PolarGrid stroke="#E5E7EB" />
          <PolarAngleAxis
            dataKey="metric"
            tick={{ fontSize: 12, fill: '#6B7280' }}
          />
          <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
            }}
          />
          <Legend />
          {data.teams.map((team, index) => (
            <Radar
              key={team}
              name={team}
              dataKey={team}
              stroke={TEAM_COLORS[team] || `hsl(${index * 60}, 70%, 50%)`}
              fill={TEAM_COLORS[team] || `hsl(${index * 60}, 70%, 50%)`}
              fillOpacity={0.3}
              strokeWidth={2}
            />
          ))}
        </RadarChart>
      </ResponsiveContainer>

      {/* Team Legends with Colors */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {data.teams.map((team) => (
          <div
            key={team}
            className="flex items-center gap-2 p-3 rounded-lg border border-gray-200 hover:shadow-md transition"
          >
            <div
              className="w-4 h-4 rounded-full"
              style={{
                backgroundColor: TEAM_COLORS[team] || '#6B7280',
              }}
            />
            <div>
              <p className="text-xs font-semibold text-gray-700">{team}</p>
              <p className="text-xs text-gray-500">
                Avg:{' '}
                {(
                  data.radarData.reduce(
                    (sum, d) => sum + (Number(d[team]) || 0),
                    0
                  ) / data.radarData.length
                ).toFixed(1)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Drill-down Modal */}
      <DetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Metric Analysis: ${selectedMetric?.metric || ''}`}
      >
        {selectedMetric && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg">
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                {selectedMetric.metric}
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Performance comparison across teams
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(selectedMetric.values).map(([team, value]) => (
                  <div key={team}>
                    <p className="text-sm text-gray-600">{team}</p>
                    <p
                      className="text-2xl font-bold"
                      style={{
                        color: TEAM_COLORS[team] || '#6B7280',
                      }}
                    >
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-4">
                Team Rankings
              </h4>
              <div className="space-y-3">
                {Object.entries(selectedMetric.values)
                  .sort(([, a], [, b]) => Number(b) - Number(a))
                  .map(([team, value], index) => (
                    <div
                      key={team}
                      className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-gray-400">
                          #{index + 1}
                        </span>
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{
                            backgroundColor: TEAM_COLORS[team] || '#6B7280',
                          }}
                        />
                        <span className="text-sm font-medium text-gray-800">
                          {team}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div
                            className="h-2 rounded-full"
                            style={{
                              width: `${value}%`,
                              backgroundColor: TEAM_COLORS[team] || '#6B7280',
                            }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-gray-700 w-10">
                          {value}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                    />
                  </svg>
                  <div>
                    <h5 className="text-sm font-semibold text-green-800 mb-1">
                      Top Performer
                    </h5>
                    <p className="text-xs text-green-700">
                      {Object.entries(selectedMetric.values).sort(
                        ([, a], [, b]) => Number(b) - Number(a)
                      )[0][0]}{' '}
                      leads in {selectedMetric.metric} with a score of{' '}
                      {
                        Object.entries(selectedMetric.values).sort(
                          ([, a], [, b]) => Number(b) - Number(a)
                        )[0][1]
                      }
                      . Analyze their strategies for best practices to share across
                      teams.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-orange-600 mt-0.5"
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
                    <h5 className="text-sm font-semibold text-orange-800 mb-1">
                      Improvement Opportunity
                    </h5>
                    <p className="text-xs text-orange-700">
                      {
                        Object.entries(selectedMetric.values).sort(
                          ([, a], [, b]) => Number(a) - Number(b)
                        )[0][0]
                      }{' '}
                      has the most room for growth in {selectedMetric.metric}.
                      Consider targeted training and resource allocation to boost
                      performance.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </DetailModal>
    </div>
  );
};

export default TeamComparisonRadarChart;
