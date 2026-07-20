"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Check, CheckCheck, Trash2, X } from "lucide-react";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data: Record<string, unknown> | null;
  isRead: boolean;
  createdAt: string;
}

interface NotificationFeed {
  notifications: Notification[];
  unreadCount: number;
  totalCount: number;
}

export default function NotificationBell() {
  const [feed, setFeed] = useState<NotificationFeed | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications?limit=20");
      if (res.ok) {
        const data = await res.json();
        setFeed(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications?limit=0&unreadOnly=true");
      if (res.ok) {
        const data = await res.json();
        setFeed((prev) => (prev ? { ...prev, unreadCount: data.data.unreadCount } : null));
      }
    } catch (error) {
      console.error("Failed to fetch unread count:", error);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications, fetchUnreadCount]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "read", id }),
      });
      setFeed((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          unreadCount: Math.max(0, prev.unreadCount - 1),
          notifications: prev.notifications.map((n) =>
            n.id === id ? { ...n, isRead: true } : n
          ),
        };
      });
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const markAllAsRead = async () => {
    setLoading(true);
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "readAll" }),
      });
      setFeed((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          unreadCount: 0,
          notifications: prev.notifications.map((n) => ({ ...n, isRead: true })),
        };
      });
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await fetch(`/api/notifications?id=${id}`, { method: "DELETE" });
      setFeed((prev) => {
        if (!prev) return prev;
        const notification = prev.notifications.find((n) => n.id === id);
        return {
          ...prev,
          unreadCount: notification && !notification.isRead ? prev.unreadCount - 1 : prev.unreadCount,
          notifications: prev.notifications.filter((n) => n.id !== id),
        };
      });
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  };

  const formatTime = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "ALERT_TRIGGERED":
        return "🔔";
      case "MARKET_OPEN":
        return "📈";
      case "MARKET_CLOSE":
        return "📉";
      case "GOAL_MILESTONE":
        return "🎯";
      case "PORTFOLIO_UPDATE":
        return "💼";
      default:
        return "ℹ️";
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-zinc-800 rounded-lg transition-colors"
      >
        <Bell className="w-5 h-5 text-zinc-400" />
        {feed && feed.unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center"
          >
            {feed.unreadCount > 9 ? "9+" : feed.unreadCount}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-full mt-2 w-80 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden z-50"
          >
            <div className="flex items-center justify-between p-4 border-b border-zinc-800">
              <div>
                <h3 className="text-white font-semibold">Notifications</h3>
                {feed && feed.unreadCount > 0 && (
                  <p className="text-zinc-400 text-xs">{feed.unreadCount} unread</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {feed && feed.unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    disabled={loading}
                    className="p-1.5 hover:bg-zinc-800 rounded-lg transition-colors"
                    title="Mark all as read"
                  >
                    <CheckCheck className="w-4 h-4 text-zinc-400" />
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-zinc-400" />
                </button>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {!feed || feed.notifications.length === 0 ? (
                <div className="p-8 text-center text-zinc-500">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No notifications</p>
                </div>
              ) : (
                feed.notifications.map((notification) => (
                  <motion.div
                    key={notification.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, x: -100 }}
                    className={`p-4 border-b border-zinc-800/50 hover:bg-zinc-800/50 transition-colors ${
                      !notification.isRead ? "bg-emerald-500/5" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-white text-sm font-medium">{notification.title}</span>
                          {!notification.isRead && (
                            <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                          )}
                        </div>
                        <p className="text-zinc-400 text-xs mt-0.5 line-clamp-2">{notification.message}</p>
                        <span className="text-zinc-500 text-xs mt-1 block">{formatTime(notification.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {!notification.isRead && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="p-1 hover:bg-zinc-700 rounded transition-colors"
                            title="Mark as read"
                          >
                            <Check className="w-3 h-3 text-zinc-400" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="p-1 hover:bg-zinc-700 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3 text-zinc-500" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
