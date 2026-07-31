import { requireAuth } from "@/lib/auth";
import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/api-handler";
import { documentService } from "@/services/document/document.service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const doc = await documentService.getDocument(session.user.id, id);
    if (!doc) {
      return successResponse({ error: "Document not found" }, undefined, 404);
    }
    return successResponse(doc);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const deleted = await documentService.deleteDocument(session.user.id, id);
    return successResponse({ deleted });
  } catch (error) {
    return handleApiError(error);
  }
}
