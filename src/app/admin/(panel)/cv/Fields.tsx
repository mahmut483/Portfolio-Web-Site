import { useId, useMemo, type ReactNode } from "react";
import { lintText } from "../../_lib/lint";

// Small building blocks for the CV editor. Only imported by CvEditor (a client component), so this
// file has no "use client" of its own: its components take callbacks, which are not serializable.

export type FactOption = { id: string; statement: string; context: string; confirmed: boolean };

export const inputClass =
  "w-full scroll-mt-32 rounded-xl border border-line-strong bg-night px-3 py-2 text-sm text-ink placeholder:text-mist/60 focus:border-ink/50 disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-red-300/70";

export const labelClass = "block text-xs font-semibold text-mist";

export const smallButton =
  "inline-flex scroll-mt-32 items-center justify-center gap-1 rounded-full border border-line-strong px-3 py-1 text-xs font-semibold text-ink transition-colors hover:border-ink/40 hover:bg-raised disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-line-strong disabled:hover:bg-transparent";

// ── List helpers (return new arrays; state is never mutated) ─────────────────

export function replaceAt<T>(list: readonly T[], index: number, item: T): T[] {
  return list.map((x, i) => (i === index ? item : x));
}

export function removeAt<T>(list: readonly T[], index: number): T[] {
  return list.filter((_, i) => i !== index);
}

export function moveItem<T>(list: readonly T[], index: number, delta: number): T[] {
  const next = list.slice();
  const target = index + delta;
  if (target < 0 || target >= next.length) return next;
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

// Empty items go without a question; anything with content asks first.
export function confirmRemove(message: string, hasContent: boolean): boolean {
  return !hasContent || window.confirm(message);
}

// ── Layout pieces ────────────────────────────────────────────────────────────

export function Section({ title, en, meta, children }: { title: string; en: string; meta?: string; children: ReactNode }) {
  return (
    <details open className="group rounded-2xl border border-line bg-panel">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-2xl px-5 py-4 transition-colors hover:bg-raised/40 [&::-webkit-details-marker]:hidden">
        <h2 className="text-lg font-semibold">
          {title} <span className="font-normal text-mist">({en})</span>
        </h2>
        <span className="flex shrink-0 items-center gap-3 text-xs text-mist">
          {meta}
          <span aria-hidden="true" className="transition-transform group-open:rotate-180">
            ▾
          </span>
        </span>
      </summary>
      <div className="space-y-4 border-t border-line px-5 py-5">{children}</div>
    </details>
  );
}

export function ItemCard({ heading, controls, children }: { heading: ReactNode; controls: ReactNode; children: ReactNode }) {
  return (
    <li className="rounded-2xl border border-line bg-night/30 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="min-w-0 truncate text-sm font-semibold">{heading}</h3>
        {controls}
      </div>
      {children}
    </li>
  );
}

export function ItemControls({
  index,
  count,
  name,
  onMove,
  onRemove,
}: {
  index: number;
  count: number;
  name: string; // accusative, for screen readers: "2. deneyimi"
  onMove: (delta: -1 | 1) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex shrink-0 items-center gap-1.5">
      <button
        type="button"
        onClick={() => onMove(-1)}
        disabled={index === 0}
        aria-label={`${name} yukarı taşı`}
        title="Yukarı taşı"
        className={smallButton}
      >
        <span aria-hidden="true">↑</span>
      </button>
      <button
        type="button"
        onClick={() => onMove(1)}
        disabled={index >= count - 1}
        aria-label={`${name} aşağı taşı`}
        title="Aşağı taşı"
        className={smallButton}
      >
        <span aria-hidden="true">↓</span>
      </button>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`${name} sil`}
        className={`${smallButton} hover:border-red-300/60 hover:text-red-200`}
      >
        Sil
      </button>
    </div>
  );
}

