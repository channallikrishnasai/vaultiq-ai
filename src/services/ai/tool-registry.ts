import type {
  ToolDefinition,
  ToolParameter,
  ToolCategory,
  ToolResult,
} from "@/types/financial-hub";

const registry = new Map<string, ToolDefinition>();

function registerTool(tool: ToolDefinition): void {
  registry.set(tool.name, tool);
}

function getTool(name: string): ToolDefinition | undefined {
  return registry.get(name);
}

function getToolsByCategory(category: ToolCategory): ToolDefinition[] {
  return Array.from(registry.values()).filter((t) => t.category === category);
}

function getAllTools(): ToolDefinition[] {
  return Array.from(registry.values());
}

function getToolDefinitionsForLLM(): {
  name: string;
  description: string;
  parameters: Record<string, { type: string; description: string; required: boolean; enum?: string[] }>;
}[] {
  return Array.from(registry.values()).map((tool) => ({
    name: tool.name,
    description: tool.description,
    parameters: Object.fromEntries(
      tool.parameters.map((p) => [
        p.name,
        {
          type: p.type,
          description: p.description,
          required: p.required,
          ...(p.enum ? { enum: p.enum } : {}),
        },
      ]),
    ),
  }));
}

// ── Goal Tools ─────────────────────────────────────────────────────────────

registerTool({
  name: "create_goal",
  description: "Create a new financial goal with target amount and optional deadline",
  category: "goal",
  parameters: [
    { name: "name", type: "string", description: "Name of the goal", required: true },
    { name: "targetAmount", type: "number", description: "Target amount in INR", required: true },
    { name: "type", type: "string", description: "Goal type", required: true, enum: ["SAVINGS", "INVESTMENT", "EMERGENCY"] },
    { name: "deadline", type: "string", description: "Target date (ISO format)", required: false },
    { name: "monthlyContribution", type: "number", description: "Monthly contribution amount", required: false },
  ],
  requiresConfirmation: true,
  sensitive: false,
  execute: async (params, userId) => {
    const { prisma } = await import("@/lib/prisma");
    const goal = await prisma.goal.create({
      data: {
        userId,
        name: params.name as string,
        targetAmount: params.targetAmount as number,
        currentAmount: 0,
        type: (params.type as string) || "SAVINGS",
        deadline: params.deadline ? new Date(params.deadline as string) : null,
      },
    });
    return { success: true, data: goal, message: `Goal "${goal.name}" created successfully` };
  },
});

registerTool({
  name: "edit_goal",
  description: "Edit an existing financial goal",
  category: "goal",
  parameters: [
    { name: "goalId", type: "string", description: "ID of the goal to edit", required: true },
    { name: "name", type: "string", description: "New name", required: false },
    { name: "targetAmount", type: "number", description: "New target amount", required: false },
    { name: "deadline", type: "string", description: "New deadline (ISO format)", required: false },
  ],
  requiresConfirmation: true,
  sensitive: false,
  execute: async (params, userId) => {
    const { prisma } = await import("@/lib/prisma");
    const goalId = params.goalId as string;
    const updateData: Record<string, unknown> = {};
    if (params.name) updateData.name = params.name;
    if (params.targetAmount) updateData.targetAmount = params.targetAmount;
    if (params.deadline) updateData.deadline = new Date(params.deadline as string);

    const goal = await prisma.goal.updateMany({
      where: { id: goalId, userId },
      data: updateData,
    });
    return { success: goal.count > 0, message: goal.count > 0 ? "Goal updated" : "Goal not found" };
  },
});

registerTool({
  name: "delete_goal",
  description: "Delete a financial goal",
  category: "goal",
  parameters: [
    { name: "goalId", type: "string", description: "ID of the goal to delete", required: true },
  ],
  requiresConfirmation: true,
  sensitive: true,
  execute: async (params, userId) => {
    const { prisma } = await import("@/lib/prisma");
    const result = await prisma.goal.deleteMany({
      where: { id: params.goalId as string, userId },
    });
    return { success: result.count > 0, message: result.count > 0 ? "Goal deleted" : "Goal not found" };
  },
});

// ── Budget Tools ───────────────────────────────────────────────────────────

