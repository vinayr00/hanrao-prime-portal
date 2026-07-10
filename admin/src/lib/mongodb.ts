// ─────────────────────────────────────────────────────────────────────────────
// MongoDB Client — SERVER SIDE ONLY
// This file must never be imported in client-side code.
// Use mongo.functions.ts (createServerFn) to call from the browser.
// ─────────────────────────────────────────────────────────────────────────────
import { MongoClient, type Db } from "mongodb";
import { randomUUID } from "node:crypto";

const URI = process.env.MONGODB_URI ?? "";
const DB_NAME = process.env.MONGODB_DB ?? "hanrao";

let _client: MongoClient | null = null;

export async function getDb(): Promise<Db> {
  if (!URI) throw new Error("MONGODB_URI is not set in .env");
  if (!_client) {
    _client = new MongoClient(URI);
    await _client.connect();
  }
  return _client.db(DB_NAME);
}

export function isMongoConfigured(): boolean {
  return Boolean(process.env.MONGODB_URI);
}

/** Strip MongoDB _id field, keep our own `id` field */
export function toDoc<T>(doc: Record<string, any>): T {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { _id, ...rest } = doc;
  return rest as T;
}

/** Generate a unique string ID */
export function newId(): string {
  return randomUUID();
}
