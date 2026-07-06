import React from "react";
import { FiCheckCircle } from "react-icons/fi";
import { cn } from "../../utils/cn";
import { Button } from "../ui/Button";
import { CATEGORY_VOCAB, CATEGORY_LABELS } from "../../constants/categoryVocab";
import { SOFTWARE_VOCAB, SOFTWARE_LABELS } from "../../constants/softwareVocab";

// Shared building blocks for the publish wizard so the NATIVE upload flow and the
// EMBED import flow render an identical Details -> Review -> Publish experience.
// Only each flow's first step (file dropzone vs. URL input) differs.

export const inputCls =
  "w-full bg-surface-container-lowest border border-hairline/10 rounded-lg py-3 px-4 text-on-surface focus:outline-none focus:border-primary focus:glow-primary transition-all";

export const Field = ({
  label, hint, optional, children,
}: { label: string; hint?: string; optional?: boolean; children: React.ReactNode }) => (
  <div className="w-full">
    <label className="block text-on-surface font-semibold text-sm mb-2">
      {label}{" "}
      {optional && <span className="text-on-surface-variant font-normal text-xs">(optional)</span>}
      {hint && <span className="text-on-surface-variant font-normal text-xs">{hint}</span>}
    </label>
    {children}
  </div>
);

export const PrimaryBtn = ({
  onClick, disabled, children,
}: { onClick: () => void; disabled?: boolean; children: React.ReactNode }) => (
  <Button
    variant="unstyled"
    type="button"
    onClick={onClick}
    disabled={disabled}
    className="px-8 py-2.5 bg-primary text-on-primary font-bold rounded-full hover:bg-primary-container hover:glow-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
  >
    {children}
  </Button>
);

export const Stepper = ({ steps, current }: { steps: readonly string[]; current: number }) => (
  <div className="flex items-center justify-center gap-2">
    {steps.map((label, i) => {
      const n = i + 1;
      const active = current === n;
      const done = current > n;
      return (
        <div key={label} className="flex items-center gap-2">
          <span
            className={cn(
              "flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border transition-all",
              active ? "bg-primary/15 border-primary text-primary"
                : done ? "border-primary/30 text-primary/70"
                : "border-hairline/10 text-on-surface-variant"
            )}
          >
            {done ? <FiCheckCircle className="w-3.5 h-3.5" /> : <span>{n}</span>}
            {label}
          </span>
          {i < steps.length - 1 && <span className="w-4 h-px bg-hairline/20" />}
        </div>
      );
    })}
  </div>
);

// The editable metadata fields — identical for native and embed. Category is
// visually flagged required; the flow hook enforces it before advancing.
export interface MetadataValues {
  title: string;
  description: string;
  hashtags: string[];
  category: string;
  softwareUsed: string[];
}
export interface MetadataSetters {
  setTitle: (v: string) => void;
  setDescription: (v: string) => void;
  setHashtags: (v: string[]) => void;
  setCategory: (v: string) => void;
  setSoftwareUsed: (v: string[]) => void;
}

export const MetadataFields = ({
  values, setters, previewUrl,
}: { values: MetadataValues; setters: MetadataSetters; previewUrl?: string }) => (
  <div className="flex flex-col gap-5">
    {previewUrl && (
      <img
        src={previewUrl}
        alt=""
        className="mx-auto h-[32vh] aspect-[9/16] object-cover rounded-xl border border-hairline/10 bg-scrim/40"
      />
    )}

    <Field label="Title">
      <input type="text" value={values.title} onChange={(e) => setters.setTitle(e.target.value)} className={inputCls} placeholder="Title" />
    </Field>

    <Field label="Description" optional>
      <textarea value={values.description} onChange={(e) => setters.setDescription(e.target.value)} rows={3} className={cn(inputCls, "resize-none")} placeholder="What's this Kine about?" />
    </Field>

    <Field label="Hashtags" hint="(comma separated)">
      <input type="text" value={values.hashtags.join(",")} onChange={(e) => setters.setHashtags(e.target.value.split(","))} className={inputCls} placeholder="vfx, houdini, breakdown" />
    </Field>

    <Field label="Category" hint="(required)">
      <select value={values.category} onChange={(e) => setters.setCategory(e.target.value)} className={inputCls}>
        <option value="">— Select a category —</option>
        {CATEGORY_VOCAB.map((c) => (
          <option key={c.slug} value={c.slug}>{c.label}</option>
        ))}
      </select>
    </Field>

    <Field label="Made with" hint="(tools)">
      <div className="flex flex-wrap gap-2">
        {SOFTWARE_VOCAB.map((tool) => {
          const selected = values.softwareUsed.includes(tool.slug);
          return (
            <button
              key={tool.slug}
              type="button"
              onClick={() =>
                setters.setSoftwareUsed(
                  selected ? values.softwareUsed.filter((s) => s !== tool.slug) : [...values.softwareUsed, tool.slug]
                )
              }
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                selected ? "bg-primary/15 border-primary text-primary"
                  : "bg-surface-container-lowest border-hairline/10 text-on-surface-variant hover:border-primary/40"
              )}
            >
              {tool.label}
            </button>
          );
        })}
      </div>
    </Field>
  </div>
);

