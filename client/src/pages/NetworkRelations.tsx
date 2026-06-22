import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useGetUserFollowersQuery, useGetMyProfileQuery } from "../utils/store/features/user/userApi";
import { useAppSelector } from "../utils/hooks/storeHooks";
import { RootState } from "../utils/store/store";
import { FiArrowLeft, FiDownload, FiEye, FiBarChart2 } from "react-icons/fi";
import Loader from "../components/Loader";

const NetworkRelations: React.FC = () => {
  const navigate = useNavigate();
  const user = useAppSelector((state: RootState) => state.user);
  const { token } = useAppSelector((state: RootState) => state.auth);

  const [activeTab, setActiveTab] = useState("Mutuals");

  const queryParam = { id: user?.id, token };
  const { data: profileData } = useGetMyProfileQuery(queryParam, {
    skip: !user?.id || !token,
  });

  const { data: followersData, isLoading } = useGetUserFollowersQuery(profileData?.body?.id || "", {
    skip: !profileData?.body?.id,
  });

  const followers = followersData?.result || [];
  const totalNodes = followersData?.total || 0;

  if (isLoading) return <Loader />;

  return (
    <div className="w-full h-full bg-[#111317] text-white flex flex-col overflow-y-auto px-4 md:px-12 py-8 scrollbar-hide">
      
      {/* Back Button */}
      <button 
        onClick={() => navigate('/vault')}
        className="flex items-center gap-2 text-on-surface-variant hover:text-white mb-8 transition-colors w-max"
      >
        <FiArrowLeft /> <span className="text-sm font-semibold tracking-widest uppercase">Return to Vault</span>
      </button>

      {/* Header Section */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-8 mb-12">
        <div className="flex flex-col max-w-3xl">
          {/* Live Pulse */}
          <div className="flex items-center gap-2 text-error font-mono text-xs font-bold tracking-[0.2em] mb-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-error"></span>
            </span>
            ((o)) LIVE DATA
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-syne font-bold tracking-wide uppercase">
            Network_Relations
          </h1>
          <p className="text-on-surface-variant mt-4 text-sm md:text-base leading-relaxed max-w-2xl">
            Your active curator network. Monitoring aesthetic resonance and content syndication across the sector.
          </p>
        </div>

        {/* Global Stats */}
        <div className="flex items-center justify-between sm:justify-start gap-4 sm:gap-8 bg-surface-container/50 border border-white/5 rounded-2xl p-5 sm:p-6 backdrop-blur-md shrink-0 w-full xl:w-auto">
          <div className="flex flex-col">
            <span className="text-xs text-on-surface-variant uppercase tracking-widest font-bold mb-1">Total Nodes</span>
            <span className="text-3xl font-syne font-bold text-primary">{totalNodes.toLocaleString()}</span>
          </div>
          <div className="w-px h-12 bg-white/10" />
          <div className="flex flex-col">
            <span className="text-xs text-on-surface-variant uppercase tracking-widest font-bold mb-1">Network Health</span>
            <span className="text-3xl font-syne font-bold text-secondary">98%</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-4 mb-8 pb-4">
        {["Mutuals", "High Resonance", "Recent Adds"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`shrink-0 px-6 py-2.5 rounded-full text-sm font-semibold transition-all border ${
              activeTab === tab 
                ? "bg-primary/20 text-primary border-primary/30" 
                : "bg-surface-container text-on-surface-variant border-white/5 hover:bg-white/5 hover:text-white"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
        {followers.map((f: any) => {
          const node = f.users_followers_follower_idTousers;
          if (!node) return null;

          // Mock Data generation for Figma parity since DB doesn't have it yet
          const cScore = (Math.random() * (99 - 60) + 60).toFixed(1);
          const reach = (Math.random() * 50 + 1).toFixed(1) + "k";
          const views = (Math.random() * 200 + 10).toFixed(1) + "k";
          const sales = Math.floor(Math.random() * 500);

          return (
            <Link 
              key={node.id} 
              to={`/users/@${node.username}`}
              className="group bg-[#181a1f] border border-white/5 rounded-[24px] p-6 hover:bg-[#1e2024] hover:border-primary/20 transition-all duration-300 shadow-lg hover:shadow-[0_0_40px_rgba(208,188,255,0.1)] flex flex-col"
            >
              {/* Card Top */}
              <div className="flex justify-between items-start mb-6">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden ring-2 ring-white/10 group-hover:ring-primary/50 transition-colors shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                    <img 
                      src={node.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${node.username}`} 
                      alt={node.username}
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  {/* Verified / Online Dot */}
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-secondary rounded-full border-2 border-[#181a1f]" />
                </div>
                
                {/* Flex Metric Badges */}
                <div className="flex flex-wrap justify-end gap-1.5 max-w-[150px]">
                  <div className="flex items-center gap-1 bg-white/5 border border-white/10 px-2 py-1 rounded-md text-[10px] font-bold text-on-surface group-hover:bg-primary/10 group-hover:text-primary transition-colors" title="Sales">
                    <FiDownload /> {sales}
                  </div>
                  <div className="flex items-center gap-1 bg-white/5 border border-white/10 px-2 py-1 rounded-md text-[10px] font-bold text-on-surface group-hover:bg-secondary/10 group-hover:text-secondary transition-colors" title="Reach">
                    <FiBarChart2 /> {reach}
                  </div>
                  <div className="flex items-center gap-1 bg-white/5 border border-white/10 px-2 py-1 rounded-md text-[10px] font-bold text-on-surface group-hover:bg-tertiary/10 group-hover:text-tertiary transition-colors" title="Views">
                    <FiEye /> {views}
                  </div>
                </div>
              </div>

              {/* Identity */}
              <h3 className="text-lg font-syne font-bold text-white group-hover:text-primary transition-colors truncate">
                {node.first_name} {node.last_name}
              </h3>
              <p className="text-[10px] text-on-surface-variant font-mono mb-6">@{node.username}</p>

              {/* Data Grid */}
              <div className="grid grid-cols-2 gap-2 mt-auto pt-2">
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase tracking-widest text-on-surface-variant font-bold mb-1">C-Score</span>
                  <span className="text-base font-syne font-bold text-white">{cScore}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase tracking-widest text-on-surface-variant font-bold mb-1">Last Active</span>
                  <span className="text-sm font-semibold text-white">Just now</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Loading Pill */}
      {followers.length > 0 && (
        <div className="flex justify-center mb-12">
          <div className="flex items-center gap-3 bg-surface-container/50 border border-white/5 px-6 py-2 rounded-full backdrop-blur-sm">
            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" />
            </div>
            <span className="text-xs uppercase tracking-widest font-bold text-on-surface-variant">
              Loading More Nodes
            </span>
          </div>
        </div>
      )}

    </div>
  );
};

export default NetworkRelations;
