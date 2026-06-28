import { useNavigate } from "react-router-dom";
import { FiUserPlus, FiCompass } from "react-icons/fi";
import { Button } from "../shared/components/ui/Button";

/**
 * Following feed — videos from creators the signed-in user follows.
 *
 * Auth-gated via routes.config (`access: "auth"`), so only signed-in users
 * reach it. The real feed (videos where uploaded_by.id ∈ my following set)
 * needs a backend endpoint that does not exist yet, so for now we show an
 * honest empty state rather than mock/fake videos.
 *
 * TODO(following-feed): replace with the real feed once user-service exposes
 * "ids I follow" and video-service can filter on uploaded_by.id.
 */
const Following = () => {
  const navigateTo = useNavigate();

  return (
    <main className="w-full h-full flex flex-col items-center justify-center text-center px-6 bg-transparent">
      <div className="w-20 h-20 rounded-full bg-surface-container-high border border-outline-variant/20 flex items-center justify-center mb-6">
        <FiUserPlus className="text-4xl text-primary" />
      </div>

      <h1 className="text-2xl md:text-3xl font-syne font-bold text-on-surface mb-2">
        Your Following feed is empty
      </h1>
      <p className="text-on-surface-variant font-inter max-w-md mb-8">
        Follow creators and their latest videos will show up here. Head to Discover
        to find people worth following.
      </p>

      <Button onClick={() => navigateTo("/discover")} className="flex items-center gap-2">
        <FiCompass className="text-lg" /> Discover creators
      </Button>
    </main>
  );
};

export default Following;
