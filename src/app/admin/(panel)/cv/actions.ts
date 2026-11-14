"use server";

import { refresh } from "next/cache";
import { cvContentSchema, type ActionResult } from "../../_lib/schema";
import { saveMasterCv } from "@/server/data/cv";

export async function saveMasterCvAction(content: unknown): Promise<ActionResult> {
  const parsed = cvContentSchema.safeParse(content);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first ? `${first.path.join(".")}: ${first.message}` : "Geçersiz veri." };
  }
  await saveMasterCv(parsed.data);
  refresh();
  return { ok: true };
}
