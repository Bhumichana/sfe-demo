import { format } from 'date-fns';

export interface RecentCall {
  id: string;
  customerName: string;
  customerClass: 'A' | 'B' | 'C';
  status: 'completed' | 'pending' | 'approved' | 'rejected';
  date: Date;
  time: string;
  activities: string[];
}

interface RecentCallItemProps {
  call: RecentCall;
  onClick?: () => void;
}

export default function RecentCallItem({ call, onClick }: RecentCallItemProps) {
  const statusConfig = {
    completed: {
      label: 'เสร็จสิ้น',
      color: 'bg-success/10 text-success border-success/20',
    },
    pending: {
      label: 'รอตรวจสอบ',
      color: 'bg-warning/10 text-warning border-warning/20',
    },
    approved: {
      label: 'อนุมัติแล้ว',
      color: 'bg-success/10 text-success border-success/20',
    },
    rejected: {
      label: 'ไม่อนุมัติ',
      color: 'bg-error/10 text-error border-error/20',
    },
  };

  const classConfig = {
    A: 'bg-error/10 text-error border-error/30',
    B: 'bg-warning/10 text-warning border-warning/30',
    C: 'bg-info/10 text-info border-info/30',
  };

  const status = statusConfig[call.status];
  const classStyle = classConfig[call.customerClass];

  return (
    <div
      onClick={onClick}
      className="bg-white border border-border rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-bold text-gray-900 text-base">{call.customerName}</h4>
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${classStyle}`}>
              Class {call.customerClass}
            </span>
          </div>
          <p className="text-sm text-gray-900 font-semibold">
            {format(call.date, 'dd/MM/yyyy')} • {call.time}
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${status.color}`}>
          {status.label}
        </span>
      </div>

      {call.activities.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {call.activities.map((activity, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-gray-700 text-white rounded-md text-xs font-medium"
            >
              {activity}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
