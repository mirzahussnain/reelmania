import React from "react";
import { useNavigate } from "react-router-dom";
import { useUserProfile } from "../shared/hooks/useUserProfile";
import Loader from "../components/Loader";
import { TbNetwork } from "react-icons/tb";

/* ─── C-Score Ring ─────────────────────────────────── */
const CScoreRing = ({ score }: { score: number }) => {
  return (
    <div className="card-glass-panel rounded-2xl p-10 border-glow-primary min-h-[500px] flex flex-col items-center justify-center relative lg:col-span-6 w-full">
      <div className="absolute top-4 left-4 flex space-x-2">
        <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
        <span className="label-meta text-primary text-[10px]">LIVE SYNC</span>
      </div>

      {/* Central C-Score */}
      <div className="relative w-[300px] h-[300px] flex items-center justify-center">
        {/* Outer Ring */}
        <div className="absolute inset-0 border border-primary/20 rounded-full animate-[spin_60s_linear_infinite]"></div>
        {/* Middle Ring */}
        <div className="absolute inset-4 border border-secondary/20 border-dashed rounded-full animate-[spin_40s_linear_infinite_reverse]"></div>
        
        {/* SVG Radial */}
        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" fill="none" r="45" stroke="rgba(255,255,255,0.05)" strokeWidth="10"></circle>
          <circle className="transition-all duration-1000" cx="50" cy="50" fill="none" r="45" stroke="var(--color-ring-1)" strokeDasharray="282" strokeDashoffset={282 - (282 * score / 100)} strokeLinecap="round" strokeWidth="10"></circle>
          <circle className="transition-all duration-1000 opacity-80" cx="50" cy="50" fill="none" r="35" stroke="var(--color-ring-2)" strokeDasharray="219" strokeDashoffset={219 - (219 * (score + 5) / 100)} strokeLinecap="round" strokeWidth="4"></circle>
        </svg>

        {/* Core Value */}
        <div className="z-10 flex flex-col items-center">
          <div className="label-meta text-on-surface-variant mb-1 tracking-widest">C-SCORE</div>
          <div className="text-6xl md:text-[80px] font-syne font-bold text-white text-glow-primary leading-none">{score}</div>
        </div>
      </div>

      <div className="mt-10 text-center max-w-[380px] w-full">
        <p className="text-base text-on-surface-variant leading-relaxed">
          Your influence map within the Komorebi ecosystem. Higher scores indicate deeper aesthetic resonance with connected nodes.
        </p>
      </div>
    </div>
  );
};

/* ─── Metric Card ─────────────────────────────────── */
const MetricCard = ({ title, value, unit, progress, borderColor, bgBarColor }: {
  title: string; value: string; unit: string; progress: number; borderColor: string; bgBarColor: string;
}) => (
  <div className={`card-glass-panel p-6 flex flex-col justify-between h-full hover:scale-[1.02] transition-transform duration-300 border-l-2 ${borderColor}`}>
    <div>
      <h3 className="label-meta text-on-surface-variant mb-2">{title}</h3>
      <div className="text-3xl font-syne font-bold text-on-surface">
        {value} <span className={`text-sm ${bgBarColor.replace('bg-', 'text-')}`}>{unit}</span>
      </div>
    </div>
    <div className="w-full bg-surface-container-high h-1 rounded-full mt-4 overflow-hidden">
      <div className={`h-full ${bgBarColor}`} style={{ width: `${progress}%` }} />
    </div>
  </div>
);

/* ─── Resonant Node Card ─────────────────────────── */
const NodeCard = ({ user, match, borderColors }: { user: { avatar: string; handle: string }; match: number, borderColors: string }) => (
  <div className="card-glass-panel p-4 rounded-xl flex items-center justify-between hover:bg-white/5 cursor-pointer transition-colors border-l border-transparent hover:border-primary">
    <div className="flex items-center space-x-4">
      <div className="relative">
        <img src={user.avatar} alt={user.handle} className={`w-10 h-10 rounded-full object-cover border ${borderColors}`} />
        <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background ${borderColors.replace('border-', 'bg-')}`} />
      </div>
      <div>
        <div className="text-sm font-semibold text-on-background">@{user.handle}</div>
        <div className="label-meta text-[10px] text-on-surface-variant mt-1">Match: {match}%</div>
      </div>
    </div>
    <span className="text-on-surface-variant text-[18px]">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
    </span>
  </div>
);

/* ─── Page ─────────────────────────────────────────── */
const PublicNetwork: React.FC = () => {
  const navigate = useNavigate();
  const { userProfile, isLoading } = useUserProfile();

  const mockNodes = [
    { handle: "neon_drifter", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=neon_drifter&backgroundColor=111317", match: 98, borderColors: "border-secondary/50" },
    { handle: "crimson_void", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=crimson_void&backgroundColor=111317", match: 94, borderColors: "border-primary/50" },
    { handle: "kage_arts",   avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=kage_arts&backgroundColor=111317",   match: 88, borderColors: "border-outline/50" },
  ];

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

  return (
    <div className="w-full h-full overflow-y-auto scrollbar-hide bg-surface text-on-surface relative">
      
      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-grid-panel opacity-50"></div>
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-secondary/5 rounded-full blur-[100px]"></div>
      </div>

      <main className="relative z-10 pt-[100px] pb-[100px] px-4 md:px-[100px] max-w-[1440px] mx-auto min-h-screen flex flex-col">
        {/* Top Header */}
        <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end border-b border-white/10 pb-6 relative z-10">
          <div>
            <h1 className="heading-page text-glow-primary mb-2">Share Network</h1>
            <p className="label-meta text-primary/80">C-Score / Aesthetic Resonance Mapping</p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center gap-4 card-glass-panel px-4 py-2">
            <span className="label-meta text-on-surface-variant">Global Rank:</span>
            <span className="text-sm font-semibold text-secondary">#1,024</span>
          </div>
        </header>

        {/* Main Grid Layout */}
        <div className="flex-grow grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 pb-20">

          {/* Left: Metrics */}
          <div className="lg:col-span-3 flex flex-col gap-6">
            <MetricCard title="Curation Velocity"    value="84.2" unit="v/h" progress={84} borderColor="border-primary/50"   bgBarColor="bg-primary" />
            <MetricCard title="Aesthetic Consistency" value="92.0" unit="%"   progress={92} borderColor="border-secondary/50" bgBarColor="bg-secondary" />
            <MetricCard title="Original Creation"     value="41.5" unit="idx" progress={41} borderColor="border-transparent"  bgBarColor="bg-outline" />
          </div>

          {/* Center: C-Score Ring */}
          <CScoreRing score={87} />

          {/* Right: Resonant Nodes */}
          <div className="lg:col-span-3 flex flex-col gap-4">
            <h3 className="label-meta text-primary mb-2 flex items-center">
              <TbNetwork className="mr-2 text-base" />
              Resonant Nodes
            </h3>

            {mockNodes.map((node) => (
              <NodeCard key={node.handle} user={node} match={node.match} borderColors={node.borderColors} />
            ))}

            {/* Join CTA */}
            <div className="mt-auto pt-8">
              <button
                onClick={() => navigate('/sign-up')}
                className="w-full py-4 rounded-xl border border-outline-variant/20 bg-surface-container hover:bg-surface-container-high text-sm font-syne font-bold transition-colors"
              >
                Join the Network
              </button>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default PublicNetwork;
