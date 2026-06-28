export const EXPLORE_TAGS = [
  "#Cyberpunk",
  "#Mecha",
  "#LoFi_Melancholy",
  "#Sakuga",
  "#RetroFuturism",
];

export const EXPLORE_HERO = {
  title: "NEO-TOKYO NIGHTFALL",
  creatorUsername: "cyber_curator",
  cScore: 98.4,
  price: 49.99,
  isTopSeller: true,
  imageSrc: "/images/neo-tokyo-hero.png",
};

export const EXPLORE_NETWORK_LEADERBOARD = [
  {
    username: "neon_drifter",
    cScore: 99.2,
    avatarSeed: "neon_drifter",
  },
  {
    username: "heavy_metal",
    cScore: 95.8,
    avatarSeed: "heavy_metal",
  },
  {
    username: "rain_beats",
    cScore: 92.1,
    avatarSeed: "rain_beats",
  },
];

// Fallback values for VideoThumbnailCard (since these aren't in schema yet).
// `asset` mirrors the model: a short MAY have a linked DigitalAsset (via
// AssetVideoLink) — only then do the format badges + cart appear. A null asset
// is just a video (no badges, no cart). Replace with real asset lookups later.
export interface MockVideoMeta {
  duration: string;
  views: string;
  asset: { priceUsd: number; formats: string[] } | null;
}

export const MOCK_VIDEO_METADATA: MockVideoMeta[] = [
  { duration: "0:45", views: "12K", asset: { priceUsd: 45, formats: ["AE", "C4D", "4K 60FPS"] } },
  { duration: "1:12", views: "8.4K", asset: null },
  { duration: "0:38", views: "45K", asset: { priceUsd: 19, formats: ["CSP", "AE", "4K 24FPS"] } },
  { duration: "2:05", views: "22K", asset: { priceUsd: 29, formats: ["BLENDER", "4K 60FPS"] } },
];

// ──────────────────────────────────────────────────────────────────────────
// Marketplace (Variant 1) — MOCK data. Replace with real DigitalAsset queries
// once marketplace-service is live. Shapes mirror the planned DigitalAsset DTO.
// ──────────────────────────────────────────────────────────────────────────

export const MARKETPLACE_FILTERS = {
  type: { label: "Type", value: "All Types", options: ["All Types", "VFX Overlays", "Neon LUTs", "Project Files", "Fluid Motion", "3D Scenes", "Models", "Materials", "HDRIs"] },
  software: { label: "Software", value: "All Apps", options: ["All Apps", "After Effects", "Premiere Pro", "Cinema 4D", "Blender", "DaVinci Resolve", "D5 Render", "Unreal Engine", "3ds Max", "SketchUp"] },
  license: { label: "License", value: "Commercial", options: ["Commercial", "Personal", "Extended"] },
  price: { label: "Price", value: "Any", options: ["Any", "Free", "Under $20", "$20–$50", "$50+"] },
};

export const MARKETPLACE_SORT = ["Trending", "Newest", "Top Rated", "Price: Low → High", "Price: High → Low"];

export const MARKETPLACE_TRENDING = [
  { title: "Neon LUTs", itemCount: "4,210", imageSrc: "/images/neo-tokyo-hero.png" },
  { title: "VFX Overlays", itemCount: "8,902", imageSrc: "/images/neo-tokyo-hero.png" },
  { title: "Project Files", itemCount: "1,405", imageSrc: "/images/neo-tokyo-hero.png" },
  { title: "Fluid Motion", itemCount: "3,012", imageSrc: "/images/neo-tokyo-hero.png" },
];

export interface MockAsset {
  id: string;
  title: string;
  priceUsd: number;
  seller: string;
  cScore: number;
  downloads: string;
  formats: string[];
  imageSrc: string;
}

export const MARKETPLACE_ASSETS: MockAsset[] = [
  { id: "a1", title: "Cyberpunk Alleyway Environment Pack - 4K", priceUsd: 45, seller: "Kinetix", cScore: 9.8, downloads: "12K", formats: ["AE", "PR"], imageSrc: "/images/neo-tokyo-hero.png" },
  { id: "a2", title: "Quantum Particle Streams Vol. 2", priceUsd: 29, seller: "VoidStudio", cScore: 9.5, downloads: "8.4K", formats: ["C4D", "OBJ"], imageSrc: "/images/neo-tokyo-hero.png" },
  { id: "a3", title: "Neon Noir Cinematic LUT Pack - ARRI/RED", priceUsd: 19, seller: "ColorGradePro", cScore: 9.9, downloads: "45K", formats: ["LUT"], imageSrc: "/images/neo-tokyo-hero.png" },
  { id: "a4", title: "FUI Interface Elements Toolkit V4", priceUsd: 55, seller: "UI_Motion", cScore: 9.2, downloads: "3.1K", formats: ["AE"], imageSrc: "/images/neo-tokyo-hero.png" },
];
