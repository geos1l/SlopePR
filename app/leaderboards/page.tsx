'use client';

import { useState, useEffect } from 'react';
import { TimeRange } from '@/types';
import ExerciseSearch from '@/components/ExerciseSearch';
import { createClient } from '@/lib/supabaseClient';

interface LeaderboardUser {
  id: string;
  name: string;
  clan: string | null;
  slope: number;
  logs: number;
  currentWeight: number;
  reps: number;
  exerciseId: string;
  exerciseName: string;
}

export default function LeaderboardsPage() {
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  const [selectedExerciseName, setSelectedExerciseName] = useState<string>('');
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>('3m');
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch leaderboard data from Supabase
  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const supabase = createClient();

        // Calculate date cutoff based on time range
        const today = new Date();
        const rangeDays: Record<TimeRange, number> = {
          '4w': 28,
          '3m': 90,
          '6m': 180,
          '1y': 365,
          'all': Infinity,
        };

        const cutoffDate = new Date(today);
        if (selectedTimeRange !== 'all') {
          cutoffDate.setDate(cutoffDate.getDate() - rangeDays[selectedTimeRange]);
        }

        // Fetch all users who are on leaderboard
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select(`
            id,
            first_name,
            last_name,
            clan_id,
            clans (
              name
            )
          `)
          .eq('show_on_leaderboard', true);

        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
          setLoading(false);
          return;
        }

        if (!profiles || profiles.length === 0) {
          setUsers([]);
          setLoading(false);
          return;
        }

        // For each user, fetch their logs and calculate stats
        const leaderboardUsers: LeaderboardUser[] = [];

        for (const profile of profiles) {
          // Build query for logs
          let logsQuery = supabase
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
            .eq('user_id', profile.id)
            .order('date', { ascending: true });

          // Filter by exercise if selected
          if (selectedExerciseId) {
            logsQuery = logsQuery.eq('exercise_id', selectedExerciseId);
          }

          // Filter by date range
          if (selectedTimeRange !== 'all') {
            logsQuery = logsQuery.gte('date', cutoffDate.toISOString().split('T')[0]);
          }

          const { data: logs, error: logsError } = await logsQuery;

          if (logsError) {
            console.error(`Error fetching logs for user ${profile.id}:`, logsError);
            continue;
          }

          if (!logs || logs.length === 0) {
            continue; // Skip users with no logs
          }

          // Group logs by exercise
          const exerciseGroups = new Map<string, typeof logs>();
          logs.forEach((log: any) => {
            const exerciseId = log.exercise_id;
            if (!exerciseGroups.has(exerciseId)) {
              exerciseGroups.set(exerciseId, []);
            }
            exerciseGroups.get(exerciseId)!.push(log);
          });

          // Calculate stats for each exercise
          for (const [exerciseId, exerciseLogs] of exerciseGroups) {
            if (exerciseLogs.length < 2) continue; // Need at least 2 logs to calculate slope

            // Sort by date
            exerciseLogs.sort((a: any, b: any) => 
              new Date(a.date).getTime() - new Date(b.date).getTime()
            );

            // Determine metric (weight or reps)
            const hasWeight = exerciseLogs.some((log: any) => log.weight !== null);
            const getValue = (log: any) => hasWeight ? (log.weight ?? 0) : log.reps;

            // Calculate slope (last value - first value)
            const firstValue = getValue(exerciseLogs[0]);
            const lastValue = getValue(exerciseLogs[exerciseLogs.length - 1]);
            const slope = lastValue - firstValue;

            // Get current lift (most recent log)
            const latestLog = exerciseLogs[exerciseLogs.length - 1];
            const currentWeight = latestLog.weight ?? 0;
            const reps = latestLog.reps;
            const exercises = latestLog.exercises as any;
            const exerciseName = Array.isArray(exercises)
              ? (exercises.length > 0 ? exercises[0].name : 'Unknown')
              : (exercises?.name || 'Unknown');

            // Get clan name
            const clans = profile.clans as any;
            const clanName = Array.isArray(clans) 
              ? (clans.length > 0 ? clans[0].name : null)
              : (clans?.name || null);

            // Build user name
            const firstName = profile.first_name || '';
            const lastName = profile.last_name || '';
            const name = `${firstName} ${lastName}`.trim() || 'Anonymous User';

            leaderboardUsers.push({
              id: profile.id,
              name,
              clan: clanName,
              slope,
              logs: exerciseLogs.length,
              currentWeight,
              reps,
              exerciseId,
              exerciseName,
            });
          }
        }

        // Sort by slope (descending)
        leaderboardUsers.sort((a, b) => b.slope - a.slope);

        setUsers(leaderboardUsers);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [selectedExerciseId, selectedTimeRange]);

  const handleExerciseSelect = (exerciseId: string, exerciseName: string) => {
    setSelectedExerciseId(exerciseId);
    setSelectedExerciseName(exerciseName);
  };

  const timeRanges: { value: TimeRange; label: string }[] = [
    { value: '4w', label: '4 Weeks' },
    { value: '3m', label: '3 Months' },
    { value: '6m', label: '6 Months' },
    { value: '1y', label: '1 Year' },
    { value: 'all', label: 'All Time' },
  ];

  // Users are already filtered and sorted from the fetch
  const filteredUsers = users;

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      <main className="lg:ml-64 px-4 sm:px-6 lg:px-8 py-8 transition-all duration-300">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-2 text-white mb-8">
            Global Leaderboards
          </h1>
          <p className="text-[#8b8b8b] mb-8">
            See who's making the most progress. Rankings based on slope (rate of improvement).
          </p>

          {/* Filters */}
          <div className="bg-[#2a2a2a] border border-[#2a2a2a] rounded-xl p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-[#8b8b8b] mb-3">
                  Exercise
                </label>
                <ExerciseSearch
                  selectedExerciseId={selectedExerciseId}
                  onSelect={handleExerciseSelect}
                  placeholder="Search exercises..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#8b8b8b] mb-3">
                  Time Period
                </label>
                <div className="flex gap-2 flex-wrap">
                  {timeRanges.map((range) => (
                    <button
                      key={range.value}
                      onClick={() => setSelectedTimeRange(range.value)}
                      className={`
                        px-4 py-2 rounded-xl font-medium text-sm transition-all
                        ${
                          selectedTimeRange === range.value
                            ? 'bg-[#d4af37] text-[#0f0f0f] font-semibold text-white'
                            : 'bg-[#2a2a2a] text-[#8b8b8b] hover:bg-[#252525] hover:text-white'
                        }
                      `}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Leaderboard */}
          <div className="bg-[#2a2a2a] border border-[#2a2a2a] rounded-xl overflow-hidden">
            {loading ? (
              <div className="p-12 text-center">
                <div className="text-[#8b8b8b]">Loading leaderboard...</div>
              </div>
            ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#2a2a2a]">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-[#8b8b8b]">Rank</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-[#8b8b8b]">User</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-[#8b8b8b]">Clan</th>
                    <th className="px-6 py-4 text-right text-sm font-medium text-[#8b8b8b]">Slope</th>
                    <th className="px-6 py-4 text-right text-sm font-medium text-[#8b8b8b]">Current Lift</th>
                    <th className="px-6 py-4 text-right text-sm font-medium text-[#8b8b8b]">Logs</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user, index) => (
                    <tr
                      key={user.id}
                      className="border-t border-[#1a1a1a] hover:bg-[#2a2a2a]/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {index === 0 && <span className="text-xl">👑👑👑</span>}
                          {index === 1 && <span className="text-xl">👑👑</span>}
                          {index === 2 && <span className="text-xl">👑</span>}
                          <span className={`font-bold ${index < 3 ? 'text-[#d4af37]' : 'text-white'}`}>
                            #{index + 1}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-white">{user.name}</span>
                      </td>
                      <td className="px-6 py-4">
                        {user.clan ? (
                          <span className="text-sm text-[#8b8b8b]">{user.clan}</span>
                        ) : (
                          <span className="text-sm text-[#8b8b8b] italic">No clan</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-bold text-[#4a90e2]">+{user.slope.toFixed(1)} lbs</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-medium text-white">
                          {user.currentWeight} lbs × {user.reps}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm text-[#8b8b8b]">{user.logs} logs</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            )}
          </div>

          {filteredUsers.length === 0 && (
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-12 text-center">
              <div className="text-6xl mb-4">🏆</div>
              <h3 className="text-xl font-bold text-white mb-2">No Leaderboard Data Yet</h3>
              <p className="text-[#8b8b8b] mb-4">
                Be the first to log workouts and appear on the leaderboard!
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

