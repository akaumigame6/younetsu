import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { verifyAdmin } from '../../../../lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  // 開発環境用のエンドポイントなので、本来は環境変数などで制限すべきだが、
  // とりあえず管理者権限のみで実行可能とする
  const admin = await verifyAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // ユーザーIDは固定のテスト用IDを使う
  const userId = 'dev-admin';

  try {
    const customQuestionsArr = [
      { id: 'q_referral', type: 'checkbox', label: 'どこで知りましたか？', options: ['Twitter', 'Instagram', '知人の紹介', 'ポスター', 'その他'] },
      { id: 'q_age', type: 'radio', label: '年代', options: ['10代', '20代', '30代', '40代以上'] },
      { id: 'q_gender', type: 'radio', label: '性別', options: ['男性', '女性', '回答しない'] }
    ];

    const eventsData = [
      {
        id: 'test-pattern-a',
        title: 'パターンA【フル機能】',
        description: 'イベント感想ON / 小枠ON / カスタム質問あり',
        startDate: new Date(),
        endDate: new Date(),
        userId,
        hasEventSurvey: true,
        hasExhibits: true,
        customQuestions: customQuestionsArr,
      },
      {
        id: 'test-pattern-b',
        title: 'パターンB【小枠のみ】',
        description: 'イベント感想OFF / 小枠ON / (カスタム質問なし)',
        startDate: new Date(),
        endDate: new Date(),
        userId,
        hasEventSurvey: false,
        hasExhibits: true,
        customQuestions: null,
      },
      {
        id: 'test-pattern-c',
        title: 'パターンC【イベントのみ】',
        description: 'イベント感想ON / 小枠OFF / カスタム質問あり',
        startDate: new Date(),
        endDate: new Date(),
        userId,
        hasEventSurvey: true,
        hasExhibits: false,
        customQuestions: customQuestionsArr,
      },
      {
        id: 'test-pattern-d',
        title: 'パターンD【最小構成】',
        description: 'イベント感想ON / 小枠ON / カスタム質問なし',
        startDate: new Date(),
        endDate: new Date(),
        userId,
        hasEventSurvey: true,
        hasExhibits: true,
        customQuestions: null,
      },
    ];

    const results = [];

    for (const data of eventsData) {
      // 既存のテストデータがあれば削除
      await prisma.event.deleteMany({ where: { id: data.id } });
      
      const createdEvent = await prisma.event.create({
        data,
      });

      // 小枠(exhibits)の作成（パターンC以外は作成）
      if (data.hasExhibits) {
        await prisma.exhibit.createMany({
          data: [
            {
              eventId: data.id,
              name: '小枠1 (Test)',
              description: 'テスト用小枠1',
              shareToken: `${data.id}-token-1`,
            },
            {
              eventId: data.id,
              name: '小枠2 (Test)',
              description: 'テスト用小枠2',
              shareToken: `${data.id}-token-2`,
            }
          ]
        });
      }
      
      results.push(createdEvent);
    }

    return NextResponse.json({ success: true, events: results });

  } catch (error: any) {
    console.error('Failed to seed test events:', error);
    return NextResponse.json({ error: error.message || 'Failed to seed data' }, { status: 500 });
  }
}
