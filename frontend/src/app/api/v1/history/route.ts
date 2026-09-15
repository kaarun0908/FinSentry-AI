import { NextResponse } from "next/server";

declare global {
  var _finSentryStore: Map<string, any> | undefined;
}

const store = globalThis._finSentryStore ?? new Map<string, any>();
globalThis._finSentryStore = store;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const saved_only = searchParams.get("saved_only") === "true";

  const items = Array.from(store.values())
    .map(entry => entry.record)
    .filter(record => !saved_only || record.is_saved)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return NextResponse.json(items);
}
