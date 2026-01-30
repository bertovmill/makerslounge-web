export interface ColumnAnalysis {
  columns: Array<{
    original_name: string;
    semantic_type:
      | "name"
      | "email"
      | "skills"
      | "needs"
      | "project"
      | "phase"
      | "interest"
      | "other";
    importance: number;
  }>;
}

export interface Connection {
  from: string;
  to: string;
  reason: string;
  strength: 1 | 2 | 3;
}

export interface Group {
  members: string[];
  theme?: string;
  reason: string;
  connections: Connection[];
}

export interface MatcherSSEEvent {
  type: "step" | "thinking" | "group" | "complete" | "error";
  data: StepEvent | ThinkingEvent | GroupEvent | CompleteEvent | ErrorEvent;
}

export interface StepEvent {
  step: string;
  phase?: string;
  icon?: string;
  progress?: number;
}

export interface ThinkingEvent {
  text: string;
}

export interface GroupEvent {
  group: Group;
  index: number;
}

export interface CompleteEvent {
  groups: Group[];
  columnAnalysis?: ColumnAnalysis;
  message: string;
  tokens?: TokenUsage;
}

export interface TokenUsage {
  input: number;
  output: number;
  estimated?: boolean;
}

export interface ErrorEvent {
  error: string;
}

export interface Contact {
  [key: string]: string;
}
