"use client";

import { useEffect, useRef, useState } from "react";

type CoinSuggestion = {
  marketId: string;
  symbol: string;
  name: string;
};

type CoinAutocompleteFieldProps = {
  inputId: string;
  label?: string;
  assetIdName: string;
  coinMarketIdName: string;
  coinNameName: string;
  coinSymbolName: string;
  initialAssetId?: string;
  initialCoinMarketId?: string;
  initialCoinName?: string;
  initialCoinSymbol?: string;
  placeholder?: string;
  required?: boolean;
  helperText?: string;
};

export function CoinAutocompleteField({
  inputId,
  label = "Coin",
  assetIdName,
  coinMarketIdName,
  coinNameName,
  coinSymbolName,
  initialAssetId = "",
  initialCoinMarketId = "",
  initialCoinName = "",
  initialCoinSymbol = "",
  placeholder = "Start typing a coin name or ticker",
  required = false,
  helperText
}: CoinAutocompleteFieldProps) {
  const [query, setQuery] = useState(initialCoinName);
  const [selectedCoin, setSelectedCoin] = useState<CoinSuggestion | null>(
    initialCoinName
      ? {
          marketId: initialCoinMarketId,
          symbol: initialCoinSymbol,
          name: initialCoinName
        }
      : null
  );
  const [assetId, setAssetId] = useState(initialAssetId);
  const [results, setResults] = useState<CoinSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const blurTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/coins/search?q=${encodeURIComponent(trimmedQuery)}`, {
          signal: controller.signal,
          cache: "no-store"
        });
        const payload = (await response.json()) as {
          results?: CoinSuggestion[];
        };

        setResults(Array.isArray(payload.results) ? payload.results : []);
        setHighlightedIndex(-1);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setResults([]);
        }
      } finally {
        setIsLoading(false);
      }
    }, 160);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [query]);

  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) {
        window.clearTimeout(blurTimeoutRef.current);
      }
    };
  }, []);

  const hiddenCoinName = selectedCoin?.marketId ? selectedCoin.name : query.trim();
  const hiddenCoinSymbol = selectedCoin?.marketId ? selectedCoin.symbol : "";
  const hiddenCoinMarketId = selectedCoin?.marketId || "";

  function selectCoin(coin: CoinSuggestion) {
    setSelectedCoin(coin);
    setAssetId("");
    setQuery(coin.name);
    setResults([]);
    setIsOpen(false);
    setHighlightedIndex(-1);
  }

  return (
    <label className="field-group coin-autocomplete">
      <span>{label}</span>
      <input type="hidden" name={assetIdName} value={assetId} />
      <input type="hidden" name={coinMarketIdName} value={hiddenCoinMarketId} />
      <input type="hidden" name={coinNameName} value={hiddenCoinName} />
      <input type="hidden" name={coinSymbolName} value={hiddenCoinSymbol} />
      <input
        id={inputId}
        type="text"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setSelectedCoin(null);
          setAssetId("");
          setIsOpen(true);
        }}
        onFocus={() => {
          if (results.length > 0 || query.trim()) {
            setIsOpen(true);
          }
        }}
        onBlur={() => {
          blurTimeoutRef.current = window.setTimeout(() => {
            setIsOpen(false);
          }, 120);
        }}
        onKeyDown={(event) => {
          if (!isOpen || results.length === 0) {
            return;
          }

          if (event.key === "ArrowDown") {
            event.preventDefault();
            setHighlightedIndex((currentIndex) => {
              const nextIndex = currentIndex + 1;
              return nextIndex >= results.length ? 0 : nextIndex;
            });
          }

          if (event.key === "ArrowUp") {
            event.preventDefault();
            setHighlightedIndex((currentIndex) => {
              if (currentIndex <= 0) {
                return results.length - 1;
              }

              return currentIndex - 1;
            });
          }

          if (event.key === "Enter" && highlightedIndex >= 0 && highlightedIndex < results.length) {
            event.preventDefault();
            selectCoin(results[highlightedIndex]);
          }

          if (event.key === "Escape") {
            setIsOpen(false);
          }
        }}
        placeholder={placeholder}
        autoComplete="off"
        required={required}
      />

      {helperText ? <small className="field-helper">{helperText}</small> : null}

      {isOpen ? (
        <div className="autocomplete-panel" role="listbox" aria-label={`${label} suggestions`}>
          {isLoading ? (
            <div className="autocomplete-empty">Searching coins...</div>
          ) : results.length === 0 ? (
            <div className="autocomplete-empty">
              {query.trim()
                ? "No matching coins were found. Try another spelling or pick a suggestion when it appears."
                : "Start typing to see coin suggestions."}
            </div>
          ) : (
            results.map((coin, index) => (
              <button
                key={coin.marketId}
                type="button"
                className={`autocomplete-option${index === highlightedIndex ? " autocomplete-option-active" : ""}`}
                onMouseDown={(event) => {
                  event.preventDefault();
                  selectCoin(coin);
                }}
              >
                <strong>{coin.symbol}</strong>
                <span>{coin.name}</span>
                <small>{coin.marketId}</small>
              </button>
            ))
          )}
        </div>
      ) : null}

      {selectedCoin?.marketId ? (
        <div className="picker-selection">
          <strong>{selectedCoin.symbol}</strong>
          <span>{selectedCoin.name}</span>
          <small>{selectedCoin.marketId}</small>
        </div>
      ) : null}
    </label>
  );
}