export function AddButton({
  onClick,
  count,
  max,
  children,
}: {
  onClick: () => void;
  count: number;
  max: number;
  children: ReactNode;
}) {
  const full = count >= max;
  return (
    <div className="flex flex-wrap items-center gap-3">
      <button type="button" onClick={onClick} disabled={full} className={smallButton}>
        <span aria-hidden="true">+</span> {children}
      </button>
      {full ? <span className="text-xs text-mist">En fazla {max} tane eklenebilir.</span> : null}
    </div>
  );
}

export function Note({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-xl border border-line bg-night/40 px-3 py-2 text-xs leading-relaxed text-mist">{children}</p>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="text-sm text-mist">{children}</p>;
}

// ── Inputs ───────────────────────────────────────────────────────────────────

type TextFieldProps = {
  label: ReactNode;
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  placeholder?: string;
  type?: "text" | "email" | "tel" | "url";
  className?: string;
  autoComplete?: string;
};

// CV content is English, so text fields carry lang="en" (spell check and screen reader voice).
export function TextField({
  label,
  value,
  onChange,
  maxLength,
  placeholder,
  type = "text",
  className,
  autoComplete = "off",
}: TextFieldProps) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className={`${labelClass} mb-1`}>
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={maxLength}
        placeholder={placeholder}
        autoComplete={autoComplete}
        lang="en"
        spellCheck={type === "text"}
        className={inputClass}
      />
    </div>
  );
}

// Plain text, not <input type="month">: a month picker can't show or enter a year on its own,
// and the CV must never get an invented month ("2024" stays "2024").
export function MonthField({
  label,
  value,
  onChange,
  required = false,
  disabled = false,
  className,
}: {
  label: ReactNode;
  value: string | null;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  const id = useId();
  const missing = required && !disabled && !value;
  return (
    <div className={className}>
      <label htmlFor={id} className={`${labelClass} mb-1`}>
        {label}
        {required ? <span className="font-normal text-mist/80"> (zorunlu)</span> : null}
      </label>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        maxLength={7}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value.trim())}
        required={required}
        disabled={disabled}
        aria-invalid={missing || undefined}
        placeholder="2024-09 ya da 2024"
        pattern="[0-9]{4}(-(0[1-9]|1[0-2]))?"
        className={inputClass}
      />
    </div>
  );
}

// Textarea with a character counter and the live writing checks from _lib/lint.
// The warnings never block saving; they are linked to the field with aria-describedby.
export function LintedTextArea({
  label,
  value,
  onChange,
  maxChars,
  maxLength,
  rows = 2,
  placeholder,
  actions,
}: {
  label: ReactNode;
  value: string;
  onChange: (value: string) => void;
  maxChars: number; // soft limit, warned by lint
  maxLength: number; // hard limit, same as the server schema
  rows?: number;
  placeholder?: string;
  actions?: ReactNode;
}) {
  const id = useId();
  const issues = useMemo(() => lintText(value, { maxChars }), [value, maxChars]);
  const count = value.trim().length;
  const countId = `${id}-count`;
  const lintId = `${id}-lint`;

  return (
    <div>
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <label htmlFor={id} className={labelClass}>
          {label}
        </label>
        <div className="flex items-center gap-2">
          <span
            id={countId}
            className={`text-xs tabular-nums ${count > maxChars ? "font-semibold text-red-300" : "text-mist"}`}
          >
            {count} / {maxChars}
            <span className="sr-only"> karakter</span>
          </span>
          {actions}
        </div>
      </div>
      <textarea
        id={id}
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={maxLength}
        placeholder={placeholder}
        lang="en"
        aria-describedby={issues.length ? `${countId} ${lintId}` : countId}
        className={`${inputClass} resize-y leading-relaxed`}
      />
      {issues.length ? (
        <ul id={lintId} className="mt-2 space-y-1">
          {issues.map((issue) => (
            <li key={issue.code} className="flex gap-2 text-xs leading-relaxed text-amber-200">
              <span aria-hidden="true">⚠</span>
              <span>
                <span className="sr-only">Uyarı: </span>
                {issue.message}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
