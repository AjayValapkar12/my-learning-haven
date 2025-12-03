export type EntryStatus = 'active' | 'important' | 'review' | 'completed';

export interface Topic {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface Tag {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

export interface LearningEntry {
  id: string;
  user_id: string;
  title: string;
  content: string | null;
  summary: string | null;
  topic_id: string | null;
  status: EntryStatus;
  reference_links: string[] | null;
  created_at: string;
  updated_at: string;
  topic?: Topic;
  tags?: Tag[];
}

export interface EntryTag {
  entry_id: string;
  tag_id: string;
}
