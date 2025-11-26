interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color?: 'primary' | 'success' | 'warning' | 'info' | 'error';
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export default function StatsCard({
  title,
  value,
  subtitle,
  icon,
  color = 'primary',
  trend,
}: StatsCardProps) {
  const colorClasses = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    info: 'bg-info/10 text-info',
    error: 'bg-error/10 text-error',
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex flex-col items-center text-center">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[color]} mb-3`}>
          {icon}
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-sm font-medium mb-2 ${
            trend.isPositive ? 'text-success' : 'text-error'
          }`}>
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {trend.isPositive ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              )}
            </svg>
            <span>{Math.abs(trend.value)}%</span>
          </div>
        )}
        <h3 className="text-sm font-semibold text-gray-900 mb-1">{title}</h3>
        <p className="text-3xl font-bold text-emerald-600 mb-1">{value}</p>
        {subtitle && (
          <p className="text-xs text-gray-900 font-semibold">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
