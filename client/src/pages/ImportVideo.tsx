import Modal from "react-modal";
import { FiLink, FiCheckCircle } from "react-icons/fi";
import { useEmbedPublishFlow } from "../shared/hooks/useEmbedPublishFlow";
import { cn } from "../shared/utils/cn";
import { Button } from "../shared/components/ui/Button";
import { CATEGORY_VOCAB, CATEGORY_LABELS } from "../shared/constants/categoryVocab";
import { SOFTWARE_VOCAB, SOFTWARE_LABELS } from "../shared/constants/softwareVocab";

type Props = { isOpen: boolean; onClose: () => void };

const STEPS = ["Import", "Details", "Review"] as const;

const ImportVideoModal = ({ isOpen, onClose }: Props) => {
  const f = useEmbedPublishFlow(onClose);

  const handleClose = () => {
    f.reset();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={handleClose}
      contentLabel="Import Video Modal"
      className="outline-none w-full h-full lg:w-[640px] lg:h-auto lg:max-h-[85vh] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col overflow-hidden z-50"
      overlayClassName="fixed inset-0 bg-scrim/60 backdrop-blur-sm z-50"
    >
      <div className="w-full h-full bg-surface-container/90 backdrop-blur-xl border border-hairline/10 lg:rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header + stepper */}
        <div className="bg-surface-container-highest/80 border-b border-hairline/5 py-4 px-6 shrink-0">
          <h2 className="text-center text-on-surface font-semibold text-lg mb-3">Import a Video</h2>
          <div className="flex items-center justify-center gap-2">
            {STEPS.map((label, i) => {
              const n = (i + 1) as 1 | 2 | 3;
              const active = f.step === n;
              const done = f.step > n;
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
                  {i < STEPS.length - 1 && <span className="w-4 h-px bg-hairline/20" />}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* STEP 1 — Import URL */}
          {f.step === 1 && (
            <div className="flex flex-col gap-4">
              <label className="block text-on-surface font-semibold text-sm" htmlFor="embedUrl">
                Video URL <span className="text-on-surface-variant font-normal text-xs">(YouTube, Vimeo, TikTok)</span>
              </label>
              <div className="relative">
                <FiLink className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                <input
                  id="embedUrl"
                  type="url"
                  value={f.url}
                  onChange={(e) => f.setUrl(e.target.value)}
                  placeholder="https://youtu.be/…"
                  className="w-full bg-surface-container-lowest border border-hairline/10 rounded-lg py-3 pl-10 pr-4 text-on-surface focus:outline-none focus:border-primary focus:glow-primary transition-all"
                />
              </div>
              <p className="text-xs text-on-surface-variant">
                We fetch the title and thumbnail automatically. It's saved as a draft you review before publishing.
              </p>
            </div>
          )}

          {/* STEP 2 — Metadata */}
          {f.step === 2 && (
            <div className="flex flex-col gap-5">
              {f.draft?.thumbnail_url && (
                <img src={f.draft.thumbnail_url} alt="" className="w-full max-h-40 object-cover rounded-lg border border-hairline/10" />
              )}

              <Field label="Title">
                <input
                  type="text"
                  value={f.title}
                  onChange={(e) => f.setTitle(e.target.value)}
                  className={inputCls}
                  placeholder="Title"
                />
              </Field>

              <Field label="Description" optional>
                <textarea
                  value={f.description}
                  onChange={(e) => f.setDescription(e.target.value)}
                  rows={3}
                  className={cn(inputCls, "resize-none")}
                  placeholder="What's this Kine about?"
                />
              </Field>

              <Field label="Hashtags" hint="(comma separated)">
                <input
                  type="text"
                  value={f.hashtags.join(",")}
                  onChange={(e) => f.setHashtags(e.target.value.split(","))}
                  className={inputCls}
                  placeholder="vfx, houdini, breakdown"
                />
              </Field>

              <Field label="Category" hint="(required)">
                <select value={f.category} onChange={(e) => f.setCategory(e.target.value)} className={inputCls}>
                  <option value="">— Select a category —</option>
                  {CATEGORY_VOCAB.map((c) => (
                    <option key={c.slug} value={c.slug}>{c.label}</option>
                  ))}
                </select>
              </Field>

              <Field label="Made with" hint="(tools)">
                <div className="flex flex-wrap gap-2">
                  {SOFTWARE_VOCAB.map((tool) => {
                    const selected = f.softwareUsed.includes(tool.slug);
                    return (
                      <button
                        key={tool.slug}
                        type="button"
                        onClick={() =>
                          f.setSoftwareUsed(
                            selected ? f.softwareUsed.filter((s) => s !== tool.slug) : [...f.softwareUsed, tool.slug]
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
          )}

          {/* STEP 3 — Review */}
          {f.step === 3 && (
            <div className="flex flex-col gap-4">
              {f.draft?.thumbnail_url && (
                <img src={f.draft.thumbnail_url} alt="" className="w-full max-h-44 object-cover rounded-lg border border-hairline/10" />
              )}
              <ReviewRow label="Title" value={f.title} />
              {f.description && <ReviewRow label="Description" value={f.description} />}
              <ReviewRow label="Category" value={CATEGORY_LABELS[f.category] ?? "—"} />
              {f.hashtags.filter(Boolean).length > 0 && (
                <ReviewRow label="Hashtags" value={f.hashtags.filter(Boolean).map((h) => `#${h}`).join(" ")} />
              )}
              {f.softwareUsed.length > 0 && (
                <ReviewRow label="Made with" value={f.softwareUsed.map((s) => SOFTWARE_LABELS[s] ?? s).join(", ")} />
              )}
              <p className="text-xs text-on-surface-variant mt-1">
                Publishing makes this public and eligible for feeds.
              </p>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex justify-between gap-3 p-6 border-t border-hairline/5 shrink-0">
          <Button
            variant="unstyled"
            type="button"
            onClick={f.step === 1 ? handleClose : () => f.setStep((f.step - 1) as 1 | 2)}
            className="px-6 py-2.5 rounded-full text-on-surface-variant font-medium hover:bg-hairline/5 transition-colors"
          >
            {f.step === 1 ? "Cancel" : "Back"}
          </Button>

          {f.step === 1 && (
            <PrimaryBtn onClick={f.handleImport} disabled={f.isImporting || !f.url.trim()}>
              {f.isImporting ? "Importing…" : "Import"}
            </PrimaryBtn>
          )}
          {f.step === 2 && (
            <PrimaryBtn onClick={f.handleSaveMetadata} disabled={f.isSaving || !f.title.trim() || !f.category}>
              {f.isSaving ? "Saving…" : "Continue"}
            </PrimaryBtn>
          )}
          {f.step === 3 && (
            <PrimaryBtn onClick={f.handlePublish} disabled={f.isPublishing}>
              {f.isPublishing ? "Publishing…" : "Publish"}
            </PrimaryBtn>
          )}
        </div>
      </div>
    </Modal>
  );
};

const inputCls =
  "w-full bg-surface-container-lowest border border-hairline/10 rounded-lg py-3 px-4 text-on-surface focus:outline-none focus:border-primary focus:glow-primary transition-all";

const Field = ({ label, hint, optional, children }: { label: string; hint?: string; optional?: boolean; children: React.ReactNode }) => (
  <div className="w-full">
    <label className="block text-on-surface font-semibold text-sm mb-2">
      {label}{" "}
      {optional && <span className="text-on-surface-variant font-normal text-xs">(optional)</span>}
      {hint && <span className="text-on-surface-variant font-normal text-xs">{hint}</span>}
    </label>
    {children}
  </div>
);

const ReviewRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-on-surface-variant text-xs font-semibold uppercase tracking-wide">{label}</span>
    <span className="text-on-surface text-sm whitespace-pre-line">{value}</span>
  </div>
);

const PrimaryBtn = ({ onClick, disabled, children }: { onClick: () => void; disabled?: boolean; children: React.ReactNode }) => (
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

export default ImportVideoModal;
