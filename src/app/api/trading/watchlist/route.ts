import { requireAuth } from "@/lib/auth";
import { watchlistItemSchema } from "@/validations/trading";
import { tradingRepository } from "@/repositories/trading.repository";
import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/api-handler";
import { NotFoundError } from "@/lib/errors";

export async function GET() {
  try {
    const session = await requireAuth();
    const watchlist = await tradingRepository.getWatchlist(session.user.id);
    return successResponse(watchlist);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const data = watchlistItemSchema.parse(body);
    const item = await tradingRepository.addToWatchlist(session.user.id, data);
    return successResponse(item, "Added to watchlist", 201);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) throw new NotFoundError("Watchlist item id required");
    const result = await tradingRepository.removeFromWatchlist(id, session.user.id);
    if (result.count === 0) throw new NotFoundError("Watchlist item not found");
    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
