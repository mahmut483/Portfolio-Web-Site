import "server-only";
import { requireOwner } from "../auth";
import { adminDb } from "../firebase-admin";
import { cvContentSchema, type CvContent, type MasterCv } from "@/app/admin/_lib/schema";

// Data access for the master CV. Every function checks the owner itself.

const masterRef = () => adminDb().collection("cv").doc("master");

export async function getMasterCv(): Promise<MasterCv | null> {
  await requireOwner();
  const snap = await masterRef().get();
  if (!snap.exists) return null;
  const data = snap.data()!;
  // Parse on read too, so a hand-edited document can't feed bad data into the UI
  const content = cvContentSchema.parse(data.content);
  return { content, updatedAt: String(data.updatedAt ?? "") };
}

export async function saveMasterCv(content: CvContent): Promise<void> {
  await requireOwner();
  const parsed = cvContentSchema.parse(content);
  await masterRef().set({ content: parsed, updatedAt: new Date().toISOString() });
}
