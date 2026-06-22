import { requireAuth } from "@/lib/auth";
import { createPortfolioSchema } from "@/validations/trading";
import { tradingRepository } from "@/repositories/trading.repository";
import { tradingService } from "@/services/trading/trading.service";
import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/api-handler";

export async function GET() {
  try {
    const session = await requireAuth();
    const portfolios = await tradingRepository.getPortfolios(session.user.id);
    const market = tradingService.getMarketOverview();
    return successResponse({ portfolios, market });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const data = createPortfolioSchema.parse(body);
    const portfolio = await tradingRepository.createPortfolio(
      session.user.id,
      data.name,
      data.cashBalance,
    );
    return successResponse(portfolio, "Portfolio created", 201);
  } catch (error) {
    return handleApiError(error);
  }
}
