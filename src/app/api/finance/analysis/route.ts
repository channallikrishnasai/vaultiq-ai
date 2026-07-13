import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { buildFinancialContext } from "@/services/ai/financial-context.service";
import {
  runFullAnalysis,
  generateMonthlyReport,
  simulateScenario,
  type WhatIfScenario,
} from "@/services/ai/analysis";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const ctx = await buildFinancialContext(session.user.id);
    const analysis = runFullAnalysis(ctx);
    return NextResponse.json(analysis);
  } catch (error) {
    console.error("[Analysis API]", error);
    return NextResponse.json(
      { error: "Failed to run analysis" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
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
    console.error("[Analysis API]", error);
    return NextResponse.json(
      { error: "Failed to process analysis request" },
      { status: 500 },
    );
  }
}
