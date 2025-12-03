import { Link } from 'react-router-dom';
import { LearningEntry } from '@/types/learning';
import { formatDistanceToNow } from 'date-fns';
import { Star, Clock, CheckCircle2, Circle, Tag, Folder } from 'lucide-react';
import { cn } from '@/lib/utils';

const statusConfig = {
  important: {
    icon: Star,
    label: 'Important',
    className: 'status-important',
  },
  review: {
    icon: Clock,
    label: 'Review Later',
    className: 'status-review',
  },
  completed: {
    icon: CheckCircle2,
    label: 'Completed',
    className: 'status-completed',
  },
  active: {
    icon: Circle,
    label: 'Active',
    className: 'status-active',
  },
};

interface EntryCardProps {
  entry: LearningEntry;
}

export function EntryCard({ entry }: EntryCardProps) {
  const status = statusConfig[entry.status];
  const StatusIcon = status.icon;

  return (
    <Link
      to={`/entry/${entry.id}`}
      className="block group animate-fade-in"
    >
      <article className="card-warm p-5 hover:shadow-card transition-all duration-200 group-hover:border-sage/30">
        <div className="flex items-start justify-between gap-4 mb-3">
          <h3 className="text-lg font-serif text-foreground group-hover:text-sage transition-colors line-clamp-2">
            {entry.title}
          </h3>
          <div className={cn('status-badge shrink-0', status.className)}>
            <StatusIcon className="w-3 h-3" />
            <span>{status.label}</span>
          </div>
        </div>

        {entry.summary && (
          <p className="text-muted-foreground text-sm line-clamp-2 mb-4">
            {entry.summary}
          </p>
        )}

        <div className="flex items-center flex-wrap gap-2 text-xs">
          {entry.topic && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-sage-light/50 text-sage">
              <Folder className="w-3 h-3" />
              {entry.topic.name}
            </span>
          )}
          
          {entry.tags && entry.tags.slice(0, 3).map((tag) => (
            <span
              key={tag.id}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-secondary text-muted-foreground"
            >
              <Tag className="w-3 h-3" />
              {tag.name}
            </span>
          ))}
          {entry.tags && entry.tags.length > 3 && (
            <span className="text-muted-foreground">
              +{entry.tags.length - 3} more
            </span>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-border/50">
          <time className="text-xs text-muted-foreground">
            Updated {formatDistanceToNow(new Date(entry.updated_at), { addSuffix: true })}
          </time>
        </div>
      </article>
    </Link>
  );
}
