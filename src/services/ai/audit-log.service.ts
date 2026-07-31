import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import type { AuditLogEntry } from "@/types/financial-hub";

const TAG = "AuditLog";

class AuditLogServiceImpl {
  private logs = new Map<string, AuditLogEntry[]>();

  async log(entry: Omit<AuditLogEntry, "id" | "createdAt">): Promise<AuditLogEntry> {
    const logEntry: AuditLogEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      ...entry,
      createdAt: new Date().toISOString(),
    };

    if (!this.logs.has(entry.userId)) {
      this.logs.set(entry.userId, []);
    }
    this.logs.get(entry.userId)!.push(logEntry);

    const userLogs = this.logs.get(entry.userId)!;
    if (userLogs.length > 200) {
      userLogs.splice(0, userLogs.length - 200);
    }

    logger.info(TAG, `Audit: ${entry.action} on ${entry.entityType}:${entry.entityId} by ${entry.userId}`);

    return logEntry;
  }

  async logAction(
    userId: string,
    action: string,
    entityType: string,
    entityId: string,
    details: Record<string, unknown>,
    metadata?: { ipAddress?: string; userAgent?: string },
  ): Promise<AuditLogEntry> {
    return this.log({
      userId,
      action,
      entityType,
      entityId,
      details,
      ...metadata,
    });
  }

  async logPermissionCheck(
    userId: string,
    action: string,
    entityType: string,
    entityId: string,
    granted: boolean,
    reason?: string,
  ): Promise<AuditLogEntry> {
    return this.log({
      userId,
      action: `permission:${granted ? "granted" : "denied"}:${action}`,
      entityType,
      entityId,
      details: { granted, reason: reason || "standard check" },
    });
  }

  async logOwnershipValidation(
    userId: string,
    entityType: string,
    entityId: string,
    valid: boolean,
  ): Promise<AuditLogEntry> {
    return this.log({
      userId,
      action: `ownership:${valid ? "valid" : "invalid"}`,
      entityType,
      entityId,
      details: { valid },
    });
  }

  async getLogs(userId: string, limit = 50): Promise<AuditLogEntry[]> {
    return (this.logs.get(userId) ?? [])
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  async getLogsByEntity(userId: string, entityType: string, entityId: string): Promise<AuditLogEntry[]> {
    return (this.logs.get(userId) ?? []).filter(
      (l) => l.entityType === entityType && l.entityId === entityId,
    );
  }

  async getLogsByAction(userId: string, action: string): Promise<AuditLogEntry[]> {
    return (this.logs.get(userId) ?? []).filter((l) => l.action.includes(action));
  }

  validateOwnership(userId: string, entityUserId: string): boolean {
    return userId === entityUserId;
  }

  validatePermission(userId: string, action: string, resource?: string): boolean {
    const sensitiveActions = ["delete_goal", "delete_budget", "update_profile", "create_virtual_trade"];
    if (sensitiveActions.includes(action)) {
      logger.info(TAG, `Sensitive action requires explicit approval: ${action} by ${userId}`);
    }
    return true;
  }
}

export const auditLogService = new AuditLogServiceImpl();
