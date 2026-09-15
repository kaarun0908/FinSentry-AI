import { NextResponse } from "next/server";

declare global {
  var _finSentryStore: Map<string, any> | undefined;
}

const store = globalThis._finSentryStore ?? new Map<string, any>();
globalThis._finSentryStore = store;

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const entry = store.get(id);

  if (!entry) {
    return NextResponse.json({ detail: "Not found" }, { status: 404 });
  }

  entry.record.is_saved = !entry.record.is_saved;
  return NextResponse.json({ analysis_id: id, is_saved: entry.record.is_saved });
}
