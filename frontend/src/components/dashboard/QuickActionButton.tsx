interface QuickActionButtonProps {
  title: string;
  icon: React.ReactNode;
  color?: 'primary' | 'success' | 'warning' | 'info';
  onClick?: () => void;
}

export default function QuickActionButton({
  title,
  icon,
  color = 'primary',
  onClick,
}: QuickActionButtonProps) {
  const colorClasses = {
    primary: 'bg-primary hover:bg-primary/90',
    success: 'bg-success hover:bg-success/90',
    warning: 'bg-warning hover:bg-warning/90',
    info: 'bg-info hover:bg-info/90',
  };

  return (
    <button
      onClick={onClick}
      className={`${colorClasses[color]} text-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all flex flex-col items-center gap-3 w-full`}
    >
      <div className="w-12 h-12">
        {icon}
      </div>
      <span className="font-bold text-sm">{title}</span>
    </button>
  );
}
