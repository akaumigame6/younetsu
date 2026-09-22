'use server';

import { prisma } from '../lib/prisma';

export async function getExistingEventFeedback(userId: string, eventId: string) {
  try {
    const data = await prisma.eventFeedback.findFirst({
      where: { userId, eventId },
    });
    return { data, error: null };
  } catch (error) {
    console.error('Failed to get event feedback record:', error);
    return { data: null, error };
  }
}

export async function getExistingExhibitFeedback(userId: string, exhibitId: string) {
  try {
    const data = await prisma.exhibitFeedback.findFirst({
      where: { userId, exhibitId },
    });
    return { data, error: null };
  } catch (error) {
    console.error('Failed to get exhibit feedback record:', error);
    return { data: null, error };
  }
}

export async function saveEventFeedback(payload: any, editId: string | null) {
  try {
    const data = {
      ...payload,
      q1: payload.q1 || [],
      referralSources: payload.referralSources || []
    };
    if (editId) {
      await prisma.eventFeedback.update({
        where: { id: editId },
        data: { ...data, isRead: false },
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
    const data = {
      ...payload,
      q1: payload.q1 || [],
    };
    if (editId) {
      await prisma.exhibitFeedback.update({
        where: { id: editId },
        data: { ...data, isRead: false },
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

export async function getEventFeedbacksByViewer(userId: string) {
  try {
    const data = await prisma.eventFeedback.findMany({ 
      where: { userId }, 
      orderBy: { createdAt: "desc" },
      include: { event: { select: { title: true } } }
    });
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function getExhibitFeedbacksByViewer(userId: string) {
  try {
    const data = await prisma.exhibitFeedback.findMany({ 
      where: { userId }, 
      orderBy: { createdAt: "desc" },
      include: { 
        exhibit: { 
          select: { 
            name: true,
            event: { select: { title: true } }
          } 
        }
      }
    });
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}
