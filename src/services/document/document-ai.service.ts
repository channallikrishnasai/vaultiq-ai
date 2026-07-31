import { documentCategoryService, type ClassificationResult } from "./document-category.service";
import { documentParserService, type ExtractedData } from "./document-parser.service";
import { documentTransactionService, type TransactionIntelligence, type Transaction } from "./document-transaction.service";
import { documentInsightService, type DocumentInsightItem } from "./document-insight.service";
import { documentSecurityService } from "./document-security.service";
import type { DocumentCategory } from "@/generated/prisma/enums";

const TAG = "DocumentAI";

export interface AIProcessingResult {
  classification: ClassificationResult;
  extraction: ExtractedData;
  transactions?: TransactionIntelligence;
  insights: DocumentInsightItem[];
  secureExtraction: Partial<ExtractedData>;
}

export const documentAiService = {
  async processDocument(
    category: DocumentCategory,
    textContent: string,
    fileName: string,
  ): Promise<AIProcessingResult> {
    // Step 1: Classify
    const classification = documentCategoryService.classifyByText(textContent);
    const finalCategory = classification.confidence > 0.5 ? classification.category : category;

    // Step 2: Extract structured data
    const extraction = documentParserService.parseDocument(finalCategory, textContent);

    // Step 3: Transaction intelligence (for bank/credit card statements)
    let transactions: TransactionIntelligence | undefined;
    if (finalCategory === "BANK_STATEMENT" || finalCategory === "CREDIT_CARD_STATEMENT") {
      const rawTransactions = documentTransactionService.parseCSVTransactions(textContent);
      if (rawTransactions.length > 0) {
        transactions = documentTransactionService.analyzeTransactions(rawTransactions);
      }
    }

    // Step 4: Generate insights
    const insights = documentInsightService.generateInsights(finalCategory, extraction, transactions);

    // Step 5: Security masking
    const sensitiveFields = documentSecurityService.getSensitiveFields();
    const secureExtraction = documentSecurityService.maskExtraction(
      extraction as Record<string, unknown>,
      sensitiveFields,
    ) as Partial<ExtractedData>;

    return {
      classification,
      extraction,
      transactions,
      insights,
      secureExtraction,
    };
  },

  generateDocumentSummary(
    category: DocumentCategory,
    extraction: ExtractedData,
    insights: DocumentInsightItem[],
  ): string {
    const categoryLabel = documentCategoryService.getCategoryLabel(category);
    const parts: string[] = [`Document: ${categoryLabel}`];

    const data = extraction as Record<string, unknown>;
    const entries = Object.entries(data).filter(([, v]) => v !== undefined && v !== null);
    if (entries.length > 0) {
      parts.push("Key Information:");
      for (const [key, value] of entries.slice(0, 5)) {
        const label = key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());
        const formatted = typeof value === "number" ? `₹${value.toLocaleString("en-IN")}` : String(value);
        parts.push(`  ${label}: ${formatted}`);
      }
    }

    if (insights.length > 0) {
      parts.push("Insights:");
      for (const insight of insights.slice(0, 3)) {
        parts.push(`  - ${insight.content}`);
      }
    }

    return parts.join("\n");
  },
};
