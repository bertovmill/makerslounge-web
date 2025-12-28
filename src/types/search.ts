export interface SearchRequest {
  query: string;
  currentUserId?: string;
  filters?: {
    skills?: string[];
    limit?: number;
  };
}

export interface SearchResponse {
  results: Profile[];
  metadata: SearchMetadata;
}

export interface SearchMetadata {
  interpretation: string;
  searchStrategy: SearchStrategy;
  totalMatches: number;
  processingTimeMs: number;
}

export type SearchStrategy = 'keyword' | 'skill_match' | 'semantic' | 'similarity';

export interface ClaudeSearchResponse {
  strategy: SearchStrategy;
  interpretation: string;
  filters: {
    skills?: string[];
    bioKeywords?: string[];
    projectKeywords?: string[];
    nameQuery?: string;
  };
  semanticCriteria?: {
    description: string;
    emphasis: string[];
  };
}

export interface Profile {
  id: string;
  name: string | null;
  photo_url: string | null;
  bio: string | null;
  skills: string[] | null;
}