registerTool({
  name: "create_budget",
  description: "Create a monthly budget for a category",
  category: "budget",
  parameters: [
    { name: "category", type: "string", description: "Budget category", required: true },
    { name: "limit", type: "number", description: "Monthly limit in INR", required: true },
    { name: "month", type: "number", description: "Month (1-12)", required: false },
    { name: "year", type: "number", description: "Year", required: false },
  ],
  requiresConfirmation: true,
  sensitive: false,
  execute: async (params, userId) => {
    const { prisma } = await import("@/lib/prisma");
    const now = new Date();
    const month = (params.month as number) || now.getMonth() + 1;
    const year = (params.year as number) || now.getFullYear();

    const budget = await prisma.budget.upsert({
      where: { userId_category_month_year: { userId, category: params.category as string, month, year } },
      update: { limit: params.limit as number },
      create: { userId, category: params.category as string, limit: params.limit as number, month, year },
    });
    return { success: true, data: budget, message: `Budget for "${budget.category}" set to ₹${budget.limit.toLocaleString("en-IN")}` };
  },
});

registerTool({
  name: "edit_budget",
  description: "Edit an existing budget limit",
  category: "budget",
  parameters: [
    { name: "budgetId", type: "string", description: "ID of the budget to edit", required: true },
    { name: "limit", type: "number", description: "New monthly limit in INR", required: true },
  ],
  requiresConfirmation: true,
  sensitive: false,
  execute: async (params, userId) => {
    const { prisma } = await import("@/lib/prisma");
    const result = await prisma.budget.updateMany({
      where: { id: params.budgetId as string, userId },
      data: { limit: params.limit as number },
    });
    return { success: result.count > 0, message: result.count > 0 ? "Budget updated" : "Budget not found" };
  },
});

// ── Alert Tools ────────────────────────────────────────────────────────────

registerTool({
  name: "create_alert",
  description: "Create a price alert for a stock",
  category: "alert",
  parameters: [
    { name: "symbol", type: "string", description: "Stock symbol (e.g., RELIANCE)", required: true },
    { name: "type", type: "string", description: "Alert type", required: true, enum: ["PRICE_ABOVE", "PRICE_BELOW", "PERCENT_CHANGE", "NEW_52W_HIGH", "NEW_52W_LOW"] },
    { name: "threshold", type: "number", description: "Threshold value", required: true },
  ],
  requiresConfirmation: true,
  sensitive: false,
  execute: async (params, userId) => {
    const { alertService } = await import("@/services/market/alert.service");
    const alert = await alertService.createAlert(userId, {
      symbol: (params.symbol as string).toUpperCase(),
      type: params.type as "PRICE_ABOVE" | "PRICE_BELOW" | "PERCENT_CHANGE" | "NEW_52W_HIGH" | "NEW_52W_LOW",
      threshold: params.threshold as number,
    });
    return { success: true, data: alert, message: `Alert created for ${alert.symbol}` };
  },
});

// ── Watchlist Tools ────────────────────────────────────────────────────────

registerTool({
  name: "add_watchlist",
  description: "Add a stock to the watchlist",
  category: "watchlist",
  parameters: [
    { name: "symbol", type: "string", description: "Stock symbol (e.g., RELIANCE)", required: true },
    { name: "companyName", type: "string", description: "Company name", required: false },
    { name: "notes", type: "string", description: "Personal notes", required: false },
  ],
  requiresConfirmation: false,
  sensitive: false,
  execute: async (params, userId) => {
    const { watchlistService } = await import("@/services/market/watchlist.service");
    const item = await watchlistService.addToWatchlist(userId, {
      symbol: (params.symbol as string).toUpperCase(),
      companyName: params.companyName as string | undefined,
      notes: params.notes as string | undefined,
    });
    return { success: true, data: item, message: `${item.symbol} added to watchlist` };
  },
});

registerTool({
  name: "remove_watchlist",
  description: "Remove a stock from the watchlist",
  category: "watchlist",
  parameters: [
    { name: "symbol", type: "string", description: "Stock symbol to remove", required: true },
  ],
  requiresConfirmation: true,
  sensitive: false,
  execute: async (params, userId) => {
    const { prisma } = await import("@/lib/prisma");
    const { watchlistService } = await import("@/services/market/watchlist.service");
    const item = await prisma.watchlist.findFirst({
      where: { userId, symbol: (params.symbol as string).toUpperCase() },
    });
    if (!item) return { success: false, error: "Symbol not found in watchlist" };

    const removed = await watchlistService.removeFromWatchlist(item.id, userId);
    return { success: removed, message: removed ? `${params.symbol} removed from watchlist` : "Failed to remove" };
  },
});

