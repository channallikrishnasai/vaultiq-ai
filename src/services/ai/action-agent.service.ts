import { randomUUID } from "crypto";
import { toolExecutor, type ExecutionResult } from "./tool-executor";
import { toolRegistry } from "./tool-registry";
import { memoryService } from "./memory.service";
import { logger } from "@/lib/logger";
import type {
  ActionType,
  ActionRequest,
  ActionPreview,
  ActionResult,
  ActionStatus,
} from "@/types/financial-hub";

const TAG = "ActionAgent";

export interface PendingAction {
  request: ActionRequest;
  preview: ActionPreview;
  status: ActionStatus;
  createdAt: string;
  confirmedAt?: string;
  executedAt?: string;
  undoneAt?: string;
  result?: ExecutionResult;
}

export interface ActionPlan {
  actions: ActionRequest[];
  message: string;
}

class ActionAgentImpl {
  private pendingActions = new Map<string, PendingAction>();
  private completedActions = new Map<string, PendingAction[]>();
  private undoStack = new Map<string, PendingAction[]>();

  parseIntent(
    message: string,
    userId: string,
  ): ActionPlan {
    const lower = message.toLowerCase();
    const actions: ActionRequest[] = [];

    const goalCreateMatch = lower.match(/(?:create|add|set up|start)\s+(?:a\s+)?(?:new\s+)?goal\s+(?:called|named|for)\s+"?([^"]+?)"?\s+(?:with\s+)?(?:target\s+)?(?:of\s+)?(?:₹|rs\.?|inr)?\s*([\d,]+)/);
    if (goalCreateMatch) {
      actions.push({
        id: randomUUID(),
        userId,
        type: "create_goal",
        params: { name: goalCreateMatch[1].trim(), targetAmount: parseInt(goalCreateMatch[2].replace(/,/g, ""), 10), type: "SAVINGS" },
        source: "chat",
        createdAt: new Date().toISOString(),
      });
    }

