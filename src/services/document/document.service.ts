import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { documentAiService, type AIProcessingResult } from "./document-ai.service";
import { documentCategoryService } from "./document-category.service";
import { documentSecurityService } from "./document-security.service";
import type { DocumentCategory, DocumentStatus } from "@/generated/prisma/enums";

const TAG = "DocumentService";

export interface DocumentItem {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  category: DocumentCategory;
  status: DocumentStatus;
  classification: Record<string, unknown> | null;
  extraction: Record<string, unknown> | null;
  transactions: Record<string, unknown> | null;
  insightsData: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentWithSecurity extends DocumentItem {
  secureExtraction: Record<string, unknown> | null;
}

export interface DocumentStats {
  total: number;
  processed: number;
  pending: number;
  failed: number;
  byCategory: { category: DocumentCategory; count: number }[];
  latestInsight: string | null;
}

export interface UploadResult {
  id: string;
  status: DocumentStatus;
  classification?: { category: DocumentCategory; confidence: number };
}

const ALLOWED_TYPES = [
  "application/pdf",
  "text/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/jpeg",
  "image/png",
  "text/plain",
];

const ALLOWED_EXTENSIONS = [".pdf", ".csv", ".xls", ".xlsx", ".jpg", ".jpeg", ".png", ".txt"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const documentService = {
  async uploadDocument(
    userId: string,
    file: { name: string; type: string; size: number; text: string },
  ): Promise<UploadResult> {
    // Validate file type
    const ext = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      throw new Error(`Unsupported file type: ${ext}`);
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`);
    }

    // Check for duplicates
    const existing = await prisma.document.findFirst({
      where: { userId, fileName: file.name, fileSize: file.size },
    });
    if (existing) {
      return { id: existing.id, status: existing.status };
    }

    // Classify file by name first
    const nameCategory = documentCategoryService.classifyByFileName(file.name);

    // Create document record
    const doc = await prisma.document.create({
      data: {
        userId,
        fileName: file.name,
        fileType: file.type || ext,
        fileSize: file.size,
        category: nameCategory,
        status: "PROCESSING",
        metadata: { originalName: file.name, uploadedAt: new Date().toISOString() },
      },
    });

    // Process with AI
    try {
      const result = await documentAiService.processDocument(nameCategory, file.text, file.name);

      await prisma.document.update({
        where: { id: doc.id },
        data: {
          status: "EXTRACTED",
          category: result.classification.category,
          classification: JSON.parse(JSON.stringify(result.classification)),
          extraction: JSON.parse(JSON.stringify(result.extraction)),
          transactions: result.transactions ? JSON.parse(JSON.stringify(result.transactions)) : undefined,
          insightsData: JSON.parse(JSON.stringify({ items: result.insights })),
        },
      });

      // Store individual insights
      for (const insight of result.insights) {
        await prisma.documentInsight.create({
          data: {
            documentId: doc.id,
            userId,
            insightType: insight.insightType,
            content: insight.content,
            severity: insight.severity,
          },
        });
      }

      return {
        id: doc.id,
        status: "EXTRACTED",
        classification: {
          category: result.classification.category,
          confidence: result.classification.confidence,
        },
      };
    } catch (error) {
      logger.error(TAG, `Failed to process document ${doc.id}`, error);
      await prisma.document.update({
        where: { id: doc.id },
        data: { status: "FAILED", metadata: { error: String(error) } },
      });
      return { id: doc.id, status: "FAILED" };
    }
  },

  async getDocuments(userId: string, options: {
    category?: DocumentCategory;
    status?: DocumentStatus;
    limit?: number;
    offset?: number;
  } = {}): Promise<DocumentItem[]> {
    const { category, status, limit = 50, offset = 0 } = options;

    const where: Record<string, unknown> = { userId };
    if (category) where.category = category;
    if (status) where.status = status;

    const docs = await prisma.document.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });

    return docs.map((d) => ({
      id: d.id,
      fileName: d.fileName,
      fileType: d.fileType,
      fileSize: d.fileSize,
      category: d.category,
      status: d.status,
      classification: d.classification as Record<string, unknown> | null,
      extraction: d.extraction as Record<string, unknown> | null,
      transactions: d.transactions as Record<string, unknown> | null,
      insightsData: d.insightsData as Record<string, unknown> | null,
      metadata: d.metadata as Record<string, unknown> | null,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    }));
  },

  async getDocument(userId: string, documentId: string): Promise<DocumentWithSecurity | null> {
    const doc = await prisma.document.findFirst({
      where: { id: documentId, userId },
    });
    if (!doc) return null;

    const secureExtraction = doc.extraction
      ? documentSecurityService.securePreview(doc.extraction as Record<string, unknown>)
      : null;

    return {
      id: doc.id,
      fileName: doc.fileName,
      fileType: doc.fileType,
      fileSize: doc.fileSize,
      category: doc.category,
      status: doc.status,
      classification: doc.classification as Record<string, unknown> | null,
      extraction: doc.extraction as Record<string, unknown> | null,
      transactions: doc.transactions as Record<string, unknown> | null,
      insightsData: doc.insightsData as Record<string, unknown> | null,
      metadata: doc.metadata as Record<string, unknown> | null,
      secureExtraction,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  },

  async deleteDocument(userId: string, documentId: string): Promise<boolean> {
    const result = await prisma.document.deleteMany({
      where: { id: documentId, userId },
    });
    return result.count > 0;
  },

  async getStats(userId: string): Promise<DocumentStats> {
    const [total, processed, pending, failed, byCategory, latestInsight] = await Promise.all([
      prisma.document.count({ where: { userId } }),
      prisma.document.count({ where: { userId, status: "EXTRACTED" } }),
      prisma.document.count({ where: { userId, status: { in: ["UPLOADING", "PROCESSING", "CLASSIFIED"] } } }),
      prisma.document.count({ where: { userId, status: "FAILED" } }),
      prisma.document.groupBy({ by: ["category"], where: { userId }, _count: true }),
      prisma.documentInsight.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
        select: { content: true },
      }),
    ]);

    return {
      total,
      processed,
      pending,
      failed,
      byCategory: byCategory.map((b) => ({
        category: b.category,
        count: b._count,
      })),
      latestInsight: latestInsight?.content ?? null,
    };
  },

  async getRecentInsights(userId: string, limit = 10): Promise<{
    id: string;
    insightType: string;
    content: string;
    severity: string;
    createdAt: Date;
  }[]> {
    return prisma.documentInsight.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        insightType: true,
        content: true,
        severity: true,
        createdAt: true,
      },
    });
  },

  async getDocumentsForCopilot(userId: string): Promise<{
    category: DocumentCategory;
    insights: { type: string; content: string; severity: string }[];
  }[]> {
    const docs = await prisma.document.findMany({
      where: { userId, status: "EXTRACTED" },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { insights: { take: 3 } },
    });

    return docs.map((d) => ({
      category: d.category,
      insights: d.insights.map((i) => ({
        type: i.insightType,
        content: i.content,
        severity: i.severity,
      })),
    }));
  },

  ALLOWED_TYPES,
  ALLOWED_EXTENSIONS,
  MAX_FILE_SIZE,
};
