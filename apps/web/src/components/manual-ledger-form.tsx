"use client";

import Link from "next/link";
import { useState } from "react";

import { CoinAutocompleteField } from "@/components/coin-autocomplete-field";
import type { ManualEntryDefaults } from "@/lib/ledger";

type ManualLedgerFormProps = {
  portfolioId: string;
  portfolioCurrency: string;
  defaults: ManualEntryDefaults;
  isEditing: boolean;
  action: (formData: FormData) => void | Promise<void>;
};

function calculateRisk(quantity: string, unitPrice: string) {
  const numericQuantity = Number(quantity);
  const numericPrice = Number(unitPrice);
  const risk = numericQuantity * numericPrice;

  return Number.isFinite(risk) ? risk.toFixed(2) : "";
}

export function ManualLedgerForm({
  portfolioId,
  portfolioCurrency,
  defaults,
  isEditing,
  action
}: ManualLedgerFormProps) {
  const [quantity, setQuantity] = useState(defaults.quantity);
  const [unitPrice, setUnitPrice] = useState(defaults.unitPrice || "");

  return (
    <form className="ledger-form" action={action}>
      <input type="hidden" name="portfolioId" value={portfolioId} />
      <input type="hidden" name="currencyCode" value={portfolioCurrency} />
      {isEditing ? <input type="hidden" name="entryId" value={defaults.entryId} /> : null}

      <CoinAutocompleteField
        inputId="manual-coin-search"
        assetIdName="assetId"
        coinMarketIdName="coinMarketId"
        coinNameName="coinName"
        coinSymbolName="coinSymbol"
        initialAssetId={defaults.assetId}
        initialCoinMarketId={defaults.coinMarketId}
        initialCoinName={defaults.coinName}
        initialCoinSymbol={defaults.coinSymbol}
        required
        helperText="Type a coin name or ticker and pick the match you want from the suggestions."
      />

      <div className="field-grid">
        <label className="field-group">
          <span>Type</span>
          <select name="entryType" defaultValue={defaults.entryType} required>
            <option value="buy">Buy</option>
            <option value="sell">Sell</option>
          </select>
        </label>

        <label className="field-group">
          <span>Date</span>
          <input type="date" name="occurredDate" defaultValue={defaults.occurredDate} required />
        </label>

        <label className="field-group">
          <span>Time (optional)</span>
          <input type="time" name="occurredTime" defaultValue={defaults.occurredTime} />
        </label>

        <label className="field-group">
          <span>Quantity</span>
          <input
            type="text"
            name="quantity"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            required
          />
        </label>

        <label className="field-group">
          <span>Unit Price ({portfolioCurrency.toUpperCase()})</span>
          <input
            type="text"
            name="unitPrice"
            value={unitPrice}
            onChange={(event) => setUnitPrice(event.target.value)}
            required
          />
        </label>

        <label className="field-group">
          <span>Risk ({portfolioCurrency.toUpperCase()})</span>
          <input type="text" value={calculateRisk(quantity, unitPrice)} readOnly />
        </label>

        <label className="field-group">
          <span>Fee ({portfolioCurrency.toUpperCase()})</span>
          <input type="text" name="feeValue" defaultValue={defaults.feeValue} />
        </label>

        <label className="field-group">
          <span>TX Hash (optional)</span>
          <input type="text" name="txHash" defaultValue={defaults.txHash} />
        </label>

        <label className="field-group">
          <span>External Ref (optional)</span>
          <input type="text" name="externalRef" defaultValue={defaults.externalRef} />
        </label>
      </div>

      <label className="field-group field-group-full">
        <span>Notes</span>
        <textarea
          name="notes"
          defaultValue={defaults.notes}
          rows={4}
          placeholder="Optional trade notes, strategy context, or fill details."
        />
      </label>

      <div className="inline-note">
        Gross value is stored automatically as quantity × unit price in {portfolioCurrency.toUpperCase()}.
      </div>

      <div className="inline-actions">
        <button type="submit" className="button-primary">
          {isEditing ? "Save Changes" : "Save Transaction"}
        </button>
        <Link href="/ledger" className="button-secondary">
          Cancel
        </Link>
      </div>
    </form>
  );
}
