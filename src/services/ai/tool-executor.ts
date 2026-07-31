import { toolRegistry } from "./tool-registry";
import { logger } from "@/lib/logger";
import type { ToolResult, ActionPreview, ActionType } from "@/types/financial-hub";

const TAG = "ToolExecutor";

export interface ExecutionPlan {
  toolName: string;
  params: Record<string, unknown>;
  userId: string;
  requiresConfirmation: boolean;
  preview?: ActionPreview;
}

export interface ExecutionResult {
  plan: ExecutionPlan;
  result: ToolResult;
  executedAt: string;
  duration: number;
}

class ToolExecutorImpl {
  private executionHistory = new Map<string, ExecutionResult[]>();

  async preview(
    toolName: string,
    params: Record<string, unknown>,
    userId: string,
  ): Promise<ActionPreview | null> {
    const tool = toolRegistry.getTool(toolName);
    if (!tool) {
      logger.warn(TAG, `Tool not found: ${toolName}`);
      return null;
    }

    const preview: ActionPreview = {
      actionType: this.mapToolToActionType(toolName),
      description: this.generateDescription(toolName, params),
      impact: this.generateImpact(toolName, params),
      reversible: !tool.sensitive,
      params,
    };

    return preview;
  }

  async execute(
    toolName: string,
    params: Record<string, unknown>,
    userId: string,
  ): Promise<ExecutionResult> {
    const tool = toolRegistry.getTool(toolName);
    if (!tool) {
      return {
        plan: { toolName, params, userId, requiresConfirmation: false },
        result: { success: false, error: `Tool "${toolName}" not found` },
        executedAt: new Date().toISOString(),
        duration: 0,
      };
    }

    const startTime = Date.now();

    try {
      logger.info(TAG, `Executing tool: ${toolName} for user: ${userId}`);

      const result = await tool.execute(params, userId);
      const duration = Date.now() - startTime;

      const executionResult: ExecutionResult = {
        plan: { toolName, params, userId, requiresConfirmation: tool.requiresConfirmation },
        result,
        executedAt: new Date().toISOString(),
        duration,
      };

      this.recordExecution(userId, executionResult);

      logger.info(TAG, `Tool executed: ${toolName} in ${duration}ms - ${result.success ? "success" : "failed"}`);

      return executionResult;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      logger.error(TAG, `Tool execution failed: ${toolName}`, error);

      const executionResult: ExecutionResult = {
        plan: { toolName, params, userId, requiresConfirmation: tool.requiresConfirmation },
        result: { success: false, error: errorMessage },
        executedAt: new Date().toISOString(),
        duration,
      };

      this.recordExecution(userId, executionResult);

      return executionResult;
    }
  }

  private mapToolToActionType(toolName: string): ActionType {
    const mapping: Record<string, ActionType> = {
      create_goal: "create_goal",
      edit_goal: "edit_goal",
      delete_goal: "delete_goal",
      create_budget: "create_budget",
      edit_budget: "edit_budget",
      create_alert: "create_alert",
      add_watchlist: "add_watchlist",
      remove_watchlist: "remove_watchlist",
      upload_document: "upload_document",
      generate_report: "generate_report",
      create_virtual_trade: "create_virtual_trade",
      update_profile: "update_profile",
    };
    return mapping[toolName] ?? "update_profile";
  }

  private generateDescription(toolName: string, params: Record<string, unknown>): string {
    const descriptions: Record<string, string> = {
      create_goal: `Create goal "${params.name}" with target ₹${(params.targetAmount as number)?.toLocaleString("en-IN")}`,
      edit_goal: `Edit goal ${params.goalId}`,
      delete_goal: `Delete goal ${params.goalId}`,
      create_budget: `Set budget for "${params.category}" to ₹${(params.limit as number)?.toLocaleString("en-IN")}/month`,
      edit_budget: `Update budget ${params.budgetId} to ₹${(params.limit as number)?.toLocaleString("en-IN")}`,
      create_alert: `Alert when ${params.symbol} ${params.type === "PRICE_ABOVE" ? "goes above" : "drops below"} ₹${params.threshold}`,
      add_watchlist: `Add ${params.symbol} to watchlist`,
      remove_watchlist: `Remove ${params.symbol} from watchlist`,
      upload_document: `Upload "${params.name}" as ${params.category}`,
      generate_report: `Generate ${params.type} report`,
      create_virtual_trade: `${params.type} ${params.quantity} shares of ${params.symbol}`,
      update_profile: `Update profile${params.income ? ` income to ₹${(params.income as number).toLocaleString("en-IN")}` : ""}`,
    };
    return descriptions[toolName] ?? `Execute ${toolName}`;
  }

  private generateImpact(toolName: string, params: Record<string, unknown>): string {
    const impacts: Record<string, string> = {
      create_goal: "A new goal will appear in your goal tracker",
      delete_goal: "This goal will be permanently removed",
      create_budget: "Budget tracking will be updated for this category",
      create_alert: "You'll be notified when the price condition is met",
      add_watchlist: "The stock will appear in your watchlist with live quotes",
      remove_watchlist: "The stock will be removed from your watchlist",
      create_virtual_trade: "Virtual portfolio will be updated (paper trading only)",
      update_profile: "Your financial profile and recommendations will update",
    };
    return impacts[toolName] ?? "This action will modify your financial data";
  }

  private recordExecution(userId: string, result: ExecutionResult): void {
    if (!this.executionHistory.has(userId)) {
      this.executionHistory.set(userId, []);
    }
    const history = this.executionHistory.get(userId)!;
    history.push(result);
    if (history.length > 50) {
      history.splice(0, history.length - 50);
    }
  }

  getExecutionHistory(userId: string, limit = 10): ExecutionResult[] {
    return (this.executionHistory.get(userId) ?? []).slice(-limit);
  }
}

export const toolExecutor = new ToolExecutorImpl();
