import React from "react";
import { useNavigate } from "react-router-dom";
import { TbNetwork } from "react-icons/tb";
import { HiOutlineUserAdd } from "react-icons/hi";
import { useUserProfile } from "../shared/hooks/useUserProfile";
import { useGetUserFollowersQuery } from "../utils/store/features/user/userApi";
import useScreenWidth from "../utils/hooks/useScreenWidth";
import Loader from "../components/Loader";
import { Button } from "../shared/components/ui/Button";
import { Carousel } from "../shared/components/ui/Carousel";
import { BRAND } from "../shared/constants/brand";
import { CScoreRing, MetricCard, NodeCard } from "../shared/components/network/NetworkView";

/**
 * Public, shareable network showcase for a curator. Mirrors PublicProfile's
 * framing (logo + "{name}'s Network" + viewer-aware CTA). Reuses the shared
 * real-data components so it can never drift from the owner's view. Shows the
 * top 3 resonant nodes (by c_score); unmodelled metrics render an honest "Soon".
 */
const PublicNetwork: React.FC = () => {
  const navigate = useNavigate();
  const isMobile = useScreenWidth() <= 640;
  const { userProfile, currentUser, followStatus, handleFollow, isLoading } = useUserProfile();

  const { data: followersData } = useGetUserFollowersQuery(userProfile?.id || "", {
    skip: !userProfile?.id,
  });

  if (isLoading) {
    return (
      <div className="w-full h-screen bg-surface flex justify-center items-center">
        <Loader />
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="w-full h-screen bg-surface flex justify-center items-center text-on-surface">
        <h2 className="text-2xl font-syne font-bold">Network Node Not Found</h2>
      </div>
    );
  }

  const isOwner = currentUser?.id === userProfile.id;
  const totalNodes = followersData?.meta?.total || 0;

  // Top 3 resonant nodes by real c_score — the public showcase highlight.
  const topNodes = [...(followersData?.data || [])]
    .sort(
      (a, b) =>
        (b.users_followers_follower_idTousers?.c_score ?? 0) -
        (a.users_followers_follower_idTousers?.c_score ?? 0)
    )
    .slice(0, 3)
    .map((f) => f.users_followers_follower_idTousers)
    .filter((n): n is NonNullable<typeof n> => Boolean(n));

  // Viewer-aware CTA (signed-out → Join · connected → View Profile · else Connect).
  const cta = !currentUser
    ? {
        heading: `Join ${userProfile.first_name}'s Network`,
        sub: `Sign in to ${BRAND} to connect with ${userProfile.first_name}, explore their curated Scopes, and grow your own network.`,
        label: "Join the Network",
        onClick: () => navigate("/sign-up"),
      }
    : followStatus
      ? {
          heading: "You're Connected",
          sub: `You're part of ${userProfile.first_name}'s network. Explore their profile to see their latest creations and Scopes.`,
          label: "View Profile",
          onClick: () => navigate(`/users/@${userProfile.username}`),
        }
      : {
          heading: `Connect with ${userProfile.first_name}`,
          sub: `Follow ${userProfile.first_name} to add them to your network and surface their creations in your feed.`,
          label: "Connect",
          onClick: handleFollow,
        };

  return (
    <div className="w-full h-full overflow-y-auto scrollbar-hide bg-surface text-on-surface relative">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-grid-panel opacity-50" />
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-secondary/5 rounded-full blur-[100px]" />
      </div>

      <main className="relative z-10 pt-12 pb-24 px-4 md:px-12 max-w-[1440px] mx-auto flex flex-col items-center">
        {/* Logo + Brand */}
        <img
          src="/images/kinetix_lg.png"
          alt={`${BRAND} logo`}
          className="h-24 md:h-32 object-contain mb-3 drop-shadow-[0_0_16px_rgba(208,188,255,0.5)]"
        />
        <span className="text-3xl md:text-4xl font-syne font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary text-glow-primary mb-10">
          {BRAND}
        </span>

        {/* Title */}
        <div className="flex items-center gap-2 text-primary font-jetbrains text-xs font-bold tracking-[0.2em] mb-3">
          <TbNetwork className="text-base" /> AESTHETIC RESONANCE MAP
        </div>
        <h1 className="text-3xl md:text-5xl font-syne font-bold tracking-wide text-on-surface text-center break-words">
          {userProfile.first_name}'s Network
        </h1>
        <p className="text-on-surface-variant mt-3 mb-12 text-sm md:text-base text-center max-w-2xl">
          {totalNodes.toLocaleString()} connected node{totalNodes === 1 ? "" : "s"} across the {BRAND} sector.
        </p>

        {/* Desktop: metrics · ring · top nodes (3-col). Mobile stacks + carousel below. */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-3 flex flex-col gap-6">
            <MetricCard title="Curation Velocity" value="Soon" accent="primary" />
            <MetricCard title="Aesthetic Consistency" value="Soon" accent="secondary" />
            <MetricCard title="Original Creation" value="Soon" accent="outline" />
          </div>

          <div className="lg:col-span-6">
            <CScoreRing score={userProfile.c_score ?? 0} />
          </div>

          {/* Desktop only: top nodes stacked in the third column */}
          {!isMobile && topNodes.length > 0 && (
            <div className="lg:col-span-3 flex flex-col gap-4">
              <h3 className="label-meta text-primary flex items-center gap-2">
                <TbNetwork className="text-base" /> Top Resonant Nodes
              </h3>
              {topNodes.map((node) => (
                <NodeCard key={node.id} node={node} publicView />
              ))}
            </div>
          )}
        </div>

        {/* Mobile only: top nodes as a horizontally-slideable carousel with dots */}
        {isMobile && topNodes.length > 0 && (
          <div className="w-full mt-10">
            <h3 className="label-meta text-primary mb-4 flex items-center gap-2">
              <TbNetwork className="text-base" /> Top Resonant Nodes
            </h3>
            {topNodes.length > 1 ? (
              <Carousel>
                {topNodes.map((node) => (
                  <NodeCard key={node.id} node={node} publicView />
                ))}
              </Carousel>
            ) : (
              <NodeCard node={topNodes[0]} publicView />
            )}
          </div>
        )}

        {/* Viewer-aware CTA — hidden for the owner viewing their own network */}
        {!isOwner && (
          <div className="w-[90%] max-w-4xl rounded-3xl border border-hairline/5 bg-gradient-to-b from-hairline/[0.04] to-transparent p-10 md:p-12 mt-16 flex flex-col items-center backdrop-blur-md">
            <h3 className="text-2xl md:text-3xl font-syne font-bold text-on-surface text-center">
              {cta.heading}
            </h3>
            <p className="text-on-surface-variant text-sm md:text-base text-center max-w-[560px] mt-4 leading-relaxed">
              {cta.sub}
            </p>
            <Button
              variant="unstyled"
              onClick={cta.onClick}
              className="mt-8 flex items-center gap-2 border border-secondary/50 bg-transparent hover:bg-secondary/10 text-secondary text-sm md:text-base font-bold px-10 py-3 rounded-full transition-all duration-300"
            >
              {cta.label === "Connect" && <HiOutlineUserAdd className="text-lg" />}
              {cta.label}
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default PublicNetwork;
