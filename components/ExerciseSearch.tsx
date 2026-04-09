'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabaseClient';

interface Exercise {
  id: string;
  name: string;
  p_muscle: string;
}

interface ExerciseSearchProps {
  selectedExerciseId: string | null;
  onSelect: (exerciseId: string, exerciseName: string) => void;
  placeholder?: string;
}

export default function ExerciseSearch({ selectedExerciseId, onSelect, placeholder = 'Search exercises...' }: ExerciseSearchProps) {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedExerciseName, setSelectedExerciseName] = useState('');
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch exercises from Supabase
  useEffect(() => {
    const fetchExercises = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('exercises')
          .select('id, name, p_muscle')
          .order('name');

        if (error) {
          console.error('Error fetching exercises:', error);
          console.error('Error details:', JSON.stringify(error, null, 2));
          setLoading(false);
          return;
        }

        console.log('Fetched exercises:', data);

        if (data) {
          setExercises(data);
          setFilteredExercises(data);
          
          // Set selected exercise name if exerciseId is provided
          if (selectedExerciseId) {
            const selected = data.find(e => e.id === selectedExerciseId);
            if (selected) {
              setSelectedExerciseName(selected.name);
              setSearchQuery(selected.name);
            }
          }
        } else {
          console.warn('No data returned from exercises query');
        }
        setLoading(false);
      } catch (err) {
        console.error('Error fetching exercises:', err);
        setLoading(false);
      }
    };

    fetchExercises();
  }, [selectedExerciseId]);

  // Filter exercises based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredExercises(exercises);
    } else {
      const filtered = exercises.filter(exercise =>
        exercise.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exercise.p_muscle?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredExercises(filtered);
    }
  }, [searchQuery, exercises]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (exercise: Exercise) => {
    setSelectedExerciseName(exercise.name);
    setSearchQuery(exercise.name);
    onSelect(exercise.id, exercise.name);
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setIsOpen(true);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  return (
    <div className="relative" ref={searchRef}>
      <input
        ref={inputRef}
        type="text"
        value={searchQuery}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        placeholder={loading ? 'Loading exercises...' : placeholder}
        className="w-full bg-[#2a2a2a] border border-[#2a2a2a] rounded-xl px-4 py-2 text-white focus:outline-none focus:border-[#d4af37]"
        disabled={loading}
      />
      
      {isOpen && (searchQuery.trim() === '' ? exercises : filteredExercises).length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl shadow-lg max-h-60 overflow-y-auto">
          {(searchQuery.trim() === '' ? exercises : filteredExercises).map((exercise) => (
            <button
              key={exercise.id}
              type="button"
              onClick={() => handleSelect(exercise)}
              className={`
                w-full text-left px-4 py-2 hover:bg-[#2a2a2a] transition-colors
                ${selectedExerciseId === exercise.id ? 'bg-[#2a2a2a]' : ''}
              `}
            >
              <div className="font-medium text-white">{exercise.name}</div>
              {exercise.p_muscle && (
                <div className="text-xs text-[#8b8b8b]">{exercise.p_muscle}</div>
              )}
            </button>
          ))}
        </div>
      )}

      {isOpen && searchQuery.trim() !== '' && filteredExercises.length === 0 && !loading && exercises.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl shadow-lg p-4 text-center text-[#8b8b8b]">
          No exercises found matching "{searchQuery}"
        </div>
      )}

      {isOpen && !loading && exercises.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl shadow-lg p-4 text-center text-[#8b8b8b]">
          <div className="text-sm mb-2 font-semibold text-white">No exercises loaded</div>
          <div className="text-xs mb-2">Check browser console for errors.</div>
          <div className="text-xs">You may need to set up RLS policies in Supabase.</div>
        </div>
      )}
    </div>
  );
}

