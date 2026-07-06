import { useEffect, useMemo, useState } from "react";
import { FaPlus, FaTrash } from "react-icons/fa";
import { FiLink } from "react-icons/fi";
import VideoCard from "../components/VideoCard";
import UploadVideoModal from "../pages/UploadVideo";
import ImportVideoModal from "../pages/ImportVideo";
import EditDraftModal from "../pages/EditDraft";
import ReactModal from "react-modal";
import { useFetchUserVideosQuery, useDeleteUserVideoMutation } from "../utils/store/features/video/videoApi";
import { useAuth } from "@clerk/clerk-react";
import { useAppSelector } from "../utils/hooks/storeHooks";
import { RootState } from "../utils/store/store";
import { VideoType } from "../types";
import Loader from "../components/Loader";
import { Button } from "../shared/components/ui/Button";
import { useCurrentUser } from "../shared/hooks/useCurrentUser";
import { cn } from "../shared/utils/cn";

type Tab = "published" | "drafts";

const ManageVideos = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [editingDraft, setEditingDraft] = useState<VideoType | null>(null);
  const [tab, setTab] = useState<Tab>("published");

  const { isSignedIn } = useAuth();
  const { token } = useCurrentUser();
  const user = useAppSelector((state: RootState) => state.user);
  const [userVideos, setUserVideos] = useState<VideoType[]>([]);
  const { data, isLoading } = useFetchUserVideosQuery(user?.id, {
    skip: !isSignedIn || !user?.id,
  });
  const [deleteVideo] = useDeleteUserVideoMutation();
  ReactModal.setAppElement("#root");

  useEffect(() => {
    if (data) setUserVideos(data.data);
  }, [data]);

  // getUserVideos returns every visibility, so split locally: a draft is anything
  // not yet published (DRAFT). Published = the public/unlisted/private set.
  const { published, drafts } = useMemo(() => {
    const drafts = userVideos.filter((v) => v.visibility === "DRAFT");
    const published = userVideos.filter((v) => v.visibility !== "DRAFT");
    return { published, drafts };
  }, [userVideos]);

  const handleDelete = async (id?: string) => {
    if (!token || !id) return;
    try { await deleteVideo({ id, token }).unwrap(); } catch { /* toast handled elsewhere */ }
  };

  const shown = tab === "published" ? published : drafts;

  return isLoading ? (<Loader />) : (
    <div className="w-full h-full flex items-start justify-center lg:p-6 transition-all ease-in-out duration-75">
      <main className="w-full h-full lg:w-11/12 lg:h-[90%] lg:rounded-2xl bg-surface-container lg:shadow-lg">
        <div className="w-full h-full flex flex-col text-on-surface">
          <div className="w-full flex justify-between items-center p-3 bg-gradient-to-r from-primary/20 to-primary-container/40 lg:rounded-t-2xl">
            <div className="flex items-center gap-1">
              <TabBtn active={tab === "published"} onClick={() => setTab("published")}>
                Published <Count n={published.length} />
              </TabBtn>
              <TabBtn active={tab === "drafts"} onClick={() => setTab("drafts")}>
                Drafts <Count n={drafts.length} />
              </TabBtn>
            </div>
            <div className="flex items-center gap-2 mr-3">
              <Button
                variant="unstyled"
                title="Import from YouTube / Vimeo / TikTok"
                className="rounded-full p-2 bg-surface-container-highest hover:bg-primary/20 text-on-surface border border-hairline/10"
                onClick={() => setIsImportOpen(true)}
              >
                <FiLink />
              </Button>
              <Button
                variant="unstyled"
                title="Upload a video"
                className="rounded-full p-2 bg-primary hover:bg-primary-container text-on-primary"
                onClick={() => setIsModalOpen(true)}
              >
                <FaPlus />
              </Button>
            </div>
          </div>

          {shown.length > 0 ? (
            <div className="w-full h-full p-5 grid grid-cols-[repeat(auto-fill,_minmax(215px,_1fr))] gap-[0.4rem] overflow-y-auto scrollbar-custom max-lg:scrollbar-hide bg-gradient-to-br from-surface-container/80 to-hairline/20 backdrop-blur-2xl rounded-b-2xl">
              {tab === "published"
                ? published.map((v) => <VideoCard key={v.id} videoInfo={v} />)
                : drafts.map((v) => (
                    <DraftCard key={v.id} draft={v} onPublish={() => setEditingDraft(v)} onDelete={() => handleDelete(v.id)} />
                  ))}
            </div>
          ) : (
            <div className="text-xl flex flex-col justify-center items-center h-full w-full text-on-surface-variant">
              <span className="text-5xl">{tab === "drafts" ? "📝" : "😔"}</span>
              <h2 className="font-semibold">{tab === "drafts" ? "No Drafts" : "No Published Videos"}</h2>
              <span className="text-sm">{tab === "drafts" ? "Uploads and imports land here until you publish them" : "Upload or import to get started"}</span>
            </div>
          )}
        </div>
      </main>

      <UploadVideoModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <ImportVideoModal isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} />
      <EditDraftModal
        draft={editingDraft}
        isOpen={!!editingDraft}
        onClose={() => setEditingDraft(null)}
        onPublished={() => setTab("published")}
      />
    </div>
  );
};

const TabBtn = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button
    onClick={onClick}
    className={cn(
      "px-4 py-2 rounded-full text-sm font-semibold transition-all flex items-center",
      active ? "bg-surface-container text-on-surface shadow" : "text-on-surface-variant hover:text-on-surface"
    )}
  >
    {children}
  </button>
);

const Count = ({ n }: { n: number }) => (
  <span className="ml-1.5 text-xs bg-primary/15 text-primary rounded-full px-1.5 py-0.5">{n}</span>
);

const STATUS_LABEL: Record<string, string> = {
  UPLOADED: "Processing…",
  PROCESSING: "Processing…",
  READY: "Ready to publish",
  FAILED: "Failed",
};

const DraftCard = ({ draft, onPublish, onDelete }: { draft: VideoType; onPublish: () => void; onDelete: () => void }) => {
  const status = draft.processing_status ?? "READY";
  return (
    <div className="relative rounded-xl overflow-hidden border border-hairline/10 bg-surface-container-lowest group">
      <div className="aspect-[9/16] bg-scrim/40">
        {draft.thumbnail_url ? (
          <img src={draft.thumbnail_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-on-surface-variant text-3xl">🎬</div>
        )}
      </div>
      <span
        className={cn(
          "absolute top-2 left-2 text-[10px] font-semibold px-2 py-0.5 rounded-full backdrop-blur-md",
          status === "FAILED" ? "bg-error/20 text-error" : status === "READY" ? "bg-primary/20 text-primary" : "bg-scrim/60 text-on-media"
        )}
      >
        {STATUS_LABEL[status] ?? status}
      </span>
      <div className="p-2">
        <p className="text-sm text-on-surface line-clamp-1 mb-2">{draft.title}</p>
        <div className="flex items-center gap-2">
          <Button
            variant="unstyled"
            onClick={onPublish}
            className="flex-1 text-xs font-semibold py-1.5 rounded-full bg-primary text-on-primary hover:bg-primary-container disabled:opacity-50"
            disabled={status === "FAILED"}
          >
            Finish &amp; Publish
          </Button>
          <Button
            variant="unstyled"
            onClick={onDelete}
            title="Delete draft"
            className="p-2 rounded-full text-on-surface-variant hover:text-error hover:bg-error/10"
          >
            <FaTrash className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ManageVideos;
