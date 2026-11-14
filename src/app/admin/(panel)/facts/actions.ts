"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import {
  absenceInputSchema,
  factInputSchema,
  skillInputSchema,
  type ActionResult,
} from "../../_lib/schema";
import {
  addAbsence,
  createFact,
  deleteFact,
  removeAbsence,
  removeSkill,
  setFactConfirmed,
  updateFact,
  upsertSkill,
} from "@/server/data/facts";

// Every action validates its input and goes through the data layer, which calls requireOwner().

const docId = z.string().regex(/^[A-Za-z0-9_-]{1,60}$/);

function invalid(error: z.ZodError): ActionResult {
  const first = error.issues[0];
  return { ok: false, error: first ? `${first.path.join(".") || "Alan"}: ${first.message}` : "Geçersiz veri." };
}

export async function createFactAction(input: unknown): Promise<ActionResult> {
  const parsed = factInputSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  await createFact(parsed.data);
  refresh();
  return { ok: true };
}

export async function updateFactAction(id: unknown, input: unknown): Promise<ActionResult> {
  const idOk = docId.safeParse(id);
  const parsed = factInputSchema.safeParse(input);
  if (!idOk.success) return { ok: false, error: "Geçersiz kimlik." };
  if (!parsed.success) return invalid(parsed.error);
  const result = await updateFact(idOk.data, parsed.data);
  if (result.error) return { ok: false, error: result.error };
  refresh();
  return { ok: true };
}

export async function setFactConfirmedAction(id: unknown, confirmed: unknown): Promise<ActionResult> {
  const idOk = docId.safeParse(id);
  if (!idOk.success || typeof confirmed !== "boolean") return { ok: false, error: "Geçersiz istek." };
  const result = await setFactConfirmed(idOk.data, confirmed);
  if (result.error) return { ok: false, error: result.error };
  refresh();
  return { ok: true };
}

export async function deleteFactAction(id: unknown): Promise<ActionResult> {
  const idOk = docId.safeParse(id);
  if (!idOk.success) return { ok: false, error: "Geçersiz kimlik." };
  await deleteFact(idOk.data);
  refresh();
  return { ok: true };
}

export async function addAbsenceAction(input: unknown): Promise<ActionResult> {
  const parsed = absenceInputSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  await addAbsence(parsed.data);
  refresh();
  return { ok: true };
}

export async function removeAbsenceAction(id: unknown): Promise<ActionResult> {
  const idOk = docId.safeParse(id);
  if (!idOk.success) return { ok: false, error: "Geçersiz kimlik." };
  await removeAbsence(idOk.data);
  refresh();
  return { ok: true };
}

export async function upsertSkillAction(input: unknown, id?: unknown): Promise<ActionResult> {
  const parsed = skillInputSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  let existing: string | undefined;
  if (id !== undefined && id !== null) {
    const idOk = docId.safeParse(id);
    if (!idOk.success) return { ok: false, error: "Geçersiz kimlik." };
    existing = idOk.data;
  }
  const result = await upsertSkill(parsed.data, existing);
  if (result.error) return { ok: false, error: result.error };
  refresh();
  return { ok: true };
}

export async function removeSkillAction(id: unknown): Promise<ActionResult> {
  const idOk = docId.safeParse(id);
  if (!idOk.success) return { ok: false, error: "Geçersiz kimlik." };
  await removeSkill(idOk.data);
  refresh();
  return { ok: true };
}
