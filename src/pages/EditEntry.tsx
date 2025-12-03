import { useParams, useNavigate, Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { EntryForm } from '@/components/entries/EntryForm';
import { useLearningEntry, useUpdateEntry, useDeleteEntry } from '@/hooks/useLearningEntries';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useState } from 'react';

export default function EditEntry() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: entry, isLoading } = useLearningEntry(id);
  const updateEntry = useUpdateEntry();
  const deleteEntry = useDeleteEntry();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleSubmit = async (data: {
    title: string;
    content: string;
    summary: string;
    topic_id: string | null;
    status: any;
    reference_links: string[];
    tagIds: string[];
  }) => {
    if (!id) return;
    try {
      await updateEntry.mutateAsync({ id, ...data });
      toast.success('Entry updated!');
      navigate(`/entry/${id}`);
    } catch (error) {
      toast.error('Failed to update entry');
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    try {
      await deleteEntry.mutateAsync(id);
      toast.success('Entry deleted');
      navigate('/');
    } catch (error) {
      toast.error('Failed to delete entry');
    }
  };

  if (isLoading) {
    return (
      <div className="page-container">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <Skeleton className="h-8 w-32 mb-4" />
            <Skeleton className="h-10 w-64 mb-2" />
            <Skeleton className="h-4 w-48 mb-8" />
            <div className="card-warm p-6">
              <Skeleton className="h-12 w-full mb-4" />
              <Skeleton className="h-12 w-full mb-4" />
              <Skeleton className="h-48 w-full mb-4" />
            </div>
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
          <div className="max-w-2xl mx-auto text-center py-16">
            <h1 className="text-2xl font-serif text-foreground mb-4">Entry not found</h1>
            <Button variant="sage" asChild>
              <Link to="/">Return to Journal</Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="page-container">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8 animate-fade-in">
            <Button variant="ghost" size="sm" asChild className="mb-4 -ml-2">
              <Link to={`/entry/${id}`}>
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Entry
              </Link>
            </Button>
            <h1 className="text-3xl font-serif text-foreground mb-2">
              Edit Entry
            </h1>
            <p className="text-muted-foreground">
              Update your learning notes and details.
            </p>
          </div>

          <div className="card-warm p-6 animate-slide-up">
            <EntryForm 
              entry={entry}
              onSubmit={handleSubmit}
              isSubmitting={updateEntry.isPending}
              onDelete={() => setShowDeleteDialog(true)}
            />
          </div>
        </div>
      </main>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
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
  );
}
