import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAIAssistant } from '@/hooks/useAIAssistant';
import { useLearningEntries } from '@/hooks/useLearningEntries';
import { Sparkles, Search, GraduationCap, Lightbulb, Loader2, X, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';

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
                <h2 className="font-serif text-lg font-semibold text-foreground">AI Assistant</h2>
                <p className="text-xs text-muted-foreground">Powered by your learning entries</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="search" className="flex-1 flex flex-col">
            <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent p-0 h-auto">
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
                <form onSubmit={handleSearch} className="flex gap-2 mb-4">
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
                <AIResponseArea response={response} error={error} isLoading={isLoading} />
              </TabsContent>

              <TabsContent value="interview" className="h-full m-0 p-4 flex flex-col">
                <form onSubmit={handleInterviewPrep} className="flex gap-2 mb-4">
                  <Input
                    placeholder="Focus on a specific topic (optional)..."
                    value={interviewTopic}
                    onChange={(e) => setInterviewTopic(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <GraduationCap className="w-4 h-4" />}
                    Generate
                  </Button>
                </form>
                <AIResponseArea response={response} error={error} isLoading={isLoading} />
              </TabsContent>

              <TabsContent value="insights" className="h-full m-0 p-4 flex flex-col">
                <div className="mb-4">
                  <Button onClick={() => getInsights()} disabled={isLoading} className="w-full">
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Sparkles className="w-4 h-4 mr-2" />
                    )}
                    Analyze My Learning Patterns
                  </Button>
                </div>
                <AIResponseArea response={response} error={error} isLoading={isLoading} />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function AIResponseArea({ response, error, isLoading }: { response: string; error: string | null; isLoading: boolean }) {
  if (error) {
    return (
      <Card className="flex-1 p-4 bg-destructive/5 border-destructive/20">
        <p className="text-destructive text-sm">{error}</p>
      </Card>
    );
  }

  if (!response && !isLoading) {
    return (
      <Card className="flex-1 flex items-center justify-center p-8 bg-muted/30 border-dashed">
        <div className="text-center text-muted-foreground">
          <Sparkles className="w-8 h-8 mx-auto mb-3 opacity-50" />
          <p className="text-sm">AI responses will appear here</p>
        </div>
      </Card>
    );
  }

  return (
    <ScrollArea className="flex-1">
      <Card className="p-4 bg-secondary/30 min-h-[200px]">
        <div className="prose prose-sm max-w-none dark:prose-invert">
          {response ? (
            <div className="whitespace-pre-wrap">{response}</div>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Thinking...</span>
            </div>
          )}
        </div>
      </Card>
    </ScrollArea>
  );
}
