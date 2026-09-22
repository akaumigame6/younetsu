// ========================
// Exhibit (小枠: 作家・作品など) Types
// ========================
export interface Exhibit {
  id: string;
  eventId: string;
  name: string;
  description?: string;
  shareToken: string; // URLで共有するためのトークン
  iconUrl?: string; // アイコン画像URL
  createdAt: string;
  updatedAt: string;
}

// ========================
// Survey (イベントアンケート) Types
// ========================
export type SurveyInputType = 'free' | 'questions';

export interface SurveyFreeData {
  type: 'free';
  content: string;
  q1?: string[];
  q2?: string;
  q3?: string;
  referralSources?: string[];
}

export interface SurveyQuestionsData {
  type: 'questions';
  selectedEmotions?: string[];
  freeEmotion?: string;
  q1: string[]; // 感情文字列配列
  q2: string; // どこで感じたか
  q3: string; // その理由
  content?: string;
  referralSources?: string[];
}

export type SurveyData = SurveyFreeData | SurveyQuestionsData;

// ========================
// Feedback (小枠への感想) Types
// ========================
export type FeedbackInputType = 'free' | 'questions';

export interface FeedbackFreeData {
  type: 'free';
  content: string;
  q1?: string[];
  q2?: string;
  q3?: string;
}

export interface FeedbackQuestionsData {
  type: 'questions';
  selectedEmotions?: string[];
  freeEmotion?: string;
  q1: string[];
  q2: string;
  q3: string;
  content?: string;
}

export type FeedbackData = FeedbackFreeData | FeedbackQuestionsData;

// ========================
// Submitted Exhibit Feedback Record (小枠への感想)
// ========================
export interface ExhibitFeedback {
  id: string;
  exhibitId: string;
  viewerId?: string | null;
  inputType: string;
  content: string;
  q1?: string[];
  q2?: string | null;
  q3?: string | null;
  eventFeedbackId?: string | null;
  reaction?: string | null;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

// ========================
// Submitted Event Feedback Record (大枠イベント全体への感想)
// ========================
export interface EventFeedback {
  id: string;
  eventId: string;
  viewerId?: string | null;
  inputType: string;
  content: string;
  q1?: string[];
  q2?: string | null;
  q3?: string | null;
  referralSources?: string[];
  customAnswers?: string | null;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

// ========================
// Admin (イベント主催者) Types
// ========================
export interface AdminUser {
  id: string;
  email: string;
}
