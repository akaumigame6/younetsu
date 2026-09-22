import type { Creator, FeedbackRecord, SurveyRecord } from '../types';

// ========================
// モック作家データ
// ========================
export const mockCreators: Creator[] = [
  {
    id: 'creator-1',
    name: '山田 花子',
    description: '油絵・アクリル画を中心に制作しています。自然や光をモチーフにした作品が多いです。',
    shareToken: 'token-yamada-hanako',
    iconUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23FFD1DC"/><text x="50" y="60" font-size="40" text-anchor="middle">🎨</text></svg>',
  },
  {
    id: 'creator-2',
    name: '鈴木 一郎',
    description: '写真作家。都市の片隅に潜む光と影を追い続けています。',
    shareToken: 'token-suzuki-ichiro',
    iconUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23AEC6CF"/><text x="50" y="60" font-size="40" text-anchor="middle">📷</text></svg>',
  },
  {
    id: 'creator-3',
    name: '佐藤 美咲',
    description: '陶芸家。土の温もりと偶然生まれる造形を大切にしています。',
    shareToken: 'token-sato-misaki',
    iconUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23FFB347"/><text x="50" y="60" font-size="40" text-anchor="middle">🏺</text></svg>',
  },
  {
    id: 'creator-4',
    name: '田中 蒼',
    description: 'デジタルアートを中心に、抽象表現を探求しています。',
    shareToken: 'token-tanaka-ao',
    iconUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23B39EB5"/><text x="50" y="60" font-size="40" text-anchor="middle">💻</text></svg>',
  },
];

// ========================
// モック感想データ
// ========================
export const mockFeedbacks: FeedbackRecord[] = [
  {
    id: 'feedback-1',
    creatorId: 'creator-1',
    inputType: 'questions',
    content: '',
    q1: ['喜び', '安らぎ'],
    q2: '光の表現、柔らかな色合い',
    q3: '子供の頃の夏の記憶と重なったから',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    reaction: 'read',
    isRead: true,
  },
  {
    id: 'feedback-2',
    creatorId: 'creator-1',
    inputType: 'free',
    content: 'とても心に響く作品でした。しばらく立ち止まって見てしまいました。',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
    isRead: false,
  },
  {
    id: 'feedback-3',
    creatorId: 'creator-2',
    inputType: 'questions',
    content: '',
    q1: ['驚き', '期待'],
    q2: '構図のダイナミズム',
    q3: 'こんな場所がこの街にあるとは知らなかった',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    updatedAt: new Date(Date.now() - 7200000).toISOString(),
    isRead: false,
  },
];

// ========================
// モックイベントアンケートデータ
// ========================
export const mockSurveys: SurveyRecord[] = [
  {
    id: 'survey-1',
    eventId: 'dummy-event',
    inputType: 'free',
    content: 'とても素晴らしい展示会でした。次回も楽しみにしています。',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'survey-2',
    eventId: 'dummy-event',
    inputType: 'questions',
    content: '',
    q1: ['感動', '驚き'],
    q2: '全体の空間デザイン',
    q3: '統一感があり没入できたため',
    createdAt: new Date(Date.now() - 40000000).toISOString(),
    updatedAt: new Date(Date.now() - 40000000).toISOString(),
  },
];

// ========================
// shareToken から Creator を取得するユーティリティ
// ========================
export const findCreatorByToken = (token: string): Creator | undefined => {
  return mockCreators.find((c) => c.shareToken === token);
};

export const findCreatorById = (id: string): Creator | undefined => {
  return mockCreators.find((c) => c.id === id);
};

export const getFeedbacksByCreatorId = (creatorId: string): FeedbackRecord[] => {
  return mockFeedbacks.filter((f) => f.creatorId === creatorId);
};
