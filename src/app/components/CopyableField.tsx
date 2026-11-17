"use client";

import { useEffect, useState } from "react";
import { Check, Copy } from "./icons";
import { track } from "../lib/analytics";

interface CopyableFieldProps {
  label: string;
  value: string;
  rowClass: string;
}

// Clipboard API is missing on non-HTTPS origins and some older in-app browsers
function legacyCopy(text: string) {
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.opacity = "0";
  document.body.appendChild(area);
  area.select();
  try {
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    area.remove();
  }
}

export default function CopyableField({ label, value, rowClass }: CopyableFieldProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  const copy = async () => {
    track("contact_copy", { field: label });
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
    } catch {
      if (legacyCopy(value)) setCopied(true);
    }
  };

  return (
    <div className={rowClass}>
      <dt className="text-mist">{label}</dt>
      <dd className="min-w-0">
        <button
          type="button"
          onClick={copy}
          data-track="skip"
          className="group/copy flex w-full items-center justify-between gap-3 text-left transition-colors cursor-pointer"
          title={`Click to copy ${label}`}
        >
          {/* Wraps instead of truncating, so the full address stays visible on phones */}
          <span className="min-w-0 [overflow-wrap:anywhere] transition-colors group-hover/copy:text-white">
            {value}
          </span>
          {/* Fixed width so the value does not rewrap when "Copy" turns into "Copied" */}
          <span className="inline-flex min-w-[5.75rem] shrink-0 items-center justify-center gap-1.5 rounded-full border border-line-strong px-2.5 py-1 text-xs font-medium text-mist transition-colors group-hover/copy:border-ink/40 group-hover/copy:text-ink">
            {copied ? <Check /> : <Copy />}
            <span aria-live="polite" className={copied ? "text-emerald-400" : undefined}>
              {copied ? "Copied" : "Copy"}
            </span>
          </span>
        </button>
      </dd>
    </div>
  );
}