    const goalDeleteMatch = lower.match(/(?:delete|remove|cancel)\s+(?:the\s+)?goal\s+(?:called|named)\s+"?([^"]+?)"?/);
    if (goalDeleteMatch) {
      actions.push({
        id: randomUUID(),
        userId,
        type: "delete_goal",
        params: { goalName: goalDeleteMatch[1].trim() },
        source: "chat",
        createdAt: new Date().toISOString(),
      });
    }

    const budgetMatch = lower.match(/(?:set|create|add)\s+(?:a\s+)?budget\s+(?:for\s+)?"?([^"]+?)"?\s+(?:at|to|of|limit)\s+(?:₹|rs\.?|inr)?\s*([\d,]+)/);
    if (budgetMatch) {
      actions.push({
        id: randomUUID(),
        userId,
        type: "create_budget",
        params: { category: budgetMatch[1].trim(), limit: parseInt(budgetMatch[2].replace(/,/g, ""), 10) },
        source: "chat",
        createdAt: new Date().toISOString(),
      });
    }

    const alertMatch = lower.match(/(?:create|set|add)\s+(?:a\s+)?(?:price\s+)?alert\s+(?:for\s+)?(\w+)\s+(?:when\s+)?(?:it\s+)?(?:goes?\s+)?(?:above|over|higher\s+than)\s+(?:₹|rs\.?|inr)?\s*([\d,]+)/);
    if (alertMatch) {
      actions.push({
        id: randomUUID(),
        userId,
        type: "create_alert",
        params: { symbol: alertMatch[1].toUpperCase(), type: "PRICE_ABOVE", threshold: parseInt(alertMatch[2].replace(/,/g, ""), 10) },
        source: "chat",
        createdAt: new Date().toISOString(),
      });
    }

    const alertBelowMatch = lower.match(/(?:create|set|add)\s+(?:a\s+)?(?:price\s+)?alert\s+(?:for\s+)?(\w+)\s+(?:when\s+)?(?:it\s+)?(?:drops?\s+)?(?:below|under|lower\s+than)\s+(?:₹|rs\.?|inr)?\s*([\d,]+)/);
    if (alertBelowMatch) {
      actions.push({
        id: randomUUID(),
        userId,
        type: "create_alert",
        params: { symbol: alertBelowMatch[1].toUpperCase(), type: "PRICE_BELOW", threshold: parseInt(alertBelowMatch[2].replace(/,/g, ""), 10) },
        source: "chat",
        createdAt: new Date().toISOString(),
      });
    }

    const watchlistAddMatch = lower.match(/(?:add|track|watch)\s+(\w+)(?:\s+to\s+(?:my\s+)?watchlist)?/);
    if (watchlistAddMatch && !lower.includes("remove")) {
      actions.push({
        id: randomUUID(),
        userId,
        type: "add_watchlist",
        params: { symbol: watchlistAddMatch[1].toUpperCase() },
        source: "chat",
        createdAt: new Date().toISOString(),
      });
    }

    const watchlistRemoveMatch = lower.match(/(?:remove|delete)\s+(\w+)\s+(?:from\s+)?(?:my\s+)?watchlist/);
    if (watchlistRemoveMatch) {
      actions.push({
        id: randomUUID(),
        userId,
        type: "remove_watchlist",
        params: { symbol: watchlistRemoveMatch[1].toUpperCase() },
        source: "chat",
        createdAt: new Date().toISOString(),
      });
    }

    const tradeMatch = lower.match(/(?:buy|purchase)\s+(\d+)\s+(?:shares?\s+of\s+)?(\w+)/);
    if (tradeMatch) {
      actions.push({
        id: randomUUID(),
        userId,
        type: "create_virtual_trade",
        params: { symbol: tradeMatch[2].toUpperCase(), type: "BUY", quantity: parseInt(tradeMatch[1], 10) },
        source: "chat",
        createdAt: new Date().toISOString(),
      });
    }

    const sellMatch = lower.match(/(?:sell)\s+(\d+)\s+(?:shares?\s+of\s+)?(\w+)/);
    if (sellMatch) {
      actions.push({
        id: randomUUID(),
        userId,
        type: "create_virtual_trade",
        params: { symbol: sellMatch[2].toUpperCase(), type: "SELL", quantity: parseInt(sellMatch[1], 10) },
        source: "chat",
        createdAt: new Date().toISOString(),
      });
    }

    const messageText = actions.length > 0
      ? `I detected ${actions.length} action${actions.length > 1 ? "s" : ""} you'd like to perform. Please review and confirm.`
      : "";

    return { actions, message: messageText };
  }

  async previewActions(actions: ActionRequest[]): Promise<ActionPreview[]> {
    const previews: ActionPreview[] = [];

    for (const action of actions) {
      const preview = await toolExecutor.preview(
        this.actionTypeToToolName(action.type),
        action.params,
        action.userId,
      );
      if (preview) {
        previews.push(preview);
      }
    }

    return previews;
  }

  async confirmAndExecute(actionId: string, userId: string, confirmed: boolean): Promise<PendingAction | null> {
    const pending = this.pendingActions.get(actionId);
    if (!pending || pending.request.userId !== userId) {
      logger.warn(TAG, `Action not found or unauthorized: ${actionId}`);
      return null;
    }

    if (!confirmed) {
      pending.status = "failed";
      pending.result = { plan: pending.request as any, result: { success: false, error: "User rejected" }, executedAt: new Date().toISOString(), duration: 0 };
      logger.info(TAG, `Action rejected by user: ${actionId}`);
      return pending;
    }

    pending.status = "executing";
    pending.confirmedAt = new Date().toISOString();

    try {
      const result = await toolExecutor.execute(
        this.actionTypeToToolName(pending.request.type),
        pending.request.params,
        userId,
      );

      pending.result = result;
      pending.status = result.result.success ? "completed" : "failed";
      pending.executedAt = new Date().toISOString();

      if (result.result.success) {
        this.addToUndoStack(userId, pending);
      }

      memoryService.storeMemory(
        userId,
        `action:${pending.request.type}`,
        JSON.stringify({ id: actionId, params: pending.request.params, result: result.result }),
        `Action executed: ${pending.request.type}`,
        24 * 60 * 60 * 1000,
      );

      logger.info(TAG, `Action ${pending.status}: ${actionId} (${pending.request.type})`);
    } catch (error) {
      pending.status = "failed";
      pending.result = {
        plan: pending.request as any,
        result: { success: false, error: error instanceof Error ? error.message : String(error) },
        executedAt: new Date().toISOString(),
        duration: 0,
      };
      logger.error(TAG, `Action execution failed: ${actionId}`, error);
    }

    return pending;
  }

  async undoAction(actionId: string, userId: string): Promise<boolean> {
    const undoStack = this.undoStack.get(userId) ?? [];
    const action = undoStack.find((a) => a.request.id === actionId);

    if (!action) {
      logger.warn(TAG, `No undoable action found: ${actionId}`);
      return false;
    }

    if (action.request.type === "create_goal") {
      const { prisma } = await import("@/lib/prisma");
      const goalData = action.request.params;
      const goalName = goalData.name as string;
      await prisma.goal.deleteMany({ where: { userId, name: goalName } });
      action.status = "undone";
      action.undoneAt = new Date().toISOString();
      logger.info(TAG, `Undone action: ${actionId}`);
      return true;
    }

    logger.warn(TAG, `Undo not supported for action type: ${action.request.type}`);
    return false;
  }

  private addToUndoStack(userId: string, action: PendingAction): void {
    if (!this.undoStack.has(userId)) {
      this.undoStack.set(userId, []);
    }
    const stack = this.undoStack.get(userId)!;
    stack.push(action);
    if (stack.length > 20) {
      stack.shift();
    }
  }

  private actionTypeToToolName(type: ActionType): string {
    const mapping: Record<ActionType, string> = {
      create_goal: "create_goal",
      edit_goal: "edit_goal",
      delete_goal: "delete_goal",
      create_budget: "create_budget",
      edit_budget: "edit_budget",
      delete_budget: "edit_budget",
      create_alert: "create_alert",
      delete_alert: "create_alert",
      add_watchlist: "add_watchlist",
      remove_watchlist: "remove_watchlist",
      upload_document: "upload_document",
      generate_report: "generate_report",
      create_virtual_trade: "create_virtual_trade",
      update_profile: "update_profile",
    };
    return mapping[type] ?? type;
  }

  storePendingAction(action: ActionRequest, preview: ActionPreview): PendingAction {
    const pending: PendingAction = {
      request: action,
      preview,
      status: "pending_confirmation",
      createdAt: new Date().toISOString(),
    };
    this.pendingActions.set(action.id, pending);
    return pending;
  }

  getPendingActions(userId: string): PendingAction[] {
    return Array.from(this.pendingActions.values())
      .filter((a) => a.request.userId === userId && a.status === "pending_confirmation");
  }

  getRecentActions(userId: string, limit = 10): PendingAction[] {
    return Array.from(this.completedActions.get(userId) ?? [])
      .concat(Array.from(this.pendingActions.values()).filter((a) => a.request.userId === userId))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }
}

export const actionAgent = new ActionAgentImpl();
