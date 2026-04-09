import { Achievement } from '@/types';

interface AchievementsRowProps {
  achievements: Achievement[];
}

export default function AchievementsRow({ achievements }: AchievementsRowProps) {
  return (
    <div className="flex gap-3 flex-wrap">
      {achievements.map((achievement) => (
        <div
          key={achievement.id}
          className={`
            flex items-center gap-2 px-3 py-2 rounded-xl border text-sm
            ${
              achievement.unlocked
                ? 'bg-[#4a90e2]/10 border-[#4a90e2]/30 text-[#4a90e2]'
                : 'bg-[#2a2a2a] border-[#2a2a2a] text-[#8b8b8b] opacity-50'
            }
          `}
        >
          <span>{achievement.icon}</span>
          <span className="font-medium">{achievement.label}</span>
        </div>
      ))}
    </div>
  );
}

