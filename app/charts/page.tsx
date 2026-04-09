'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ExerciseSelector from '@/components/ExerciseSelector';
import StatCard from '@/components/StatCard';
import ProgressChart from '@/components/ProgressChart';
import StreakSummary from '@/components/StreakSummary';
import AchievementsRow from '@/components/AchievementsRow';
import { TimeRange } from '@/types';
import { useAuth } from '@/lib/useAuth';
import { createClient } from '@/lib/supabaseClient';

interface Log {
  id: string;
  date: string;
  exercise_id: string;
  exercise_name: string;
  weight: number | null;
  reps: number;image.png
}

interface LoggedExercise {
  id: string;
  name: string;
}

export default function ChartsPage() {
  const router = useRouter();
  const { isLoggedIn, user } = useAuth();
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('3m');
  const [logs, setLogs] = useState<Log[]>([]);
  const [loggedExercises, setLoggedExercises] = useState<LoggedExercise[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch logs and distinct exercises from Supabase
  useEffect(() => {
    if (!isLoggedIn || !user) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const supabase = createClient();
        
        // Fetch all logs for the user
        const { data: logsData, error: logsError } = await supabase
          .from('logs')
          .select(`
            id,
            date,
            exercise_id,
            reps,
            weight,
            exercises (
              id,
              name
            )
          `)
          .eq('user_id', user.id)
          .order('date', { ascending: true });

        if (logsError) {
          console.error('Error fetching logs:', logsError);
          setLoading(false);
          return;
        }

        // Transform logs to include exercise name
        const transformedLogs: Log[] = (logsData || []).map((log: any) => ({
          id: log.id,
          date: log.date,
          exercise_id: log.exercise_id,
          exercise_name: log.exercises?.name || '',
          weight: log.weight,
          reps: log.reps,
        }));

        setLogs(transformedLogs);

        // Get distinct exercises the user has logged
        const exerciseMap = new Map<string, LoggedExercise>();
        transformedLogs.forEach(log => {
          if (log.exercise_id && log.exercise_name && !exerciseMap.has(log.exercise_id)) {
            exerciseMap.set(log.exercise_id, {
              id: log.exercise_id,
              name: log.exercise_name,
            });
          }
        });

        const distinctExercises = Array.from(exerciseMap.values());
        setLoggedExercises(distinctExercises);

        // Set first exercise as selected if available and none selected
        if (distinctExercises.length > 0 && !selectedExerciseId) {
          setSelectedExerciseId(distinctExercises[0].id);
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setLoading(false);
      }
    };

    fetchData();
  }, [isLoggedIn, user]);

  // Filter logs by selected exercise and time range
  const filteredLogs = logs.filter(log => {
    if (selectedExerciseId && log.exercise_id !== selectedExerciseId) return false;
    
    const today = new Date();
    const rangeDays: Record<TimeRange, number> = {
      '4w': 28,
      '3m': 90,
      '6m': 180,
      '1y': 365,
      'all': Infinity,
    };

    const cutoffDate = new Date(today);
    cutoffDate.setDate(cutoffDate.getDate() - rangeDays[timeRange]);

    const logDate = new Date(log.date);
    return logDate >= cutoffDate;
  });

  // Determine if exercise uses weight or reps for Y-axis
  const hasWeightLogs = filteredLogs.some(log => log.weight !== null);
  const yAxisMetric = hasWeightLogs ? 'weight' : 'reps';
  const yAxisLabel = hasWeightLogs ? 'Weight (lbs)' : 'Reps';

  // Prepare chart data
  const chartData = filteredLogs.map(log => ({
    date: log.date,
    weight: log.weight ?? 0,
    reps: log.reps,
    sets: 1, // TODO: add sets column to schema
    isPR: false, // TODO: calculate PRs
    yValue: yAxisMetric === 'weight' ? (log.weight ?? 0) : log.reps,
  }));

  const streak = { current: 0, lastWorkout: '', nextGoal: isLoggedIn ? 'Log your first workout to start your streak' : 'Log in to start your streak' };
  const achievements: any[] = [];

  // Calculate stats based on chosen metric (weight or reps)
  const getMetricValue = (log: Log) => yAxisMetric === 'weight' ? (log.weight ?? 0) : log.reps;
  
  const currentMax = filteredLogs.length > 0 
    ? Math.max(...filteredLogs.map(getMetricValue))
    : 0;
  
  const previousMax = filteredLogs.length > 1
    ? Math.max(...filteredLogs.slice(0, -1).map(getMetricValue))
    : currentMax;
  
  const change = currentMax - previousMax;
  const trend = change > 0 ? 'up' : change < 0 ? 'down' : 'neutral';
  
  const allTimePR = logs.length > 0 && selectedExerciseId
    ? Math.max(...logs.filter(l => l.exercise_id === selectedExerciseId).map(getMetricValue))
    : 0;
  
  const average = filteredLogs.length > 0
    ? filteredLogs.reduce((sum, l) => sum + getMetricValue(l), 0) / filteredLogs.length
    : 0;

  const stats = [
    {
      label: 'Current Max',
      value: filteredLogs.length > 0 ? currentMax.toFixed(yAxisMetric === 'weight' ? 0 : 1) : '—',
      change: filteredLogs.length > 1 ? (change > 0 ? `+${change.toFixed(yAxisMetric === 'weight' ? 0 : 1)}` : change.toFixed(yAxisMetric === 'weight' ? 0 : 1)) : undefined,
      trend: trend as 'up' | 'down' | 'neutral',
    },
    {
      label: 'All-Time PR',
      value: allTimePR > 0 ? allTimePR.toFixed(yAxisMetric === 'weight' ? 0 : 1) : '—',
    },
    {
      label: 'Average',
      value: filteredLogs.length > 0 ? average.toFixed(yAxisMetric === 'weight' ? 0 : 1) : '—',
    },
    {
      label: 'PRs This Period',
      value: '—', // TODO: calculate PRs
    },
  ];

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      <main className="lg:ml-64 px-4 sm:px-6 lg:px-8 py-8 transition-all duration-300">
        {/* Hero Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 tracking-tight">
            <span className="text-white">Track your strength </span>
            <span className="text-[#4a90e2]">progress</span>
            <span className="text-white"> over time.</span>
          </h1>
          <p className="text-[#8b8b8b] text-lg">
            Every rep counts. Every session matters.
          </p>
        </div>

        {/* Exercise Selector */}
        <div className="mb-6">
          <ExerciseSelector
            loggedExercises={loggedExercises}
            selectedExerciseId={selectedExerciseId}
            onSelect={setSelectedExerciseId}
            loading={loading}
          />
        </div>
        
        {!isLoggedIn && (
          <div className="mb-6 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4 text-center">
            <p className="text-[#8b8b8b] mb-2">You're not logged in. Log in to track your strength progress.</p>
            <Link
              href="/login"
              className="inline-block bg-[#d4af37] text-[#0f0f0f] px-6 py-2 rounded-xl font-semibold hover:bg-[#b8941f] transition-colors"
            >
              Log In
            </Link>
          </div>
        )}
        
        {isLoggedIn && logs.length === 0 && (
          <div className="mb-6 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6 text-center">
            <p className="text-[#8b8b8b] mb-4">You haven't logged any workouts yet. Start tracking your progress!</p>
            <Link
              href="/calendar"
              className="inline-block bg-[#d4af37] text-[#0f0f0f] px-6 py-3 rounded-xl font-semibold hover:bg-[#b8941f] transition-colors"
            >
              Log Your First Workout
            </Link>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {stats.map((stat, index) => (
            <StatCard key={index} stat={stat} />
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Chart - Takes 2 columns on desktop */}
          <div className="lg:col-span-2">
            <ProgressChart
              data={chartData}
              onRangeChange={setTimeRange}
              currentRange={timeRange}
              yAxisLabel={yAxisLabel}
              yAxisMetric={yAxisMetric}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <StreakSummary streak={streak} />
            <div>
              <h3 className="text-sm font-medium text-[#8b8b8b] mb-3">Achievements</h3>
              <AchievementsRow achievements={achievements} />
            </div>
          </div>
        </div>

        {/* Additional Info Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4">
            <div className="text-[#8b8b8b] mb-1">Total Logs</div>
            <div className="text-xl font-bold text-white">{logs.length}</div>
          </div>
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4">
            <div className="text-[#8b8b8b] mb-1">Heaviest Lift</div>
            <div className="text-xl font-bold text-[#d4af37]">
              {yAxisMetric === 'weight' && allTimePR > 0 ? `${allTimePR} lbs` : '—'}
            </div>
          </div>
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4">
            <div className="text-[#8b8b8b] mb-1">Time Trained</div>
            <div className="text-xl font-bold text-white">—</div>
          </div>
        </div>
      </main>
    </div>
  );
}

