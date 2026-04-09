import { StreakData } from '@/types';

interface StreakSummaryProps {
  streak: StreakData;
}

export default function StreakSummary({ streak }: StreakSummaryProps) {
  const daysSinceLastWorkout = Math.floor(
    (Date.now() - new Date(streak.lastWorkout).getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="bg-gradient-to-r from-[#4a90e2]/10 via-[#d4af37]/5 to-[#4a90e2]/10 border border-[#4a90e2]/20 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div>
            <div className="text-sm text-[#8b8b8b]">Current Streak</div>
            <div className="text-2xl font-bold text-[#d4af37]">{streak.current} days</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-[#8b8b8b]">Last workout</div>
          <div className="text-sm font-medium text-white">
            {daysSinceLastWorkout === 0 ? 'Today' : `${daysSinceLastWorkout} days ago`}
          </div>
        </div>
      </div>
      {streak.nextGoal && (
        <div className="pt-2 border-t border-[#4a90e2]/10">
          <div className="text-xs text-[#8b8b8b] mb-1">Next goal</div>
          <div className="text-sm font-medium text-white">{streak.nextGoal}</div>
        </div>
      )}
    </div>
  );
}

