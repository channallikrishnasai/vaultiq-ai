import { requireAuth } from "@/lib/auth";
import { notificationService } from "@/services/notification/notification.service";
import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/api-handler";
import { ValidationError } from "@/lib/errors";

export async function GET(request: Request) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") ?? "50", 10);
    const offset = parseInt(searchParams.get("offset") ?? "0", 10);
    const unreadOnly = searchParams.get("unreadOnly") === "true";

    const feed = await notificationService.getNotifications(session.user.id, {
      limit,
      offset,
      unreadOnly,
    });
    return successResponse(feed);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const { action, id } = body;

    if (action === "readAll") {
      const count = await notificationService.markAllAsRead(session.user.id);
      return successResponse({ marked: count });
    }

    if (action === "read" && id) {
      const result = await notificationService.markAsRead(id, session.user.id);
      return successResponse({ marked: result });
    }

    throw new ValidationError("Invalid action. Use 'read' with id or 'readAll'");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const clearAll = searchParams.get("clearAll") === "true";

    if (clearAll) {
      const count = await notificationService.clearAll(session.user.id);
      return successResponse({ cleared: count });
    }

    if (id) {
      const result = await notificationService.deleteNotification(id, session.user.id);
      return successResponse({ deleted: result });
    }

    throw new ValidationError("Provide id or clearAll=true");
  } catch (error) {
    return handleApiError(error);
  }
}
