'use client';

import { useState } from 'react';

interface WorkoutEvent {
  id: string;
  date: string;
  exerciseId: string;
  exerciseName: string;
  weight: number;
  reps: number;
}

interface CalendarViewProps {
  workouts: WorkoutEvent[];
  selectedDate: string | null;
  onDateSelect: (date: string) => void;
  onWorkoutClick?: (workout: WorkoutEvent) => void;
}

// Helper function to get exercise color based on name
const getExerciseColor = (exerciseName: string): string => {
  const name = exerciseName.toLowerCase();
  if (name.includes('bench') || name.includes('press')) return '#d4af37';
  if (name.includes('squat')) return '#4a90e2';
  if (name.includes('deadlift')) return '#4a9b4a';
  return '#8b8b8b';
};

export default function CalendarView({ workouts, selectedDate, onDateSelect, onWorkoutClick }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Get first day of month and number of days
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  // Get previous month's trailing days
  const prevMonth = new Date(year, month - 1, 0);
  const daysInPrevMonth = prevMonth.getDate();

  const days: Array<{ date: Date; isCurrentMonth: boolean; dateString: string }> = [];

  // Add previous month's trailing days
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    const date = new Date(year, month - 1, daysInPrevMonth - i);
    days.push({
      date,
      isCurrentMonth: false,
      dateString: date.toISOString().split('T')[0],
    });
  }

  // Add current month's days
  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(year, month, i);
    days.push({
      date,
      isCurrentMonth: true,
      dateString: date.toISOString().split('T')[0],
    });
  }

  // Add next month's leading days to fill the grid
  const totalCells = days.length;
  const remainingCells = 42 - totalCells; // 6 rows × 7 days
  for (let i = 1; i <= remainingCells; i++) {
    const date = new Date(year, month + 1, i);
    days.push({
      date,
      isCurrentMonth: false,
      dateString: date.toISOString().split('T')[0],
    });
  }

  const getWorkoutsForDate = (dateString: string) => {
    const dayWorkouts = workouts.filter(w => {
      // Normalize both dates for comparison
      const workoutDate = w.date ? w.date.split('T')[0] : '';
      const normalizedDateString = dateString.split('T')[0];
      return workoutDate === normalizedDateString;
    });
    
    // Debug logging (remove in production)
    if (dayWorkouts.length > 0) {
      console.log(`Found ${dayWorkouts.length} workouts for ${dateString}:`, dayWorkouts);
    }
    
    return dayWorkouts;
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={goToToday}
            className="px-4 py-2 bg-[#2a2a2a] text-white rounded-xl hover:bg-[#252525] transition-colors text-sm font-medium"
          >
            Today
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={goToPreviousMonth}
              className="p-2 text-[#8b8b8b] hover:text-white hover:bg-[#1a1a1a] rounded-xl transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={goToNextMonth}
              className="p-2 text-[#8b8b8b] hover:text-white hover:bg-[#1a1a1a] rounded-xl transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          <h2 className="text-xl font-bold text-white">
            {monthNames[month]} {year}
          </h2>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Day Headers */}
        {dayNames.map((day) => (
          <div
            key={day}
            className="p-2 text-center text-sm font-medium text-[#8b8b8b]"
          >
            {day}
          </div>
        ))}

        {/* Calendar Days */}
        {days.map((day, index) => {
          const dayWorkouts = getWorkoutsForDate(day.dateString);
          const isToday = day.dateString === today;
          const isSelected = selectedDate === day.dateString;

          return (
            <div
              key={index}
              onClick={() => onDateSelect(day.dateString)}
              className={`
                min-h-[100px] max-h-[100px] p-2 border border-[#2a2a2a] rounded-xl cursor-pointer transition-all flex flex-col
                ${!day.isCurrentMonth ? 'opacity-30' : ''}
                ${isToday ? 'bg-[#d4af37]/10 border-[#d4af37]/30' : ''}
                ${isSelected ? 'bg-[#EF4444]/20 border-[#d4af37]' : 'hover:bg-[#1a1a1a]'}
              `}
            >
              <div className={`
                text-sm font-medium mb-1 flex-shrink-0
                ${isToday ? 'text-[#d4af37]' : isSelected ? 'text-white' : 'text-[#8b8b8b]'}
              `}>
                {day.date.getDate()}
              </div>
              <div className="space-y-1 overflow-y-auto flex-1 min-h-0 calendar-day-scroll">
                {dayWorkouts.length === 0 ? (
                  <div className="text-xs text-[#8b8b8b] px-2">No workouts</div>
                ) : (
                  dayWorkouts.map((workout) => {
                    const exerciseColor = getExerciseColor(workout.exerciseName);
                    return (
                      <div
                        key={workout.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onWorkoutClick) {
                            onWorkoutClick(workout);
                          }
                        }}
                        className="text-xs px-2 py-1 rounded truncate cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0"
                        style={{
                          backgroundColor: `${exerciseColor}20`,
                          color: exerciseColor,
                          borderLeft: `3px solid ${exerciseColor}`,
                        }}
                        title={`${workout.exerciseName} - Click to delete`}
                      >
                        {workout.exerciseName} {workout.weight > 0 ? `${workout.weight}lbs × ` : ''}{workout.reps} reps
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

