import { useState } from "react";
import { FiShoppingCart, FiSliders } from "react-icons/fi";
import { BsLightningFill } from "react-icons/bs";
import { BRAND } from "../shared/constants/brand";
import { Button } from "../shared/components/ui/Button";
import { SearchField } from "../shared/components/ui/SearchField";
import { Select } from "../shared/components/ui/Select";
import {
  MARKETPLACE_FILTERS,
  MARKETPLACE_TRENDING,
  MARKETPLACE_ASSETS,
  MARKETPLACE_SORT,
} from "../shared/constants/mocks";

/**
 * Marketplace (Variant 1) — the digital-asset storefront.
 *
 * Distinct from Discover (the social funnel): this page is organised around
 * BUYING a DigitalAsset — faceted by Type / Software / License / Price, with a
 * sort control. Currently MOCK data; wire to marketplace-service once it's live.
 */
const Marketplace = () => {
  const [query, setQuery] = useState("");

  return (
    <div className="min-h-full w-full pt-8 pb-24 flex flex-col items-center bg-linear-to-br from-surface to-surface-container">
      <div className="w-full max-w-7xl px-4 md:px-8 flex flex-col">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-syne font-bold text-on-surface tracking-tight mb-2">
            {BRAND} Marketplace
          </h1>
          <p className="text-sm md:text-base text-on-surface-variant font-inter">
            High-efficiency digital storefront for film, motion &amp; 3D creators. Secure your creative edge.
          </p>
        </div>

        {/* Filter bar — row 1: full-width search · row 2: facets + action */}
        <div className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl p-4 mb-12 flex flex-col gap-4">
          <SearchField
            value={query}
            onChange={setQuery}
            placeholder="Query asset database..."
            className="w-full"
          />
          <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
            <div className="flex flex-wrap gap-3 flex-1">
              {Object.entries(MARKETPLACE_FILTERS).map(([key, filter]) => (
                <Select key={key} label={filter.label} defaultValue={filter.value} options={filter.options} />
              ))}
            </div>
            <Button className="flex items-center gap-2 shrink-0">
              <FiSliders /> Execute Search
            </Button>
          </div>
        </div>

        {/* Trending Vectors */}
        <div className="mb-12">
          <h2 className="flex items-center gap-2 text-sm font-jetbrains font-bold uppercase tracking-widest text-primary mb-4">
            <span className="w-2 h-2 rounded-full bg-primary glow-primary-sm" /> Trending Vectors
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {MARKETPLACE_TRENDING.map((cat) => (
              <button
                key={cat.title}
                className="relative h-24 rounded-lg overflow-hidden border border-outline-variant/20 group text-left"
              >
                <img src={cat.imageSrc} alt={cat.title} className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-60 group-hover:scale-105 transition-all duration-500" />
                <div className="absolute inset-0 bg-linear-to-t from-scrim to-transparent" />
                <div className="absolute bottom-3 left-3">
                  <div className="text-on-media font-syne font-bold text-base">{cat.title}</div>
                  <div className="text-on-media-dim text-xs font-jetbrains">{cat.itemCount} items</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Asset grid */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
            <h2 className="text-xl md:text-2xl font-syne font-bold text-on-surface">Trending Assets</h2>
            <Select label="Sort" defaultValue={MARKETPLACE_SORT[0]} options={MARKETPLACE_SORT} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {MARKETPLACE_ASSETS.map((asset) => (
              <div
                key={asset.id}
                className="bg-surface-container-low border border-outline-variant/20 rounded-xl overflow-hidden group hover:border-primary/40 transition-colors flex flex-col"
              >
                {/* Thumb + format badges */}
                <div className="relative h-44 overflow-hidden">
                  <img src={asset.imageSrc} alt={asset.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute top-2 right-2 flex gap-1">
                    {asset.formats.map((f) => (
                      <span key={f} className="bg-scrim/70 backdrop-blur-md border border-hairline/20 text-on-media text-[10px] font-jetbrains font-bold px-2 py-0.5 rounded">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Body */}
                <div className="p-4 flex flex-col gap-3 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-bold text-on-surface leading-snug line-clamp-2">{asset.title}</h3>
                    <span className="text-primary font-jetbrains font-bold text-sm shrink-0">${asset.priceUsd}</span>
                  </div>

                  <div className="mt-auto flex items-center justify-between">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs text-on-surface-variant">By {asset.seller}</span>
                      <span className="text-[11px] font-jetbrains text-on-surface-variant flex items-center gap-2">
                        <span className="flex items-center gap-0.5 text-primary"><BsLightningFill className="text-[9px]" /> C:{asset.cScore}</span>
                        <span>DL:{asset.downloads}</span>
                      </span>
                    </div>
                    <Button variant="icon" aria-label={`Add ${asset.title} to cart`}>
                      <FiShoppingCart />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Load more */}
        <div className="flex justify-center">
          <Button variant="outline" className="flex items-center gap-2">
            Load Next Sector
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Marketplace;
