'use server';

import { prisma } from '../lib/prisma';

export async function getExistingEventFeedback(viewerId: string, eventId: string) {
  try {
    const data = await prisma.eventFeedback.findFirst({
      where: { viewerId, eventId },
    });
    return { data, error: null };
  } catch (error) {
    console.error('Failed to get event feedback record:', error);
    return { data: null, error };
  }
}

export async function getExistingExhibitFeedback(viewerId: string, exhibitId: string) {
  try {
    const data = await prisma.exhibitFeedback.findFirst({
      where: { viewerId, exhibitId },
    });
    return { data, error: null };
  } catch (error) {
    console.error('Failed to get exhibit feedback record:', error);
    return { data: null, error };
  }
}

export async function saveEventFeedback(payload: any, editId: string | null) {
  try {
    // string[] を string (JSON文字列) に変換する
    const data = {
      ...payload,
      q1: JSON.stringify(payload.q1 || []),
      referralSources: JSON.stringify(payload.referralSources || [])
    };
    if (editId) {
      await prisma.eventFeedback.update({
        where: { id: editId },
        data,
      });
    } else {
      await prisma.eventFeedback.create({
        data,
      });
    }
    return { error: null };
  } catch (error) {
    console.error('Failed to save event feedback record:', error);
    return { error };
  }
}

export async function saveExhibitFeedback(payload: any, editId: string | null) {
  try {
    // string[] を string (JSON文字列) に変換する
    const data = {
      ...payload,
      q1: JSON.stringify(payload.q1 || []),
    };
    if (editId) {
      await prisma.exhibitFeedback.update({
        where: { id: editId },
        data,
      });
    } else {
      await prisma.exhibitFeedback.create({
        data,
      });
    }
    return { error: null };
  } catch (error) {
    console.error('Failed to save exhibit feedback record:', error);
    return { error };
  }
}

export async function getExhibitFeedbackById(id: string) {
  try {
    const data = await prisma.exhibitFeedback.findUnique({ where: { id } });
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function getEventFeedbackById(id: string) {
  try {
    const data = await prisma.eventFeedback.findUnique({ where: { id } });
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function getEventFeedbacksByViewer(viewerId: string) {
  try {
    const data = await prisma.eventFeedback.findMany({ 
      where: { viewerId }, 
      orderBy: { createdAt: "desc" },
      include: { event: { select: { title: true } } }
    });
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function getExhibitFeedbacksByViewer(viewerId: string) {
  try {
    const data = await prisma.exhibitFeedback.findMany({ 
      where: { viewerId }, 
      orderBy: { createdAt: "desc" },
      include: { 
        exhibit: { select: { name: true } },
        event: { select: { title: true } }
      }
    });
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}
