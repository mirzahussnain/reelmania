import Modal from "react-modal";
import { FiLink } from "react-icons/fi";
import { useEmbedPublishFlow } from "../shared/hooks/useEmbedPublishFlow";
import { Button } from "../shared/components/ui/Button";
import {
  Stepper,
  PrimaryBtn,
  MetadataFields,
  ReviewSummary,
} from "../shared/components/wizard/WizardBits";

type Props = { isOpen: boolean; onClose: () => void };

const STEPS = ["Import", "Details", "Review"] as const;

const ImportVideoModal = ({ isOpen, onClose }: Props) => {
  const f = useEmbedPublishFlow(onClose);

  const handleClose = () => {
    f.reset();
    onClose();
  };

  const values = {
    title: f.title, description: f.description, hashtags: f.hashtags,
    category: f.category, softwareUsed: f.softwareUsed,
  };
  const setters = {
    setTitle: f.setTitle, setDescription: f.setDescription, setHashtags: f.setHashtags,
    setCategory: f.setCategory, setSoftwareUsed: f.setSoftwareUsed,
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
          <Stepper steps={STEPS} current={f.step} />
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

          {/* STEP 2 — Details */}
          {f.step === 2 && (
            <MetadataFields values={values} setters={setters} previewUrl={f.draft?.thumbnail_url} />
          )}

          {/* STEP 3 — Review */}
          {f.step === 3 && (
            <ReviewSummary
              values={values}
              previewUrl={f.draft?.thumbnail_url}
              note="Publishing makes this public and eligible for feeds."
            />
          )}
        </div>

        {/* Footer */}
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

export default ImportVideoModal;
