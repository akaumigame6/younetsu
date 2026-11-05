import type { Options, Styles, Locale } from 'react-joyride';

export const TUTORIAL_STORAGE_KEY = 'younetsu_author_tutorial_completed';

/**
 * チュートリアルが完了済みかどうかを判定
 */
export function isTutorialCompleted(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(TUTORIAL_STORAGE_KEY) === 'true';
}

/**
 * チュートリアルを完了済みにマーク
 */
export function markTutorialCompleted(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TUTORIAL_STORAGE_KEY, 'true');
}

/**
 * チュートリアルの状態をリセット（再受講用）
 */
export function resetTutorial(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TUTORIAL_STORAGE_KEY);
}

/**
 * React Joyride v3 共通オプション
 */
export const tourOptions: Partial<Options> = {
  arrowColor: '#FFFFFF',
  backgroundColor: '#FFFFFF',
  overlayColor: 'rgba(0, 0, 0, 0.55)',
  primaryColor: '#333333',
  textColor: '#2C2C2C',
  zIndex: 10000,
  skipBeacon: true,
  showProgress: true,
  blockTargetInteraction: false,
};

/**
 * React Joyride v3 共通スタイル定義
 */
export const tourStyles: Partial<Styles> = {
  tooltip: {
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.16)',
    padding: '20px',
    fontSize: '0.92rem',
    lineHeight: '1.6',
  },
  tooltipTitle: {
    fontSize: '1.05rem',
    fontWeight: 'bold',
    marginBottom: '8px',
  },
  buttonPrimary: {
    backgroundColor: '#333333',
    borderRadius: '8px',
    padding: '8px 16px',
    fontSize: '0.85rem',
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  buttonBack: {
    color: '#666666',
    marginRight: '8px',
    fontSize: '0.85rem',
  },
  buttonSkip: {
    color: '#999999',
    fontSize: '0.85rem',
  },
};

/**
 * 日本語ラベル定義
 */
export const tourLocale: Locale = {
  back: '戻る',
  close: '閉じる',
  last: '完了',
  next: '次へ',
  open: '開く',
  skip: 'スキップ',
};
