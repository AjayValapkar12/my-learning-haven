import { useParams, useNavigate, Link, Navigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { useLearningEntry, useDeleteEntry } from '@/hooks/useLearningEntries';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { formatDistanceToNow, format } from 'date-fns';
import { 
  ArrowLeft, 
  Edit, 
  Star, 
  Clock, 
  CheckCircle2, 
  Circle, 
  Tag, 
  Folder, 
  Link as LinkIcon,
  ExternalLink,
  Trash2,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

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

export default function ViewEntry() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: entry, isLoading } = useLearningEntry(id);
  const deleteEntry = useDeleteEntry();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const handleDelete = async () => {
    if (!id) return;
    try {
      await deleteEntry.mutateAsync(id);
      toast.success('Entry deleted');
      navigate('/');
    } catch (error: any) {
      console.error('Failed to delete entry:', error);
      toast.error(error?.message || 'Failed to delete entry');
    }
  };

  if (isLoading) {
    return (
      <div className="page-container">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-3xl mx-auto">
            <Skeleton className="h-8 w-48 mb-4" />
            <Skeleton className="h-12 w-3/4 mb-4" />
            <Skeleton className="h-4 w-1/2 mb-8" />
            <Skeleton className="h-64 w-full" />
          </div>
        </main>
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="page-container">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-3xl mx-auto text-center py-16">
            <h1 className="text-2xl font-serif text-foreground mb-4">Entry not found</h1>
            <Button variant="sage" asChild>
              <Link to="/">Return to Journal</Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const status = statusConfig[entry.status];
  const StatusIcon = status.icon;

  return (
    <div className="page-container">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Navigation */}
          <div className="flex items-center justify-between mb-6 animate-fade-in">
            <Button variant="ghost" size="sm" asChild className="-ml-2">
              <Link to="/">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Journal
              </Link>
            </Button>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" asChild>
                <Link to={`/entry/${id}/edit`}>
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Link>
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this entry?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete your learning entry.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          {/* Entry Content */}
          <article className="card-warm p-8 animate-slide-up">
            {/* Status Badge */}
            <div className={cn('status-badge mb-4', status.className)}>
              <StatusIcon className="w-3 h-3" />
              <span>{status.label}</span>
            </div>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-serif text-foreground mb-4">
              {entry.title}
            </h1>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6 pb-6 border-b border-border">
              <time>
                Created {format(new Date(entry.created_at), 'MMM d, yyyy')}
              </time>
              <span>•</span>
              <time>
                Updated {formatDistanceToNow(new Date(entry.updated_at), { addSuffix: true })}
              </time>
            </div>

            {/* Summary */}
            {entry.summary && (
              <div className="mb-6 p-4 bg-secondary/50 rounded-xl border border-border/50">
                <p className="text-foreground italic">{entry.summary}</p>
              </div>
            )}

            {/* Topic & Tags */}
            <div className="flex flex-wrap gap-2 mb-6">
              {entry.topic && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-sm">
                  <Folder className="w-3.5 h-3.5" />
                  {entry.topic.name}
                </span>
              )}
              {entry.tags?.map((tag) => (
                <span
                  key={tag.id}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-muted-foreground text-sm"
                >
                  <Tag className="w-3.5 h-3.5" />
                  {tag.name}
                </span>
              ))}
            </div>

            {/* Content */}
            {entry.content && (
              <div className="prose prose-neutral max-w-none mb-8">
                <div className="whitespace-pre-wrap text-foreground leading-relaxed">
                  {entry.content}
                </div>
              </div>
            )}

            {/* Reference Links */}
            {entry.reference_links && entry.reference_links.length > 0 && (
              <div className="pt-6 border-t border-border">
                <h2 className="font-medium text-foreground mb-3 flex items-center gap-2">
                  <LinkIcon className="w-4 h-4 text-primary" />
                  References
                </h2>
                <ul className="space-y-2">
                  {entry.reference_links.map((link, index) => (
                    <li key={index}>
                      <a
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-primary hover:underline"
                      >
                        <span className="truncate max-w-md">{link}</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </article>
        </div>
      </main>
    </div>
  );
}
