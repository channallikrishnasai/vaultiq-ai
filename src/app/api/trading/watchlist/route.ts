import { requireAuth } from "@/lib/auth";
import { watchlistItemSchema, updateWatchlistSchema } from "@/validations/trading";
import { watchlistService } from "@/services/market/watchlist.service";
import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/api-handler";
import { NotFoundError, ValidationError } from "@/lib/errors";

export async function GET() {
  try {
    const session = await requireAuth();
    const summary = await watchlistService.getWatchlistSummary(session.user.id);
    return successResponse(summary);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const data = watchlistItemSchema.parse(body);
    const item = await watchlistService.addToWatchlist(session.user.id, data);
    return successResponse(item, "Added to watchlist", 201);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const action = searchParams.get("action");

    if (!id) throw new ValidationError("Watchlist item id required");

    if (action === "favorite") {
      const result = await watchlistService.toggleFavorite(id, session.user.id);
      if (!result) throw new NotFoundError("Watchlist item not found");
      return successResponse({ toggled: true });
    }

    const body = await request.json();
    const data = updateWatchlistSchema.parse(body);
    const result = await watchlistService.updateWatchlistItem(id, session.user.id, data);
    if (!result) throw new NotFoundError("Watchlist item not found");
    return successResponse({ updated: true });
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
    const result = await watchlistService.removeFromWatchlist(id, session.user.id);
    if (!result) throw new NotFoundError("Watchlist item not found");
    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
