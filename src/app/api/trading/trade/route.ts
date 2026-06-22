import { requireAuth } from "@/lib/auth";
import { executeTradeSchema } from "@/validations/trading";
import { tradingRepository } from "@/repositories/trading.repository";
import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/api-handler";
import { NotFoundError, ValidationError } from "@/lib/errors";

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const data = executeTradeSchema.parse(body);

    const portfolio = await tradingRepository.getPortfolio(data.portfolioId, session.user.id);
    if (!portfolio) throw new NotFoundError("Portfolio not found");

    const totalAmount = data.quantity * data.price;
    if (data.type === "BUY" && portfolio.cashBalance < totalAmount) {
      throw new ValidationError("Insufficient funds for this trade");
    }

    const trade = await tradingRepository.executeTrade(data);
    const updated = await tradingRepository.getPortfolio(data.portfolioId, session.user.id);
    return successResponse({ trade, portfolio: updated }, "Trade executed");
  } catch (error) {
    return handleApiError(error);
  }
}
