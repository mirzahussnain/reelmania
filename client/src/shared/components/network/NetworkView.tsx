import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { TbNetwork } from "react-icons/tb";
import { FiDownload, FiBarChart2, FiEye, FiMoreVertical } from "react-icons/fi";
import type { userType } from "../../../types";
import type { FollowerEdge } from "../../contracts/api";
import { BadgeRow } from "../ui/Badge";
import { Button } from "../ui/Button";
import { NETWORK } from "../../constants/network";

// Category = the DIRECTIONAL relationship being viewed (unambiguous nouns):
//   Followers (inbound) · Following (outbound, owner-only). Mutual isn't its own
//   category — it's an attribute, surfaced as an "In Sync" badge on each node.
// Sort is orthogonal — it just orders whichever list is active.
type NetworkTab = typeof NETWORK.FOLLOWERS | typeof NETWORK.FOLLOWING;
type SortMode = "Recent" | "High Resonance";
const SORTS: SortMode[] = ["Recent", "High Resonance"];

/* ─── C-Score ring — reads the real persisted percentile (0 until the job runs) ─── */
export const CScoreRing: React.FC<{ score: number }> = ({ score }) => (
  <div className="card-glass-panel rounded-2xl p-6 sm:p-10 border-glow-primary flex flex-col items-center justify-center relative w-full">
    <div className="absolute top-4 left-4 flex items-center space-x-2">
      <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
      <span className="label-meta text-primary text-[10px]">LIVE SYNC</span>
    </div>

    <div className="relative w-[220px] h-[220px] sm:w-[280px] sm:h-[280px] flex items-center justify-center">
      <div className="absolute inset-0 border border-primary/20 rounded-full animate-[spin_60s_linear_infinite]" />
      <div className="absolute inset-4 border border-secondary/20 border-dashed rounded-full animate-[spin_40s_linear_infinite_reverse]" />
      <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" fill="none" r="45" stroke="var(--color-ring-track)" strokeWidth="10" />
        <circle
          className="transition-all duration-1000"
          cx="50" cy="50" fill="none" r="45" stroke="var(--color-ring-1)"
          strokeDasharray="282" strokeDashoffset={282 - (282 * score) / 100}
          strokeLinecap="round" strokeWidth="10"
        />
      </svg>
      <div className="z-10 flex flex-col items-center">
        <div className="label-meta text-on-surface-variant mb-1 tracking-widest">C-SCORE</div>
        <div className="text-5xl sm:text-6xl font-syne font-bold text-on-media text-glow-primary leading-none">{score}</div>
      </div>
    </div>

    <p className="mt-8 text-center max-w-[380px] text-sm text-on-surface-variant leading-relaxed">
      Influence within the Kinetix ecosystem. Higher scores indicate deeper aesthetic
      resonance with connected nodes.
    </p>
  </div>
);

/* ─── Metric card. Shows a real value, or an honest "Soon" for signals not yet
   modelled (Curation Velocity / Aesthetic Consistency) — never a fake number. ─── */
export const MetricCard: React.FC<{
  title: string;
  value: string | number;
  unit?: string;
  accent?: "primary" | "secondary" | "outline";
}> = ({ title, value, unit, accent = "primary" }) => {
  const border = accent === "primary" ? "border-primary/50" : accent === "secondary" ? "border-secondary/50" : "border-outline/40";
  const pending = value === "Soon";
  return (
    <div className={`card-glass-panel p-6 flex flex-col justify-between border-l-2 ${border}`}>
      <h3 className="label-meta text-on-surface-variant mb-2">{title}</h3>
      <div className={`text-3xl font-syne font-bold ${pending ? "text-on-surface-variant/50" : "text-on-surface"}`}>
        {value}
        {unit && !pending && <span className="text-sm text-on-surface-variant ml-1">{unit}</span>}
      </div>
    </div>
  );
};

/* Per-node metric pill. Real values land with marketplace/analytics; "—" for now. */
const MetricPill: React.FC<{ icon: React.ReactNode; value: string; hover: string; title: string }> = ({
  icon, value, hover, title,
}) => (
  <span
    title={title}
    className={`flex items-center gap-1 bg-surface-container border border-outline-variant/20 px-2 py-1 rounded-md text-[10px] font-bold text-on-surface-variant transition-colors ${hover}`}
  >
    {icon} {value}
  </span>
);

