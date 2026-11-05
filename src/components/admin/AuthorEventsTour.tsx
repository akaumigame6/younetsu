"use client";

import React, { useEffect, useState } from 'react';
import { Joyride, STATUS, ACTIONS, EVENTS, type Step, type EventData } from 'react-joyride';
import { tourOptions, tourStyles, tourLocale } from '../../lib/tutorial';

interface AuthorEventsTourProps {
  run: boolean;
  stepIndex: number;
  onStepChange: (index: number) => void;
  onClose: () => void;
  onOpenModal: () => void;
  onFillSampleData: () => void;
  isTitleFilled: boolean;
  areDatesFilled: boolean;
}

export default function AuthorEventsTour({
  run,
  stepIndex,
  onStepChange,
  onClose,
  onOpenModal,
  onFillSampleData,
  isTitleFilled,
  areDatesFilled,
}: AuthorEventsTourProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const SampleButton = () => (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        onFillSampleData();
      }}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '6px 12px',
        marginTop: '8px',
        backgroundColor: '#F3F4F6',
        border: '1px solid #D1D5DB',
        borderRadius: '6px',
        fontSize: '0.8rem',
        cursor: 'pointer',
        fontWeight: 600,
        color: '#1F2937',
        transition: 'background-color 0.2s',
      }}
      onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#E5E7EB')}
      onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#F3F4F6')}
    >
      ✨ サンプル情報を自動入力する
    </button>
  );

  const steps: Step[] = [
    {
      target: '[data-tour="new-event-btn"]',
      title: '① イベントの新規作成',
      content: (
        <div>
          <p style={{ margin: 0 }}>
            YouNetsuへようこそ！まずは「新規イベント」ボタンを押して、展示会や発表会の枠を作成してみましょう。
          </p>
        </div>
      ),
      skipBeacon: true,
      blockTargetInteraction: false,
      buttons: ['primary', 'skip'],
    },
    {
      target: '[data-tour="tour-event-title"]',
      title: '② イベント名の入力',
      content: (
        <div>
          <p style={{ margin: '0 0 6px 0' }}>
            イベント名を入力します。このまま手入力するか、下のボタンを押すとサンプルが自動入力されます。
          </p>
          <SampleButton />
        </div>
      ),
      skipBeacon: true,
      blockTargetInteraction: false,
      buttons: ['back', 'primary', 'skip'],
    },
    {
      target: '[data-tour="tour-event-dates"]',
      title: '③ 開催期間・場所の設定',
      content: (
        <div>
          <p style={{ margin: '0 0 6px 0' }}>
            開始日・終了日、開催場所を設定します。入力欄を直接クリックして変更できます。
          </p>
          {!areDatesFilled && <SampleButton />}
        </div>
      ),
      skipBeacon: true,
      blockTargetInteraction: false,
      buttons: ['back', 'primary', 'skip'],
    },
    {
      target: '[data-tour="tour-event-exhibits"]',
      title: '④ 個別枠（作家・作品ごと）の設定',
      content: (
        <div>
          <p style={{ margin: 0 }}>
            合同展などで、作家や作品ごとに個別の感想枠（専用QRコード）を発行したい場合はチェックを入れます。呼び名（作家/作品/ブース等）も自由に選択可能です。
          </p>
        </div>
      ),
      skipBeacon: true,
      blockTargetInteraction: false,
      buttons: ['back', 'primary', 'skip'],
    },
    {
      target: '[data-tour="modal-submit-btn"]',
      title: '⑤ イベントを作成する',
      content: (
        <div>
          <p style={{ margin: 0 }}>
            必要な項目が入力できました！「作成する」ボタンを押してイベントを登録しましょう。
          </p>
        </div>
      ),
      skipBeacon: true,
      blockTargetInteraction: false,
      buttons: ['back', 'skip'],
    },
    {
      target: '[data-tour="event-card-dashboard"]',
      title: '⑥ ダッシュボードを開く',
      content: (
        <div>
          <p style={{ margin: 0 }}>
            イベントが作成されました！「ダッシュボードを開く」をクリックして、QRコードの発行や集まった感想の確認画面へ進みましょう。
          </p>
        </div>
      ),
      skipBeacon: true,
      blockTargetInteraction: false,
      buttons: ['skip'],
    },
  ];

  const handleJoyrideEvent = (data: EventData) => {
    const { action, index, status, type } = data;

    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      onClose();
      return;
    }

    if (type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) {
      if (action === ACTIONS.NEXT) {
        if (index === 0) {
          onOpenModal();
        } else if (index === 1 && !isTitleFilled) {
          // タイトルが未入力のまま「次へ」を押した場合は自動でサンプル補完して進める
          onFillSampleData();
        } else if (index === 2 && !areDatesFilled) {
          // 日程が未入力のまま「次へ」を押した場合は自動でサンプル補完して進める
          onFillSampleData();
        }
        onStepChange(index + 1);
      } else if (action === ACTIONS.PREV) {
        onStepChange(index - 1);
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
      options={tourOptions}
      styles={tourStyles}
      locale={tourLocale}
      onEvent={handleJoyrideEvent}
    />
  );
}
