"use client";

import { useState } from "react";

import type { AssetOption, ChainOption } from "@/lib/catalog";

type ChainAssetPickerProps = {
  chains: ChainOption[];
  assets: AssetOption[];
  initialChainId?: string;
  initialAssetId?: string;
};

function truncateContractAddress(value: string | null) {
  if (!value) {
    return "Native asset";
  }

  if (value.length <= 16) {
    return value;
  }

  return `${value.slice(0, 8)}...${value.slice(-6)}`;
}

function formatAssetOptionLabel(asset: AssetOption) {
  return `${asset.symbol} | ${asset.name}`;
}

export function ChainAssetPicker({
  chains,
  assets,
  initialChainId = "",
  initialAssetId = ""
}: ChainAssetPickerProps) {
  const fallbackChainId = initialChainId || chains[0]?.id || "";
  const initialAsset = assets.find((asset) => asset.assetId === initialAssetId) || null;
  const [chainId, setChainId] = useState(fallbackChainId);
  const [assetSearch, setAssetSearch] = useState(initialAsset ? formatAssetOptionLabel(initialAsset) : "");
  const [assetId, setAssetId] = useState(initialAssetId);

  const chainAssets = assets.filter((asset) => asset.chainId === chainId);
  const normalizedSearch = assetSearch.trim().toLowerCase();
  const matchingAssets = chainAssets
    .filter((asset) => {
      if (!normalizedSearch) {
        return true;
      }

      const searchBlob = [
        asset.symbol,
        asset.name,
        asset.chainName,
        asset.coingeckoId,
        asset.contractAddress
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchBlob.includes(normalizedSearch);
    })
    .slice(0, 10);

  const selectedAsset = chainAssets.find((asset) => asset.assetId === assetId) || null;

  return (
    <div className="picker-stack">
      <label className="field-group">
        <span>Chain</span>
        <select
          name="chainId"
          value={chainId}
          onChange={(event) => {
            setChainId(event.target.value);
            setAssetId("");
            setAssetSearch("");
          }}
          required
        >
          <option value="" disabled>
            Select a chain
          </option>
          {chains.map((chain) => (
            <option key={chain.id} value={chain.id}>
              {chain.name}
            </option>
          ))}
        </select>
      </label>

      <div className="field-group">
        <span>Coin</span>
        <input type="hidden" name="assetId" value={assetId} required />
        <input
          type="text"
          value={assetSearch}
          onChange={(event) => {
            setAssetSearch(event.target.value);
            setAssetId("");
          }}
          placeholder={chainId ? "Search by symbol, name, or contract" : "Select a chain first"}
          disabled={!chainId}
        />

        <div className="picker-results" aria-live="polite">
          {!chainId ? (
            <p className="picker-empty">Choose a chain to load that chain&apos;s supported assets.</p>
          ) : matchingAssets.length === 0 ? (
            <p className="picker-empty">No matching assets were found for this chain.</p>
          ) : (
            matchingAssets.map((asset) => {
              const isSelected = asset.assetId === assetId;

              return (
                <button
                  type="button"
                  key={`${asset.chainId}-${asset.assetId}`}
                  className={`picker-option${isSelected ? " picker-option-selected" : ""}`}
                  onClick={() => {
                    setAssetId(asset.assetId);
                    setAssetSearch(formatAssetOptionLabel(asset));
                  }}
                >
                  <strong>{asset.symbol}</strong>
                  <span>{asset.name}</span>
                  <small>
                    {asset.isNative ? "Native asset" : truncateContractAddress(asset.contractAddress)}
                  </small>
                </button>
              );
            })
          )}
        </div>

        {selectedAsset ? (
          <div className="picker-selection">
            <strong>{selectedAsset.symbol}</strong>
            <span>{selectedAsset.name}</span>
            <small>
              {selectedAsset.chainName}
              {selectedAsset.isNative ? " · Native" : ` · ${truncateContractAddress(selectedAsset.contractAddress)}`}
            </small>
          </div>
        ) : null}
      </div>
    </div>
  );
}
