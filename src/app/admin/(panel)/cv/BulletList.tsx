import { useId, useMemo, useState } from "react";
import { newId } from "../../_lib/format";
import type { Bullet } from "../../_lib/schema";
import {
  AddButton,
  ItemControls,
  LintedTextArea,
  confirmRemove,
  inputClass,
  moveItem,
  removeAt,
  replaceAt,
  smallButton,
  type FactOption,
} from "./Fields";

// Same limit as bulletSchema.factIds on the server
const MAX_FACTS = 10;

type FactMap = Map<string, FactOption>;

// Bullet editor shared by Experience and Projects. `owner` ("Deneyim 2") makes the repeated
// labels unique for screen readers.
export default function BulletList({
  bullets,
  onChange,
  max,
  facts,
  owner,
}: {
  bullets: Bullet[];
  onChange: (next: Bullet[]) => void;
  max: number;
  facts: FactOption[];
  owner: string;
}) {
  const factMap = useMemo<FactMap>(() => new Map(facts.map((f) => [f.id, f])), [facts]);

  const add = () => onChange([...bullets, { id: newId("b_"), text: "", factIds: [] }]);

  return (
    <div className="mt-4 space-y-3">
      <h4 className="text-xs font-semibold uppercase tracking-[0.08em] text-mist">Maddeler</h4>
      {bullets.length ? (
        <ol className="space-y-3">
          {bullets.map((bullet, i) => (
            <li key={bullet.id} className="rounded-xl border border-line bg-night/40 p-3">
              <BulletRow
                bullet={bullet}
                index={i}
                count={bullets.length}
                owner={owner}
                facts={facts}
                factMap={factMap}
                onChange={(next) => onChange(replaceAt(bullets, i, next))}
                onMove={(delta) => onChange(moveItem(bullets, i, delta))}
                onRemove={() => {
                  if (confirmRemove("Bu madde silinsin mi?", Boolean(bullet.text.trim() || bullet.factIds.length))) {
                    onChange(removeAt(bullets, i));
                  }
                }}
              />
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-xs text-mist">Henüz madde yok.</p>
      )}
      <AddButton onClick={add} count={bullets.length} max={max}>
        Madde ekle
      </AddButton>
    </div>
  );
}

function BulletRow({
  bullet,
  index,
  count,
  owner,
  facts,
  factMap,
  onChange,
  onMove,
  onRemove,
}: {
  bullet: Bullet;
  index: number;
  count: number;
  owner: string;
  facts: FactOption[];
  factMap: FactMap;
  onChange: (next: Bullet) => void;
  onMove: (delta: -1 | 1) => void;
  onRemove: () => void;
}) {
  const where = `${owner}, madde ${index + 1}`;
  return (
    <>
      <LintedTextArea
        label={
          <>
            Madde {index + 1}
            <span className="sr-only"> ({owner})</span>
          </>
        }
        value={bullet.text}
        onChange={(text) => onChange({ ...bullet, text })}
        maxChars={200}
        maxLength={400}
        rows={2}
        placeholder="Fiil + ne yaptın + sonuç (İngilizce)"
        actions={
          <ItemControls
            index={index}
            count={count}
            name={`${owner}, ${index + 1}. maddeyi`}
            onMove={onMove}
            onRemove={onRemove}
          />
        }
      />
      <LinkedFacts
        ids={bullet.factIds}
        factMap={factMap}
        onPrune={() => onChange({ ...bullet, factIds: bullet.factIds.filter((id) => factMap.has(id)) })}
      />
      <FactPicker
        facts={facts}
        selected={bullet.factIds}
        where={where}
        onChange={(factIds) => onChange({ ...bullet, factIds })}
      />
    </>
  );
}

// "Bağlı bilgiler: F003, F007 (onaysız)" under the bullet
function LinkedFacts({ ids, factMap, onPrune }: { ids: string[]; factMap: FactMap; onPrune: () => void }) {
  if (!ids.length) return <p className="mt-2 text-xs text-mist">Bağlı bilgi yok.</p>;
  const missing = ids.some((id) => !factMap.has(id));
  return (
    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
      <p className="text-xs text-mist">
        Bağlı bilgiler:{" "}
        {ids.map((id, i) => {
          const fact = factMap.get(id);
          return (
            <span key={id}>
              {i > 0 ? ", " : ""}
              <span className="font-semibold text-ink" title={fact?.statement}>
                {id}
              </span>
              {!fact ? (
                <span className="text-red-300"> (bulunamadı)</span>
              ) : !fact.confirmed ? (
                <span className="text-amber-200"> (onaysız)</span>
              ) : null}
            </span>
          );
        })}
      </p>
      {missing ? (
        <button type="button" onClick={onPrune} className={smallButton}>
          Bulunamayanları kaldır
        </button>
      ) : null}
    </div>
  );
}

// Compact multi-select: a disclosure with a search box and one checkbox per fact.
function FactPicker({
  facts,
  selected,
  where,
  onChange,
}: {
  facts: FactOption[];
  selected: string[];
  where: string;
  onChange: (next: string[]) => void;
}) {
  const id = useId();
  const [query, setQuery] = useState("");
  const q = query.trim().toLocaleLowerCase("tr");
  const visible = q
    ? facts.filter((f) => `${f.id} ${f.context} ${f.statement}`.toLocaleLowerCase("tr").includes(q))
    : facts;
  const full = selected.length >= MAX_FACTS;

  const toggle = (factId: string, on: boolean) =>
    onChange(on ? [...selected, factId] : selected.filter((x) => x !== factId));

  return (
    <details className="mt-2 rounded-xl border border-line">
      <summary className="cursor-pointer rounded-xl px-3 py-1.5 text-xs font-semibold text-mist transition-colors hover:text-ink">
        Bilgi bağla ({selected.length})<span className="sr-only">, {where}</span>
      </summary>
      <div className="border-t border-line p-3">
        {facts.length === 0 ? (
          <p className="text-xs text-mist">Bilgi Bankası&apos;nda henüz bilgi yok.</p>
        ) : (
          <>
            <label htmlFor={`${id}-q`} className="sr-only">
              Bilgi ara ({where})
            </label>
            <input
              id={`${id}-q`}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ara: F003, şirket ya da kelime"
              autoComplete="off"
              className={`${inputClass} py-1.5 text-xs`}
            />
            <fieldset className="mt-2">
              <legend className="sr-only">Bağlı bilgiler ({where})</legend>
              {visible.length ? (
                <ul className="max-h-56 space-y-0.5 overflow-y-auto pr-1">
                  {visible.map((f) => {
                    const checked = selected.includes(f.id);
                    return (
                      <li key={f.id}>
                        <label
                          title={f.statement}
                          className={`flex items-start gap-2 rounded-lg px-2 py-1.5 text-xs transition-colors hover:bg-raised ${
                            !checked && full ? "cursor-not-allowed opacity-50" : "cursor-pointer"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={!checked && full}
                            onChange={(e) => toggle(f.id, e.target.checked)}
                            className="mt-0.5 accent-ink"
                          />
                          <span className="min-w-0">
                            <span className="font-semibold text-ink">
                              {f.id} · {f.context || "Bağlamsız"}
                            </span>
                            {!f.confirmed ? <span className="text-amber-200"> (onaysız)</span> : null}
                            <span className="block truncate text-mist" lang="en">
                              {f.statement}
                            </span>
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-xs text-mist">Eşleşen bilgi yok.</p>
              )}
            </fieldset>
            {full ? <p className="mt-2 text-xs text-mist">Bir maddeye en fazla {MAX_FACTS} bilgi bağlanabilir.</p> : null}
          </>
        )}
      </div>
    </details>
  );
}
