interface DailyTaskButtonProps {
  title: string;
  titleEn?: string;
  icon: string;
  badge?: number;
  onClick?: () => void;
}

export default function DailyTaskButton({
  title,
  titleEn,
  icon,
  badge,
  onClick,
}: DailyTaskButtonProps) {
  return (
    <button
      onClick={onClick}
      className="bg-white border-2 border-border hover:border-primary rounded-xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col items-center gap-2 relative group"
    >
      {badge !== undefined && badge > 0 && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-error text-white rounded-full flex items-center justify-center text-xs font-bold">
          {badge > 99 ? '99+' : badge}
        </div>
      )}
      <div className="text-4xl group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <div className="text-center">
        <p className="font-bold text-sm text-gray-900">{title}</p>
        {titleEn && (
          <p className="text-xs text-gray-900 font-semibold">{titleEn}</p>
        )}
      </div>
    </button>
  );
}
