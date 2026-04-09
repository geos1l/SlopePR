export default function QuickActions() {
  const actions = [
    { label: 'Log Workout', icon: '➕', primary: true },
    { label: 'View Calendar', icon: '📅', primary: false },
    { label: 'Check Clan', icon: '👥', primary: false },
  ];

  return (
    <div className="flex gap-3 flex-wrap">
      {actions.map((action) => (
        <button
          key={action.label}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all
            ${
              action.primary
                ? 'bg-[#EF4444] text-white hover:bg-[#DC2626] shadow-lg shadow-[#EF4444]/20'
                : 'bg-[#1a1a1a] text-[#F5F5F5] hover:bg-[#252525] border border-[#1a1a1a]'
            }
          `}
        >
          <span>{action.icon}</span>
          <span>{action.label}</span>
        </button>
      ))}
    </div>
  );
}

