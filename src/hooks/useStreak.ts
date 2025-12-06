import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  todayCompleted: boolean;
  totalDays: number;
  streakHistory: { date: string; count: number }[];
}

export function useStreak() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['streak', user?.id],
    queryFn: async (): Promise<StreakData> => {
      if (!user) throw new Error('Not authenticated');

      const { data: streaks, error } = await supabase
        .from('learning_streaks')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) throw error;

      if (!streaks || streaks.length === 0) {
        return {
          currentStreak: 0,
          longestStreak: 0,
          todayCompleted: false,
          totalDays: 0,
          streakHistory: [],
        };
      }

      const today = new Date().toISOString().split('T')[0];
      const todayCompleted = streaks.some(s => s.date === today);

      // Calculate current streak
      let currentStreak = 0;
      const sortedDates = streaks.map(s => s.date).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
      
      let expectedDate = new Date();
      if (!todayCompleted) {
        expectedDate.setDate(expectedDate.getDate() - 1);
      }

      for (const dateStr of sortedDates) {
        const date = new Date(dateStr);
        const expected = expectedDate.toISOString().split('T')[0];
        
        if (dateStr === expected) {
          currentStreak++;
          expectedDate.setDate(expectedDate.getDate() - 1);
        } else if (dateStr < expected) {
          break;
        }
      }

      // Calculate longest streak
      let longestStreak = 0;
      let tempStreak = 0;
      const ascDates = [...sortedDates].reverse();

      for (let i = 0; i < ascDates.length; i++) {
        if (i === 0) {
          tempStreak = 1;
        } else {
          const prev = new Date(ascDates[i - 1]);
          const curr = new Date(ascDates[i]);
          const diffDays = Math.floor((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
          
          if (diffDays === 1) {
            tempStreak++;
          } else {
            longestStreak = Math.max(longestStreak, tempStreak);
            tempStreak = 1;
          }
        }
      }
      longestStreak = Math.max(longestStreak, tempStreak);

      return {
        currentStreak,
        longestStreak,
        todayCompleted,
        totalDays: streaks.length,
        streakHistory: streaks.slice(0, 30).map(s => ({
          date: s.date,
          count: s.entries_count,
        })),
      };
    },
    enabled: !!user,
  });
}
