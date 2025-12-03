import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { EntryForm } from '@/components/entries/EntryForm';
import { useCreateEntry } from '@/hooks/useLearningEntries';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function NewEntry() {
  const navigate = useNavigate();
  const createEntry = useCreateEntry();

  const handleSubmit = async (data: Parameters<typeof createEntry.mutateAsync>[0]) => {
    try {
      const entry = await createEntry.mutateAsync(data);
      toast.success('Entry created successfully!');
      navigate(`/entry/${entry.id}`);
    } catch (error) {
      toast.error('Failed to create entry');
    }
  };

  return (
    <div className="page-container">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8 animate-fade-in">
            <Button variant="ghost" size="sm" asChild className="mb-4 -ml-2">
              <Link to="/">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Journal
              </Link>
            </Button>
            <h1 className="text-3xl font-serif text-foreground mb-2">
              New Learning Entry
            </h1>
            <p className="text-muted-foreground">
              Capture what you have learned, discovered, or want to remember.
            </p>
          </div>

          <div className="card-warm p-6 animate-slide-up">
            <EntryForm 
              onSubmit={handleSubmit}
              isSubmitting={createEntry.isPending}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
