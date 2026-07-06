import React, { useState } from "react";
import { FiCheckCircle, FiShoppingBag } from "react-icons/fi";
import { FaHeart } from "react-icons/fa";
import { BiSolidCommentDetail, BiShareAlt, BiDotsHorizontalRounded, BiBookmark } from "react-icons/bi";
import { HiVolumeOff } from "react-icons/hi";
import { cn } from "../../utils/cn";
import { Button } from "../ui/Button";
import { useCurrentUser } from "../../hooks/useCurrentUser";
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

// Mocked action-rail entry (like/comment/share) — visual only in the review.
const MockAction = ({ icon, label }: { icon: React.ReactNode; label: string }) => (
  <div className="flex flex-col items-center">
    <div className="action-circle">{icon}</div>
    <span className="text-on-media font-bold text-[13px] tracking-wide drop-shadow-md mt-1">{label}</span>
  </div>
);

// Feed-style review: the actual clip in a 9:16 player dressed EXACTLY like a feed
// card (VideoInfoOverlay + VideoActions), so the creator sees what they'll ship.
// The action rail numbers are mocked (no real likes/comments yet). Uses the local
// blob for native; a poster for embeds. Category sits above the title; the
// more/less expansion reveals description → software → hashtags (in that order).
export const ReviewPreview = ({
  values, videoUrl, posterUrl, note,
}: { values: MetadataValues; videoUrl?: string; posterUrl?: string; note?: string }) => {
  const [expanded, setExpanded] = useState(false);
  const { user } = useCurrentUser();
  const username = user?.username || "you";
  const tags = values.hashtags.filter(Boolean);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative mx-auto h-[68vh] aspect-[9/16] rounded-2xl overflow-hidden bg-scrim/60 glow-black">
        {videoUrl ? (
          <video src={videoUrl} className="w-full h-full object-cover" autoPlay loop muted playsInline />
        ) : posterUrl ? (
          <img src={posterUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl text-on-media/60">🎬</div>
        )}

        {/* Top bar — settings + mute (mocked, non-interactive) */}
        <div className="absolute top-0 inset-x-0 p-4 flex items-start justify-between z-20 pointer-events-none">
          <BiDotsHorizontalRounded className="text-[28px] text-on-media drop-shadow-md" />
          <HiVolumeOff className="text-2xl text-on-media drop-shadow-md" />
        </div>

        {/* Right action rail — mocked numbers */}
        <div className="absolute right-3 bottom-16 flex flex-col items-center gap-5 z-20 pointer-events-none">
          <MockAction icon={<FaHeart className="text-[22px] text-on-media" />} label="2" />
          <MockAction icon={<BiSolidCommentDetail className="text-[26px] text-on-media" />} label="8" />
          <MockAction icon={<BiShareAlt className="text-[26px] text-on-media" />} label="Share" />
          <div className="action-circle"><BiBookmark className="text-[22px] text-on-media" /></div>
        </div>

        {/* Bottom-left info block */}
        <section className="absolute left-4 bottom-6 w-[calc(100%-5rem)] flex flex-col items-start z-20">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-primary/80 flex items-center justify-center text-on-primary font-bold text-lg overflow-hidden shrink-0">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                username.charAt(0).toUpperCase()
              )}
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-on-media font-bold text-lg drop-shadow-md">@{username}</span>
              <span className="text-on-media-dim text-xs font-medium drop-shadow-md">just now</span>
            </div>
          </div>

          {/* Category pill — just above the title */}
          {values.category && (
            <span className="mb-1 bg-on-media/15 border border-on-media/20 text-on-media font-semibold text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full drop-shadow-md">
              {CATEGORY_LABELS[values.category] ?? values.category}
            </span>
          )}

          <h1 className="text-on-media font-semibold text-base drop-shadow-md line-clamp-1">
            {values.title || "Untitled"}
          </h1>

          {/* Expandable: description → software → hashtags */}
          {expanded && (
            <div className="mt-1 w-full">
              {values.description && (
                <p className="text-on-media-dim text-xs drop-shadow-md mb-2 whitespace-pre-line line-clamp-4">
                  {values.description}
                </p>
              )}
              {values.softwareUsed.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 mb-2">
                  {values.softwareUsed.map((s) => (
                    <span key={s} className="bg-primary/10 border border-primary/20 text-primary font-semibold text-[10px] px-2 py-0.5 rounded-full drop-shadow-md">
                      {SOFTWARE_LABELS[s] ?? s}
                    </span>
                  ))}
                </div>
              )}
              {tags.length > 0 && (
                <div className="flex flex-wrap items-center gap-x-2">
                  {tags.map((h, i) => (
                    <span key={i} className="text-on-media text-xs font-semibold drop-shadow-md">#{h}</span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Project asset pill — kept as-is (mocked price) */}
          <div className="mt-2">
            <span className="flex items-center gap-1.5 backdrop-blur-md border border-outline-variant/50 text-on-media-dim text-xs font-semibold px-3 py-1.5 rounded-full shadow-md" style={{ background: "var(--color-media-scrim)" }}>
              <FiShoppingBag className="w-3.5 h-3.5 text-primary" strokeWidth={2.5} />
              Project File • $5.00
            </span>
          </div>
        </section>

        {/* more / less toggle — only when there's something to expand */}
        {(values.description || values.softwareUsed.length > 0 || tags.length > 0) && (
          <Button
            variant="unstyled"
            onClick={() => setExpanded((e) => !e)}
            className="absolute bottom-6 right-3 z-30 font-bold text-sm text-on-media drop-shadow-md px-1 hover:underline"
          >
            {expanded ? "less" : "more"}
          </Button>
        )}
      </div>
      {note && <p className="text-xs text-on-surface-variant text-center">{note}</p>}
    </div>
  );
};