// ── Document Tools ─────────────────────────────────────────────────────────

registerTool({
  name: "upload_document",
  description: "Upload and analyze a financial document",
  category: "document",
  parameters: [
    { name: "name", type: "string", description: "Document name", required: true },
    { name: "category", type: "string", description: "Document category", required: true, enum: ["BANK_STATEMENT", "SALARY_SLIP", "TAX_DOCUMENT", "INSURANCE", "MUTUAL_FUND", "CREDIT_CARD", "LOAN", "INVESTMENT", "OTHER"] },
  ],
  requiresConfirmation: false,
  sensitive: true,
  execute: async (params, userId) => {
    const { documentService } = await import("@/services/document/document.service");
    const doc = await documentService.uploadDocument(userId, {
      name: params.name as string,
      type: "application/pdf",
      size: 0,
      text: "",
    });
    return { success: true, data: doc, message: `Document uploaded successfully` };
  },
});

// ── Profile Tools ──────────────────────────────────────────────────────────

registerTool({
  name: "update_profile",
  description: "Update user profile settings",
  category: "profile",
  parameters: [
    { name: "income", type: "number", description: "Monthly income in INR", required: false },
    { name: "riskAppetite", type: "string", description: "Risk appetite", required: false, enum: ["CONSERVATIVE", "MODERATE", "AGGRESSIVE"] },
    { name: "occupation", type: "string", description: "Occupation", required: false },
  ],
  requiresConfirmation: true,
  sensitive: true,
  execute: async (params, userId) => {
    const { prisma } = await import("@/lib/prisma");
    const updateData: Record<string, unknown> = {};
    if (params.income !== undefined) updateData.income = params.income;
    if (params.riskAppetite) updateData.riskAppetite = params.riskAppetite;
    if (params.occupation) updateData.occupation = params.occupation;

    const profile = await prisma.profile.update({
      where: { userId },
      data: updateData,
    });
    return { success: true, data: profile, message: "Profile updated successfully" };
  },
});

// ── Virtual Trade Tools ────────────────────────────────────────────────────

registerTool({
  name: "create_virtual_trade",
  description: "Create a virtual trade in the paper trading portfolio",
  category: "portfolio",
  parameters: [
    { name: "symbol", type: "string", description: "Stock symbol", required: true },
    { name: "type", type: "string", description: "Trade type", required: true, enum: ["BUY", "SELL"] },
    { name: "quantity", type: "number", description: "Number of shares", required: true },
    { name: "price", type: "number", description: "Price per share (optional, uses market price)", required: false },
  ],
  requiresConfirmation: true,
  sensitive: false,
  execute: async (params, userId) => {
    const { prisma } = await import("@/lib/prisma");
    const portfolio = await prisma.portfolio.findFirst({
      where: { userId, isDefault: true },
    });
    if (!portfolio) return { success: false, error: "No default portfolio found" };

    const { tradingRepository } = await import("@/repositories/trading.repository");
    const trade = await tradingRepository.executeTrade({
      portfolioId: portfolio.id,
      symbol: (params.symbol as string).toUpperCase(),
      type: params.type as "BUY" | "SELL",
      quantity: params.quantity as number,
      price: (params.price as number) || 100,
    });
    return { success: true, data: trade, message: `${params.type} order for ${params.symbol} executed` };
  },
});

// ── Report Tools ───────────────────────────────────────────────────────────

registerTool({
  name: "generate_report",
  description: "Generate a financial report",
  category: "financial",
  parameters: [
    { name: "type", type: "string", description: "Report type", required: true, enum: ["monthly", "quarterly", "annual", "health", "portfolio"] },
  ],
  requiresConfirmation: false,
  sensitive: false,
  execute: async (params, userId) => {
    const report = { type: params.type, userId, generatedAt: new Date().toISOString() };
    return { success: true, data: report, message: `${params.type} report generated` };
  },
});

export const toolRegistry = {
  getTool,
  getToolsByCategory,
  getAllTools,
  getToolDefinitionsForLLM,
  registerTool,
};
