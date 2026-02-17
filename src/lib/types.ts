export type Understanding = "understood" | "partial" | "not_understood";

export interface Document {
  id: string;
  title: string;
  original_filename: string;
  created_at: string;
}

export interface Sentence {
  id: string;
  document_id: string;
  content: string;
  position: number;
  understanding: Understanding;
  created_at: string;
}

export interface StudyGuide {
  id: string;
  document_id: string;
  content: string;
  created_at: string;
}

export interface Quiz {
  id: string;
  document_id: string;
  created_at: string;
}

export interface QuizQuestion {
  id: string;
  quiz_id: string;
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string | null;
  position: number;
}
