import { requireAuth } from "@/lib/auth";
import { successResponse } from "@/lib/api-response";
import { handleApiError } from "@/lib/api-handler";
import { documentService } from "@/services/document/document.service";
import type { DocumentCategory, DocumentStatus } from "@/generated/prisma/enums";

export async function GET(request: Request) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(request.url);

    const category = searchParams.get("category") as DocumentCategory | null;
    const status = searchParams.get("status") as DocumentStatus | null;
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const documents = await documentService.getDocuments(session.user.id, {
      category: category || undefined,
      status: status || undefined,
      limit,
      offset,
    });

    return successResponse(documents);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json();

    const { fileName, fileType, fileSize, text } = body;
    if (!fileName || !text) {
      return successResponse({ error: "fileName and text are required" }, undefined, 400);
    }

    const result = await documentService.uploadDocument(session.user.id, {
      name: fileName,
      type: fileType || "text/plain",
      size: fileSize || text.length,
      text,
    });

    return successResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
