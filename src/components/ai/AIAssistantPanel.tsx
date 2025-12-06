import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useAIAssistant } from '@/hooks/useAIAssistant';
import { useLearningEntries } from '@/hooks/useLearningEntries';
import { Sparkles, Search, GraduationCap, Lightbulb, Loader2, X, Brain, BookOpen, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface AIAssistantPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AIAssistantPanel({ isOpen, onClose }: AIAssistantPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [interviewTopic, setInterviewTopic] = useState('');
  const { data: entries = [] } = useLearningEntries();
  const { isLoading, response, error, smartSearch, getInterviewPrep, getInsights, reset } = useAIAssistant({ entries });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      smartSearch(searchQuery);
    }
  };

  const handleInterviewPrep = (e: React.FormEvent) => {
    e.preventDefault();
    getInterviewPrep(interviewTopic);
  };

  if (!isOpen) return null;

  const hasEntries = entries.length > 0;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="fixed inset-y-0 right-0 w-full max-w-2xl bg-card border-l border-border shadow-elevated animate-slide-in-right">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10">
                <Brain className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-serif text-lg font-semibold text-foreground">AI Learning Assistant</h2>
                <p className="text-xs text-muted-foreground">
                  {hasEntries ? `Analyzing ${entries.length} learning entries` : 'Add entries to unlock AI features'}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {!hasEntries ? (
            <div className="flex-1 flex items-center justify-center p-8">
              <Card className="p-8 text-center max-w-md bg-muted/30 border-dashed">
                <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="font-semibold text-lg mb-2">No Learning Entries Yet</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Start adding learning entries to unlock AI-powered search, interview preparation, and insights.
                </p>
                <Button onClick={onClose} variant="outline">
                  Add Your First Entry
                </Button>
              </Card>
            </div>
          ) : (
            <Tabs defaultValue="search" className="flex-1 flex flex-col overflow-hidden">
              <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent p-0 h-auto flex-shrink-0">
                <TabsTrigger 
                  value="search" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3 px-4"
                  onClick={reset}
                >
                  <Search className="w-4 h-4 mr-2" />
                  Smart Search
                </TabsTrigger>
                <TabsTrigger 
                  value="interview" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3 px-4"
                  onClick={reset}
                >
                  <GraduationCap className="w-4 h-4 mr-2" />
                  Interview Prep
                </TabsTrigger>
                <TabsTrigger 
                  value="insights" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-3 px-4"
                  onClick={reset}
                >
                  <Lightbulb className="w-4 h-4 mr-2" />
                  Insights
                </TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-hidden">
                <TabsContent value="search" className="h-full m-0 p-4 flex flex-col">
                  <form onSubmit={handleSearch} className="flex gap-2 mb-4 flex-shrink-0">
                    <Input
                      placeholder="Ask anything about your learnings..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="flex-1"
                    />
                    <Button type="submit" disabled={isLoading || !searchQuery.trim()}>
                      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    </Button>
                  </form>
                  <AIResponseArea response={response} error={error} isLoading={isLoading} type="search" />
                </TabsContent>

                <TabsContent value="interview" className="h-full m-0 p-4 flex flex-col">
                  <div className="mb-4 flex-shrink-0">
                    <p className="text-sm text-muted-foreground mb-3">
                      Generate interview questions based on your learning entries. Optionally focus on a specific topic.
                    </p>
                    <form onSubmit={handleInterviewPrep} className="flex gap-2">
                      <Input
                        placeholder="e.g., React hooks, System design, JavaScript..."
                        value={interviewTopic}
                        onChange={(e) => setInterviewTopic(e.target.value)}
                        className="flex-1"
                      />
                      <Button type="submit" disabled={isLoading}>
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <GraduationCap className="w-4 h-4" />}
                        <span className="ml-2">Generate</span>
                      </Button>
                    </form>
                  </div>
                  <AIResponseArea response={response} error={error} isLoading={isLoading} type="interview" />
                </TabsContent>

                <TabsContent value="insights" className="h-full m-0 p-4 flex flex-col">
                  <div className="mb-4 flex-shrink-0">
                    <p className="text-sm text-muted-foreground mb-3">
                      Get AI-powered insights about your learning patterns, knowledge gaps, and suggestions for improvement.
                    </p>
                    <Button onClick={() => getInsights()} disabled={isLoading} className="w-full">
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <Sparkles className="w-4 h-4 mr-2" />
                      )}
                      Analyze My Learning Patterns
                    </Button>
                  </div>
                  <AIResponseArea response={response} error={error} isLoading={isLoading} type="insights" />
                </TabsContent>
              </div>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
}

function AIResponseArea({ 
  response, 
  error, 
  isLoading,
  type 
}: { 
  response: string; 
  error: string | null; 
  isLoading: boolean;
  type: 'search' | 'interview' | 'insights';
}) {
  const placeholderText = {
    search: 'Search results will appear here',
    interview: 'Interview questions will be generated here',
    insights: 'Your learning insights will appear here'
  };

  if (error) {
    return (
      <Card className="flex-1 p-4 bg-destructive/5 border-destructive/20">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-destructive font-medium text-sm">Something went wrong</p>
            <p className="text-destructive/80 text-sm mt-1">{error}</p>
          </div>
        </div>
      </Card>
    );
  }

  if (!response && !isLoading) {
    return (
      <Card className="flex-1 flex items-center justify-center p-8 bg-muted/30 border-dashed">
        <div className="text-center text-muted-foreground">
          <Sparkles className="w-8 h-8 mx-auto mb-3 opacity-50" />
          <p className="text-sm">{placeholderText[type]}</p>
        </div>
      </Card>
    );
  }

  return (
    <ScrollArea className="flex-1 min-h-0">
      <Card className="p-5 bg-secondary/30">
        {response ? (
          <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:font-serif prose-headings:text-foreground prose-p:text-foreground/90 prose-strong:text-foreground prose-li:text-foreground/90">
            <ReactMarkdown
              components={{
                h1: ({ children }) => <h1 className="text-xl font-serif font-semibold mb-4 mt-2">{children}</h1>,
                h2: ({ children }) => <h2 className="text-lg font-serif font-semibold mb-3 mt-4">{children}</h2>,
                h3: ({ children }) => <h3 className="text-base font-serif font-medium mb-2 mt-3">{children}</h3>,
                p: ({ children }) => <p className="mb-3 leading-relaxed">{children}</p>,
                ul: ({ children }) => <ul className="list-disc pl-5 mb-3 space-y-1">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal pl-5 mb-3 space-y-1">{children}</ol>,
                li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                code: ({ children }) => (
                  <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>
                ),
                pre: ({ children }) => (
                  <pre className="bg-muted p-3 rounded-lg overflow-x-auto mb-3 text-sm">{children}</pre>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-2 border-primary/50 pl-4 italic text-muted-foreground mb-3">
                    {children}
                  </blockquote>
                ),
              }}
            >
              {response}
            </ReactMarkdown>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>AI is thinking...</span>
          </div>
        )}
      </Card>
    </ScrollArea>
  );
}
