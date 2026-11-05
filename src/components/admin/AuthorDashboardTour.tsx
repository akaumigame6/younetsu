"use client";

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Joyride, STATUS, ACTIONS, EVENTS, type Step, type EventData } from 'react-joyride';
import { tourOptions, tourStyles, tourLocale, markTutorialCompleted } from '../../lib/tutorial';

export type DashboardTabKey = 'overview' | 'exhibits' | 'exhibit-settings' | 'event-settings';

interface AuthorDashboardTourProps {
  run: boolean;
  onClose: () => void;
  onTabChange?: (tab: DashboardTabKey) => void;
  hasExhibits?: boolean;
}

export default function AuthorDashboardTour({
  run,
  onClose,
  onTabChange,
  hasExhibits = true,
}: AuthorDashboardTourProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  const prevRunRef = useRef(false);
  const onTabChangeRef = useRef(onTabChange);

  useEffect(() => {
    onTabChangeRef.current = onTabChange;
  }, [onTabChange]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // run が false から true に変化した初回のみ初期化（ステップ0とURL発行タブへの切替）を実行
  useEffect(() => {
    if (run && !prevRunRef.current) {
      setStepIndex(0);
      if (onTabChangeRef.current) {
        onTabChangeRef.current('exhibits');
      }
    }
    prevRunRef.current = run;
  }, [run]);

  const steps: Step[] = [
    {
      target: '[data-tour="tour-exhibits-content"]',
      title: '① URL・QRコードの発行',
      content: (
        <div>
          <p style={{ margin: 0 }}>
            鑑賞者に案内する全体のアンケートURLやQRコード、および各個別枠（作家）専用のURLをここで取得・ダウンロードできます。
            会場POPへの印刷やSNSでの共有に利用しましょう。
          </p>
        </div>
      ),
      skipBeacon: true,
      blockTargetInteraction: false,
      buttons: ['primary', 'skip'],
    },
    ...(hasExhibits ? [
      {
        target: '[data-tour="tour-exhibit-settings-content"]',
        title: '② 個別枠の設定と管理',
        content: (
          <div>
            <p style={{ margin: 0 }}>
              各作家や作品名をクリックしてアコーディオンを展開すると、表示名や紹介文（プロフィール文）をいつでも編集・保存できます。
            </p>
          </div>
        ),
        skipBeacon: true,
        blockTargetInteraction: false,
        buttons: ['back', 'primary', 'skip'],
      } as Step
    ] : []),
    {
      target: '[data-tour="tour-event-settings-content"]',
      title: hasExhibits ? '③ イベント全体の設定・質問項目' : '② イベント全体の設定・質問項目',
      content: (
        <div>
          <p style={{ margin: 0 }}>
            アンケートに「年齢を聞く」「性別を聞く」などの追加質問をチェックボックスで自由に追加できます。
            感想の既読管理機能や呼称（作家・作品など）の変更もここで行えます。
          </p>
        </div>
      ),
      skipBeacon: true,
      blockTargetInteraction: false,
      buttons: ['back', 'primary', 'skip'],
    },
    {
      target: '[data-tour="tour-overview-content"]',
      title: hasExhibits ? '④ 集まった感想・回答の確認' : '③ 集まった感想・回答の確認',
      content: (
        <div>
          <p style={{ margin: 0 }}>
            鑑賞者から届いた感想数や回答サマリーがリアルタイムに表示されます。
            スクロールすると、AIによる要約分析やメッセージ一覧の閲覧、CSVでの一括ダウンロードも可能です。
          </p>
        </div>
      ),
      skipBeacon: true,
      blockTargetInteraction: false,
      buttons: ['back', 'primary', 'skip'],
    },
    {
      target: '[data-tour="dashboard-header"]',
      title: '🎉 チュートリアル完了！',
      content: (
        <div>
          <p style={{ margin: 0 }}>
            お疲れ様でした！以上でダッシュボードの基本操作の案内は終了です。
            <br /><br />
            作成したイベントはこのまま本番利用していただけます（不要な場合は、左上の「一覧へ」から戻り、ゴミ箱アイコンで削除できます）。
          </p>
        </div>
      ),
      skipBeacon: true,
      buttons: ['primary'],
    },
  ];

  // ステップインデックスに応じたタブ切り替え
  const syncTabWithStep = (targetIndex: number) => {
    if (!onTabChangeRef.current) return;

    if (hasExhibits) {
      if (targetIndex === 0) onTabChangeRef.current('exhibits');
      else if (targetIndex === 1) onTabChangeRef.current('exhibit-settings');
      else if (targetIndex === 2) onTabChangeRef.current('event-settings');
      else if (targetIndex === 3) onTabChangeRef.current('overview');
      else if (targetIndex === 4) onTabChangeRef.current('overview');
    } else {
      if (targetIndex === 0) onTabChangeRef.current('exhibits');
      else if (targetIndex === 1) onTabChangeRef.current('event-settings');
      else if (targetIndex === 2) onTabChangeRef.current('overview');
      else if (targetIndex === 3) onTabChangeRef.current('overview');
    }
  };

  const handleJoyrideEvent = (data: EventData) => {
    const { action, index, status, type } = data;

    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      onClose();
      markTutorialCompleted();
      // URLパラメータのクリーンアップ (?tour=continue を消す)
      if (typeof window !== 'undefined' && searchParams.get('tour') === 'continue') {
        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.delete('tour');
        router.replace(currentUrl.pathname);
      }
      return;
    }

    if (type === EVENTS.STEP_AFTER) {
      if (action === ACTIONS.NEXT) {
        const nextIndex = index + 1;
        syncTabWithStep(nextIndex);
        setStepIndex(nextIndex);
      } else if (action === ACTIONS.PREV) {
        const prevIndex = index - 1;
        syncTabWithStep(prevIndex);
        setStepIndex(prevIndex);
      } else if (action === ACTIONS.CLOSE) {
        onClose();
      }
    }
  };

  if (!mounted) return null;

  return (
    <Joyride
      steps={steps}
      run={run}
      stepIndex={stepIndex}
      continuous
      options={{
        ...tourOptions,
        targetWaitTimeout: 3000,
      }}
      styles={tourStyles}
      locale={tourLocale}
      onEvent={handleJoyrideEvent}
    />
  );
}
