import React from "react";
import { useNavigate } from "react-router-dom";
import { useUserProfile } from "../shared/hooks/useUserProfile";
import Loader from "../components/Loader";
import { TbNetwork } from "react-icons/tb";

const CScoreRing = ({ score }: { score: number }) => {
  const radius = 120;
  const stroke = 24;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  
  // Calculate offset based on score (0-100)
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="relative flex flex-col items-center justify-center w-full max-w-lg">
      {/* SVG Ring Container */}
      <div className="relative w-64 h-64 md:w-80 md:h-80 drop-shadow-[0_0_30px_rgba(202,154,255,0.15)] mt-4">
        
        {/* Top Right Live Sync Indicator */}
        <div className="absolute -top-4 -right-4 flex items-center gap-2 text-[10px] font-jetbrains font-bold tracking-[0.2em] text-primary drop-shadow-[0_0_8px_rgba(202,154,255,0.8)] z-10">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
          <div className="flex flex-col leading-tight">
            <span>LIVE</span>
            <span>SYNC</span>
          </div>
        </div>
        <svg
          height="100%"
          width="100%"
          viewBox="0 0 240 240"
          className="transform -rotate-90"
        >
          {/* Background Track */}
          <circle
            stroke="rgba(255,255,255,0.03)"
            fill="transparent"
            strokeWidth={stroke}
            r={normalizedRadius}
            cx="120"
            cy="120"
          />
          
          {/* Outer Purple Ring (The "Max" ring representation) */}
          <circle
            stroke="#CA9AFF"
            fill="transparent"
            strokeWidth={stroke}
            strokeDasharray={`${circumference} ${circumference}`}
            style={{ strokeDashoffset: circumference * 0.1 }} // Leaves a small gap
            strokeLinecap="round"
            r={normalizedRadius}
            cx="120"
            cy="120"
            className="opacity-70"
          />

          {/* Inner Cyan Score Ring */}
          <circle
            stroke="#00E5FF"
            fill="transparent"
            strokeWidth={stroke - 6}
            strokeDasharray={`${circumference} ${circumference}`}
            style={{ strokeDashoffset }}
            strokeLinecap="round"
            r={normalizedRadius - 4} // Slightly inset
            cx="120"
            cy="120"
            className="drop-shadow-[0_0_15px_rgba(0,229,255,0.8)] transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Center Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[10px] text-on-surface-variant font-jetbrains font-bold tracking-[0.2em] uppercase mb-1">
            C-Score
          </span>
          <span className="text-6xl md:text-8xl font-syne font-bold text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.5)] italic pr-4">
            {score}
          </span>
        </div>
      </div>

      <p className="mt-8 text-on-surface-variant text-sm w-[280px] md:w-[320px] text-center leading-relaxed">
        Your influence map within the Komorebi ecosystem. Higher scores indicate deeper aesthetic resonance with connected nodes.
      </p>
    </div>
  );
};

const MetricCard = ({ title, value, unit, progress, colorClass }: any) => (
  <div className="bg-surface-container/30 border border-white/5 rounded-2xl p-6 backdrop-blur-md flex flex-col justify-between h-40">
    <div className="text-xs text-on-surface-variant font-jetbrains font-semibold tracking-widest uppercase mb-4">
      {title}
    </div>
    <div className="flex items-baseline gap-2">
      <span className="text-4xl font-syne font-bold text-white tracking-wide">{value}</span>
      <span className="text-xs text-on-surface-variant font-jetbrains">{unit}</span>
    </div>
    {/* Progress Bar */}
    <div className="w-full h-1 bg-white/5 mt-auto rounded-full overflow-hidden">
      <div 
        className={`h-full ${colorClass} rounded-full shadow-[0_0_10px_currentColor]`} 
        style={{ width: `${progress}%` }}
      />
    </div>
  </div>
);