/* ─── A single connected node (real follower) ─── */
export const NodeCard: React.FC<{
  node: NonNullable<FollowerEdge["users_followers_follower_idTousers"]>;
  /** In a public/shareable context, link to the public profile instead of the
   *  in-app one so visitors stay in the public (no-auth) flow. */
  publicView?: boolean;
}> = ({ node, publicView }) => (
  <Link
    to={publicView ? `/share/profile/${node.username}` : `/users/@${node.username}`}
    className="card-solid group p-5 hover:bg-surface-container hover:border-primary/20 transition-all duration-300 glow-black hover:glow-primary flex flex-col"
  >
    <div className="flex items-start justify-between gap-3 mb-4">
      <div className="flex items-center gap-4 min-w-0">
        <img
          src={node.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${node.username}`}
          alt={node.username}
          className="w-14 h-14 rounded-xl object-cover ring-2 ring-outline-variant/30 group-hover:ring-primary/50 transition-colors shrink-0"
        />
        <div className="min-w-0">
          <h3 className="text-base font-syne font-bold text-on-surface group-hover:text-primary transition-colors truncate">
            {node.first_name} {node.last_name}
          </h3>
          <p className="label-meta truncate">@{node.username}</p>
          {/* Mutual connection — both follow each other. */}
          {node.isMutual && (
            <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-primary/15 border border-primary/30 px-2 py-0.5 text-[10px] font-bold tracking-wide text-primary">
              <TbNetwork className="text-xs" /> {NETWORK.IN_SYNC}
            </span>
          )}
        </div>
      </div>

      {/* Per-node metrics — placeholders until marketplace/analytics exist */}
      <div className="flex flex-wrap justify-end gap-1.5 shrink-0 max-w-[130px]">
        <MetricPill icon={<FiDownload />} value="—" title="Sales" hover="group-hover:bg-primary/10 group-hover:text-primary" />
        <MetricPill icon={<FiBarChart2 />} value="—" title="Reach" hover="group-hover:bg-secondary/10 group-hover:text-secondary" />
        <MetricPill icon={<FiEye />} value="—" title="Views" hover="group-hover:bg-tertiary/10 group-hover:text-tertiary" />
      </div>
    </div>

    <BadgeRow
      badges={[
        ...(node.is_founding_member ? [{ id: "founding_member", label: "Founding Member" }] : []),
        ...(node.is_verified ? [{ id: "verified", label: "Verified" }] : []),
      ]}
      size={36}
      className="mb-3"
    />
    <div className="flex items-center justify-between mt-auto pt-2 border-t border-outline-variant/10">
      <span className="label-meta">C-Score</span>
      <span className="text-base font-syne font-bold text-on-surface">{node.c_score ?? 0}</span>
    </div>
  </Link>
);

interface NetworkViewProps {
  /** The network's owner (whose connections these are). */
  userProfile: userType;
  followers: FollowerEdge[];
  totalNodes: number;
  /** The users this person follows (outbound). Owner-only; enables the "Following" tab. */
  following?: FollowerEdge[];
  /** True when the viewer owns this network — drives copy only; data is identical. */
  isOwner: boolean;
  /** Tab to open on mount (deep-link from the Vault stats). Defaults to "Recent". */
  initialTab?: NetworkTab;
}

/**
 * The single source for the network view, used by both the owner's in-app
 * `/vault/network` and the public shareable `/share/network/:username`. Only real
 * data is shown — the owner's persisted c_score and their actual connections.
 * Unmodelled vanity metrics were removed rather than faked.
 */
export const NetworkView: React.FC<NetworkViewProps> = ({ userProfile, followers, totalNodes, following, isOwner, initialTab }) => {
  const title = isOwner ? "Your Network" : `${userProfile.first_name}'s Network`;

  // Following (outbound) is owner-only and hydrates the OTHER relation (the
  // followed user), so its nodes are read from a different field than Followers.
  const showFollowing = isOwner && following !== undefined;
  const tabs: NetworkTab[] = [
    NETWORK.FOLLOWERS,
    ...(showFollowing ? [NETWORK.FOLLOWING] : []),
  ];

  // Honor the deep-linked category only if it's actually available (e.g.
  // Following is owner-only); otherwise fall back to Followers.
  const [tab, setTab] = useState<NetworkTab>(
    initialTab && tabs.includes(initialTab) ? initialTab : NETWORK.FOLLOWERS
  );
  const [sort, setSort] = useState<SortMode>("Recent");
  // Mobile: the sort pills collapse into a three-dot dropdown to keep the tab
  // bar on a single row.
  const [sortMenuOpen, setSortMenuOpen] = useState(false);

  // Which relation-side node each tab renders: Following → the followed user;
  // Followers → the follower. Defined before nodes so the c_score sort reads the
  // correct side.
  const nodeOf = (edge: FollowerEdge) =>
    tab === NETWORK.FOLLOWING
      ? edge.users_followers_following_idTousers
      : edge.users_followers_follower_idTousers;

  // Category picks the base list; sort orders it. "Recent" keeps API order
  // (created_at desc); "High Resonance" ranks by each node's real c_score.
  const nodes = useMemo(() => {
    const base = tab === NETWORK.FOLLOWING ? following ?? [] : followers;
    if (sort === "High Resonance") {
      return [...base].sort((a, b) => (nodeOf(b)?.c_score ?? 0) - (nodeOf(a)?.c_score ?? 0));
    }
    return base;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [followers, following, tab, sort]);

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-primary font-jetbrains text-xs font-bold tracking-[0.2em] mb-3">
            <TbNetwork className="text-base" /> AESTHETIC RESONANCE MAP
          </div>
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-syne font-bold tracking-wide text-on-surface break-words">
            {title}
          </h1>
          <p className="text-on-surface-variant mt-3 text-sm md:text-base max-w-2xl">
            {isOwner
              ? "Your active curator network — connections and their resonance across the sector."
              : `${userProfile.first_name}'s curator network on Kinetix.`}
          </p>
        </div>

        <div className="card-glass p-5 flex items-center gap-6 shrink-0 w-full sm:w-auto">
          <div className="flex flex-col">
            <span className="label-meta mb-1">Total Nodes</span>
            <span className="stat-value text-primary">{totalNodes.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Ring + connections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <CScoreRing score={userProfile.c_score ?? 0} />
        </div>

        <div className="lg:col-span-2">
          <div className="flex items-center justify-between gap-3 mb-4">
            {/* Category = directional relationship. */}
            <div className="flex items-center gap-2 min-w-0">
              {tabs.map((t) => (
                <Button key={t} variant="pill" active={tab === t} onClick={() => setTab(t)}>
                  {t}
                </Button>
              ))}
            </div>

            {/* Sort = ordering of the active list (orthogonal to category).
                sm+: inline pills. Mobile: a three-dot dropdown so the bar stays
                on one row. */}
            <div className="shrink-0">
              <div className="hidden sm:flex items-center gap-2">
                {SORTS.map((s) => (
                  <Button key={s} variant="pill" active={sort === s} onClick={() => setSort(s)}>
                    {s}
                  </Button>
                ))}
              </div>

              <div className="relative sm:hidden">
                <Button
                  variant="pill"
                  active={sort !== "Recent"}
                  onClick={() => setSortMenuOpen((o) => !o)}
                  aria-label="Sort"
                >
                  <FiMoreVertical />
                </Button>
                {sortMenuOpen && (
                  <>
                    {/* Click-away backdrop */}
                    <div className="fixed inset-0 z-10" onClick={() => setSortMenuOpen(false)} />
                    <div className="absolute right-0 mt-2 z-20 min-w-[160px] card-glass rounded-xl p-1 shadow-2xl">
                      {SORTS.map((s) => (
                        <button
                          key={s}
                          onClick={() => {
                            setSort(s);
                            setSortMenuOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                            sort === s
                              ? "text-primary bg-primary/10 font-semibold"
                              : "text-on-surface-variant hover:bg-surface-container"
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          {nodes.length === 0 ? (
            <div className="card-solid p-10 text-center text-on-surface-variant/60">
              {tab === NETWORK.FOLLOWING ? "You're not following anyone yet." : "No followers yet."}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {nodes.map((f) => {
                const node = nodeOf(f);
                return node ? <NodeCard key={node.id} node={node} /> : null;
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NetworkView;
