import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTopics, useCreateTopic } from '@/hooks/useTopics';
import { useTags, useCreateTag } from '@/hooks/useTags';
import { LearningEntry, EntryStatus, Tag } from '@/types/learning';
import { toast } from 'sonner';
import { Plus, X, Link as LinkIcon, Trash2, Star, Clock, CheckCircle2, Circle, Mic, MicOff } from 'lucide-react';
import { cn } from '@/lib/utils';

const statusOptions = [
  { value: 'active', label: 'Active', icon: Circle, color: 'text-status-active' },
  { value: 'important', label: 'Important', icon: Star, color: 'text-status-important' },
  { value: 'review', label: 'Review Later', icon: Clock, color: 'text-status-review' },
  { value: 'completed', label: 'Completed', icon: CheckCircle2, color: 'text-status-completed' },
];

interface EntryFormProps {
  entry?: LearningEntry | null;
  onSubmit: (data: {
    title: string;
    content: string;
    summary: string;
    topic_id: string | null;
    status: EntryStatus;
    reference_links: string[];
    tagIds: string[];
  }) => Promise<void>;
  isSubmitting: boolean;
  onDelete?: () => void;
}

export function EntryForm({ entry, onSubmit, isSubmitting, onDelete }: EntryFormProps) {
  const navigate = useNavigate();
  const { data: topics } = useTopics();
  const { data: allTags } = useTags();
  const createTopic = useCreateTopic();
  const createTag = useCreateTag();

  // Form states
  const [title, setTitle] = useState(entry?.title || '');
  const [content, setContent] = useState(entry?.content || '');
  const [summary, setSummary] = useState(entry?.summary || '');
  const [topicId, setTopicId] = useState<string | null>(entry?.topic_id || null);
  const [status, setStatus] = useState<EntryStatus>(entry?.status || 'active');
  const [referenceLinks, setReferenceLinks] = useState<string[]>(entry?.reference_links || []);
  const [selectedTags, setSelectedTags] = useState<Tag[]>(entry?.tags || []);
  const [newLink, setNewLink] = useState('');
  const [newTag, setNewTag] = useState('');
  const [newTopic, setNewTopic] = useState('');

  // Speech recognition
  const recognitionRef = useRef<any>(null);
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');

  useEffect(() => {
    if (entry) {
      setTitle(entry.title);
      setContent(entry.content || '');
      setSummary(entry.summary || '');
      setTopicId(entry.topic_id);
      setStatus(entry.status);
      setReferenceLinks(entry.reference_links || []);
      setSelectedTags(entry.tags || []);
    }
  }, [entry]);

  // -------------------------
  // FULLY STABLE SPEECH RECOGNITION
  // -------------------------
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error("Voice recognition not supported in your browser.");
      return;
    }

    const recog = new SpeechRecognition();
    recog.continuous = true;
    recog.interimResults = true;
    recog.lang = "en-US";

    recog.onstart = () => {
      setIsListening(true);
    };

    recog.onerror = (e: any) => {
      console.log("Speech error:", e.error);
      toast.error("Voice recognition error occurred");
      setIsListening(false);
    };

    recog.onend = () => {
      setIsListening(false);
    };

    recog.onresult = (event: any) => {
      let finalText = "";
      let interim = "";

      for (let i = 0; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          finalText += transcript + " ";
        } else {
          interim += transcript;
        }
      }

      setInterimText(interim);

      if (finalText.trim().length > 0) {
        setContent((prev) => (prev + " " + finalText).trim());
      }
    };

    recognitionRef.current = recog;
  }, []);

  const startListening = () => {
    try {
      recognitionRef.current.start();
      toast.message("Listening…");
    } catch {
      toast.error("Unable to start voice recognition");
    }
  };

  const stopListening = () => {
    try {
      recognitionRef.current.stop();
      toast.message("Stopped");
      setInterimText("");
    } catch {
      toast.error("Unable to stop voice recognition");
    }
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    await onSubmit({
      title: title.trim(),
      content: content.trim(),
      summary: summary.trim(),
      topic_id: topicId,
      status,
      reference_links: referenceLinks.filter(Boolean),
      tagIds: selectedTags.map((t) => t.id),
    });
  };

  // Links
  const addLink = () => {
    if (newLink.trim()) {
      setReferenceLinks([...referenceLinks, newLink.trim()]);
      setNewLink('');
    }
  };

  const removeLink = (index: number) => {
    setReferenceLinks(referenceLinks.filter((_, i) => i !== index));
  };

  // Tags
  const handleAddTag = async () => {
    const tagName = newTag.toLowerCase().trim();
    if (!tagName) return;

    const existing = allTags?.find((t) => t.name === tagName);
    if (existing) {
      if (!selectedTags.find((t) => t.id === existing.id)) {
        setSelectedTags([...selectedTags, existing]);
      }
    } else {
      try {
        const created = await createTag.mutateAsync(tagName);
        setSelectedTags([...selectedTags, created]);
      } catch {
        toast.error('Failed to create tag');
      }
    }
    setNewTag('');
  };

  const removeTag = (tagId: string) => {
    setSelectedTags(selectedTags.filter((t) => t.id !== tagId));
  };

  // Topic
  const handleAddTopic = async () => {
    if (!newTopic.trim()) return;
    try {
      const created = await createTopic.mutateAsync({ name: newTopic.trim() });
      setTopicId(created.id);
      setNewTopic('');
      toast.success('Topic created');
    } catch {
      toast.error('Failed to create topic');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      
      {/* Notes with mic */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="content" className="text-foreground font-medium">Notes</Label>

          <button
            type="button"
            onClick={isListening ? stopListening : startListening}
            className="p-2 rounded-lg bg-secondary hover:bg-sage-light transition"
          >
            {isListening ? (
              <MicOff className="w-5 h-5 text-red-500" />
            ) : (
              <Mic className="w-5 h-5 text-sage" />
            )}
          </button>
        </div>

        <Textarea
          id="content"
          value={`${content}${interimText ? " " + interimText : ""}`}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your detailed notes here... (Markdown supported)"
          className="min-h-[200px] bg-secondary/50 border-border rounded-xl resize-y"
        />
      </div>

      {/* Summary */}
      <div className="space-y-2">
        <Label htmlFor="summary" className="text-foreground font-medium">Summary</Label>
        <Input
          id="summary"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="A brief summary of this entry"
          className="h-11 bg-secondary/50 border-border rounded-xl"
        />
      </div>

      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title" className="text-foreground font-medium">Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What did you learn?"
          className="h-12 text-lg font-serif bg-secondary/50 border-border rounded-xl"
          required
        />
      </div>

      {/* Status */}
      <div className="space-y-2">
        <Label className="text-foreground font-medium">Status</Label>
        <div className="flex flex-wrap gap-2">
          {statusOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = status === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setStatus(option.value as EntryStatus)}
                className={cn(
                  'inline-flex items-center gap-2 px-4 py-2 rounded-xl border transition-all',
                  isSelected
                    ? 'bg-sage text-primary-foreground border-sage'
                    : 'bg-secondary/50 border-border hover:border-sage/50'
                )}
              >
                <Icon className={cn('w-4 h-4', !isSelected && option.color)} />
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Topic */}
      <div className="space-y-2">
        <Label className="text-foreground font-medium">Topic</Label>
        <div className="flex gap-2">
          <Select value={topicId || "none"} onValueChange={(v) => setTopicId(v === "none" ? null : v)}>
            <SelectTrigger className="flex-1 h-11 bg-secondary/50 border-border rounded-xl">
              <SelectValue placeholder="Select a topic" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No topic</SelectItem>
              {topics?.map((topic) => (
                <SelectItem key={topic.id} value={topic.id}>
                  {topic.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Input
              value={newTopic}
              onChange={(e) => setNewTopic(e.target.value)}
              placeholder="New topic"
              className="w-32 h-11 bg-secondary/50 border-border rounded-xl"
            />
            <Button type="button" variant="soft" size="icon" onClick={handleAddTopic} className="h-11 w-11">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <Label className="text-foreground font-medium">Tags</Label>
        <div className="flex flex-wrap gap-2 mb-2">
          {selectedTags.map((tag) => (
            <span
              key={tag.id}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-sage-light text-sage text-sm"
            >
              {tag.name}
              <button type="button" onClick={() => removeTag(tag.id)} className="hover:text-destructive">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
            placeholder="Add a tag"
            className="flex-1 h-11 bg-secondary/50 border-border rounded-xl"
          />
          <Button type="button" variant="soft" onClick={handleAddTag} className="h-11">
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </div>
      </div>

      {/* Reference Links */}
      <div className="space-y-2">
        <Label className="text-foreground font-medium">Reference Links</Label>
        <div className="space-y-2">
          {referenceLinks.map((link, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-secondary/50 rounded-lg text-sm">
                <LinkIcon className="w-4 h-4 text-muted-foreground shrink-0" />
                <a href={link} target="_blank" rel="noopener noreferrer" className="text-sage hover:underline truncate">
                  {link}
                </a>
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={() => removeLink(index)} className="shrink-0">
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={newLink}
            onChange={(e) => setNewLink(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addLink())}
            placeholder="https://..."
            className="flex-1 h-11 bg-secondary/50 border-border rounded-xl"
          />
          <Button type="button" variant="soft" onClick={addLink} className="h-11">
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        {onDelete && (
          <Button type="button" variant="ghost" onClick={onDelete} className="text-destructive hover:text-destructive">
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        )}

        <div className="flex gap-2">
          <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button type="submit" variant="sage" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : entry ? 'Update Entry' : 'Create Entry'}
          </Button>
        </div>
      </div>
    </form>
  );
}
