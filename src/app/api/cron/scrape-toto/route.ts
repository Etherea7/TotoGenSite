import { NextResponse } from "next/server";
import { scrapeAndImportLatestDraws } from "@/lib/scrape-runner";

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (!cronSecret) {
    return NextResponse.json(
      { success: false, error: "CRON_SECRET is not configured" },
      { status: 500 }
    );
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const response = await scrapeAndImportLatestDraws();
    return NextResponse.json(response, { status: response.success ? 200 : 500 });
  } catch (error) {
    console.error("Cron scrape failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
