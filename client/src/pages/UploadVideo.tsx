import { FaExchangeAlt, FaPlus } from "react-icons/fa";
import Modal from "react-modal";
import { useNativeUploadFlow } from "../shared/hooks/useNativeUploadFlow";
import { cn } from "../shared/utils/cn";
import { Button } from "../shared/components/ui/Button";
import {
  Stepper,
  PrimaryBtn,
  MetadataFields,
  ReviewPreview,
} from "../shared/components/wizard/WizardBits";

type Props = { isOpen: boolean; onClose: () => void };

const STEPS = ["Select", "Details", "Review"] as const;

const UploadVideoModal = ({ isOpen, onClose }: Props) => {
  const f = useNativeUploadFlow(onClose);

  const handleClose = () => {
    f.reset();
    onClose();
  };

  const triggerFileInput = () => {
    const el = document.getElementById("fileInput") as HTMLInputElement | null;
    if (el) { el.value = ""; el.click(); }
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
      contentLabel="Upload Video Modal"
      className="outline-none w-full h-full lg:w-[640px] lg:h-auto lg:max-h-[85vh] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col overflow-hidden z-50"
      overlayClassName="fixed inset-0 bg-scrim/60 backdrop-blur-sm z-50"
    >
      <div className="w-full h-full bg-surface-container/90 backdrop-blur-xl border border-hairline/10 lg:rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        <div className="bg-surface-container-highest/80 border-b border-hairline/5 py-4 px-6 shrink-0">
          <h2 className="text-center text-on-surface font-semibold text-lg mb-3">Upload a Video</h2>
          <Stepper steps={STEPS} current={f.step} />
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* STEP 1 — Select a file from disk (local preview only, no upload yet) */}
          {f.step === 1 && (
            <div
              className={cn(
                "mx-auto h-[52vh] aspect-[9/16] flex flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all cursor-pointer group",
                f.fileURL ? "border-transparent" : "border-primary/30 hover:border-primary hover:bg-primary/5"
              )}
              onClick={!f.fileURL ? triggerFileInput : undefined}
            >
              <input type="file" id="fileInput" accept="video/*" onChange={f.handleFileChange} className="hidden" />
              {f.fileURL ? (
                <div className="w-full h-full relative rounded-xl overflow-hidden glow-primary group">
                  <video className="w-full h-full object-cover" src={f.fileURL} autoPlay loop muted playsInline />
                  <Button
                    variant="unstyled"
                    className="absolute top-2 right-2 p-2 bg-scrim/50 hover:bg-primary/80 text-on-media rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all"
                    title="Change Video"
                    onClick={(e) => { e.stopPropagation(); triggerFileInput(); }}
                    type="button"
                  >
                    <FaExchangeAlt />
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col justify-center items-center text-on-surface-variant group-hover:text-primary transition-colors">
                  <div className="w-14 h-14 rounded-full bg-surface-container flex items-center justify-center mb-4 group-hover:glow-primary transition-all">
                    <FaPlus className="text-xl" />
                  </div>
                  <h2 className="font-semibold mb-1">Select Video</h2>
                  <span className="text-xs opacity-60">(MP4 · max 50MB)</span>
                </div>
              )}
            </div>
          )}

          {/* STEP 2 — Details (still no upload) */}
          {f.step === 2 && <MetadataFields values={values} setters={setters} />}

          {/* STEP 3 — Feed-style review; Upload is the only network action */}
          {f.step === 3 && (
            <ReviewPreview
              values={values}
              videoUrl={f.fileURL ?? undefined}
              note="This is how your Kine will look. Uploading publishes it — it goes live once processing finishes."
            />
          )}
        </div>

        <div className="flex justify-between gap-3 p-6 border-t border-hairline/5 shrink-0">
          <Button
            variant="unstyled"
            type="button"
            onClick={f.step === 1 ? handleClose : () => f.setStep((f.step - 1) as 1 | 2)}
            className="px-6 py-2.5 rounded-full text-on-surface-variant font-medium hover:bg-hairline/5 transition-colors"
            disabled={f.isUploading}
          >
            {f.step === 1 ? "Cancel" : "Back"}
          </Button>

          {f.step === 1 && (
            <PrimaryBtn onClick={f.goToDetails} disabled={!f.file}>Continue</PrimaryBtn>
          )}
          {f.step === 2 && (
            <PrimaryBtn onClick={f.goToReview} disabled={!f.title.trim() || !f.category}>Continue</PrimaryBtn>
          )}
          {f.step === 3 && (
            <PrimaryBtn onClick={f.handleUpload} disabled={f.isUploading}>
              {f.isUploading ? "Uploading…" : "Upload"}
            </PrimaryBtn>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default UploadVideoModal;
