import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import type { NotificationType } from "@/generated/prisma/enums";

const TAG = "NotificationService";

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  data: Record<string, unknown> | null;
  isRead: boolean;
  createdAt: Date;
}

export interface NotificationFeed {
  notifications: NotificationItem[];
  unreadCount: number;
  totalCount: number;
}

export const notificationService = {
  async getNotifications(
    userId: string,
    options: { limit?: number; offset?: number; unreadOnly?: boolean } = {},
  ): Promise<NotificationFeed> {
    const { limit = 50, offset = 0, unreadOnly = false } = options;

    const where = {
      userId,
      ...(unreadOnly ? { isRead: false } : {}),
    };

    const [notifications, unreadCount, totalCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.notification.count({
        where: { userId, isRead: false },
      }),
      prisma.notification.count({ where: { userId } }),
    ]);

    return {
      notifications: notifications.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        data: n.data as Record<string, unknown> | null,
        isRead: n.isRead,
        createdAt: n.createdAt,
      })),
      unreadCount,
      totalCount,
    };
  },

  async getUnreadCount(userId: string): Promise<number> {
    return prisma.notification.count({
      where: { userId, isRead: false },
    });
  },

  async createNotification(
    userId: string,
    data: {
      type: NotificationType;
      title: string;
      message: string;
      data?: Record<string, unknown>;
    },
  ): Promise<NotificationItem> {
    const notification = await prisma.notification.create({
      data: {
        userId,
        type: data.type,
        title: data.title,
        message: data.message,
        data: data.data ? JSON.parse(JSON.stringify(data.data)) : undefined,
      },
    });

    logger.info(TAG, `Notification created: ${data.type} for user ${userId}`);

    return {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: notification.data as Record<string, unknown> | null,
      isRead: notification.isRead,
      createdAt: notification.createdAt,
    };
  },

  async markAsRead(id: string, userId: string): Promise<boolean> {
    const result = await prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });
    return result.count > 0;
  },

  async markAllAsRead(userId: string): Promise<number> {
    const result = await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return result.count;
  },

  async deleteNotification(id: string, userId: string): Promise<boolean> {
    const result = await prisma.notification.deleteMany({
      where: { id, userId },
    });
    return result.count > 0;
  },

  async clearAll(userId: string): Promise<number> {
    const result = await prisma.notification.deleteMany({
      where: { userId },
    });
    return result.count;
  },
};
