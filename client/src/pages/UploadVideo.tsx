
import { FaExchangeAlt, FaPlus } from "react-icons/fa";
import Modal from "react-modal";
import { MutatingDots } from "react-loader-spinner";
import { useVideoUpload } from "../shared/hooks/useVideoUpload";
import { cn } from "../shared/utils/cn";
import { Button } from "../shared/components/ui/Button";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

const UploadVideoModal = ({ isOpen, onClose }: Props) => {
  const {
    title,
    setTitle,
    hashtags,
    setHashtags,
    fileURL,
    timeLeft,
    isPending,
    isUploadingToS3,
    handleFileChange,
    triggerFileInput,
    handleSubmit,
    resetForm
  } = useVideoUpload(onClose);

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={handleClose}
      contentLabel="Upload Video Modal"
      className="outline-none w-full h-full lg:w-[800px] lg:h-[600px] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col justify-center items-center overflow-hidden z-50"
      overlayClassName="fixed inset-0 bg-scrim/60 backdrop-blur-sm z-50"
    >
      <div className="w-full h-full bg-surface-container/80 backdrop-blur-xl border border-hairline/10 lg:rounded-2xl shadow-2xl flex flex-col relative overflow-hidden">

        {/* Header */}
        <h2 className="w-full bg-surface-container-highest/80 border-b border-hairline/5 text-center text-on-surface font-semibold text-lg py-4 shrink-0">
          Upload New Video
        </h2>

        {fileURL && !isPending && (
          <div className="absolute top-4 right-4 text-xs font-mono px-3 py-1 bg-error/20 text-error border border-error/50 rounded-full animate-pulse">
            Cache expires: {timeLeft}s
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="w-full h-full flex flex-col lg:flex-row overflow-hidden"
          encType="multipart/form-data"
        >
          {/* Left Side: Dropzone / Preview */}
          <div className="w-full lg:w-[45%] h-[300px] lg:h-full bg-scrim/20 p-6 flex flex-col items-center justify-center border-b lg:border-b-0 lg:border-r border-hairline/5 relative">
            {isPending ? (
              <div className="w-full h-full flex flex-col justify-center items-center gap-4">
                <MutatingDots color="var(--color-primary)" secondaryColor="var(--color-primary-container)" />
                <h2 className="text-primary font-medium tracking-wide">
                  {isUploadingToS3 ? "Uploading to Cloud..." : "Finalizing Database..."}
                </h2>
              </div>
            ) : (
              <div 
                className={cn(
                  "w-full h-full flex flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all cursor-pointer group",
                  fileURL ? "border-transparent" : "border-primary/30 hover:border-primary hover:bg-primary/5"
                )}
                onClick={!fileURL ? triggerFileInput : undefined}
              >
                <input
                  type="file"
                  id="fileInput"
                  accept="video/*"
                  onChange={handleFileChange}
                  className="hidden"
                  required={!fileURL}
                />
                
                {fileURL ? (
                  <div className="w-full h-full relative rounded-xl overflow-hidden glow-primary group">
                    <video className="w-full h-full object-cover" src={fileURL} autoPlay loop muted />
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
                    <span className="text-xs opacity-60">(MP4, 1080p, 720p, etc.)</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Side: Metadata Form */}
          <div className="flex-1 p-6 flex flex-col justify-between overflow-y-auto">
            <div className="w-full flex flex-col gap-5">
              
              <div className="w-full">
                <label className="block text-on-surface font-semibold text-sm mb-2" htmlFor="title">
                  Video Title
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-hairline/10 rounded-lg py-3 px-4 text-on-surface focus:outline-none focus:border-primary focus:glow-primary transition-all"
                  placeholder="Catchy title..."
                  required
                />
              </div>

              <div className="w-full">
                <label className="block text-on-surface font-semibold text-sm mb-2" htmlFor="hashtags">
                  Hashtags <span className="text-on-surface-variant font-normal text-xs">(comma separated)</span>
                </label>
                <input
                  type="text"
                  id="hashtags"
                  value={hashtags.join(",")}
                  onChange={(e) => setHashtags(e.target.value.split(","))}
                  className="w-full bg-surface-container-lowest border border-hairline/10 rounded-lg py-3 px-4 text-on-surface focus:outline-none focus:border-primary focus:glow-primary transition-all"
                  placeholder="gaming, lifestyle, comedy"
                />
              </div>

            </div>

            <div className="w-full flex justify-end gap-3 pt-6 mt-4 border-t border-hairline/5">
              <Button
                variant="unstyled"
                type="button"
                onClick={handleClose}
                className="px-6 py-2.5 rounded-full text-on-surface-variant font-medium hover:bg-hairline/5 transition-colors disabled:opacity-50"
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                variant="unstyled"
                type="submit"
                className="px-8 py-2.5 bg-primary text-on-primary font-bold rounded-full hover:bg-primary-container hover:glow-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isPending || !fileURL || !title.trim()}
              >
                {isPending ? "Uploading..." : "Publish"}
              </Button>
            </div>
          </div>

        </form>
      </div>
    </Modal>
  );
};

export default UploadVideoModal;
