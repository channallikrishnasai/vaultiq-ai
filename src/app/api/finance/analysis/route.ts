import { requireAuth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { buildFinancialContext } from "@/services/ai/financial-context.service";
import {
  runFullAnalysis,
  generateMonthlyReport,
  simulateScenario,
  type WhatIfScenario,
} from "@/services/ai/analysis";
import { checkRateLimit, getRateLimitHeaders, RATE_LIMITS } from "@/lib/rate-limit";
import { handleApiError } from "@/lib/api-handler";

export async function GET() {
  try {
    const session = await requireAuth();

    const rateLimitResult = checkRateLimit(`analysis:${session.user.id}`, RATE_LIMITS.analysis);
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: "Too many requests." }, {
        status: 429,
        headers: getRateLimitHeaders(rateLimitResult),
      });
    }

    const ctx = await buildFinancialContext(session.user.id);
    const analysis = runFullAnalysis(ctx);
    return NextResponse.json(analysis);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAuth();

    const rateLimitResult = checkRateLimit(`analysis:${session.user.id}`, RATE_LIMITS.analysis);
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ error: "Too many requests." }, {
        status: 429,
        headers: getRateLimitHeaders(rateLimitResult),
      });
    }

    const body = await request.json();
    const { type, scenario } = body as {
      type: "full_analysis" | "monthly_report" | "simulation";
      scenario?: WhatIfScenario;
    };

    const ctx = await buildFinancialContext(session.user.id);

    switch (type) {
      case "full_analysis": {
        const analysis = runFullAnalysis(ctx);
        return NextResponse.json(analysis);
      }
      case "monthly_report": {
        const report = generateMonthlyReport(ctx);
        return NextResponse.json(report);
      }
      case "simulation": {
        if (!scenario) {
          return NextResponse.json(
            { error: "Scenario parameters required" },
            { status: 400 },
          );
        }
        const result = simulateScenario(ctx, scenario);
        return NextResponse.json(result);
      }
      default:
        return NextResponse.json(
          { error: "Invalid type. Use: full_analysis, monthly_report, or simulation" },
          { status: 400 },
        );
    }
  } catch (error) {
    return handleApiError(error);
  }
}