const NodeCard = ({ user, match }: any) => (
  <div className="bg-surface-container/30 border border-white/5 rounded-2xl p-4 backdrop-blur-md flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors group">
    <div className="flex items-center gap-4">
      {/* Avatar with Online Indicator */}
      <div className="relative w-12 h-12 rounded-full overflow-hidden ring-2 ring-white/10 group-hover:ring-primary/50 transition-all">
        <img src={user.avatar} alt={user.handle} className="w-full h-full object-cover" />
        <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#00E5FF] rounded-full border-2 border-surface-container shadow-[0_0_8px_#00E5FF]" />
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-syne font-bold text-white group-hover:text-primary transition-colors">
          @{user.handle}
        </span>
        <span className="text-xs font-jetbrains text-on-surface-variant">
          Match: {match}%
        </span>
      </div>
    </div>
    <div className="text-on-surface-variant group-hover:text-white transition-colors">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 18l6-6-6-6" />
      </svg>
    </div>
  </div>
);

const PublicNetwork: React.FC = () => {
  const navigate = useNavigate();

  const { userProfile, isLoading } = useUserProfile();

  // Mock Resonant Nodes for Figma Parity
  const mockNodes = [
    { handle: "neon_drifter", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=neon_drifter&backgroundColor=111317", match: 98 },
    { handle: "crimson_void", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=crimson_void&backgroundColor=111317", match: 94 },
    { handle: "kage_arts", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=kage_arts&backgroundColor=111317", match: 88 },
  ];

  if (isLoading) {
    return (
      <div className="w-full h-screen bg-[#111317] flex justify-center items-center">
        <Loader />
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="w-full h-screen bg-[#111317] flex justify-center items-center text-white">
        <h2 className="text-2xl font-syne font-bold">Network Node Not Found</h2>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-[#111317] bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[length:24px_24px] text-white overflow-y-auto scrollbar-hide px-4 md:px-12 py-10 relative">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-white/10 pb-6 mb-10 gap-6">
        <div className="flex flex-col">
          <h1 className="text-4xl md:text-5xl font-syne font-bold drop-shadow-lg tracking-wide">
            Share Network
          </h1>
          <p className="text-primary font-jetbrains text-xs md:text-sm tracking-widest uppercase mt-2 font-semibold">
            C-Score / Aesthetic Resonance Mapping
          </p>
        </div>
        
        <div className="bg-surface-container/60 border border-white/10 px-4 py-2 rounded-full backdrop-blur-md">
          <span className="text-xs font-jetbrains text-on-surface-variant uppercase tracking-widest mr-2">Global Rank:</span>
          <span className="text-sm font-jetbrains font-bold text-white">#1,024</span>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 pb-20">
        
        {/* Left Column: Metrics */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <MetricCard 
            title="Curation Velocity" 
            value="84.2" 
            unit="v/h" 
            progress={84} 
            colorClass="bg-[#CA9AFF]" 
          />
          <MetricCard 
            title="Aesthetic Consistency" 
            value="92.0" 
            unit="%" 
            progress={92} 
            colorClass="bg-[#00E5FF]" 
          />
          <MetricCard 
            title="Original Creation" 
            value="41.5" 
            unit="idx" 
            progress={41} 
            colorClass="bg-white/40" 
          />
        </div>

        {/* Center Column: C-Score Ring */}
        <div className="lg:col-span-6 bg-surface-container/20 border border-white/5 rounded-[2rem] p-8 backdrop-blur-xl flex justify-center items-center min-h-[400px] shadow-[inset_0_0_100px_rgba(0,0,0,0.5)] relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-[radial-gradient(circle,rgba(202,154,255,0.05)_0%,transparent_50%)] pointer-events-none" />
          <CScoreRing score={87} />
        </div>

        {/* Right Column: Resonant Nodes */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <div className="flex items-center gap-2 mb-2">
            <TbNetwork className="text-primary text-xl" />
            <span className="text-xs font-jetbrains font-bold tracking-widest text-primary uppercase">
              Resonant Nodes
            </span>
          </div>
          
          {mockNodes.map((node) => (
            <NodeCard key={node.handle} user={node} match={node.match} />
          ))}

          {/* Connect CTA for external viewers */}
          <div className="mt-auto pt-8">
            <button 
              onClick={() => navigate('/sign-up')}
              className="w-full py-4 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 text-sm font-syne font-bold transition-colors backdrop-blur-md"
            >
              Join the Network
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PublicNetwork;
