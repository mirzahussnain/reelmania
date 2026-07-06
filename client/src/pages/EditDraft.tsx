import Modal from "react-modal";
import { useDraftPublishFlow } from "../shared/hooks/useDraftPublishFlow";
import { Button } from "../shared/components/ui/Button";
import {
  Stepper,
  PrimaryBtn,
  MetadataFields,
  ReviewSummary,
} from "../shared/components/wizard/WizardBits";
import type { VideoType } from "../types";

type Props = { draft: VideoType | null; isOpen: boolean; onClose: () => void; onPublished?: () => void };

const STEPS = ["Details", "Review"] as const;

const EditDraftModal = ({ draft, isOpen, onClose, onPublished }: Props) => {
  const f = useDraftPublishFlow(draft, () => { onPublished?.(); onClose(); });

  const values = {
    title: f.title, description: f.description, hashtags: f.hashtags,
    category: f.category, softwareUsed: f.softwareUsed,
  };
  const setters = {
    setTitle: f.setTitle, setDescription: f.setDescription, setHashtags: f.setHashtags,
    setCategory: f.setCategory, setSoftwareUsed: f.setSoftwareUsed,
  };
  const previewUrl = draft?.thumbnail_url;

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      contentLabel="Edit Draft Modal"
      className="outline-none w-full h-full lg:w-[640px] lg:h-auto lg:max-h-[85vh] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col overflow-hidden z-50"
      overlayClassName="fixed inset-0 bg-scrim/60 backdrop-blur-sm z-50"
    >
      <div className="w-full h-full bg-surface-container/90 backdrop-blur-xl border border-hairline/10 lg:rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        <div className="bg-surface-container-highest/80 border-b border-hairline/5 py-4 px-6 shrink-0">
          <h2 className="text-center text-on-surface font-semibold text-lg mb-3">Finish &amp; Publish</h2>
          <Stepper steps={STEPS} current={f.step - 1} />
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {f.step === 2 && <MetadataFields values={values} setters={setters} previewUrl={previewUrl} />}
          {f.step === 3 && (
            <ReviewSummary
              values={values}
              previewUrl={previewUrl}
              note={
                f.isFailed
                  ? "Processing failed — this file couldn't be read."
                  : f.isReady
                    ? "Publishing makes this public and eligible for feeds."
                    : "Processing your video… Publish unlocks once it's ready."
              }
            />
          )}
        </div>

        <div className="flex justify-between gap-3 p-6 border-t border-hairline/5 shrink-0">
          <Button
            variant="unstyled"
            type="button"
            onClick={f.step === 2 ? onClose : () => f.setStep(2)}
            className="px-6 py-2.5 rounded-full text-on-surface-variant font-medium hover:bg-hairline/5 transition-colors"
          >
            {f.step === 2 ? "Cancel" : "Back"}
          </Button>

          {f.step === 2 && (
            <PrimaryBtn onClick={f.handleSaveMetadata} disabled={f.isSaving || !f.title.trim() || !f.category}>
              {f.isSaving ? "Saving…" : "Continue"}
            </PrimaryBtn>
          )}
          {f.step === 3 && (
            <PrimaryBtn onClick={f.handlePublish} disabled={f.isPublishing || !f.isReady}>
              {f.isPublishing ? "Publishing…" : f.isReady ? "Publish" : "Processing…"}
            </PrimaryBtn>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default EditDraftModal;