// Feed-style review: the actual clip in a 9:16 player with the entered metadata
// overlaid, mirroring how a Kine looks in the feed (VideoInfoOverlay). Uses the
// local blob for native; a poster image for embeds (no local bytes).
export const ReviewPreview = ({
  values, videoUrl, posterUrl, note,
}: { values: MetadataValues; videoUrl?: string; posterUrl?: string; note?: string }) => (
  <div className="flex flex-col items-center gap-3">
    <div className="relative mx-auto h-[52vh] aspect-[9/16] rounded-xl overflow-hidden border border-hairline/10 bg-scrim/60">
      {videoUrl ? (
        <video src={videoUrl} className="w-full h-full object-cover" autoPlay loop muted playsInline />
      ) : posterUrl ? (
        <img src={posterUrl} alt="" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-3xl text-on-media/60">🎬</div>
      )}

      {/* Bottom scrim + overlay, matching the feed's VideoInfoOverlay. */}
      <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-scrim/90 via-scrim/40 to-transparent">
        {values.category && (
          <span className="inline-block mb-2 bg-on-media/15 border border-on-media/20 text-on-media font-semibold text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full">
            {CATEGORY_LABELS[values.category] ?? values.category}
          </span>
        )}
        <h3 className="text-on-media font-semibold text-sm line-clamp-1 drop-shadow-md">{values.title || "Untitled"}</h3>
        {values.description && (
          <p className="text-on-media-dim text-xs line-clamp-2 mt-1 drop-shadow-md">{values.description}</p>
        )}
        {values.softwareUsed.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {values.softwareUsed.map((s) => (
              <span key={s} className="bg-primary/20 border border-primary/30 text-primary text-[10px] font-semibold px-2 py-0.5 rounded-full">
                {SOFTWARE_LABELS[s] ?? s}
              </span>
            ))}
          </div>
        )}
        {values.hashtags.filter(Boolean).length > 0 && (
          <div className="flex flex-wrap gap-x-2 mt-2">
            {values.hashtags.filter(Boolean).map((h, i) => (
              <span key={i} className="text-on-media text-xs font-semibold drop-shadow-md">#{h}</span>
            ))}
          </div>
        )}
      </div>
    </div>
    {note && <p className="text-xs text-on-surface-variant text-center">{note}</p>}
  </div>
);

const ReviewRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-on-surface-variant text-xs font-semibold uppercase tracking-wide">{label}</span>
    <span className="text-on-surface text-sm whitespace-pre-line">{value}</span>
  </div>
);

// Read-only summary for the Review step. `note` lets a flow add a status line
// (e.g. native "still processing…").
export const ReviewSummary = ({
  values, previewUrl, note,
}: { values: MetadataValues; previewUrl?: string; note?: string }) => (
  <div className="flex flex-col gap-4">
    {previewUrl && (
      <img
        src={previewUrl}
        alt=""
        className="mx-auto h-[40vh] aspect-[9/16] object-cover rounded-xl border border-hairline/10 bg-scrim/40"
      />
    )}
    <ReviewRow label="Title" value={values.title || "—"} />
    {values.description && <ReviewRow label="Description" value={values.description} />}
    <ReviewRow label="Category" value={CATEGORY_LABELS[values.category] ?? "—"} />
    {values.hashtags.filter(Boolean).length > 0 && (
      <ReviewRow label="Hashtags" value={values.hashtags.filter(Boolean).map((h) => `#${h}`).join(" ")} />
    )}
    {values.softwareUsed.length > 0 && (
      <ReviewRow label="Made with" value={values.softwareUsed.map((s) => SOFTWARE_LABELS[s] ?? s).join(", ")} />
    )}
    {note && <p className="text-xs text-on-surface-variant mt-1">{note}</p>}
  </div>
);
