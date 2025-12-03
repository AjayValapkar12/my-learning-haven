import { EntryStatus } from '@/types/learning';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Star, Clock, CheckCircle2, Circle, LayoutGrid } from 'lucide-react';
import { cn } from '@/lib/utils';

const statusFilters = [
  { value: 'all', label: 'All', icon: LayoutGrid },
  { value: 'important', label: 'Important', icon: Star },
  { value: 'review', label: 'Review', icon: Clock },
  { value: 'active', label: 'Active', icon: Circle },
  { value: 'completed', label: 'Done', icon: CheckCircle2 },
] as const;

interface EntryFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: EntryStatus | 'all';
  onStatusChange: (status: EntryStatus | 'all') => void;
}

export function EntryFilters({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
}: EntryFiltersProps) {
  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder="Search your entries..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 h-12 bg-secondary/50 border-border rounded-xl"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {statusFilters.map((filter) => {
          const Icon = filter.icon;
          const isActive = statusFilter === filter.value;
          
          return (
            <Button
              key={filter.value}
              variant={isActive ? 'sage' : 'secondary'}
              size="sm"
              onClick={() => onStatusChange(filter.value)}
              className={cn(
                'gap-1.5',
                !isActive && 'hover:bg-sage-light/50'
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {filter.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
