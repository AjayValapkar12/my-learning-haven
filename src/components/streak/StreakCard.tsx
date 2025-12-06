import { useStreak } from '@/hooks/useStreak';
import { Card } from '@/components/ui/card';
import { Flame, Trophy, Calendar, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export function StreakCard() {
  const { data: streak, isLoading } = useStreak();

  if (isLoading) {
    return (
      <Card className="p-5 animate-pulse">
        <div className="h-20 bg-muted rounded-lg" />
      </Card>
    );
  }

  if (!streak) return null;

  const { currentStreak, longestStreak, todayCompleted, totalDays, streakHistory } = streak;

  return (
    <Card className="p-5 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber/30">
      <div className="flex items-center gap-3 mb-4">
        <div className={cn(
          "p-2.5 rounded-xl",
          todayCompleted 
            ? "bg-gradient-to-br from-orange-400 to-amber-500 shadow-lg shadow-amber/30" 
            : "bg-muted"
        )}>
          <Flame className={cn(
            "w-5 h-5",
            todayCompleted ? "text-white" : "text-muted-foreground"
          )} />
        </div>
        <div>
          <h3 className="font-medium text-foreground">Learning Streak</h3>
          <p className="text-xs text-muted-foreground">
            {todayCompleted ? "You've learned today! 🎉" : "Add a learning to continue your streak"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center p-3 bg-background/50 rounded-xl">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Flame className="w-4 h-4 text-status-important" />
          </div>
          <p className="text-2xl font-bold text-foreground">{currentStreak}</p>
          <p className="text-xs text-muted-foreground">Current</p>
        </div>
        <div className="text-center p-3 bg-background/50 rounded-xl">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Trophy className="w-4 h-4 text-status-review" />
          </div>
          <p className="text-2xl font-bold text-foreground">{longestStreak}</p>
          <p className="text-xs text-muted-foreground">Longest</p>
        </div>
        <div className="text-center p-3 bg-background/50 rounded-xl">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Calendar className="w-4 h-4 text-status-completed" />
          </div>
          <p className="text-2xl font-bold text-foreground">{totalDays}</p>
          <p className="text-xs text-muted-foreground">Total Days</p>
        </div>
      </div>

      {/* Mini streak calendar */}
      <div className="mt-4">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Last 14 days</span>
        </div>
        <div className="flex gap-1">
          {Array.from({ length: 14 }).map((_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (13 - i));
            const dateStr = date.toISOString().split('T')[0];
            const hasEntry = streakHistory.some(h => h.date === dateStr);
            
            return (
              <div
                key={i}
                className={cn(
                  "w-full h-6 rounded-sm transition-colors",
                  hasEntry 
                    ? "bg-gradient-to-t from-orange-400 to-amber-400" 
                    : "bg-muted/50"
                )}
                title={`${dateStr}: ${hasEntry ? 'Learned!' : 'No entries'}`}
              />
            );
          })}
        </div>
      </div>
    </Card>
  );
}
