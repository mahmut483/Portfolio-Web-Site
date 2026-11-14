import "server-only";
import { requireOwner } from "../auth";
import { adminDb } from "../firebase-admin";
import {
  absenceInputSchema,
  factInputSchema,
  skillInputSchema,
  type Absence,
  type Fact,
  type FactInput,
  type Skill,
  type SkillInput,
} from "@/app/admin/_lib/schema";

// Data access for the fact bank, the "bende yok" list and the skill dictionary.
// Every exported function checks the owner itself.

const db = () => adminDb();
const now = () => new Date().toISOString();

function toFact(id: string, d: FirebaseFirestore.DocumentData): Fact {
  return {
    id,
    ...factInputSchema.parse(d),
    confirmed: Boolean(d.confirmed),
    confirmedAt: d.confirmedAt ?? null,
    origin: d.origin === "cv" || d.origin === "site" ? d.origin : "manual",
    sourceText: String(d.sourceText ?? ""),
    createdAt: String(d.createdAt ?? ""),
    updatedAt: String(d.updatedAt ?? ""),
  };
}

export async function listFacts(): Promise<Fact[]> {
  await requireOwner();
  const snap = await db().collection("facts").get();
  return snap.docs.map((d) => toFact(d.id, d.data())).sort((a, b) => a.id.localeCompare(b.id));
}

// Readable, stable ids (F001, F002...) so suggestions can cite them
async function nextFactId(): Promise<string> {
  const counter = db().collection("meta").doc("counters");
  return db().runTransaction(async (tx) => {
    const snap = await tx.get(counter);
    const n = Number(snap.data()?.fact ?? 0) + 1;
    tx.set(counter, { fact: n }, { merge: true });
    return `F${String(n).padStart(3, "0")}`;
  });
}

export async function createFact(input: FactInput): Promise<string> {
  await requireOwner();
  const data = factInputSchema.parse(input);
  const id = await nextFactId();
  const t = now();
  await db().collection("facts").doc(id).set({
    ...data,
    confirmed: false,
    confirmedAt: null,
    origin: "manual",
    sourceText: "",
    createdAt: t,
    updatedAt: t,
  });
  return id;
}

export async function updateFact(id: string, input: FactInput): Promise<{ error?: string }> {
  await requireOwner();
  const data = factInputSchema.parse(input);
  const ref = db().collection("facts").doc(id);
  const snap = await ref.get();
  if (!snap.exists) return { error: "Bilgi bulunamadı." };
  // Same rule as confirming: a confirmed fact must keep its scope fields
  if (snap.data()!.confirmed && (!data.ownership || !data.status)) {
    return { error: "Onaylı bir bilginin \"rolüm\" ve \"durum\" alanları boş olamaz. Önce onayı kaldır." };
  }
  await ref.update({ ...data, updatedAt: now() });
  return {};
}

// A fact can only be confirmed once its scope is recorded: the AI rules depend on both fields
export async function setFactConfirmed(id: string, confirmed: boolean): Promise<{ error?: string }> {
  await requireOwner();
  const ref = db().collection("facts").doc(id);
  const snap = await ref.get();
  if (!snap.exists) return { error: "Bilgi bulunamadı." };
  const d = snap.data()!;
  if (confirmed && (!d.ownership || !d.status)) {
    return { error: "Onaylamadan önce \"rolüm\" ve \"durum\" alanlarını seç." };
  }
  await ref.update({ confirmed, confirmedAt: confirmed ? now() : null, updatedAt: now() });
  return {};
}

export async function deleteFact(id: string): Promise<void> {
  await requireOwner();
  await db().collection("facts").doc(id).delete();
}

// ── "Bende yok" ──────────────────────────────────────────────────────────────

export async function listAbsences(): Promise<Absence[]> {
  await requireOwner();
  const snap = await db().collection("absences").get();
  return snap.docs
    .map((d) => ({ id: d.id, ...absenceInputSchema.parse(d.data()), createdAt: String(d.data().createdAt ?? "") }))
    .sort((a, b) => a.text.localeCompare(b.text));
}

export async function addAbsence(input: { text: string; note: string }): Promise<void> {
  await requireOwner();
  const data = absenceInputSchema.parse(input);
  await db().collection("absences").add({ ...data, createdAt: now() });
}

export async function removeAbsence(id: string): Promise<void> {
  await requireOwner();
  await db().collection("absences").doc(id).delete();
}

// ── Skill dictionary ─────────────────────────────────────────────────────────

function skillId(name: string) {
  return name
    .toLowerCase()
    .replace(/#/g, "sharp")
    .replace(/\+/g, "plus")
    .replace(/\./g, "dot")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

export async function listSkills(): Promise<Skill[]> {
  await requireOwner();
  const snap = await db().collection("skills").get();
  return snap.docs
    .map((d) => ({ id: d.id, ...skillInputSchema.parse(d.data()), updatedAt: String(d.data().updatedAt ?? "") }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function upsertSkill(input: SkillInput, existingId?: string): Promise<{ error?: string }> {
  await requireOwner();
  const data = skillInputSchema.parse(input);
  const id = existingId ?? skillId(data.name);
  if (!id) return { error: "Geçersiz beceri adı." };
  const ref = db().collection("skills").doc(id);
  const exists = (await ref.get()).exists;
  // New skill: never overwrite one that already exists. Edit: the document must exist.
  if (!existingId && exists) return { error: `"${data.name}" sözlükte zaten var.` };
  if (existingId && !exists) return { error: "Beceri bulunamadı." };
  await ref.set({ ...data, updatedAt: now() });
  return {};
}

export async function removeSkill(id: string): Promise<void> {
  await requireOwner();
  await db().collection("skills").doc(id).delete();
}

// Counts for the dashboard
export async function factBankStats() {
  await requireOwner();
  const [facts, absences, skills] = await Promise.all([
    db().collection("facts").get(),
    db().collection("absences").count().get(),
    db().collection("skills").count().get(),
  ]);
  const confirmed = facts.docs.filter((d) => d.data().confirmed).length;
  return {
    facts: facts.size,
    confirmed,
    pending: facts.size - confirmed,
    absences: absences.data().count,
    skills: skills.data().count,
  };
}
