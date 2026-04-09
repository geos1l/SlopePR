'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import CalendarView from '@/components/CalendarView';
import ExerciseSearch from '@/components/ExerciseSearch';
import { useAuth } from '@/lib/useAuth';
import { createClient } from '@/lib/supabaseClient';

interface WorkoutEvent {
  id: string;
  date: string;
  exerciseId: string;
  exerciseName: string;
  weight: number;
  reps: number;
}

export default function CalendarPage() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  const [selectedExerciseName, setSelectedExerciseName] = useState<string>('');
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [isWeighted, setIsWeighted] = useState(false);

  // Bodyweight exercises
  const bodyweightExercises = ['Push-Ups', 'Pull-Up', 'Chin-Up', 'Dips'];
  const isBodyweightExercise = bodyweightExercises.includes(selectedExerciseName);


  const [workouts, setWorkouts] = useState<WorkoutEvent[]>([]);
  const { user } = useAuth();
  const [workoutToDelete, setWorkoutToDelete] = useState<WorkoutEvent | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch workouts from Supabase
  useEffect(() => {
    if (!isLoggedIn || !user) {
      setWorkouts([]);
      return;
    }

    const fetchWorkouts = async () => {
      try {
        const supabase = createClient();
        
        // Fetch ALL logs, not just current month
        const { data, error } = await supabase
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

        if (error) {
          console.error('Error fetching workouts:', error);
          console.error('Error details:', JSON.stringify(error, null, 2));
          alert(`Error fetching workouts: ${error.message}. Please check the browser console.`);
          return;
        }

        console.log('Fetched workouts from database:', data);
        console.log('Number of logs fetched:', data?.length || 0);

        const transformedWorkouts: WorkoutEvent[] = (data || []).map((log: any) => {
          // Ensure date is in YYYY-MM-DD format
          const logDate = log.date ? (log.date.split('T')[0] || log.date) : '';
          return {
            id: log.id,
            date: logDate,
            exerciseId: log.exercise_id,
            exerciseName: log.exercises?.name || '',
            weight: log.weight || 0,
            reps: log.reps,
          };
        });

        console.log('Transformed workouts:', transformedWorkouts);
        setWorkouts(transformedWorkouts);
      } catch (err) {
        console.error('Error fetching workouts:', err);
      }
    };

    fetchWorkouts();
  }, [isLoggedIn, user]);

  const handleExerciseSelect = (exerciseId: string, exerciseName: string) => {
    setSelectedExerciseId(exerciseId);
    setSelectedExerciseName(exerciseName);
    // Reset weighted toggle when exercise changes
    setIsWeighted(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn || !user) {
      router.push('/login');
      return;
    }
    
    if (!selectedExerciseId) {
      alert('Please select an exercise');
      return;
    }

    if (!reps) {
      alert('Please enter reps');
      return;
    }

    // For bodyweight exercises, weight is optional (null if not weighted)
    const weightValue = (isBodyweightExercise && !isWeighted) ? null : (weight ? parseInt(weight) : null);
    
    if (!isBodyweightExercise && !weightValue) {
      alert('Please enter weight');
      return;
    }

    try {
      const supabase = createClient();
      
      // Insert log into Supabase
      console.log('Attempting to save workout:', {
        user_id: user.id,
        exercise_id: selectedExerciseId,
        date: formDate,
        reps: parseInt(reps),
        weight: weightValue,
      });

      const { data, error } = await supabase
        .from('logs')
        .insert({
          user_id: user.id,
          exercise_id: selectedExerciseId,
          date: formDate,
          reps: parseInt(reps),
          weight: weightValue,
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving workout:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        alert(`Error saving workout: ${error.message}. Please check the browser console for details.`);
        return;
      }

      console.log('Successfully saved workout:', data);
      alert('Workout logged successfully!');

      // Refresh workouts from database to ensure consistency
      // This ensures we get all workouts including ones from other months
      const supabaseRefresh = createClient();
      const { data: refreshedData, error: refreshError } = await supabaseRefresh
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

      if (!refreshError && refreshedData) {
        console.log('Refreshed workouts from database:', refreshedData);
        const transformedWorkouts: WorkoutEvent[] = refreshedData.map((log: any) => {
          // Ensure date is in YYYY-MM-DD format
          const logDate = log.date ? (log.date.split('T')[0] || log.date) : '';
          return {
            id: log.id,
            date: logDate,
            exerciseId: log.exercise_id,
            exerciseName: log.exercises?.name || '',
            weight: log.weight || 0,
            reps: log.reps,
          };
        });
        console.log('Updated workouts list:', transformedWorkouts);
        setWorkouts(transformedWorkouts);
      } else {
        if (refreshError) {
          console.error('Error refreshing workouts:', refreshError);
        }
        // Fallback: add to local state if refresh fails
        const newWorkout: WorkoutEvent = {
          id: data.id,
          date: formDate,
          exerciseId: selectedExerciseId,
          exerciseName: selectedExerciseName,
          weight: weightValue || 0,
          reps: parseInt(reps),
        };
        setWorkouts([...workouts, newWorkout]);
      }
      
      // Reset form
      setWeight('');
      setReps('');
      setSelectedExerciseId(null);
      setSelectedExerciseName('');
      setIsWeighted(false);
    } catch (err) {
      console.error('Error saving workout:', err);
      alert('Error saving workout. Please try again.');
    }
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setFormDate(date);
  };

  const handleWorkoutClick = (workout: WorkoutEvent) => {
    setWorkoutToDelete(workout);
  };

  const handleDeleteConfirm = async () => {
    if (!workoutToDelete || !isLoggedIn || !user) return;

    setIsDeleting(true);
    try {
      const supabase = createClient();
      
      // Delete from Supabase
      const { error } = await supabase
        .from('logs')
        .delete()
        .eq('id', workoutToDelete.id)
        .eq('user_id', user.id); // Extra security check

      if (error) {
        console.error('Error deleting workout:', error);
        alert('Error deleting workout. Please try again.');
        setIsDeleting(false);
        return;
      }

      // Refresh workouts from database to ensure consistency
      const supabaseRefresh = createClient();
      const { data: refreshedData, error: refreshError } = await supabaseRefresh
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

      if (!refreshError && refreshedData) {
        console.log('Refreshed workouts after delete:', refreshedData);
        const transformedWorkouts: WorkoutEvent[] = refreshedData.map((log: any) => {
          // Ensure date is in YYYY-MM-DD format
          const logDate = log.date ? (log.date.split('T')[0] || log.date) : '';
          return {
            id: log.id,
            date: logDate,
            exerciseId: log.exercise_id,
            exerciseName: log.exercises?.name || '',
            weight: log.weight || 0,
            reps: log.reps,
          };
        });
        console.log('Updated workouts list after delete:', transformedWorkouts);
        setWorkouts(transformedWorkouts);
      } else {
        if (refreshError) {
          console.error('Error refreshing workouts after delete:', refreshError);
        }
        // Fallback: remove from local state if refresh fails
        setWorkouts(workouts.filter(w => w.id !== workoutToDelete.id));
      }
      
      setWorkoutToDelete(null);
      setIsDeleting(false);
    } catch (err) {
      console.error('Error deleting workout:', err);
      alert('Error deleting workout. Please try again.');
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setWorkoutToDelete(null);
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      <main className="lg:ml-64 px-4 sm:px-6 lg:px-8 py-8 transition-all duration-300">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-2 text-[#F5F5F5] mb-8">
            Workout Calendar
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Log Workout Form */}
            <div className="lg:col-span-1">
              <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6">
                <h2 className="text-xl font-bold mb-4 text-[#F5F5F5]">Log Workout</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#8b8b8b] mb-2">
                      Date
                    </label>
                    <input
                      type="date"
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      className="w-full bg-[#2a2a2a] border border-[#2a2a2a] rounded-xl px-4 py-2 text-white focus:outline-none focus:border-[#d4af37]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#8b8b8b] mb-2">
                      Exercise
                    </label>
                    <ExerciseSearch
                      selectedExerciseId={selectedExerciseId}
                      onSelect={handleExerciseSelect}
                      placeholder="Search exercises..."
                    />
                  </div>

                  {/* Bodyweight toggle for bodyweight exercises */}
                  {isBodyweightExercise && (
                    <div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isWeighted}
                          onChange={(e) => setIsWeighted(e.target.checked)}
                          className="w-4 h-4 bg-[#2a2a2a] border border-[#2a2a2a] rounded text-[#d4af37] focus:ring-[#d4af37]"
                        />
                        <span className="text-sm font-medium text-[#8b8b8b]">Weighted?</span>
                      </label>
                    </div>
                  )}

                  {/* Weight input - only show if not bodyweight or if bodyweight and weighted */}
                  {(!isBodyweightExercise || isWeighted) && (
                    <div>
                      <label className="block text-sm font-medium text-[#8b8b8b] mb-2">
                        Weight (lbs)
                      </label>
                      <input
                        type="number"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        placeholder="185"
                        className="w-full bg-[#2a2a2a] border border-[#2a2a2a] rounded-xl px-4 py-2 text-white focus:outline-none focus:border-[#d4af37]"
                        required={!isBodyweightExercise}
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-[#8b8b8b] mb-2">
                      Reps
                    </label>
                    <input
                      type="number"
                      value={reps}
                      onChange={(e) => setReps(e.target.value)}
                      placeholder="5"
                      className="w-full bg-[#2a2a2a] border border-[#2a2a2a] rounded-xl px-4 py-2 text-white focus:outline-none focus:border-[#d4af37]"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!isLoggedIn}
                    className={`
                      w-full py-3 rounded-xl font-semibold transition-colors
                      ${isLoggedIn 
                        ? 'bg-[#d4af37] text-[#0f0f0f] hover:bg-[#b8941f]' 
                        : 'bg-[#2a2a2a] text-[#8b8b8b] cursor-not-allowed opacity-50'
                      }
                    `}
                  >
                    {isLoggedIn ? 'Log Workout' : 'Log In to Log Workout'}
                  </button>
                </form>
              </div>
            </div>

            {/* Calendar View */}
            <div className="lg:col-span-2">
              <div className={!isLoggedIn ? 'opacity-50 pointer-events-none' : ''}>
                <CalendarView
                  workouts={workouts}
                  selectedDate={selectedDate}
                  onDateSelect={handleDateSelect}
                  onWorkoutClick={handleWorkoutClick}
                />
              </div>
              {!isLoggedIn && (
                <div className="mt-4 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4 text-center">
                  <p className="text-[#8b8b8b] mb-2">You're not logged in. Log in to view and log your workouts.</p>
                  <Link
                    href="/login"
                    className="inline-block bg-[#d4af37] text-[#0f0f0f] px-6 py-2 rounded-xl font-semibold hover:bg-[#b8941f] transition-colors"
                  >
                    Log In
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {workoutToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-white mb-4">Delete Workout?</h3>
            <div className="mb-6">
              <p className="text-[#8b8b8b] mb-2">Are you sure you want to delete this workout?</p>
              <div className="bg-[#2a2a2a] rounded-xl p-4 border border-[#2a2a2a]">
                <div className="text-white font-medium mb-1">{workoutToDelete.exerciseName}</div>
                <div className="text-[#8b8b8b] text-sm">
                  Date: {new Date(workoutToDelete.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </div>
                <div className="text-[#8b8b8b] text-sm">
                  {workoutToDelete.weight > 0 
                    ? `${workoutToDelete.weight} lbs × ${workoutToDelete.reps} reps`
                    : `${workoutToDelete.reps} reps`}
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleDeleteCancel}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-[#2a2a2a] text-white rounded-xl hover:bg-[#1a1a1a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-[#EF4444] text-white rounded-xl hover:bg-[#dc2626] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

