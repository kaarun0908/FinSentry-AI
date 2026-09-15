import { NextResponse } from "next/server";

declare global {
  var _finSentryStore: Map<string, any> | undefined;
}

const store = globalThis._finSentryStore ?? new Map<string, any>();
globalThis._finSentryStore = store;

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const entry = store.get(id);

  if (!entry) {
    return NextResponse.json({ detail: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    analysis_id: id,
    is_saved: entry.record.is_saved,
    created_at: entry.record.created_at,
    result: entry.full
  });
}
