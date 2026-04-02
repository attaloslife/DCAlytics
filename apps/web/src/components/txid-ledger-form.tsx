"use client";

import { useState } from "react";

import { CoinAutocompleteField } from "@/components/coin-autocomplete-field";

type TxidNetworkOption = {
  key: string;
  label: string;
};

type TxidReviewState = {
  coinMarketId: string;
  coinName: string;
  coinSymbol: string;
  networkKey: string;
  transactionHash: string;
  occurredDate: string;
  occurredTime: string;
  unitPrice: string;
  quantity: string;
  feeValue: string;
  reviewBadge: string;
  reviewMessage: string;
};

type TxidLedgerFormProps = {
  portfolioId: string;
  portfolioCurrency: string;
  networks: TxidNetworkOption[];
  action: (formData: FormData) => void | Promise<void>;
};

function calculateRisk(quantity: string, unitPrice: string) {
  const numericQuantity = Number(quantity);
  const numericPrice = Number(unitPrice);
  const risk = numericQuantity * numericPrice;

  return Number.isFinite(risk) ? risk.toFixed(2) : "";
}

export function TxidLedgerForm({
  portfolioId,
  portfolioCurrency,
  networks,
  action
}: TxidLedgerFormProps) {
  const [networkKey, setNetworkKey] = useState(networks[0]?.key || "");
  const [transactionHash, setTransactionHash] = useState("");
  const [lookupMessage, setLookupMessage] = useState("");
  const [lookupError, setLookupError] = useState("");
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [reviewState, setReviewState] = useState<TxidReviewState | null>(null);
  const [reviewQuantity, setReviewQuantity] = useState("");
  const [reviewUnitPrice, setReviewUnitPrice] = useState("");

  async function handleLookup(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLookupError("");
    setLookupMessage("");

    const formData = new FormData(event.currentTarget);
    const payload = {
      coinMarketId: `${formData.get("lookupCoinMarketId") || ""}`,
      coinName: `${formData.get("lookupCoinName") || ""}`,
      coinSymbol: `${formData.get("lookupCoinSymbol") || ""}`,
      networkKey,
      transactionHash,
      currencyCode: portfolioCurrency
    };

    setIsLookingUp(true);

    try {
      const response = await fetch("/api/txid/lookup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      const result = (await response.json()) as {
        error?: string;
        coin?: {
          marketId: string;
          name: string;
          symbol: string;
        };
        prefill?: {
          networkKey: string;
          normalizedHash: string;
          transactionDate: string;
          coinPrice: string;
          quantity: string;
          commission: string;
          reviewBadge: string;
          reviewMessage: string;
          lookupMessage: string;
        };
      };

      if (!response.ok || !result.prefill || !result.coin) {
        setReviewState(null);
        setReviewQuantity("");
        setReviewUnitPrice("");
        setLookupError(result.error || "Unable to prepare that transaction.");
        return;
      }

      setLookupMessage(result.prefill.lookupMessage);
      setLookupError("");
      setNetworkKey(result.prefill.networkKey);
      setTransactionHash(result.prefill.normalizedHash);
      setReviewState({
        coinMarketId: result.coin.marketId,
        coinName: result.coin.name,
        coinSymbol: result.coin.symbol,
        networkKey: result.prefill.networkKey,
        transactionHash: result.prefill.normalizedHash,
        occurredDate: result.prefill.transactionDate,
        occurredTime: "",
        unitPrice: result.prefill.coinPrice,
        quantity: result.prefill.quantity,
        feeValue: result.prefill.commission || "0",
        reviewBadge: result.prefill.reviewBadge,
        reviewMessage: result.prefill.reviewMessage
      });
      setReviewQuantity(result.prefill.quantity);
      setReviewUnitPrice(result.prefill.coinPrice);
    } catch (error) {
      setReviewState(null);
      setReviewQuantity("");
      setReviewUnitPrice("");
      setLookupError(error instanceof Error ? error.message : "Unable to prepare that transaction.");
    } finally {
      setIsLookingUp(false);
    }
  }

  return (
    <div className="txid-flow">
      <form className="ledger-form" onSubmit={handleLookup}>
        <CoinAutocompleteField
          inputId="txid-lookup-coin"
          assetIdName="lookupAssetId"
          coinMarketIdName="lookupCoinMarketId"
          coinNameName="lookupCoinName"
          coinSymbolName="lookupCoinSymbol"
          required
          helperText="Pick the coin first, then the app can fetch the TXID and historical price for review."
        />

        <div className="field-grid">
          <label className="field-group">
            <span>Network</span>
            <select
              value={networkKey}
              onChange={(event) => setNetworkKey(event.target.value)}
              required
            >
              {networks.map((network) => (
                <option key={network.key} value={network.key}>
                  {network.label}
                </option>
              ))}
            </select>
          </label>

          <label className="field-group">
            <span>Transaction Hash / TXID</span>
            <input
              type="text"
              value={transactionHash}
              onChange={(event) => setTransactionHash(event.target.value)}
              required
            />
          </label>
        </div>

        <div className="inline-actions">
          <button type="submit" className="button-primary" disabled={isLookingUp}>
            {isLookingUp ? "Fetching..." : "Fetch and Prepare Review"}
          </button>
        </div>

        {lookupMessage ? <div className="banner banner-success">{lookupMessage}</div> : null}
        {lookupError ? <div className="banner banner-error">{lookupError}</div> : null}
      </form>

      {reviewState ? (
        <form className="ledger-form txid-review-form" action={action}>
          <input type="hidden" name="portfolioId" value={portfolioId} />
          <input type="hidden" name="currencyCode" value={portfolioCurrency} />
          <input type="hidden" name="networkKey" value={reviewState.networkKey} />
          <input type="hidden" name="transactionHash" value={reviewState.transactionHash} />

          <div className="txid-review-header">
            <div>
              <span className="eyebrow">TXID Review</span>
              <h3>Review before adding</h3>
              <p className="section-copy">{reviewState.reviewMessage}</p>
            </div>

            <div className="status-chip">{reviewState.reviewBadge}</div>
          </div>

          <CoinAutocompleteField
            inputId="txid-review-coin"
            assetIdName="assetId"
            coinMarketIdName="coinMarketId"
            coinNameName="coinName"
            coinSymbolName="coinSymbol"
            initialCoinMarketId={reviewState.coinMarketId}
            initialCoinName={reviewState.coinName}
            initialCoinSymbol={reviewState.coinSymbol}
            required
          />

          <div className="field-grid">
            <label className="field-group">
              <span>Type</span>
              <select name="entryType" defaultValue="buy" required>
                <option value="buy">Buy</option>
                <option value="sell">Sell</option>
              </select>
            </label>

            <label className="field-group">
              <span>Date</span>
              <input type="date" name="occurredDate" defaultValue={reviewState.occurredDate} required />
            </label>

            <label className="field-group">
              <span>Time (optional)</span>
              <input type="time" name="occurredTime" defaultValue={reviewState.occurredTime} />
            </label>

            <label className="field-group">
              <span>Quantity</span>
              <input
                type="text"
                name="quantity"
                value={reviewQuantity}
                onChange={(event) => setReviewQuantity(event.target.value)}
                required
              />
            </label>

            <label className="field-group">
              <span>Coin Price ({portfolioCurrency.toUpperCase()})</span>
              <input
                type="text"
                name="unitPrice"
                value={reviewUnitPrice}
                onChange={(event) => setReviewUnitPrice(event.target.value)}
                required
              />
            </label>

            <label className="field-group">
              <span>Risk ({portfolioCurrency.toUpperCase()})</span>
              <input type="text" value={calculateRisk(reviewQuantity, reviewUnitPrice)} readOnly />
            </label>

            <label className="field-group">
              <span>Commission ({portfolioCurrency.toUpperCase()})</span>
              <input type="text" name="feeValue" defaultValue={reviewState.feeValue} />
            </label>
          </div>

          <label className="field-group field-group-full">
            <span>Notes</span>
            <textarea
              name="notes"
              rows={4}
              placeholder="Optional notes for this TXID-based entry."
            />
          </label>

          <div className="inline-actions">
            <button type="submit" className="button-primary">
              Approve and Add
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
