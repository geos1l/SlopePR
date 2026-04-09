import { StatCard as StatCardType } from '@/types';

interface StatCardProps {
  stat: StatCardType;
}

export default function StatCard({ stat }: StatCardProps) {
  const trendColor = {
    up: 'text-[#4a90e2]',
    down: 'text-[#d4af37]',
    neutral: 'text-[#8b8b8b]',
  }[stat.trend || 'neutral'];

  const trendIcon = {
    up: '↑',
    down: '↓',
    neutral: '→',
  }[stat.trend || 'neutral'];

  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4">
      <div className="text-[#8b8b8b] text-sm mb-1">{stat.label}</div>
      <div className="text-2xl font-bold text-white mb-1">
        {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
      </div>
      {stat.change && (
        <div className={`text-xs font-medium ${trendColor} flex items-center gap-1`}>
          <span>{trendIcon}</span>
          <span>{stat.change}</span>
        </div>
      )}
    </div>
  );
}

