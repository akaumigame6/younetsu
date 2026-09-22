import { PrismaClient } from '@prisma/client';
import { mockExhibits, mockExhibitFeedbacks, mockEventFeedbacks } from '../src/data/mockData';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. デフォルトイベントの作成 (mockEventFeedbacksが参照するため)

  let event = await prisma.event.findUnique({ where: { id: 'dummy-event' } });
  if (!event) {
    event = await prisma.event.create({
      data: {
        id: 'dummy-event',
        adminId: 'dummy-admin',
        title: '緑市 マルシェ (Mock)',
        description: 'モックデータ用のイベント',
        startDate: new Date(),
        endDate: new Date(),
        location: '〇〇ギャラリー',
        eventQ2Placeholder: '例：〇〇の展示で、入り口の雰囲気から',
        eventQ3Placeholder: '例：色使いがとても綺麗だったから',
        creatorQ2Placeholder: '例：作品の〇〇の表現から',
        creatorQ3Placeholder: '例：不思議な魅力があったから',
        freeEventPlaceholder: '例：素晴らしい体験でした。特に〇〇が印象に残りました。',
        freeCreatorPlaceholder: '例：素晴らしい体験でした。特に〇〇が印象に残りました。',
        referralSources: 'X(旧Twitter),Instagram,ポスター/チラシ,知人の紹介,その他',
      }
    });
    console.log(`Created event: ${event.title}`);
  }

  // 2. Exhibits (小枠) の追加
  for (const exhibit of mockExhibits) {
    const existing = await prisma.exhibit.findUnique({ where: { id: exhibit.id } });
    if (!existing) {
      await prisma.exhibit.create({
        data: {
          id: exhibit.id,
          eventId: event.id,
          name: exhibit.name,
          description: exhibit.description,
          shareToken: exhibit.shareToken,
          iconUrl: exhibit.iconUrl,
        }
      });
      console.log(`Created exhibit: ${exhibit.name}`);
    }
  }

  // 3. ExhibitFeedbacks (小枠への感想) の追加
  for (const feedback of mockExhibitFeedbacks) {
    const existing = await prisma.exhibitFeedback.findUnique({ where: { id: feedback.id } });
    if (!existing) {
      await prisma.exhibitFeedback.create({
        data: {
          id: feedback.id,
          exhibitId: feedback.exhibitId,
          inputType: feedback.inputType,
          content: feedback.content,
          q1: JSON.stringify(feedback.q1 || []),
          q2: feedback.q2,
          q3: feedback.q3,
          reaction: feedback.reaction,
          isRead: feedback.isRead,
          createdAt: new Date(feedback.createdAt),
          updatedAt: new Date(feedback.updatedAt),
        }
      });
      console.log(`Created exhibit feedback: ${feedback.id}`);
    }
  }

  // 4. EventFeedbacks (大枠全体への感想) の追加
  for (const feedback of mockEventFeedbacks) {
    const existing = await prisma.eventFeedback.findUnique({ where: { id: feedback.id } });
    if (!existing) {
      await prisma.eventFeedback.create({
        data: {
          id: feedback.id,
          eventId: event.id, // イベントは上で取得/作成したものを強制利用
          inputType: feedback.inputType,
          content: feedback.content,
          q1: JSON.stringify(feedback.q1 || []),
          q2: feedback.q2,
          q3: feedback.q3,
          referralSources: '[]',
          createdAt: new Date(feedback.createdAt),
          updatedAt: new Date(feedback.updatedAt),
        }
      });
      console.log(`Created event feedback: ${feedback.id}`);
    }
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

