import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { EntryCard } from '@/components/entries/EntryCard';
import { EntryFilters } from '@/components/entries/EntryFilters';
import { EmptyState } from '@/components/entries/EmptyState';
import { useLearningEntries } from '@/hooks/useLearningEntries';
import { useTopics } from '@/hooks/useTopics';
import { EntryStatus } from '@/types/learning';
import { Skeleton } from '@/components/ui/skeleton';
import { Folder, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<EntryStatus | 'all'>('all');
  
  const { data: entries, isLoading } = useLearningEntries(searchQuery, statusFilter);
  const { data: topics } = useTopics();

  const hasFilters = searchQuery.length > 0 || statusFilter !== 'all';

  return (
    <div className="page-container">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          {/* Hero Section */}
          <div className="mb-8 animate-fade-in">
            <h1 className="text-3xl md:text-4xl font-serif text-foreground mb-2">
              Your Learning Journal
            </h1>
            <p className="text-muted-foreground">
              {entries?.length 
                ? `${entries.length} entries captured`
                : 'Start capturing your knowledge'}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar - Topics */}
            <aside className="lg:col-span-1 space-y-6">
              <div className="card-warm p-5">
                <h2 className="font-medium text-foreground mb-4 flex items-center gap-2">
                  <Folder className="w-4 h-4 text-sage" />
                  Topics
                </h2>
                {topics && topics.length > 0 ? (
                  <ul className="space-y-1">
                    {topics.map((topic) => (
                      <li key={topic.id}>
                        <button
                          className="w-full text-left px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                        >
                          {topic.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Topics will appear here as you create entries.
                  </p>
                )}
              </div>

              {/* Stats */}
              <div className="card-warm p-5">
                <h2 className="font-medium text-foreground mb-4 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-sage" />
                  Overview
                </h2>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total entries</span>
                    <span className="font-medium text-foreground">{entries?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Important</span>
                    <span className="font-medium text-status-important">
                      {entries?.filter(e => e.status === 'important').length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">To review</span>
                    <span className="font-medium text-status-review">
                      {entries?.filter(e => e.status === 'review').length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Completed</span>
                    <span className="font-medium text-status-completed">
                      {entries?.filter(e => e.status === 'completed').length || 0}
                    </span>
                  </div>
                </div>
              </div>
            </aside>

            {/* Main Content */}
            <div className="lg:col-span-3 space-y-6">
              <EntryFilters
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                statusFilter={statusFilter}
                onStatusChange={setStatusFilter}
              />

              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="card-warm p-5">
                      <Skeleton className="h-6 w-3/4 mb-3" />
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                  ))}
                </div>
              ) : entries && entries.length > 0 ? (
                <div className="space-y-4">
                  {entries.map((entry) => (
                    <EntryCard key={entry.id} entry={entry} />
                  ))}
                </div>
              ) : (
                <EmptyState hasFilters={hasFilters} />
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
