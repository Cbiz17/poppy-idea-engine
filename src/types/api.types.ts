// Database response types based on your schema
// These types represent what Supabase returns from queries

export interface DatabaseIdea {
  id: string;
  user_id: string;
  title: string;
  content: string;
  category: string;
  tags: string[] | null;
  metadata: Record<string, any> | null;
  embedding: number[] | null;
  is_public: boolean;
  branched_from_id: string | null;
  branch_note: string | null;
  is_branch: boolean;
  development_stage: 'initial' | 'developing' | 'refined' | 'completed';
  development_count: number;
  ai_generated_summary: string | null;
  last_activity: string;
  archived: boolean;
  pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface DatabaseIdeaWithBranches extends DatabaseIdea {
  branches?: Pick<DatabaseIdea, 'id' | 'title'>[];
}

export interface DatabaseIdeaDevelopmentHistory {
  id: string;
  idea_id: string;
  user_id: string;
  conversation_id: string | null;
  development_type: 'refinement' | 'expansion' | 'pivot' | 'merge' | 'major_revision' | 'branch';
  previous_version: {
    title: string;
    content: string;
    category: string;
    timestamp: string;
  };
  new_version: {
    title: string;
    content: string;
    category: string;
    timestamp: string;
  };
  ai_confidence_score: number | null;
  change_summary: string;
  version_number: number;
  tags: string[] | null;
  development_metadata: Record<string, any> | null;
  parent_history_id: string | null;
  branch_name: string | null;
  created_at: string;
}

export interface DatabaseConversation {
  id: string;
  user_id: string;
  title: string | null;
  summary: string | null;
  idea_id: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface DatabaseConversationMessage {
  id: string;
  conversation_id: string;
  user_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  embedding: number[] | null;
  metadata: Record<string, any> | null;
  created_at: string;
}

export interface DatabaseUser {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  preferences: Record<string, any> | null;
  onboarding_completed: boolean;
  onboarding_step: number | null;
  created_at: string;
  updated_at: string;
}

// API Response Types
export interface IdeasListResponse {
  ideas: DatabaseIdeaWithBranches[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface IdeaResponse {
  idea: DatabaseIdea;
}

export interface IdeaHistoryResponse {
  history: DatabaseIdeaDevelopmentHistory[];
}

// Input Types for API requests
export interface CreateIdeaInput {
  title: string;
  content: string;
  category: string;
  conversationId?: string;
  continuationContext?: {
    relatedIdeaId: string;
    confidence: number;
    detectionMethod: string;
    timeSinceLastUpdate?: number;
  };
  originalIdeaId?: string;
  branchedFromId?: string;
  branchNote?: string;
  isBranch?: boolean;
  saveType?: 'new' | 'update' | 'merge';
  metadata?: Record<string, any>;
}

export interface UpdateIdeaInput {
  title: string;
  content: string;
  category: string;
  conversationId?: string;
  developmentType?: 'refinement' | 'expansion' | 'pivot' | 'merge' | 'major_revision';
  metadata?: {
    confidence?: number;
    tags?: string[];
    [key: string]: any;
  };
}

// Supabase Query Builders with proper types
export type IdeaInsert = Omit<DatabaseIdea, 'id' | 'created_at' | 'updated_at'>;
export type IdeaUpdate = Partial<Omit<DatabaseIdea, 'id' | 'user_id' | 'created_at'>>;

// Error Response Type
export interface ErrorResponse {
  error: string;
  details?: string;
}
