import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BookOpen, Plus, Sparkles } from 'lucide-react';

interface EmptyStateProps {
  hasFilters?: boolean;
}

export function EmptyState({ hasFilters }: EmptyStateProps) {
  if (hasFilters) {
    return (
      <div className="text-center py-16 animate-fade-in">
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-secondary flex items-center justify-center">
          <BookOpen className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-serif text-foreground mb-2">No entries found</h3>
        <p className="text-muted-foreground mb-6">
          Try adjusting your search or filters
        </p>
      </div>
    );
  }

  return (
    <div className="text-center py-16 animate-fade-in">
      <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-sage-light/50 flex items-center justify-center">
        <Sparkles className="w-10 h-10 text-sage" />
      </div>
      <h3 className="text-2xl font-serif text-foreground mb-3">Start Your Learning Journey</h3>
      <p className="text-muted-foreground mb-8 max-w-md mx-auto">
        Capture your first insight, note, or discovery. Every learning journey begins with a single step.
      </p>
      <Button variant="sage" size="lg" asChild>
        <Link to="/entry/new">
          <Plus className="w-5 h-5" />
          Create Your First Entry
        </Link>
      </Button>
    </div>
  );
}
