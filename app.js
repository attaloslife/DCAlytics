const STORAGE_KEY = "dcalytics-transactions";
const CURRENCY_STORAGE_KEY = "dcalytics-portfolio-currency";

const coinAliasDirectory = [
  { coin: "Bitcoin", marketId: "bitcoin", aliases: ["bitcoin", "btc"] },
  { coin: "Ethereum", marketId: "ethereum", aliases: ["ethereum", "eth"] },
  { coin: "BNB", marketId: "binancecoin", aliases: ["bnb", "binancecoin", "binance coin"] },
  { coin: "Solana", marketId: "solana", aliases: ["solana", "sol"] },
  { coin: "XRP", marketId: "ripple", aliases: ["xrp", "ripple"] },
  { coin: "Cardano", marketId: "cardano", aliases: ["cardano", "ada"] },
  { coin: "Dogecoin", marketId: "dogecoin", aliases: ["dogecoin", "doge"] },
  { coin: "Avalanche", marketId: "avalanche-2", aliases: ["avalanche", "avax"] },
  { coin: "Chainlink", marketId: "chainlink", aliases: ["chainlink", "link"] },
  { coin: "Polkadot", marketId: "polkadot", aliases: ["polkadot", "dot"] },
  { coin: "Arbitrum", marketId: "arbitrum", aliases: ["arbitrum", "arb"] },
  { coin: "Sui", marketId: "sui", aliases: ["sui"] },
  { coin: "Toncoin", marketId: "the-open-network", aliases: ["toncoin", "ton", "the open network"] },
  { coin: "Litecoin", marketId: "litecoin", aliases: ["litecoin", "ltc"] },
  { coin: "TRON", marketId: "tron", aliases: ["tron", "trx"] },
  { coin: "Kaspa", marketId: "kaspa", aliases: ["kaspa", "kas"] },
  { coin: "Pepe", marketId: "pepe", aliases: ["pepe"] },
  { coin: "Stellar", marketId: "stellar", aliases: ["stellar", "stellar lumens", "xlm"] },
  { coin: "Near Protocol", marketId: "near", aliases: ["near", "near protocol"] },
  { coin: "Hedera", marketId: "hedera-hashgraph", aliases: ["hedera", "hbar"] },
  { coin: "Aptos", marketId: "aptos", aliases: ["aptos", "apt"] },
  { coin: "Sei", marketId: "sei-network", aliases: ["sei"] },
  { coin: "Render", marketId: "render-token", aliases: ["render", "rndr"] },
  { coin: "Uniswap", marketId: "uniswap", aliases: ["uniswap", "uni"] },
  { coin: "Shiba Inu", marketId: "shiba-inu", aliases: ["shiba inu", "shib"] },
  { coin: "Internet Computer", marketId: "internet-computer", aliases: ["internet computer", "icp"] }
];

const coinAliasMap = new Map();

coinAliasDirectory.forEach((entry) => {
  const aliasSet = new Set([entry.coin, ...entry.aliases]);

  aliasSet.forEach((alias) => {
    const trimmedAlias = alias.trim();
    const slugAlias = slugifyCoin(trimmedAlias);

    coinAliasMap.set(trimmedAlias.toLowerCase(), entry);
    coinAliasMap.set(slugAlias, entry);
    coinAliasMap.set(slugAlias.replace(/-/g, ""), entry);
  });
});

const validViews = ["dashboard", "add-transaction", "trade-log", "add-by-txid", "strategy"];
const tabButtons = document.querySelectorAll(".tab-link");
const tabPanels = document.querySelectorAll(".tab-panel");
const form = document.getElementById("transaction-form");
const coinInput = document.getElementById("coin");
const marketIdInput = document.getElementById("marketId");
const dateLabel = document.getElementById("date-label");
const dateInput = document.getElementById("transactionDate");
const coinPriceInput = document.getElementById("coinPrice");
const quantityInput = document.getElementById("quantity");
const riskInput = document.getElementById("risk");
const commissionInput = document.getElementById("commission");
const notesInput = document.getElementById("notes");
const feedback = document.getElementById("form-feedback");
const editState = document.getElementById("edit-state");
const submitButton = document.getElementById("submit-transaction");
const resetButton = document.getElementById("reset-transaction");
const txidLookupForm = document.getElementById("txid-lookup-form");
const txidLookupCoinInput = document.getElementById("txid-coin");
const txidLookupNetworkInput = document.getElementById("txid-network");
const txidLookupHashInput = document.getElementById("txid-hash");
const txidPrepareReviewButton = document.getElementById("txid-prepare-review");
const txidFetchFeedback = document.getElementById("txid-fetch-feedback");
const txidReviewCard = document.getElementById("txid-review-card");
const txidReviewBadge = document.getElementById("txid-review-badge");
const txidReviewCoinChip = document.getElementById("txid-review-coin-chip");
const txidReviewNetworkChip = document.getElementById("txid-review-network-chip");
const txidReviewHashChip = document.getElementById("txid-review-hash-chip");
const txidReviewForm = document.getElementById("txid-review-form");
const txidReviewCoinInput = document.getElementById("txid-review-coin");
const txidReviewNetworkInput = document.getElementById("txid-review-network");
const txidReviewHashInput = document.getElementById("txid-review-hash");
const txidReviewMarketIdInput = document.getElementById("txid-review-market-id");
const txidDateLabel = document.getElementById("txid-date-label");
const txidTransactionDateInput = document.getElementById("txid-transaction-date");
const txidCoinPriceInput = document.getElementById("txid-coin-price");
const txidQuantityInput = document.getElementById("txid-quantity");
const txidRiskInput = document.getElementById("txid-risk");
const txidCommissionInput = document.getElementById("txid-commission");
const txidNotesInput = document.getElementById("txid-notes");
const txidReviewFeedback = document.getElementById("txid-review-feedback");
const txidDiscardReviewButton = document.getElementById("txid-discard-review");
const portfolioCurrencySelect = document.getElementById("portfolio-currency");
const portfolioCurrencyFeedback = document.getElementById("portfolio-currency-feedback");
const dashboardEmpty = document.getElementById("dashboard-empty");
const dashboardContent = document.getElementById("dashboard-content");
const metricTotalTransactions = document.getElementById("metric-total-transactions");
const metricOpenCoins = document.getElementById("metric-open-coins");
const metricTotalBuys = document.getElementById("metric-total-buys");
const metricTotalSells = document.getElementById("metric-total-sells");
const metricNetInvested = document.getElementById("metric-net-invested");
const metricTotalFees = document.getElementById("metric-total-fees");
const metricPortfolioValue = document.getElementById("metric-portfolio-value");
const metricRealizedProfitLoss = document.getElementById("metric-realized-pl");
const metricUnrealizedProfitLoss = document.getElementById("metric-unrealized-pl");
const metricTotalProfitLoss = document.getElementById("metric-total-pl");
const dashboardPriceStatus = document.getElementById("dashboard-price-status");
const dashboardPriceDetail = document.getElementById("dashboard-price-detail");
const dashboardPriceUpdated = document.getElementById("dashboard-price-updated");
const dashboardPriceCoverage = document.getElementById("dashboard-price-coverage");
const dashboardRefreshPricesButton = document.getElementById("dashboard-refresh-prices");
const dashboardConversionStatus = document.getElementById("dashboard-conversion-status");
const dashboardConversionDetail = document.getElementById("dashboard-conversion-detail");
const dashboardPositionSummary = document.getElementById("dashboard-position-summary");
const dashboardPositionBody = document.getElementById("dashboard-position-body");
const dashboardDetailTitle = document.getElementById("dashboard-detail-title");
const dashboardDetailCaption = document.getElementById("dashboard-detail-caption");
const dashboardDetailEmpty = document.getElementById("dashboard-detail-empty");
const dashboardDetailGrid = document.getElementById("dashboard-detail-grid");
const dashboardAllocationSummary = document.getElementById("dashboard-allocation-summary");
const dashboardAllocationEmpty = document.getElementById("dashboard-allocation-empty");
const dashboardAllocationChart = document.getElementById("dashboard-allocation-chart");
const dashboardAllocationTotal = document.getElementById("dashboard-allocation-total");
const dashboardAllocationLegend = document.getElementById("dashboard-allocation-legend");
const tradeLogFeedback = document.getElementById("trade-log-feedback");
const filterYearSelect = document.getElementById("filter-year");
const filterMonthSelect = document.getElementById("filter-month");
const filterCoinSelect = document.getElementById("filter-coin");
const filterTypeSelect = document.getElementById("filter-type");
const clearFiltersButton = document.getElementById("clear-filters");
const filterSummary = document.getElementById("filter-summary");
const tradeTableBody = document.getElementById("trade-table-body");
const emptyState = document.getElementById("empty-state");
const clearTransactionsButton = document.getElementById("clear-transactions");
const typeInputs = Array.from(form.querySelectorAll('input[name="type"]'));
const txidReviewTypeInputs = Array.from(txidReviewForm.querySelectorAll('input[name="txidType"]'));
const allocationChartColors = [
  "#3e86f5",
  "#31e8a0",
  "#75a9ff",
  "#1bc7ff",
  "#7cf7c0",
  "#4f6fff",
  "#1fda8a",
  "#99d8ff"
];
const dashboardPriceApiUrl = "https://api.coingecko.com/api/v3/simple/price";
const supportedVsCurrenciesApiUrl = "https://api.coingecko.com/api/v3/simple/supported_vs_currencies";
const coinGeckoCoinDetailsApiUrl = "https://api.coingecko.com/api/v3/coins";
const dashboardPriceRefreshMs = 5 * 60 * 1000;
const dashboardConversionRateRefreshMs = 5 * 60 * 1000;
const coinGeckoCoinListApiUrl = "https://api.coingecko.com/api/v3/coins/list";
const coinGeckoCoinCatalogStorageKey = "dcalytics-coingecko-coin-catalog";
const coinGeckoCoinCatalogRefreshMs = 7 * 24 * 60 * 60 * 1000;
const coinGeckoHistoricalPriceDayMs = 24 * 60 * 60 * 1000;
const quantityEpsilon = 0.00000001;
const preferredFiatCurrencies = [
  "usd",
  "eur",
  "gbp",
  "try",
  "cad",
  "aud",
  "chf",
  "jpy",
  "cny",
  "aed",
  "brl",
  "sgd",
  "nzd",
  "sek",
  "nok"
];
const txidLiveFetchNetworkConfigs = [
  {
    key: "bitcoin",
    label: "Bitcoin",
    type: "bitcoin",
    apiBaseUrl: "https://mempool.space/api",
    aliases: ["bitcoin", "btc", "bitcoin mainnet"],
    nativeSymbols: ["btc"],
    nativeNames: ["bitcoin"],
    nativeMarketIds: ["bitcoin"]
  },
  {
    key: "solana",
    label: "Solana",
    type: "solana",
    apiBaseUrl: "https://solana-rpc.publicnode.com",
    aliases: ["solana", "sol", "solana mainnet"],
    nativeSymbols: ["sol"],
    nativeNames: ["solana", "sol"],
    nativeMarketIds: ["solana"]
  },
  {
    key: "ethereum",
    label: "Ethereum",
    type: "evm",
    apiBaseUrl: "https://eth.blockscout.com",
    aliases: ["ethereum", "eth", "ethereum mainnet"],
    nativeSymbols: ["eth"],
    nativeNames: ["ethereum", "ether"],
    nativeMarketIds: ["ethereum"]
  },
  {
    key: "base",
    label: "Base",
    type: "evm",
    apiBaseUrl: "https://base.blockscout.com",
    aliases: ["base", "base mainnet"],
    nativeSymbols: ["eth"],
    nativeNames: ["ethereum", "ether"],
    nativeMarketIds: ["ethereum"]
  },
  {
    key: "arbitrum",
    label: "Arbitrum",
    type: "evm",
    apiBaseUrl: "https://arbitrum.blockscout.com",
    aliases: ["arbitrum", "arb", "arbitrum one"],
    nativeSymbols: ["eth"],
    nativeNames: ["ethereum", "ether"],
    nativeMarketIds: ["ethereum"]
  },
  {
    key: "optimism",
    label: "Optimism",
    type: "evm",
    apiBaseUrl: "https://optimism.blockscout.com",
    aliases: ["optimism", "op", "optimism mainnet"],
    nativeSymbols: ["eth"],
    nativeNames: ["ethereum", "ether"],
    nativeMarketIds: ["ethereum"]
  },
  {
    key: "polygon",
    label: "Polygon",
    type: "evm",
    apiBaseUrl: "https://polygon.blockscout.com",
    aliases: ["polygon", "matic", "pol", "polygon pos"],
    nativeSymbols: ["matic", "pol"],
    nativeNames: ["polygon", "matic", "polygon ecosystem token"],
    nativeMarketIds: ["matic-network", "polygon-ecosystem-token"]
  },
  {
    key: "gnosis",
    label: "Gnosis",
    type: "evm",
    apiBaseUrl: "https://gnosis.blockscout.com",
    aliases: ["gnosis", "xdai", "gnosis chain", "xdai chain"],
    nativeSymbols: ["xdai"],
    nativeNames: ["xdai", "xdai"],
    nativeMarketIds: ["xdai"]
  },
  {
    key: "scroll",
    label: "Scroll",
    type: "evm",
    apiBaseUrl: "https://scroll.blockscout.com",
    aliases: ["scroll", "scroll mainnet"],
    nativeSymbols: ["eth"],
    nativeNames: ["ethereum", "ether"],
    nativeMarketIds: ["ethereum"]
  }
];
const txidLiveFetchSupportSummary = txidLiveFetchNetworkConfigs
  .map((networkConfig) => networkConfig.label)
  .join(", ");

let suppressResetFeedbackClear = false;
let currentEditingId = null;
let marketIdWasEditedManually = false;
let suppressTxidLookupFeedbackClear = false;
let txidMarketIdWasEditedManually = false;
let selectedDashboardCoinKey = "";
let dashboardPriceRequestId = 0;
let dashboardPriceState = {
  status: "idle",
  marketIdsKey: "",
  prices: {},
  updatedAts: {},
  lastUpdatedAt: 0,
  fetchedAt: 0,
  error: ""
};
let dashboardConversionRequestId = 0;
let dashboardConversionState = {
  status: "idle",
  currencyKey: "",
  rates: {},
  fetchedAt: 0,
  error: ""
};
let coinGeckoCatalogLoadPromise = null;
let supportedCurrenciesLoadPromise = null;
let coinGeckoCatalogState = {
  status: "idle",
  entries: [],
  fetchedAt: 0,
  byId: new Map(),
  byName: new Map(),
  bySymbol: new Map(),
  error: ""
};
const coinGeckoCoinDetailCache = new Map();
const coinGeckoCoinDetailRequests = new Map();
const coinGeckoHistoricalPriceCache = new Map();
const coinGeckoHistoricalPriceRequests = new Map();
let supportedCurrencyState = {
  status: "idle",
  currencies: ["usd"],
  error: ""
};
let coinAutocompletePanelIdCounter = 0;
const coinAutocompleteControllers = [];

function getTodayForInput() {
  const now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60 * 1000;
  return new Date(now.getTime() - offsetMs).toISOString().split("T")[0];
}

function generateId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }

  return `tx-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeCurrencyCode(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function getStoredPortfolioCurrency() {
  const storedCurrency = normalizeCurrencyCode(localStorage.getItem(CURRENCY_STORAGE_KEY));
  return storedCurrency || "usd";
}

function savePortfolioCurrency(currencyCode) {
  localStorage.setItem(CURRENCY_STORAGE_KEY, normalizeCurrencyCode(currencyCode) || "usd");
}

function getPortfolioCurrency() {
  return normalizeCurrencyCode(portfolioCurrencySelect?.value) || getStoredPortfolioCurrency();
}

function getCurrencyDisplayLabel(currencyCode) {
  const normalizedCurrencyCode = normalizeCurrencyCode(currencyCode) || "usd";
  const upperCurrencyCode = normalizedCurrencyCode.toUpperCase();

  if (typeof Intl.DisplayNames === "function") {
    try {
      const displayNames = new Intl.DisplayNames(["en"], { type: "currency" });
      const currencyName = displayNames.of(upperCurrencyCode);

      if (currencyName) {
        return `${upperCurrencyCode} - ${currencyName}`;
      }
    } catch (error) {
      console.warn("Unable to format currency display name", error);
    }
  }

  return upperCurrencyCode;
}

function populatePortfolioCurrencyOptions(currencyCodes) {
  const normalizedCodes = [...new Set(currencyCodes.map(normalizeCurrencyCode).filter(Boolean))];
  const selectedCurrency = normalizeCurrencyCode(portfolioCurrencySelect.value) || getStoredPortfolioCurrency();

  portfolioCurrencySelect.innerHTML = "";

  normalizedCodes.forEach((currencyCode) => {
    const option = document.createElement("option");

    option.value = currencyCode;
    option.textContent = getCurrencyDisplayLabel(currencyCode);
    portfolioCurrencySelect.appendChild(option);
  });

  if (!normalizedCodes.length) {
    const option = document.createElement("option");

    option.value = "usd";
    option.textContent = getCurrencyDisplayLabel("usd");
    portfolioCurrencySelect.appendChild(option);
  }

  portfolioCurrencySelect.value = normalizedCodes.includes(selectedCurrency) ? selectedCurrency : "usd";
}

function ensureSupportedCurrenciesLoaded() {
  if (supportedCurrencyState.status === "ready" && supportedCurrencyState.currencies.length > 0) {
    return Promise.resolve();
  }

  if (supportedCurrenciesLoadPromise) {
    return supportedCurrenciesLoadPromise;
  }

  supportedCurrencyState = {
    ...supportedCurrencyState,
    status: "loading",
    error: ""
  };

  supportedCurrenciesLoadPromise = fetch(supportedVsCurrenciesApiUrl)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Supported currency lookup failed with status ${response.status}.`);
      }

      return response.json();
    })
    .then((currencies) => {
      const supportedCurrencies = Array.isArray(currencies) ? currencies.map(normalizeCurrencyCode) : [];
      const availablePreferredCurrencies = preferredFiatCurrencies.filter((currencyCode) =>
        supportedCurrencies.includes(currencyCode)
      );
      const nextCurrencies = availablePreferredCurrencies.length ? availablePreferredCurrencies : ["usd"];

      supportedCurrencyState = {
        status: "ready",
        currencies: nextCurrencies,
        error: ""
      };
      populatePortfolioCurrencyOptions(nextCurrencies);
      portfolioCurrencyFeedback.textContent = "";
      savePortfolioCurrency(portfolioCurrencySelect.value);
    })
    .catch((error) => {
      supportedCurrencyState = {
        status: "error",
        currencies: ["usd"],
        error: error.message
      };
      populatePortfolioCurrencyOptions(["usd"]);
      savePortfolioCurrency("usd");
      portfolioCurrencyFeedback.textContent = "Supported currency list could not be refreshed, so the selector fell back to USD only.";
    })
    .finally(() => {
      supportedCurrenciesLoadPromise = null;
    });

  return supportedCurrenciesLoadPromise;
}

function slugifyCoin(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function formatCoinLabel(value) {
  return value
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function getAliasDisplaySymbol(entry) {
  if (!entry || !Array.isArray(entry.aliases)) {
    return "";
  }

  const symbolCandidate = entry.aliases
    .map((alias) => alias.trim().toUpperCase())
    .filter((alias) => /^[A-Z0-9]{2,10}$/.test(alias))
    .sort((left, right) => left.length - right.length)[0];

  return symbolCandidate || "";
}

function normalizeCatalogNameKey(value) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function normalizeCatalogSymbolKey(value) {
  return value.trim().toLowerCase();
}

function buildCoinGeckoCatalogIndexes(entries) {
  const byId = new Map();
  const byName = new Map();
  const bySymbol = new Map();

  entries.forEach((entry) => {
    if (!entry || typeof entry.id !== "string" || typeof entry.name !== "string" || typeof entry.symbol !== "string") {
      return;
    }

    const normalizedEntry = {
      id: entry.id.trim(),
      name: entry.name.trim(),
      symbol: entry.symbol.trim()
    };

    if (!normalizedEntry.id || !normalizedEntry.name || !normalizedEntry.symbol) {
      return;
    }

    const idKey = normalizedEntry.id.toLowerCase();
    const nameKey = normalizeCatalogNameKey(normalizedEntry.name);
    const symbolKey = normalizeCatalogSymbolKey(normalizedEntry.symbol);

    byId.set(idKey, normalizedEntry);

    if (!byName.has(nameKey)) {
      byName.set(nameKey, normalizedEntry);
    }

    if (!bySymbol.has(symbolKey)) {
      bySymbol.set(symbolKey, []);
    }

    bySymbol.get(symbolKey).push(normalizedEntry);
  });

  return {
    byId,
    byName,
    bySymbol
  };
}

function setCoinGeckoCatalog(entries, fetchedAt = Date.now()) {
  const sanitizedEntries = Array.isArray(entries) ? entries : [];
  const indexes = buildCoinGeckoCatalogIndexes(sanitizedEntries);

  coinGeckoCatalogState = {
    status: "ready",
    entries: sanitizedEntries,
    fetchedAt,
    byId: indexes.byId,
    byName: indexes.byName,
    bySymbol: indexes.bySymbol,
    error: ""
  };
}

function hydrateCoinGeckoCatalogFromStorage() {
  const rawCatalog = localStorage.getItem(coinGeckoCoinCatalogStorageKey);

  if (!rawCatalog) {
    return false;
  }

  try {
    const parsedCatalog = JSON.parse(rawCatalog);

    if (!Array.isArray(parsedCatalog?.entries)) {
      return false;
    }

    setCoinGeckoCatalog(parsedCatalog.entries, Number(parsedCatalog.fetchedAt) || 0);
    return true;
  } catch (error) {
    console.error("Unable to parse cached CoinGecko catalog", error);
    return false;
  }
}

function cacheCoinGeckoCatalog(entries, fetchedAt) {
  try {
    localStorage.setItem(
      coinGeckoCoinCatalogStorageKey,
      JSON.stringify({
        fetchedAt,
        entries
      })
    );
  } catch (error) {
    console.warn("Unable to cache CoinGecko catalog", error);
  }
}

function getCoinGeckoCatalogEntryById(marketId) {
  const normalizedMarketId = typeof marketId === "string" ? marketId.trim().toLowerCase() : "";

  if (!normalizedMarketId) {
    return null;
  }

  return coinGeckoCatalogState.byId.get(normalizedMarketId) || null;
}

function getCoinGeckoCatalogAliasEntry(rawValue) {
  const cleanedValue = rawValue.trim().replace(/\s+/g, " ");
  const slugValue = slugifyCoin(cleanedValue);
  const aliasMatch =
    coinAliasMap.get(cleanedValue.toLowerCase()) ||
    coinAliasMap.get(slugValue) ||
    coinAliasMap.get(slugValue.replace(/-/g, ""));

  if (!aliasMatch) {
    return null;
  }

  return getCoinGeckoCatalogEntryById(aliasMatch.marketId) || aliasMatch;
}

function getCoinDisplaySymbol(rawValue, currentMarketId = "") {
  const catalogEntry = getCoinGeckoCatalogEntryFromValue(rawValue, currentMarketId);

  if (catalogEntry?.symbol) {
    return catalogEntry.symbol.toUpperCase();
  }

  const aliasEntry = getCoinGeckoCatalogAliasEntry(rawValue);
  const aliasSymbol = getAliasDisplaySymbol(aliasEntry);

  if (aliasSymbol) {
    return aliasSymbol;
  }

  const cleanedMarketId = typeof currentMarketId === "string" ? currentMarketId.trim() : "";

  if (/^[a-z0-9]{2,10}$/i.test(cleanedMarketId)) {
    return cleanedMarketId.toUpperCase();
  }

  const cleanedValue = rawValue.trim().replace(/\s+/g, " ");

  if (/^[a-z0-9]{2,10}$/i.test(cleanedValue)) {
    return cleanedValue.toUpperCase();
  }

  return "";
}

function formatCoinDisplayLabel(rawValue, currentMarketId = "") {
  const canonicalCoinData = getCanonicalCoinData(rawValue, currentMarketId);
  const coinSymbol = getCoinDisplaySymbol(rawValue, canonicalCoinData.marketId || currentMarketId);

  if (coinSymbol) {
    return coinSymbol;
  }

  const coinLabel = canonicalCoinData.coin || formatCoinLabel(rawValue);

  if (!coinLabel) {
    return "-";
  }

  return coinLabel;
}

function getCoinGeckoCatalogEntryFromValue(rawValue, currentMarketId = "") {
  const cleanedValue = rawValue.trim().replace(/\s+/g, " ");
  const currentMarketIdEntry = getCoinGeckoCatalogEntryById(currentMarketId);

  if (currentMarketIdEntry) {
    return currentMarketIdEntry;
  }

  if (!cleanedValue) {
    return null;
  }

  const idKey = cleanedValue.toLowerCase();
  const slugValue = slugifyCoin(cleanedValue);
  const nameKey = normalizeCatalogNameKey(cleanedValue);
  const symbolKey = normalizeCatalogSymbolKey(cleanedValue.replace(/\s+/g, ""));
  const aliasEntry = getCoinGeckoCatalogAliasEntry(cleanedValue);
  const aliasMarketId = aliasEntry?.marketId || aliasEntry?.id || "";
  const idMatch =
    coinGeckoCatalogState.byId.get(idKey) ||
    coinGeckoCatalogState.byId.get(slugValue);

  if (idMatch) {
    return idMatch;
  }

  const nameMatch = coinGeckoCatalogState.byName.get(nameKey);

  if (nameMatch) {
    return nameMatch;
  }

  if (aliasMarketId && coinGeckoCatalogState.byId.has(aliasMarketId.toLowerCase())) {
    return coinGeckoCatalogState.byId.get(aliasMarketId.toLowerCase());
  }

  const symbolCandidates = coinGeckoCatalogState.bySymbol.get(symbolKey) || [];

  if (symbolCandidates.length === 1) {
    return symbolCandidates[0];
  }

  if (symbolCandidates.length > 1 && aliasMarketId) {
    const preferredSymbolEntry = symbolCandidates.find((entry) => entry.id === aliasMarketId);

    if (preferredSymbolEntry) {
      return preferredSymbolEntry;
    }
  }

  return null;
}

function getCanonicalCoinData(rawValue, currentMarketId = "") {
  const cleanedValue = rawValue.trim().replace(/\s+/g, " ");
  const fallbackMarketId = typeof currentMarketId === "string" ? currentMarketId.trim() : "";

  if (!cleanedValue && !fallbackMarketId) {
    return { coin: "", marketId: "" };
  }

  const catalogEntry = getCoinGeckoCatalogEntryFromValue(cleanedValue, fallbackMarketId);

  if (catalogEntry) {
    return {
      coin: catalogEntry.name,
      marketId: catalogEntry.id
    };
  }

  const aliasEntry = getCoinGeckoCatalogAliasEntry(cleanedValue);

  if (aliasEntry) {
    return {
      coin: aliasEntry.coin || aliasEntry.name,
      marketId: aliasEntry.marketId || aliasEntry.id
    };
  }

  return {
    coin: cleanedValue ? formatCoinLabel(cleanedValue) : "",
    marketId: fallbackMarketId || slugifyCoin(cleanedValue)
  };
}

function normalizeTransactionRecord(transaction) {
  const rawCoin = typeof transaction.coin === "string" ? transaction.coin : "";
  const currentMarketId = typeof transaction.marketId === "string" ? transaction.marketId.trim() : "";
  const canonicalCoinData = getCanonicalCoinData(rawCoin, currentMarketId);
  const currency = normalizeCurrencyCode(transaction.currency) || getStoredPortfolioCurrency();

  return {
    ...transaction,
    coin: canonicalCoinData.coin || (rawCoin ? formatCoinLabel(rawCoin) : ""),
    marketId: canonicalCoinData.marketId || currentMarketId || slugifyCoin(rawCoin),
    currency
  };
}

function getStoredTransactions() {
  const raw = localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    const normalizedTransactions = parsed.map(normalizeTransactionRecord);
    const hasChanges = normalizedTransactions.some((transaction, index) => {
      const original = parsed[index];
      return (
        transaction.coin !== original.coin ||
        transaction.marketId !== original.marketId ||
        transaction.currency !== normalizeCurrencyCode(original.currency)
      );
    });

    if (hasChanges) {
      saveTransactions(normalizedTransactions);
    }

    return normalizedTransactions;
  } catch (error) {
    console.error("Unable to parse stored transactions", error);
    return [];
  }
}

function saveTransactions(transactions) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

function normalizeStoredTransactionsWithCoinGeckoCatalog() {
  const raw = localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return false;
  }

  try {
    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return false;
    }

    const normalizedTransactions = parsed.map(normalizeTransactionRecord);
    const hasChanges = normalizedTransactions.some((transaction, index) => {
      const original = parsed[index];
      return (
        transaction.coin !== original.coin ||
        transaction.marketId !== original.marketId ||
        transaction.currency !== normalizeCurrencyCode(original.currency)
      );
    });

    if (hasChanges) {
      saveTransactions(normalizedTransactions);
    }

    return hasChanges;
  } catch (error) {
    console.error("Unable to normalize stored transactions with CoinGecko catalog", error);
    return false;
  }
}

function ensureCoinGeckoCatalogLoaded(forceRefresh = false) {
  const hasCatalogEntries = coinGeckoCatalogState.entries.length > 0;
  const hasFreshCatalog =
    hasCatalogEntries &&
    Date.now() - coinGeckoCatalogState.fetchedAt < coinGeckoCoinCatalogRefreshMs;

  if (!forceRefresh && hasFreshCatalog) {
    return Promise.resolve();
  }

  if (coinGeckoCatalogLoadPromise) {
    return coinGeckoCatalogLoadPromise;
  }

  coinGeckoCatalogState = {
    ...coinGeckoCatalogState,
    status: "loading",
    error: ""
  };

  coinGeckoCatalogLoadPromise = fetch(coinGeckoCoinListApiUrl)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Coin catalog lookup failed with status ${response.status}.`);
      }

      return response.json();
    })
    .then((entries) => {
      const fetchedAt = Date.now();

      setCoinGeckoCatalog(entries, fetchedAt);
      cacheCoinGeckoCatalog(entries, fetchedAt);

      const normalizedAnyTransactions = normalizeStoredTransactionsWithCoinGeckoCatalog();

      if (normalizedAnyTransactions) {
        renderPortfolioViews();
      }
    })
    .catch((error) => {
      if (coinGeckoCatalogState.entries.length > 0) {
        coinGeckoCatalogState = {
          ...coinGeckoCatalogState,
          status: "ready",
          error: error.message
        };
        return;
      }

      coinGeckoCatalogState = {
        status: "error",
        entries: [],
        fetchedAt: 0,
        byId: new Map(),
        byName: new Map(),
        bySymbol: new Map(),
        error: error.message
      };
    })
    .finally(() => {
      coinGeckoCatalogLoadPromise = null;
    });

  return coinGeckoCatalogLoadPromise;
}

function normalizeCoinAutocompleteQuery(value) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

function getCoinAutocompleteSearchEntries() {
  if (coinGeckoCatalogState.entries.length > 0) {
    return coinGeckoCatalogState.entries;
  }

  return coinAliasDirectory.map((entry) => ({
    id: entry.marketId,
    name: entry.coin,
    symbol: getAliasDisplaySymbol(entry) || entry.coin
  }));
}

function getCoinAutocompleteSuggestions(query, limit = 8) {
  const cleanedQuery = normalizeCoinAutocompleteQuery(query);

  if (!cleanedQuery) {
    return [];
  }

  const lowerQuery = cleanedQuery.toLowerCase();
  const nameQuery = normalizeCatalogNameKey(cleanedQuery);
  const symbolQuery = normalizeCatalogSymbolKey(cleanedQuery.replace(/\s+/g, ""));
  const slugQuery = slugifyCoin(cleanedQuery);
  const allowContainsMatches = Math.max(nameQuery.length, symbolQuery.length, slugQuery.length) >= 2;
  const aliasEntry = getCoinGeckoCatalogAliasEntry(cleanedQuery);
  const aliasMarketId = aliasEntry?.marketId || aliasEntry?.id || "";
  const rankedEntries = [];

  getCoinAutocompleteSearchEntries().forEach((entry) => {
    if (!entry || typeof entry.id !== "string" || typeof entry.name !== "string" || typeof entry.symbol !== "string") {
      return;
    }

    const entryId = entry.id.trim().toLowerCase();
    const entryName = normalizeCatalogNameKey(entry.name);
    const entrySymbol = normalizeCatalogSymbolKey(entry.symbol);
    let score = 0;

    if (entryId === lowerQuery || entryId === slugQuery) {
      score = 1000;
    } else if (entrySymbol === symbolQuery) {
      score = 980;
    } else if (entryName === nameQuery) {
      score = 960;
    } else if (symbolQuery && entrySymbol.startsWith(symbolQuery)) {
      score = 830 - Math.min(60, entrySymbol.length - symbolQuery.length);
    } else if (entryName.startsWith(nameQuery)) {
      score = 800 - Math.min(90, entryName.length - nameQuery.length);
    } else if (slugQuery && entryId.startsWith(slugQuery)) {
      score = 770 - Math.min(90, entryId.length - slugQuery.length);
    } else if (allowContainsMatches && entryName.includes(nameQuery)) {
      score = 660 - Math.min(70, entryName.indexOf(nameQuery));
    } else if (allowContainsMatches && symbolQuery && entrySymbol.includes(symbolQuery)) {
      score = 630 - Math.min(70, entrySymbol.indexOf(symbolQuery));
    } else if (allowContainsMatches && slugQuery && entryId.includes(slugQuery)) {
      score = 600 - Math.min(70, entryId.indexOf(slugQuery));
    }

    if (!score) {
      return;
    }

    if (aliasMarketId && entryId === aliasMarketId.toLowerCase()) {
      score += 45;
    }

    rankedEntries.push({
      entry,
      score
    });
  });

  return rankedEntries
    .sort((left, right) => (
      right.score - left.score ||
      left.entry.name.localeCompare(right.entry.name) ||
      left.entry.symbol.localeCompare(right.entry.symbol)
    ))
    .slice(0, limit)
    .map(({ entry }) => entry);
}

function getSelectedCoinMarketId(input) {
  return typeof input?.dataset?.selectedMarketId === "string"
    ? input.dataset.selectedMarketId.trim()
    : "";
}

function setSelectedCoinMarketId(input, marketId = "") {
  if (!input) {
    return;
  }

  const cleanedMarketId = typeof marketId === "string" ? marketId.trim() : "";

  if (cleanedMarketId) {
    input.dataset.selectedMarketId = cleanedMarketId;
    return;
  }

  delete input.dataset.selectedMarketId;
}

function createCoinAutocompleteController({ input, onSelect }) {
  if (!input) {
    return null;
  }

  const panel = document.createElement("div");
  const status = document.createElement("div");
  const list = document.createElement("div");
  const listId = `coin-autocomplete-${++coinAutocompletePanelIdCounter}`;
  const state = {
    suggestions: [],
    activeIndex: -1,
    requestId: 0
  };

  panel.className = "coin-autocomplete-panel";
  panel.hidden = true;

  status.className = "coin-autocomplete-status";
  status.hidden = true;

  list.className = "coin-autocomplete-list";
  list.id = listId;
  list.setAttribute("role", "listbox");

  panel.append(status, list);
  input.insertAdjacentElement("afterend", panel);
  input.setAttribute("aria-autocomplete", "list");
  input.setAttribute("aria-controls", listId);
  input.setAttribute("aria-expanded", "false");

  function clearActiveDescendant() {
    input.removeAttribute("aria-activedescendant");
  }

  function setExpanded(isExpanded) {
    input.setAttribute("aria-expanded", isExpanded ? "true" : "false");
  }

  function close() {
    state.suggestions = [];
    state.activeIndex = -1;
    list.innerHTML = "";
    status.textContent = "";
    status.hidden = true;
    panel.hidden = true;
    setExpanded(false);
    clearActiveDescendant();
  }

  function updateActiveSuggestion(nextIndex) {
    if (!state.suggestions.length) {
      state.activeIndex = -1;
      clearActiveDescendant();
      return;
    }

    if (nextIndex < 0) {
      state.activeIndex = -1;
      [...list.children].forEach((child) => {
        child.dataset.active = "false";
      });
      clearActiveDescendant();
      return;
    }

    const boundedIndex = Math.max(0, Math.min(nextIndex, state.suggestions.length - 1));
    state.activeIndex = boundedIndex;

    [...list.children].forEach((child, childIndex) => {
      child.dataset.active = childIndex === boundedIndex ? "true" : "false";
    });

    const activeOption = list.children[boundedIndex];

    if (activeOption) {
      input.setAttribute("aria-activedescendant", activeOption.id);
      activeOption.scrollIntoView({
        block: "nearest"
      });
    } else {
      clearActiveDescendant();
    }
  }

  function selectSuggestion(entry) {
    state.requestId += 1;
    input.value = entry.name;
    setSelectedCoinMarketId(input, entry.id);

    if (typeof onSelect === "function") {
      onSelect(entry);
    }

    close();
  }

  function renderStatus(message) {
    state.suggestions = [];
    state.activeIndex = -1;
    list.innerHTML = "";
    status.textContent = message;
    status.hidden = false;
    panel.hidden = false;
    setExpanded(true);
    clearActiveDescendant();
  }

  function renderSuggestions() {
    list.innerHTML = "";
    status.textContent = "";
    status.hidden = true;

    if (!state.suggestions.length) {
      close();
      return;
    }

    state.suggestions.forEach((entry, index) => {
      const option = document.createElement("button");
      const symbol = document.createElement("span");
      const main = document.createElement("span");
      const title = document.createElement("strong");
      const subtitle = document.createElement("span");
      const marketId = document.createElement("span");

      option.type = "button";
      option.className = "coin-autocomplete-item";
      option.id = `${listId}-option-${index}`;
      option.setAttribute("role", "option");
      option.dataset.active = "false";

      symbol.className = "coin-autocomplete-symbol";
      symbol.textContent = (entry.symbol || "-").toUpperCase();

      main.className = "coin-autocomplete-main";
      title.textContent = entry.name;
      subtitle.textContent = `Symbol: ${(entry.symbol || "-").toUpperCase()}`;
      main.append(title, subtitle);

      marketId.className = "coin-autocomplete-id";
      marketId.textContent = entry.id;

      option.append(symbol, main, marketId);

      option.addEventListener("pointerdown", (event) => {
        event.preventDefault();
      });

      option.addEventListener("mousemove", () => {
        updateActiveSuggestion(index);
      });

      option.addEventListener("click", () => {
        selectSuggestion(entry);
      });

      list.appendChild(option);
    });

    panel.hidden = false;
    setExpanded(true);
    updateActiveSuggestion(-1);
  }

  async function refreshSuggestions() {
    const cleanedQuery = normalizeCoinAutocompleteQuery(input.value);
    const requestId = ++state.requestId;

    if (!cleanedQuery) {
      close();
      return;
    }

    if (!coinGeckoCatalogState.entries.length && coinGeckoCatalogState.status !== "error") {
      renderStatus("Loading coin list...");
    }

    await ensureCoinGeckoCatalogLoaded();

    if (requestId !== state.requestId) {
      return;
    }

    const latestQuery = normalizeCoinAutocompleteQuery(input.value);

    if (!latestQuery || document.activeElement !== input) {
      close();
      return;
    }

    state.suggestions = getCoinAutocompleteSuggestions(latestQuery);

    if (!state.suggestions.length) {
      renderStatus("No coin matches found. You can still type it manually.");
      return;
    }

    renderSuggestions();
  }

  input.addEventListener("input", () => {
    setSelectedCoinMarketId(input, "");
    refreshSuggestions();
  });

  input.addEventListener("focus", () => {
    if (normalizeCoinAutocompleteQuery(input.value)) {
      refreshSuggestions();
    }
  });

  input.addEventListener("keydown", async (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();

      if (panel.hidden) {
        await refreshSuggestions();
      }

      if (state.suggestions.length) {
        updateActiveSuggestion(state.activeIndex + 1);
      }

      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();

      if (panel.hidden) {
        await refreshSuggestions();
      }

      if (!state.suggestions.length) {
        return;
      }

      if (state.activeIndex === -1) {
        updateActiveSuggestion(state.suggestions.length - 1);
        return;
      }

      updateActiveSuggestion(state.activeIndex - 1);
      return;
    }

    if (event.key === "Enter" && !panel.hidden && state.activeIndex >= 0) {
      event.preventDefault();
      selectSuggestion(state.suggestions[state.activeIndex]);
      return;
    }

    if (event.key === "Escape" && !panel.hidden) {
      event.preventDefault();
      close();
    }
  });

  input.addEventListener("blur", () => {
    window.setTimeout(() => {
      if (document.activeElement === input || panel.contains(document.activeElement)) {
        return;
      }

      close();
    }, 120);
  });

  return {
    close
  };
}

function closeCoinAutocompletePanels() {
  coinAutocompleteControllers.forEach((controller) => {
    controller?.close();
  });
}

function formatNumber(value) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return "-";
  }

  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 8
  }).format(numericValue);
}

function formatCurrency(value, useCompactNotation = false, currencyCode = getPortfolioCurrency()) {
  const numericValue = Number(value);
  const normalizedCurrencyCode = normalizeCurrencyCode(currencyCode) || "usd";

  if (!Number.isFinite(numericValue)) {
    return "-";
  }

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: normalizedCurrencyCode.toUpperCase(),
      notation: useCompactNotation ? "compact" : "standard",
      minimumFractionDigits: useCompactNotation ? 0 : 2,
      maximumFractionDigits: 2
    }).format(numericValue);
  } catch (error) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: useCompactNotation ? "compact" : "standard",
      minimumFractionDigits: useCompactNotation ? 0 : 2,
      maximumFractionDigits: 2
    }).format(numericValue);
  }
}

function formatPrice(value, currencyCode = getPortfolioCurrency()) {
  const numericValue = Number(value);
  const normalizedCurrencyCode = normalizeCurrencyCode(currencyCode) || "usd";

  if (!Number.isFinite(numericValue)) {
    return "-";
  }

  let maximumFractionDigits = 2;

  if (Math.abs(numericValue) < 1) {
    maximumFractionDigits = 4;
  }

  if (Math.abs(numericValue) < 0.01) {
    maximumFractionDigits = 6;
  }

  if (Math.abs(numericValue) < 0.0001) {
    maximumFractionDigits = 8;
  }

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: normalizedCurrencyCode.toUpperCase(),
      minimumFractionDigits: 2,
      maximumFractionDigits
    }).format(numericValue);
  } catch (error) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits
    }).format(numericValue);
  }
}

function formatRiskDisplay(value) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return "-";
  }

  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numericValue);
}

function formatRiskInputValue(value) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return "";
  }

  return numericValue.toFixed(2);
}

function formatPercentage(value) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return "-";
  }

  return new Intl.NumberFormat("en-US", {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  }).format(numericValue);
}

function formatReadableList(items) {
  const cleanedItems = (Array.isArray(items) ? items : []).filter(
    (item) => typeof item === "string" && item.trim()
  );

  if (!cleanedItems.length) {
    return "";
  }

  if (typeof Intl.ListFormat === "function") {
    return new Intl.ListFormat("en-US", { style: "long", type: "conjunction" }).format(cleanedItems);
  }

  if (cleanedItems.length === 1) {
    return cleanedItems[0];
  }

  if (cleanedItems.length === 2) {
    return `${cleanedItems[0]} and ${cleanedItems[1]}`;
  }

  return `${cleanedItems.slice(0, -1).join(", ")}, and ${cleanedItems[cleanedItems.length - 1]}`;
}

function formatDate(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(`${value}T00:00:00`);
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(date);
}

function getDaysSinceDate(value) {
  if (!value) {
    return null;
  }

  const startDate = new Date(`${value}T00:00:00`);

  if (Number.isNaN(startDate.getTime())) {
    return null;
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const millisecondsPerDay = 24 * 60 * 60 * 1000;

  return Math.max(0, Math.floor((today - startDate) / millisecondsPerDay));
}

function formatDateTime(value) {
  const timestamp = Number(value);

  if (!Number.isFinite(timestamp) || timestamp <= 0) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(timestamp));
}

function formatDateForInput(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return "";
  }

  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offsetMs).toISOString().split("T")[0];
}

function getTimestampMsFromValue(value) {
  if (value === null || value === undefined || value === "") {
    return 0;
  }

  const cleanedValue = String(value).trim();

  if (!cleanedValue) {
    return 0;
  }

  if (typeof value === "number" || /^\d+$/.test(cleanedValue)) {
    const timestamp = Number(cleanedValue) * (cleanedValue.length <= 10 ? 1000 : 1);
    return Number.isFinite(timestamp) && timestamp > 0 ? timestamp : 0;
  }

  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) && timestamp > 0 ? timestamp : 0;
}

function getInputDateFromTimestampValue(value) {
  const timestamp = getTimestampMsFromValue(value);
  return timestamp ? formatDateForInput(new Date(timestamp)) : "";
}

function parseIntegerStringToBigInt(value) {
  try {
    if (typeof value === "bigint") {
      return value;
    }

    const cleanedValue = typeof value === "string" ? value.trim() : `${value ?? 0}`;
    return BigInt(cleanedValue || "0");
  } catch (error) {
    return 0n;
  }
}

function formatUnitsFromIntegerString(value, decimals = 0) {
  const normalizedDecimals = Math.max(0, Number(decimals) || 0);
  const rawValue = parseIntegerStringToBigInt(value);

  if (normalizedDecimals === 0) {
    return rawValue.toString();
  }

  const divisor = 10n ** BigInt(normalizedDecimals);
  const whole = rawValue / divisor;
  const fractional = (rawValue % divisor)
    .toString()
    .padStart(normalizedDecimals, "0")
    .replace(/0+$/g, "");

  return fractional ? `${whole}.${fractional}` : whole.toString();
}

function roundDecimalString(value, fractionDigits = 8) {
  const normalizedFractionDigits = Math.max(0, Number(fractionDigits) || 0);
  const rawValue = typeof value === "string" ? value.trim() : `${value ?? ""}`.trim();

  if (!rawValue) {
    return "";
  }

  const isNegative = rawValue.startsWith("-");
  const absoluteValue = isNegative ? rawValue.slice(1) : rawValue;
  const [wholePartRaw = "0", fractionalPartRaw = ""] = absoluteValue.split(".");
  const wholePart = wholePartRaw || "0";

  if (!/^\d+$/.test(wholePart) || (fractionalPartRaw && !/^\d+$/.test(fractionalPartRaw))) {
    const numericValue = Number(rawValue);
    return Number.isFinite(numericValue) ? numericValue.toFixed(normalizedFractionDigits) : rawValue;
  }

  const scale = 10n ** BigInt(normalizedFractionDigits);
  let roundedScaledValue =
    parseIntegerStringToBigInt(wholePart) * scale +
    parseIntegerStringToBigInt((fractionalPartRaw.slice(0, normalizedFractionDigits) || "").padEnd(normalizedFractionDigits, "0"));

  if (
    normalizedFractionDigits < fractionalPartRaw.length &&
    Number(fractionalPartRaw.charAt(normalizedFractionDigits)) >= 5
  ) {
    roundedScaledValue += 1n;
  }

  const roundedWhole = roundedScaledValue / scale;
  const roundedFraction =
    normalizedFractionDigits > 0
      ? `.${(roundedScaledValue % scale).toString().padStart(normalizedFractionDigits, "0")}`
      : "";

  return `${isNegative ? "-" : ""}${roundedWhole}${roundedFraction}`;
}

function formatTxidPrefillDecimal(value) {
  return roundDecimalString(value, 8);
}

function normalizeTxidNetworkKey(value) {
  return typeof value === "string"
    ? value
        .trim()
        .toLowerCase()
        .replace(/[_-]+/g, " ")
        .replace(/\s+/g, " ")
    : "";
}

function getTxidNetworkConfig(rawNetwork) {
  const normalizedNetwork = normalizeTxidNetworkKey(rawNetwork);
  const slugNetwork = slugifyCoin(rawNetwork || "");

  if (!normalizedNetwork && !slugNetwork) {
    return null;
  }

  return txidLiveFetchNetworkConfigs.find((networkConfig) => {
    const aliases = [networkConfig.key, networkConfig.label, ...(networkConfig.aliases || [])];

    return aliases.some((alias) => (
      normalizeTxidNetworkKey(alias) === normalizedNetwork || slugifyCoin(alias) === slugNetwork
    ));
  }) || null;
}

function normalizeTxidHashForNetwork(transactionHash, networkConfig) {
  const trimmedHash = typeof transactionHash === "string" ? transactionHash.trim() : "";

  if (!trimmedHash) {
    return "";
  }

  if (networkConfig?.type === "evm") {
    const normalizedHash = /^0x/i.test(trimmedHash) ? trimmedHash : `0x${trimmedHash}`;

    if (!/^0x[a-fA-F0-9]{64}$/.test(normalizedHash)) {
      const error = new Error(
        `${networkConfig.label} transaction hashes must be 64 hex characters${/^0x/i.test(trimmedHash) ? "" : " (the app can add the 0x prefix for you)"}.`
      );
      error.code = "invalid-hash";
      throw error;
    }

    return normalizedHash;
  }

  const normalizedHash = trimmedHash.replace(/^0x/i, "");

  if (networkConfig?.type === "bitcoin" && !/^[a-fA-F0-9]{64}$/.test(normalizedHash)) {
    const error = new Error("Bitcoin transaction hashes must be 64 hex characters.");
    error.code = "invalid-hash";
    throw error;
  }

  if (networkConfig?.type === "solana" && !/^[1-9A-HJ-NP-Za-km-z]{32,100}$/.test(trimmedHash)) {
    const error = new Error("Solana transaction signatures must be valid base58 strings.");
    error.code = "invalid-hash";
    throw error;
  }

  if (networkConfig?.type === "solana") {
    return trimmedHash;
  }

  return normalizedHash.toLowerCase();
}

function createTxidFetchError(message, code = "txid-fetch") {
  const error = new Error(message);
  error.code = code;
  return error;
}

async function fetchCoinGeckoCoinDetail(marketId) {
  const normalizedMarketId = typeof marketId === "string" ? marketId.trim().toLowerCase() : "";

  if (!normalizedMarketId) {
    return null;
  }

  if (coinGeckoCoinDetailCache.has(normalizedMarketId)) {
    return coinGeckoCoinDetailCache.get(normalizedMarketId);
  }

  if (coinGeckoCoinDetailRequests.has(normalizedMarketId)) {
    return coinGeckoCoinDetailRequests.get(normalizedMarketId);
  }

  const request = fetch(
    `${coinGeckoCoinDetailsApiUrl}/${encodeURIComponent(normalizedMarketId)}?localization=false&tickers=false&market_data=false&community_data=false&developer_data=false&sparkline=false`
  )
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Coin detail lookup failed with status ${response.status}.`);
      }

      return response.json();
    })
    .then((coinDetail) => {
      coinGeckoCoinDetailCache.set(normalizedMarketId, coinDetail);
      return coinDetail;
    })
    .finally(() => {
      coinGeckoCoinDetailRequests.delete(normalizedMarketId);
    });

  coinGeckoCoinDetailRequests.set(normalizedMarketId, request);
  return request;
}

function getCoinGeckoErrorDetails(payload) {
  const nestedStatus = payload?.error?.status || payload?.status || null;
  const rawMessage =
    nestedStatus?.error_message ||
    (typeof payload?.error === "string" ? payload.error : "") ||
    (typeof payload?.message === "string" ? payload.message : "");
  const message = typeof rawMessage === "string" ? rawMessage.trim() : "";
  const code = Number(nestedStatus?.error_code);

  return {
    code: Number.isFinite(code) ? code : 0,
    message
  };
}

function getCoinGeckoHistoricalPriceRange(timestampMs) {
  const date = new Date(timestampMs);
  const dayStartMs = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());

  return {
    fromSeconds: Math.floor(dayStartMs / 1000),
    toSeconds: Math.floor((dayStartMs + coinGeckoHistoricalPriceDayMs - 1) / 1000)
  };
}

function getClosestHistoricalPriceSample(prices, timestampMs) {
  let closestSample = null;

  (Array.isArray(prices) ? prices : []).forEach((entry) => {
    const sampleTimestamp = Number(entry?.[0]);
    const samplePrice = Number(entry?.[1]);

    if (!Number.isFinite(sampleTimestamp) || sampleTimestamp <= 0 || !Number.isFinite(samplePrice)) {
      return;
    }

    const distance = Math.abs(sampleTimestamp - timestampMs);

    if (
      !closestSample ||
      distance < closestSample.distance ||
      (distance === closestSample.distance && sampleTimestamp > closestSample.timestamp)
    ) {
      closestSample = {
        timestamp: sampleTimestamp,
        price: samplePrice,
        distance
      };
    }
  });

  return closestSample;
}

function buildHistoricalPriceUnavailableResult(note, code = "historical-price-unavailable") {
  return {
    price: "",
    matchedAt: 0,
    status: "manual",
    code,
    note
  };
}

async function fetchCoinGeckoHistoricalPrice(marketId, timestampValue, currencyCode = getPortfolioCurrency()) {
  const normalizedMarketId = typeof marketId === "string" ? marketId.trim().toLowerCase() : "";
  const normalizedCurrencyCode = normalizeCurrencyCode(currencyCode) || "usd";
  const transactionTimestampMs = getTimestampMsFromValue(timestampValue);

  if (!normalizedMarketId) {
    return buildHistoricalPriceUnavailableResult(
      "Historical price needs review because this coin does not have a CoinGecko market ID yet.",
      "missing-market-id"
    );
  }

  if (!transactionTimestampMs) {
    return buildHistoricalPriceUnavailableResult(
      "Historical price needs review because this transaction does not have a confirmed on-chain timestamp yet.",
      "missing-timestamp"
    );
  }

  const { fromSeconds, toSeconds } = getCoinGeckoHistoricalPriceRange(transactionTimestampMs);
  const cacheKey = `${normalizedMarketId}:${normalizedCurrencyCode}:${fromSeconds}`;

  if (coinGeckoHistoricalPriceCache.has(cacheKey)) {
    return coinGeckoHistoricalPriceCache.get(cacheKey);
  }

  if (coinGeckoHistoricalPriceRequests.has(cacheKey)) {
    return coinGeckoHistoricalPriceRequests.get(cacheKey);
  }

  const requestUrl = new URL(
    `${coinGeckoCoinDetailsApiUrl}/${encodeURIComponent(normalizedMarketId)}/market_chart/range`
  );

  requestUrl.searchParams.set("vs_currency", normalizedCurrencyCode);
  requestUrl.searchParams.set("from", `${fromSeconds}`);
  requestUrl.searchParams.set("to", `${toSeconds}`);
  requestUrl.searchParams.set("precision", "full");

  const request = fetch(requestUrl)
    .then(async (response) => {
      let payload = null;

      try {
        payload = await response.json();
      } catch (error) {
        payload = null;
      }

      const coinGeckoError = getCoinGeckoErrorDetails(payload);
      const isTooOld = coinGeckoError.code === 10012 || /365 days/i.test(coinGeckoError.message);
      const isRateLimited =
        response.status === 429 ||
        coinGeckoError.code === 429 ||
        /rate limit/i.test(coinGeckoError.message);

      if (!response.ok || coinGeckoError.message) {
        if (isTooOld) {
          return buildHistoricalPriceUnavailableResult(
            "Historical price needs review because CoinGecko public history only reaches back about 365 days.",
            "history-window"
          );
        }

        if (isRateLimited) {
          return buildHistoricalPriceUnavailableResult(
            "Historical price needs review because CoinGecko rate-limited the lookup just now.",
            "rate-limit"
          );
        }

        return buildHistoricalPriceUnavailableResult(
          coinGeckoError.message
            ? `Historical price needs review because CoinGecko could not return pricing for this timestamp: ${coinGeckoError.message}`
            : "Historical price needs review because CoinGecko could not return pricing for this timestamp."
        );
      }

      const closestSample = getClosestHistoricalPriceSample(payload?.prices, transactionTimestampMs);

      if (!closestSample) {
        return buildHistoricalPriceUnavailableResult(
          "Historical price needs review because CoinGecko did not return a price sample for that transaction day.",
          "no-sample"
        );
      }

      return {
        price: formatTxidPrefillDecimal(closestSample.price),
        matchedAt: closestSample.timestamp,
        status: "ready",
        code: "ready",
        note: `Historical ${normalizedCurrencyCode.toUpperCase()} price was prefilled from CoinGecko's closest sample at ${formatDateTime(closestSample.timestamp)}.`
      };
    })
    .catch((error) => buildHistoricalPriceUnavailableResult(
      error?.message
        ? `Historical price needs review because the CoinGecko lookup failed: ${error.message}`
        : "Historical price needs review because the CoinGecko lookup failed."
    ))
    .then((result) => {
      coinGeckoHistoricalPriceCache.set(cacheKey, result);
      return result;
    })
    .finally(() => {
      coinGeckoHistoricalPriceRequests.delete(cacheKey);
    });

  coinGeckoHistoricalPriceRequests.set(cacheKey, request);
  return request;
}

function buildTxidLookupMessage(networkLabel, hasHistoricalPrice, hasQuantity, currencyCode = getPortfolioCurrency()) {
  const normalizedCurrencyCode = normalizeCurrencyCode(currencyCode) || "usd";
  const prefilledFields = ["date"];

  if (hasHistoricalPrice) {
    prefilledFields.push(`historical ${normalizedCurrencyCode.toUpperCase()} price`);
  }

  if (hasQuantity) {
    prefilledFields.push("quantity");
  }

  prefilledFields.push("fee");
  return `Fetched ${networkLabel} data live and prefilled the ${formatReadableList(prefilledFields)}.`;
}

function buildTxidReviewMessage(networkLabel, quantityNote, historicalPriceNote, statusNote = "") {
  return [
    `${networkLabel} data fetched live.`,
    quantityNote,
    historicalPriceNote,
    statusNote,
    "Please confirm type before adding."
  ]
    .filter(Boolean)
    .join(" ");
}

async function fetchTxidJson(url, notFoundMessage, fallbackMessage) {
  const response = await fetch(url);

  if (!response.ok) {
    if (response.status === 404) {
      throw createTxidFetchError(notFoundMessage, "not-found");
    }

    throw createTxidFetchError(`${fallbackMessage} (${response.status}).`);
  }

  return response.json();
}

function getTxidCoinMatchMetadata(coinData) {
  return {
    name: normalizeCatalogNameKey(coinData.coin || ""),
    symbol: normalizeCatalogSymbolKey(getCoinDisplaySymbol(coinData.coin || "", coinData.marketId || "")),
    marketId: slugifyCoin(coinData.marketId || ""),
    coinSlug: slugifyCoin(coinData.coin || "")
  };
}

function getSolanaMintAddressFromCoinDetail(coinData, coinDetail) {
  if (slugifyCoin(coinData?.marketId || "") === "solana") {
    return "So11111111111111111111111111111111111111112";
  }

  const detailPlatformAddress =
    coinDetail?.detail_platforms?.solana?.contract_address ||
    coinDetail?.platforms?.solana ||
    coinDetail?.contract_address;

  return typeof detailPlatformAddress === "string" ? detailPlatformAddress.trim() : "";
}

function isNativeCoinForTxidNetwork(coinData, networkConfig) {
  const coinMatchMetadata = getTxidCoinMatchMetadata(coinData);

  return (
    networkConfig.nativeSymbols.includes(coinMatchMetadata.symbol) ||
    networkConfig.nativeNames.includes(coinMatchMetadata.name) ||
    networkConfig.nativeMarketIds.includes(coinMatchMetadata.marketId) ||
    networkConfig.nativeMarketIds.includes(coinMatchMetadata.coinSlug)
  );
}

function getTxidBigIntAbsolute(value) {
  return value < 0n ? -value : value;
}

function getSolanaAccountPubkey(account) {
  if (typeof account === "string") {
    return account;
  }

  return account?.pubkey || "";
}

function getSolanaPrimarySigner(transactionDetails) {
  const accountKeys = Array.isArray(transactionDetails?.transaction?.message?.accountKeys)
    ? transactionDetails.transaction.message.accountKeys
    : [];
  const primarySignerIndex = accountKeys.findIndex((account) => account?.signer);
  const fallbackIndex = primarySignerIndex >= 0 ? primarySignerIndex : 0;
  const account = accountKeys[fallbackIndex];

  return {
    pubkey: getSolanaAccountPubkey(account),
    index: fallbackIndex
  };
}

function getSolanaTokenBalanceChangeEntries(transactionDetails, mintAddress) {
  const normalizedMintAddress = typeof mintAddress === "string" ? mintAddress.trim() : "";
  const balanceEntries = new Map();

  if (!normalizedMintAddress) {
    return [];
  }

  const assignBalanceSide = (entries, sideKey) => {
    (Array.isArray(entries) ? entries : []).forEach((entry, index) => {
      if ((entry?.mint || "").trim() !== normalizedMintAddress) {
        return;
      }

      const accountIndexKey =
        typeof entry.accountIndex === "number"
          ? `${entry.accountIndex}`
          : `${entry.owner || "unknown-owner"}:${index}`;
      const existingEntry = balanceEntries.get(accountIndexKey) || {
        owner: entry?.owner || "",
        mint: normalizedMintAddress,
        decimals: Number(entry?.uiTokenAmount?.decimals ?? 0) || 0,
        preAmount: 0n,
        postAmount: 0n
      };

      existingEntry.owner = existingEntry.owner || entry?.owner || "";
      existingEntry.decimals = Number(entry?.uiTokenAmount?.decimals ?? existingEntry.decimals ?? 0) || 0;
      existingEntry[sideKey] = parseIntegerStringToBigInt(entry?.uiTokenAmount?.amount || 0);
      balanceEntries.set(accountIndexKey, existingEntry);
    });
  };

  assignBalanceSide(transactionDetails?.meta?.preTokenBalances, "preAmount");
  assignBalanceSide(transactionDetails?.meta?.postTokenBalances, "postAmount");

  return [...balanceEntries.values()]
    .map((entry) => ({
      ...entry,
      change: entry.postAmount - entry.preAmount
    }))
    .filter((entry) => entry.change !== 0n);
}

function inferSolanaTokenQuantity(transactionDetails, mintAddress) {
  const primarySigner = getSolanaPrimarySigner(transactionDetails);
  const tokenChanges = getSolanaTokenBalanceChangeEntries(transactionDetails, mintAddress);

  if (!tokenChanges.length) {
    return null;
  }

  const ownerMatches = primarySigner.pubkey
    ? tokenChanges.filter((entry) => entry.owner === primarySigner.pubkey)
    : [];
  const rankedChanges = (ownerMatches.length ? ownerMatches : tokenChanges)
    .slice()
    .sort((left, right) => {
      const leftAbs = getTxidBigIntAbsolute(left.change);
      const rightAbs = getTxidBigIntAbsolute(right.change);

      if (leftAbs === rightAbs) {
        return 0;
      }

      return leftAbs > rightAbs ? -1 : 1;
    });
  const selectedChange = rankedChanges[0];

  if (!selectedChange) {
    return null;
  }

  return {
    quantity: formatUnitsFromIntegerString(getTxidBigIntAbsolute(selectedChange.change), selectedChange.decimals),
    note:
      ownerMatches.length > 0
        ? "Quantity was prefilled from the selected coin's Solana token balance change for the primary signer."
        : "Quantity was prefilled from the selected coin's Solana token balance change.",
    usedOwnerMatch: ownerMatches.length > 0
  };
}

function inferSolanaNativeQuantity(transactionDetails) {
  const wrappedSolQuantity = inferSolanaTokenQuantity(
    transactionDetails,
    "So11111111111111111111111111111111111111112"
  );

  if (wrappedSolQuantity) {
    return {
      quantity: wrappedSolQuantity.quantity,
      note: "Quantity was prefilled from wrapped SOL movement in the transaction."
    };
  }

  const primarySigner = getSolanaPrimarySigner(transactionDetails);
  const preBalances = Array.isArray(transactionDetails?.meta?.preBalances) ? transactionDetails.meta.preBalances : [];
  const postBalances = Array.isArray(transactionDetails?.meta?.postBalances) ? transactionDetails.meta.postBalances : [];
  const signerIndex = primarySigner.index;

  if (signerIndex < 0 || signerIndex >= preBalances.length || signerIndex >= postBalances.length) {
    return {
      quantity: "",
      note: "Quantity needs review because a primary signer balance change could not be determined on Solana."
    };
  }

  const fee = BigInt(Number(transactionDetails?.meta?.fee) || 0);
  const preBalance = BigInt(Number(preBalances[signerIndex]) || 0);
  const postBalance = BigInt(Number(postBalances[signerIndex]) || 0);
  const delta = postBalance - preBalance;
  let movement = 0n;

  if (delta < 0n) {
    movement = getTxidBigIntAbsolute(delta) > fee ? getTxidBigIntAbsolute(delta) - fee : 0n;
  } else if (delta > 0n) {
    movement = delta + fee;
  }

  if (movement <= 0n) {
    return {
      quantity: "",
      note: "Quantity needs review because this Solana transaction does not show a clear SOL movement for the primary signer."
    };
  }

  return {
    quantity: formatUnitsFromIntegerString(movement, 9),
    note: "Quantity was estimated from the primary signer's SOL balance change."
  };
}

function getBestMatchingTokenTransfer(coinData, tokenTransfers) {
  const coinMatchMetadata = getTxidCoinMatchMetadata(coinData);
  const rankedMatches = (Array.isArray(tokenTransfers) ? tokenTransfers : [])
    .map((tokenTransfer) => {
      const tokenName = normalizeCatalogNameKey(tokenTransfer?.token?.name || "");
      const tokenSymbol = normalizeCatalogSymbolKey(tokenTransfer?.token?.symbol || "");
      const tokenSlug = slugifyCoin(tokenTransfer?.token?.name || "");
      let score = 0;

      if (coinMatchMetadata.name && tokenName === coinMatchMetadata.name) {
        score = 100;
      } else if (coinMatchMetadata.marketId && tokenSlug === coinMatchMetadata.marketId) {
        score = 96;
      } else if (coinMatchMetadata.coinSlug && tokenSlug === coinMatchMetadata.coinSlug) {
        score = 94;
      } else if (coinMatchMetadata.symbol && tokenSymbol === coinMatchMetadata.symbol) {
        score = 90;
      } else if (coinMatchMetadata.name && tokenName.includes(coinMatchMetadata.name)) {
        score = 70;
      } else if (coinMatchMetadata.symbol && tokenSymbol.includes(coinMatchMetadata.symbol)) {
        score = 60;
      }

      return {
        tokenTransfer,
        score,
        rawAmount: parseIntegerStringToBigInt(tokenTransfer?.total?.value || 0)
      };
    })
    .filter((match) => match.score > 0)
    .sort((left, right) => (
      right.score - left.score ||
      (left.rawAmount === right.rawAmount ? 0 : left.rawAmount > right.rawAmount ? -1 : 1)
    ));

  if (!rankedMatches.length) {
    return null;
  }

  return {
    match: rankedMatches[0].tokenTransfer,
    multipleMatches: rankedMatches.length > 1
  };
}

async function fetchSolanaRpcJson(networkConfig, method, params, fallbackMessage) {
  const response = await fetch(networkConfig.apiBaseUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method,
      params
    })
  });

  if (!response.ok) {
    throw createTxidFetchError(`${fallbackMessage} (${response.status}).`);
  }

  const payload = await response.json();

  if (payload?.error) {
    throw createTxidFetchError(payload.error.message || fallbackMessage);
  }

  return payload?.result ?? null;
}

function inferBitcoinTransferQuantity(transactionDetails) {
  const outputs = Array.isArray(transactionDetails?.vout)
    ? transactionDetails.vout.filter((output) => Number(output?.value) > 0)
    : [];

  if (!outputs.length) {
    return {
      quantity: "",
      note: "Quantity needs review because this Bitcoin transaction has no spendable outputs."
    };
  }

  if (outputs.length === 1) {
    return {
      quantity: formatUnitsFromIntegerString(outputs[0].value, 8),
      note: "Quantity was estimated from the single Bitcoin output."
    };
  }

  const inputAddresses = new Set(
    (Array.isArray(transactionDetails?.vin) ? transactionDetails.vin : [])
      .map((input) => input?.prevout?.scriptpubkey_address?.toLowerCase())
      .filter(Boolean)
  );
  const nonChangeOutputs = outputs.filter((output) => {
    const outputAddress = output?.scriptpubkey_address?.toLowerCase();
    return outputAddress && !inputAddresses.has(outputAddress);
  });

  if (nonChangeOutputs.length === 1) {
    return {
      quantity: formatUnitsFromIntegerString(nonChangeOutputs[0].value, 8),
      note: "Quantity was estimated from the non-change Bitcoin output."
    };
  }

  return {
    quantity: "",
    note: "Quantity needs review because this Bitcoin transaction has multiple possible outputs."
  };
}

async function fetchBitcoinTxidPrefill(networkConfig, transactionHash, coinData) {
  const transactionDetails = await fetchTxidJson(
    `${networkConfig.apiBaseUrl}/tx/${transactionHash}`,
    `That transaction hash was not found on ${networkConfig.label}.`,
    `Could not load ${networkConfig.label} transaction data`
  );
  const isConfirmed = Boolean(transactionDetails?.status?.confirmed);
  const transactionTimestampMs = getTimestampMsFromValue(transactionDetails?.status?.block_time);
  const quantityEstimate = isNativeCoinForTxidNetwork(coinData, networkConfig)
    ? inferBitcoinTransferQuantity(transactionDetails)
    : {
        quantity: "",
        note: `Quantity needs review because ${coinData.coin || "this coin"} is not the native asset on ${networkConfig.label}.`
      };
  const historicalPrice = await fetchCoinGeckoHistoricalPrice(
    coinData.marketId,
    transactionTimestampMs,
    getPortfolioCurrency()
  );
  const statusNote = isConfirmed
    ? ""
    : "Bitcoin has not confirmed this transaction yet, so the date and price may still need manual review.";

  return {
    transactionDate: isConfirmed
      ? getInputDateFromTimestampValue(transactionDetails?.status?.block_time)
      : getTodayForInput(),
    coinPrice: historicalPrice.price,
    quantity: formatTxidPrefillDecimal(quantityEstimate.quantity),
    commission: formatTxidPrefillDecimal(formatUnitsFromIntegerString(transactionDetails?.fee || 0, 8)),
    reviewBadge: "Live Fetch",
    reviewMessage: buildTxidReviewMessage(
      networkConfig.label,
      quantityEstimate.note,
      historicalPrice.note,
      statusNote
    ),
    lookupMessage: buildTxidLookupMessage(
      networkConfig.label,
      Boolean(historicalPrice.price),
      Boolean(quantityEstimate.quantity)
    ),
    normalizedHash: transactionHash,
    networkLabel: networkConfig.label
  };
}

async function fetchEvmTxidPrefill(networkConfig, transactionHash, coinData) {
  const transactionDetails = await fetchTxidJson(
    `${networkConfig.apiBaseUrl}/api/v2/transactions/${transactionHash}`,
    `That transaction hash was not found on ${networkConfig.label}.`,
    `Could not load ${networkConfig.label} transaction data`
  );
  let tokenTransfers = Array.isArray(transactionDetails?.token_transfers) ? transactionDetails.token_transfers : [];

  if (transactionDetails?.token_transfers_overflow) {
    const tokenTransferResponse = await fetchTxidJson(
      `${networkConfig.apiBaseUrl}/api/v2/transactions/${transactionHash}/token-transfers`,
      `That transaction hash was found on ${networkConfig.label}, but its token transfers could not be loaded.`,
      `Could not load ${networkConfig.label} token transfer details`
    );
    tokenTransfers = Array.isArray(tokenTransferResponse?.items) ? tokenTransferResponse.items : tokenTransfers;
  }

  const matchedTokenTransfer = getBestMatchingTokenTransfer(coinData, tokenTransfers);
  const isNativeCoin = isNativeCoinForTxidNetwork(coinData, networkConfig);
  let quantity = "";
  let quantityNote = "";

  if (matchedTokenTransfer?.match) {
    const tokenTransfer = matchedTokenTransfer.match;
    const tokenDecimals = Number(tokenTransfer?.total?.decimals ?? tokenTransfer?.token?.decimals ?? 18);
    quantity = formatUnitsFromIntegerString(tokenTransfer?.total?.value || 0, tokenDecimals);
    quantityNote = matchedTokenTransfer.multipleMatches
      ? `Quantity was prefilled from the strongest matching ${tokenTransfer.token?.symbol || "token"} transfer on ${networkConfig.label}.`
      : `Quantity was prefilled from the matching ${tokenTransfer.token?.symbol || "token"} transfer on ${networkConfig.label}.`;
  } else if (isNativeCoin && parseIntegerStringToBigInt(transactionDetails?.value || 0) > 0n) {
    quantity = formatUnitsFromIntegerString(transactionDetails?.value || 0, 18);
    quantityNote = `Quantity was prefilled from the native ${networkConfig.label} transfer value.`;
  } else {
    quantityNote = `Quantity needs review because ${coinData.coin || "this coin"} was not matched to a clear on-chain transfer in this ${networkConfig.label} transaction.`;
  }

  const isSuccessful = transactionDetails?.status === "ok" || transactionDetails?.result === "success";
  const transactionTimestampMs = getTimestampMsFromValue(transactionDetails?.timestamp);
  const transactionDate = getInputDateFromTimestampValue(transactionDetails?.timestamp) || getTodayForInput();
  const fee = formatUnitsFromIntegerString(transactionDetails?.fee?.value || 0, 18);
  const historicalPrice = await fetchCoinGeckoHistoricalPrice(
    coinData.marketId,
    transactionTimestampMs,
    getPortfolioCurrency()
  );
  const statusNote = isSuccessful
    ? ""
    : "Explorer data marks this transaction as failed or reverted, so please review it carefully.";

  return {
    transactionDate,
    coinPrice: historicalPrice.price,
    quantity: formatTxidPrefillDecimal(quantity),
    commission: formatTxidPrefillDecimal(fee),
    reviewBadge: "Live Fetch",
    reviewMessage: buildTxidReviewMessage(
      networkConfig.label,
      quantityNote,
      historicalPrice.note,
      statusNote
    ),
    lookupMessage: buildTxidLookupMessage(
      networkConfig.label,
      Boolean(historicalPrice.price),
      Boolean(quantity)
    ),
    normalizedHash: transactionHash,
    networkLabel: networkConfig.label
  };
}

async function fetchSolanaTxidPrefill(networkConfig, transactionHash, coinData) {
  const transactionDetails = await fetchSolanaRpcJson(
    networkConfig,
    "getTransaction",
    [
      transactionHash,
      {
        encoding: "jsonParsed",
        commitment: "confirmed",
        maxSupportedTransactionVersion: 0
      }
    ],
    `Could not load ${networkConfig.label} transaction data`
  );

  if (!transactionDetails) {
    throw createTxidFetchError(`That transaction hash was not found on ${networkConfig.label}.`, "not-found");
  }

  const isNativeSolanaCoin = isNativeCoinForTxidNetwork(coinData, networkConfig);
  let quantityEstimate = null;

  if (isNativeSolanaCoin) {
    quantityEstimate = inferSolanaNativeQuantity(transactionDetails);
  } else {
    try {
      const coinDetail = await fetchCoinGeckoCoinDetail(coinData.marketId);
      const mintAddress = getSolanaMintAddressFromCoinDetail(coinData, coinDetail);

      if (mintAddress) {
        quantityEstimate = inferSolanaTokenQuantity(transactionDetails, mintAddress);
      }
    } catch (error) {
      quantityEstimate = null;
    }
  }

  if (!quantityEstimate) {
    quantityEstimate = {
      quantity: "",
      note: isNativeSolanaCoin
        ? "Quantity needs review because this Solana transaction does not show a clear SOL movement."
        : `Quantity needs review because ${coinData.coin || "this coin"} could not be matched to a Solana mint in the fetched transaction.`
    };
  }

  const hasError = transactionDetails?.meta?.err !== null && transactionDetails?.meta?.err !== undefined;
  const transactionTimestampMs = getTimestampMsFromValue(transactionDetails?.blockTime);
  const historicalPrice = await fetchCoinGeckoHistoricalPrice(
    coinData.marketId,
    transactionTimestampMs,
    getPortfolioCurrency()
  );
  const errorNote = hasError
    ? "Solana marks this transaction as failed, so please review it carefully."
    : "";

  return {
    transactionDate: getInputDateFromTimestampValue(transactionDetails?.blockTime) || getTodayForInput(),
    coinPrice: historicalPrice.price,
    quantity: formatTxidPrefillDecimal(quantityEstimate.quantity),
    commission: formatTxidPrefillDecimal(formatUnitsFromIntegerString(transactionDetails?.meta?.fee || 0, 9)),
    reviewBadge: "Live Fetch",
    reviewMessage: buildTxidReviewMessage(
      networkConfig.label,
      quantityEstimate.note,
      historicalPrice.note,
      errorNote
    ),
    lookupMessage: buildTxidLookupMessage(
      networkConfig.label,
      Boolean(historicalPrice.price),
      Boolean(quantityEstimate.quantity)
    ),
    normalizedHash: transactionHash,
    networkLabel: networkConfig.label
  };
}

async function fetchTxidLivePrefill(coinData, networkInput, transactionHash) {
  const networkConfig = getTxidNetworkConfig(networkInput);

  if (!networkConfig) {
    throw createTxidFetchError(
      `Live fetch currently supports ${txidLiveFetchSupportSummary}.`,
      "unsupported-network"
    );
  }

  const normalizedHash = normalizeTxidHashForNetwork(transactionHash, networkConfig);

  if (networkConfig.type === "bitcoin") {
    return fetchBitcoinTxidPrefill(networkConfig, normalizedHash, coinData);
  }

  if (networkConfig.type === "evm") {
    return fetchEvmTxidPrefill(networkConfig, normalizedHash, coinData);
  }

  if (networkConfig.type === "solana") {
    return fetchSolanaTxidPrefill(networkConfig, normalizedHash, coinData);
  }

  throw createTxidFetchError(`Live fetch is not configured yet for ${networkConfig.label}.`);
}

function formatRelativeTimeFromNow(value) {
  const timestamp = Number(value);

  if (!Number.isFinite(timestamp) || timestamp <= 0) {
    return "-";
  }

  const diffMs = timestamp - Date.now();
  const absoluteDiffMs = Math.abs(diffMs);

  if (absoluteDiffMs < 15000) {
    return "Just now";
  }

  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const units = [
    { unit: "day", milliseconds: 24 * 60 * 60 * 1000 },
    { unit: "hour", milliseconds: 60 * 60 * 1000 },
    { unit: "minute", milliseconds: 60 * 1000 }
  ];

  for (const entry of units) {
    if (absoluteDiffMs >= entry.milliseconds) {
      return formatter.format(Math.round(diffMs / entry.milliseconds), entry.unit);
    }
  }

  return formatter.format(Math.round(diffMs / 1000), "second");
}

function formatShortLabelList(items, maxItems = 3) {
  const uniqueItems = [...new Set(items.filter(Boolean))];

  if (!uniqueItems.length) {
    return "";
  }

  const visibleItems = uniqueItems.slice(0, maxItems);

  if (uniqueItems.length <= maxItems) {
    return visibleItems.join(", ");
  }

  return `${visibleItems.join(", ")} +${uniqueItems.length - maxItems} more`;
}

function compareTransactionsByDateDesc(left, right) {
  const dateCompare = new Date(right.transactionDate) - new Date(left.transactionDate);

  if (dateCompare !== 0) {
    return dateCompare;
  }

  return new Date(right.createdAt || 0) - new Date(left.createdAt || 0);
}

function compareTransactionsByDateAsc(left, right) {
  const dateCompare = new Date(left.transactionDate) - new Date(right.transactionDate);

  if (dateCompare !== 0) {
    return dateCompare;
  }

  return new Date(left.createdAt || 0) - new Date(right.createdAt || 0);
}

function updateRisk() {
  const price = Number(coinPriceInput.value);
  const quantity = Number(quantityInput.value);
  const risk = price * quantity;

  riskInput.value = Number.isFinite(risk) ? formatRiskInputValue(risk) : "";
}

function setTransactionType(type) {
  typeInputs.forEach((input) => {
    input.checked = input.value === type;
  });
}

function updateDateLabel() {
  const selectedType = form.elements.type.value;
  dateLabel.textContent = selectedType === "sell" ? "Exit Date" : "Entry Date";
}

function getSuggestedMarketId(coinValue, currentMarketId = "") {
  const cleanedCoinValue = normalizeCoinAutocompleteQuery(coinValue);
  const cleanedMarketId = typeof currentMarketId === "string" ? currentMarketId.trim() : "";

  if (!cleanedCoinValue) {
    return cleanedMarketId;
  }

  const catalogEntry = getCoinGeckoCatalogEntryFromValue(cleanedCoinValue, cleanedMarketId);

  if (catalogEntry?.id) {
    return catalogEntry.id;
  }

  const aliasEntry = getCoinGeckoCatalogAliasEntry(cleanedCoinValue);

  if (aliasEntry?.marketId || aliasEntry?.id) {
    return aliasEntry.marketId || aliasEntry.id;
  }

  return cleanedMarketId;
}

function updateMarketIdFromCoin(force = false) {
  const suggestedMarketId = getSuggestedMarketId(
    coinInput.value,
    getSelectedCoinMarketId(coinInput) || marketIdInput.value
  );

  if (!suggestedMarketId) {
    if (force || !marketIdWasEditedManually) {
      marketIdInput.value = "";
    }
    return;
  }

  if (force || !marketIdWasEditedManually || !marketIdInput.value.trim()) {
    marketIdInput.value = suggestedMarketId;
  }
}

function syncMarketIdManualState() {
  const currentMarketId = marketIdInput.value.trim();
  const suggestedMarketId = getSuggestedMarketId(
    coinInput.value,
    getSelectedCoinMarketId(coinInput) || currentMarketId
  );

  if (!currentMarketId) {
    marketIdWasEditedManually = false;
    updateMarketIdFromCoin();
    return;
  }

  marketIdWasEditedManually = currentMarketId !== suggestedMarketId;
}

function normalizeCoinField() {
  const canonicalCoinData = getCanonicalCoinData(coinInput.value, marketIdInput.value);

  if (!canonicalCoinData.coin) {
    coinInput.value = "";
    setSelectedCoinMarketId(coinInput, "");
    updateMarketIdFromCoin(true);
    return;
  }

  coinInput.value = canonicalCoinData.coin;
  setSelectedCoinMarketId(coinInput, canonicalCoinData.marketId);
  const suggestedMarketId = getSuggestedMarketId(canonicalCoinData.coin, canonicalCoinData.marketId);

  if (!suggestedMarketId && (!marketIdWasEditedManually || !marketIdInput.value.trim())) {
    marketIdInput.value = canonicalCoinData.marketId;
    return;
  }

  updateMarketIdFromCoin();
}

function normalizeTxidLookupCoinField() {
  const canonicalCoinData = getCanonicalCoinData(
    txidLookupCoinInput.value,
    getSelectedCoinMarketId(txidLookupCoinInput)
  );

  txidLookupCoinInput.value = canonicalCoinData.coin;
  setSelectedCoinMarketId(txidLookupCoinInput, canonicalCoinData.marketId);
}

function setTxidReviewType(type) {
  txidReviewTypeInputs.forEach((input) => {
    input.checked = input.value === type;
  });
}

function updateTxidDateLabel() {
  const selectedType = txidReviewForm.elements.txidType.value;
  txidDateLabel.textContent = selectedType === "sell" ? "Exit Date" : "Entry Date";
}

function updateTxidRisk() {
  const price = Number(txidCoinPriceInput.value);
  const quantity = Number(txidQuantityInput.value);
  const risk = price * quantity;

  txidRiskInput.value = Number.isFinite(risk) ? formatRiskInputValue(risk) : "";
}

function updateTxidMarketIdFromCoin(force = false) {
  const suggestedMarketId = getSuggestedMarketId(
    txidReviewCoinInput.value,
    getSelectedCoinMarketId(txidReviewCoinInput) || txidReviewMarketIdInput.value
  );

  if (!suggestedMarketId) {
    if (force || !txidMarketIdWasEditedManually) {
      txidReviewMarketIdInput.value = "";
    }
    return;
  }

  if (force || !txidMarketIdWasEditedManually || !txidReviewMarketIdInput.value.trim()) {
    txidReviewMarketIdInput.value = suggestedMarketId;
  }
}

function syncTxidMarketIdManualState() {
  const currentMarketId = txidReviewMarketIdInput.value.trim();
  const suggestedMarketId = getSuggestedMarketId(
    txidReviewCoinInput.value,
    getSelectedCoinMarketId(txidReviewCoinInput) || currentMarketId
  );

  if (!currentMarketId) {
    txidMarketIdWasEditedManually = false;
    updateTxidMarketIdFromCoin();
    return;
  }

  txidMarketIdWasEditedManually = currentMarketId !== suggestedMarketId;
}

function normalizeTxidReviewCoinField() {
  const canonicalCoinData = getCanonicalCoinData(txidReviewCoinInput.value, txidReviewMarketIdInput.value);

  if (!canonicalCoinData.coin) {
    txidReviewCoinInput.value = "";
    setSelectedCoinMarketId(txidReviewCoinInput, "");
    updateTxidMarketIdFromCoin(true);
    updateTxidReviewContext();
    return;
  }

  txidReviewCoinInput.value = canonicalCoinData.coin;
  setSelectedCoinMarketId(txidReviewCoinInput, canonicalCoinData.marketId);
  const suggestedMarketId = getSuggestedMarketId(canonicalCoinData.coin, canonicalCoinData.marketId);

  if (!suggestedMarketId && (!txidMarketIdWasEditedManually || !txidReviewMarketIdInput.value.trim())) {
    txidReviewMarketIdInput.value = canonicalCoinData.marketId;
    updateTxidReviewContext();
    return;
  }

  updateTxidMarketIdFromCoin();
  updateTxidReviewContext();
}

function getShortTransactionHash(value) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return "-";
  }

  if (trimmedValue.length <= 20) {
    return trimmedValue;
  }

  return `${trimmedValue.slice(0, 10)}...${trimmedValue.slice(-8)}`;
}

function updateTxidReviewContext() {
  txidReviewCoinChip.textContent = `Coin: ${txidReviewCoinInput.value.trim() || "-"}`;
  txidReviewNetworkChip.textContent = `Network: ${txidReviewNetworkInput.value.trim() || "-"}`;
  txidReviewHashChip.textContent = `Hash: ${getShortTransactionHash(txidReviewHashInput.value)}`;
}

function buildTxidSourceNote(noteValue, network, transactionHash) {
  const sourceLabel = `TXID import | ${network || "Unknown network"} | ${getShortTransactionHash(transactionHash)}`;
  return noteValue ? `${sourceLabel} | ${noteValue}` : sourceLabel;
}

function applyDefaultTxidReviewState() {
  closeCoinAutocompletePanels();
  setSelectedCoinMarketId(txidReviewCoinInput, "");
  txidMarketIdWasEditedManually = false;
  txidReviewForm.reset();
  setTxidReviewType("buy");
  txidTransactionDateInput.value = getTodayForInput();
  txidCommissionInput.value = "0";
  updateTxidDateLabel();
  updateTxidRisk();
  updateTxidMarketIdFromCoin(true);
  updateTxidReviewContext();
  txidReviewBadge.textContent = "Manual Review";
  txidReviewFeedback.textContent = "";
}

function hideTxidReview() {
  txidReviewCard.hidden = true;
  applyDefaultTxidReviewState();
}

function prepareTxidReview(liveFetchResult = null) {
  const canonicalCoinData = getCanonicalCoinData(
    txidLookupCoinInput.value,
    getSelectedCoinMarketId(txidLookupCoinInput)
  );

  txidReviewCoinInput.value = canonicalCoinData.coin;
  setSelectedCoinMarketId(txidReviewCoinInput, canonicalCoinData.marketId);
  txidReviewNetworkInput.value = txidLookupNetworkInput.value.trim();
  txidReviewHashInput.value = liveFetchResult?.normalizedHash || txidLookupHashInput.value.trim();
  txidReviewMarketIdInput.value = canonicalCoinData.marketId;
  txidTransactionDateInput.value = liveFetchResult?.transactionDate || getTodayForInput();
  txidCoinPriceInput.value = liveFetchResult?.coinPrice || "";
  txidQuantityInput.value = liveFetchResult?.quantity || "";
  txidRiskInput.value = "";
  txidCommissionInput.value = liveFetchResult?.commission || "0";
  txidNotesInput.value = "";
  txidMarketIdWasEditedManually = false;
  setTxidReviewType("buy");
  updateTxidDateLabel();
  updateTxidRisk();
  updateTxidMarketIdFromCoin(true);
  updateTxidReviewContext();
  txidReviewBadge.textContent = liveFetchResult?.reviewBadge || "Awaiting Approval";
  txidReviewFeedback.textContent = liveFetchResult?.reviewMessage || "";
  txidReviewCard.hidden = false;
}

function buildTxidTransactionRecord(formData) {
  const rawCoin = formData.get("coin").trim();
  const submittedMarketId = formData.get("marketId").trim();
  const canonicalCoinData = getCanonicalCoinData(rawCoin, submittedMarketId);
  const coinPrice = Number(formData.get("coinPrice"));
  const quantity = Number(formData.get("quantity"));
  const calculatedRisk = coinPrice * quantity;
  const network = formData.get("network").trim();
  const transactionHash = formData.get("transactionHash").trim();
  const marketId = canonicalCoinData.marketId || submittedMarketId || slugifyCoin(rawCoin);

  return {
    id: generateId(),
    coin: canonicalCoinData.coin,
    marketId,
    currency: getPortfolioCurrency(),
    type: formData.get("txidType"),
    transactionDate: formData.get("transactionDate"),
    coinPrice,
    quantity,
    risk: Number.isFinite(calculatedRisk) ? calculatedRisk : 0,
    commission: Number(formData.get("commission") || 0),
    notes: buildTxidSourceNote(formData.get("notes").trim(), network, transactionHash),
    network,
    transactionHash,
    source: "txid-review",
    createdAt: new Date().toISOString()
  };
}

function getDashboardConversionCurrencies(transactions) {
  const portfolioCurrency = getPortfolioCurrency();

  return [
    ...new Set(
      [portfolioCurrency, ...transactions.map((transaction) => normalizeCurrencyCode(transaction.currency) || portfolioCurrency)]
        .filter(Boolean)
    )
  ].sort();
}

function resetDashboardConversionState() {
  dashboardConversionState = {
    status: "idle",
    currencyKey: "",
    rates: {},
    fetchedAt: 0,
    error: ""
  };
}

function getDashboardConversionStatePortfolioCurrency() {
  return dashboardConversionState.currencyKey.split(":")[0] || "";
}

function getDashboardConversionRate(sourceCurrency, portfolioCurrency = getPortfolioCurrency()) {
  const normalizedSourceCurrency = normalizeCurrencyCode(sourceCurrency) || portfolioCurrency;

  if (normalizedSourceCurrency === portfolioCurrency) {
    return 1;
  }

  if (getDashboardConversionStatePortfolioCurrency() !== portfolioCurrency) {
    return null;
  }

  const conversionRate = Number(dashboardConversionState.rates[normalizedSourceCurrency]);

  return Number.isFinite(conversionRate) && conversionRate > 0 ? conversionRate : null;
}

function convertDashboardAmount(value, sourceCurrency, portfolioCurrency = getPortfolioCurrency()) {
  const numericValue = Number(value);
  const conversionRate = getDashboardConversionRate(sourceCurrency, portfolioCurrency);

  if (!Number.isFinite(numericValue) || !Number.isFinite(conversionRate)) {
    return null;
  }

  return numericValue * conversionRate;
}

function loadDashboardConversionRates(transactions, forceRefresh = false) {
  const portfolioCurrency = getPortfolioCurrency();
  const currencies = getDashboardConversionCurrencies(transactions);
  const currencyKey = `${portfolioCurrency}:${currencies.join(",")}`;
  const currenciesNeedingRates = currencies.filter((currencyCode) => currencyCode !== portfolioCurrency);
  const isFresh =
    dashboardConversionState.status === "ready" &&
    dashboardConversionState.currencyKey === currencyKey &&
    Date.now() - dashboardConversionState.fetchedAt < dashboardConversionRateRefreshMs;
  const hasRecentError =
    dashboardConversionState.status === "error" &&
    dashboardConversionState.currencyKey === currencyKey &&
    Date.now() - dashboardConversionState.fetchedAt < dashboardConversionRateRefreshMs;
  const hasActiveRequest =
    dashboardConversionState.status === "loading" &&
    dashboardConversionState.currencyKey === currencyKey;

  if (!currencies.length) {
    resetDashboardConversionState();
    return;
  }

  if (!currenciesNeedingRates.length) {
    dashboardConversionState = {
      status: "ready",
      currencyKey,
      rates: {
        [portfolioCurrency]: 1
      },
      fetchedAt: Date.now(),
      error: ""
    };
    return;
  }

  if ((!forceRefresh && (isFresh || hasRecentError || hasActiveRequest)) || (forceRefresh && hasActiveRequest)) {
    return;
  }

  const previousRates =
    dashboardConversionState.currencyKey === currencyKey
      ? dashboardConversionState.rates
      : {
          [portfolioCurrency]: 1
        };

  dashboardConversionState = {
    status: "loading",
    currencyKey,
    rates: previousRates,
    fetchedAt: dashboardConversionState.fetchedAt,
    error: ""
  };

  const requestId = ++dashboardConversionRequestId;
  const requestUrl = new URL(dashboardPriceApiUrl);

  requestUrl.searchParams.set("ids", "bitcoin");
  requestUrl.searchParams.set("vs_currencies", currencies.join(","));
  requestUrl.searchParams.set("precision", "full");

  fetch(requestUrl)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Currency conversion lookup failed with status ${response.status}.`);
      }

      return response.json();
    })
    .then((data) => {
      if (requestId !== dashboardConversionRequestId) {
        return;
      }

      const bitcoinPrices = data?.bitcoin;
      const portfolioReferencePrice = Number(bitcoinPrices?.[portfolioCurrency]);

      if (!Number.isFinite(portfolioReferencePrice) || portfolioReferencePrice <= 0) {
        throw new Error(`Conversion reference price unavailable for ${portfolioCurrency.toUpperCase()}.`);
      }

      const rates = {
        [portfolioCurrency]: 1
      };

      currenciesNeedingRates.forEach((currencyCode) => {
        const sourceReferencePrice = Number(bitcoinPrices?.[currencyCode]);

        if (Number.isFinite(sourceReferencePrice) && sourceReferencePrice > 0) {
          rates[currencyCode] = portfolioReferencePrice / sourceReferencePrice;
        }
      });

      const missingCurrencies = currenciesNeedingRates.filter(
        (currencyCode) => !Number.isFinite(rates[currencyCode]) || rates[currencyCode] <= 0
      );

      if (missingCurrencies.length) {
        throw new Error(`Conversion rates unavailable for ${missingCurrencies.join(", ").toUpperCase()}.`);
      }

      dashboardConversionState = {
        status: "ready",
        currencyKey,
        rates,
        fetchedAt: Date.now(),
        error: ""
      };
      renderDashboard();
    })
    .catch((error) => {
      if (requestId !== dashboardConversionRequestId) {
        return;
      }

      dashboardConversionState = {
        status: "error",
        currencyKey,
        rates: previousRates,
        fetchedAt: Date.now(),
        error: error.message
      };
      renderDashboard();
    });
}

function getDashboardMoneyPlaceholder() {
  return dashboardConversionState.status === "loading" ? "Loading..." : "Unavailable";
}

function getDashboardData(transactions) {
  const portfolioCurrency = getPortfolioCurrency();
  const positionsMap = new Map();
  let totalBuyValue = 0;
  let totalSellValue = 0;
  let totalFees = 0;
  let hasConversionGaps = false;
  const sortedTransactions = transactions.slice().sort(compareTransactionsByDateAsc);

  sortedTransactions.forEach((transaction) => {
    const quantity = Number(transaction.quantity) || 0;
    const transactionCurrency = normalizeCurrencyCode(transaction.currency) || portfolioCurrency;
    const convertedRisk = convertDashboardAmount(transaction.risk, transactionCurrency, portfolioCurrency);
    const convertedCommission = convertDashboardAmount(
      transaction.commission,
      transactionCurrency,
      portfolioCurrency
    );
    const hasConvertedMoney = Number.isFinite(convertedRisk) && Number.isFinite(convertedCommission);
    const positionKey = getTransactionCoinKey(transaction);
    const existingPosition = positionsMap.get(positionKey) || {
      coin: transaction.coin,
      marketId: transaction.marketId || "",
      buyQuantity: 0,
      sellQuantity: 0,
      buyValue: 0,
      sellValue: 0,
      totalFees: 0,
      tradeCount: 0,
      firstTradeDate: "",
      lastTradeDate: "",
      lastTradeType: "",
      totalBuyCost: 0,
      remainingQuantity: 0,
      remainingCostBasis: 0,
      realizedProfitLoss: 0,
      moneyDataComplete: true
    };

    existingPosition.tradeCount += 1;

    if (transaction.marketId) {
      existingPosition.marketId = transaction.marketId;
    }

    if (transaction.coin) {
      existingPosition.coin = transaction.coin;
    }

    if (!existingPosition.firstTradeDate || transaction.transactionDate < existingPosition.firstTradeDate) {
      existingPosition.firstTradeDate = transaction.transactionDate;
    }

    if (!existingPosition.lastTradeDate || transaction.transactionDate > existingPosition.lastTradeDate) {
      existingPosition.lastTradeDate = transaction.transactionDate;
      existingPosition.lastTradeType = transaction.type;
    }

    if (!hasConvertedMoney) {
      hasConversionGaps = true;
      existingPosition.moneyDataComplete = false;
    }

    if (transaction.type === "buy") {
      existingPosition.buyQuantity += quantity;
      existingPosition.remainingQuantity += quantity;

      if (hasConvertedMoney) {
        totalBuyValue += convertedRisk;
        totalFees += convertedCommission;
        existingPosition.buyValue += convertedRisk;
        existingPosition.totalFees += convertedCommission;
        existingPosition.totalBuyCost += convertedRisk + convertedCommission;

        if (existingPosition.moneyDataComplete) {
          existingPosition.remainingCostBasis += convertedRisk + convertedCommission;
        }
      }
    } else {
      existingPosition.sellQuantity += quantity;
      const availableQuantity = Math.max(existingPosition.remainingQuantity, 0);
      const matchedQuantity = Math.min(availableQuantity, quantity);
      const excessQuantity = quantity - matchedQuantity;

      if (hasConvertedMoney) {
        totalSellValue += convertedRisk;
        totalFees += convertedCommission;
        existingPosition.sellValue += convertedRisk;
        existingPosition.totalFees += convertedCommission;

        if (existingPosition.moneyDataComplete) {
          const averageCostPerCoin =
            availableQuantity > quantityEpsilon
              ? existingPosition.remainingCostBasis / availableQuantity
              : 0;
          const matchedCostBasis = averageCostPerCoin * matchedQuantity;
          const netProceeds = convertedRisk - convertedCommission;

          existingPosition.realizedProfitLoss += netProceeds - matchedCostBasis;
          existingPosition.remainingCostBasis -= matchedCostBasis;
        }
      }

      existingPosition.remainingQuantity -= matchedQuantity;

      if (excessQuantity > quantityEpsilon) {
        existingPosition.remainingQuantity -= excessQuantity;
      }
    }

    positionsMap.set(positionKey, existingPosition);
  });

  const positions = [...positionsMap.values()]
    .map((position) => {
      const openQuantity =
        Math.abs(position.remainingQuantity) > quantityEpsilon
          ? position.remainingQuantity
          : 0;
      const hasMoneyData = position.moneyDataComplete;
      const openCostBasis =
        hasMoneyData && openQuantity > quantityEpsilon && position.remainingCostBasis > quantityEpsilon
          ? position.remainingCostBasis
          : 0;
      const netInvested = hasMoneyData ? position.buyValue + position.totalFees - position.sellValue : null;
      const averageBuyPrice =
        hasMoneyData && openQuantity > quantityEpsilon ? openCostBasis / openQuantity : null;
      let status = "flat";

      if (openQuantity > quantityEpsilon) {
        status = "open";
      } else if (openQuantity < -quantityEpsilon) {
        status = "net-sold";
      }

      return {
        ...position,
        openQuantity,
        averageBuyPrice,
        openCostBasis,
        netInvested,
        totalBuyCost: hasMoneyData ? position.totalBuyCost : null,
        realizedProfitLoss: hasMoneyData ? position.realizedProfitLoss : null,
        moneyDataComplete: hasMoneyData,
        status
      };
    })
    .sort((left, right) => {
      const statusRank = { open: 0, "net-sold": 1, flat: 2 };
      const statusCompare = statusRank[left.status] - statusRank[right.status];

      if (statusCompare !== 0) {
        return statusCompare;
      }

      const openCostCompare = (Number(right.openCostBasis) || 0) - (Number(left.openCostBasis) || 0);

      if (openCostCompare !== 0) {
        return openCostCompare;
      }

      const exposureCompare =
        Math.abs(Number(right.netInvested) || 0) - Math.abs(Number(left.netInvested) || 0);

      if (exposureCompare !== 0) {
        return exposureCompare;
      }

      return new Date(right.lastTradeDate) - new Date(left.lastTradeDate);
    });

  const allocationPositions = positions
    .filter((position) => position.moneyDataComplete && position.openCostBasis > quantityEpsilon)
    .slice()
    .sort((left, right) => right.openCostBasis - left.openCostBasis);
  const totalOpenCostBasis = allocationPositions.reduce(
    (sum, position) => sum + position.openCostBasis,
    0
  );

  return {
    totalTransactions: transactions.length,
    trackedCoins: positions.length,
    openCoins: positions.filter((position) => position.status === "open").length,
    totalBuyValue,
    totalSellValue,
    totalFees,
    netInvested: totalBuyValue + totalFees - totalSellValue,
    positions,
    allocationPositions,
    totalOpenCostBasis,
    hasConversionGaps
  };
}

function getDashboardPriceMarketIds(positions) {
  return [...new Set(positions.map((position) => position.marketId).filter(Boolean))].sort();
}

function resetDashboardPriceState() {
  dashboardPriceState = {
    status: "idle",
    marketIdsKey: "",
    prices: {},
    updatedAts: {},
    lastUpdatedAt: 0,
    fetchedAt: 0,
    error: ""
  };
}

function loadDashboardPrices(positions, forceRefresh = false) {
  const marketIds = getDashboardPriceMarketIds(positions);
  const portfolioCurrency = getPortfolioCurrency();
  const marketIdsKey = `${portfolioCurrency}:${marketIds.join(",")}`;
  const isFresh =
    dashboardPriceState.status === "ready" &&
    dashboardPriceState.marketIdsKey === marketIdsKey &&
    Date.now() - dashboardPriceState.fetchedAt < dashboardPriceRefreshMs;
  const hasRecentError =
    dashboardPriceState.status === "error" &&
    dashboardPriceState.marketIdsKey === marketIdsKey &&
    Date.now() - dashboardPriceState.fetchedAt < dashboardPriceRefreshMs;
  const hasActiveRequest =
    dashboardPriceState.status === "loading" &&
    dashboardPriceState.marketIdsKey === marketIdsKey;

  if (!marketIds.length) {
    resetDashboardPriceState();
    return;
  }

  if ((!forceRefresh && (isFresh || hasRecentError || hasActiveRequest)) || (forceRefresh && hasActiveRequest)) {
    return;
  }

  const previousPrices =
    dashboardPriceState.marketIdsKey === marketIdsKey ? dashboardPriceState.prices : {};
  const previousUpdatedAts =
    dashboardPriceState.marketIdsKey === marketIdsKey ? dashboardPriceState.updatedAts : {};
  const previousLastUpdatedAt =
    dashboardPriceState.marketIdsKey === marketIdsKey ? dashboardPriceState.lastUpdatedAt : 0;

  dashboardPriceState = {
    status: "loading",
    marketIdsKey,
    prices: previousPrices,
    updatedAts: previousUpdatedAts,
    lastUpdatedAt: previousLastUpdatedAt,
    fetchedAt: dashboardPriceState.fetchedAt,
    error: ""
  };

  const requestId = ++dashboardPriceRequestId;
  const requestUrl = new URL(dashboardPriceApiUrl);

  requestUrl.searchParams.set("ids", marketIds.join(","));
  requestUrl.searchParams.set("vs_currencies", portfolioCurrency);
  requestUrl.searchParams.set("include_last_updated_at", "true");
  requestUrl.searchParams.set("precision", "full");

  fetch(requestUrl)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Price lookup failed with status ${response.status}.`);
      }

      return response.json();
    })
    .then((data) => {
      if (requestId !== dashboardPriceRequestId) {
        return;
      }

      const prices = {};
      const updatedAts = {};
      let lastUpdatedAt = 0;

      marketIds.forEach((marketId) => {
        const currentPrice = data?.[marketId]?.[portfolioCurrency];
        const lastUpdatedTimestamp = Number(data?.[marketId]?.last_updated_at);

        if (Number.isFinite(currentPrice)) {
          prices[marketId] = currentPrice;
        }

        if (Number.isFinite(lastUpdatedTimestamp) && lastUpdatedTimestamp > 0) {
          const updatedAtMs = lastUpdatedTimestamp * 1000;

          updatedAts[marketId] = updatedAtMs;
          lastUpdatedAt = Math.max(lastUpdatedAt, updatedAtMs);
        }
      });

      dashboardPriceState = {
        status: "ready",
        marketIdsKey,
        prices,
        updatedAts,
        lastUpdatedAt: lastUpdatedAt || Date.now(),
        fetchedAt: Date.now(),
        error: ""
      };
      renderDashboard();
    })
    .catch((error) => {
      if (requestId !== dashboardPriceRequestId) {
        return;
      }

      dashboardPriceState = {
        status: "error",
        marketIdsKey,
        prices: previousPrices,
        updatedAts: previousUpdatedAts,
        lastUpdatedAt: previousLastUpdatedAt,
        fetchedAt: Date.now(),
        error: error.message
      };
      renderDashboard();
    });
}

function getDashboardPricePlaceholder(position, context = "price") {
  if (!position.marketId) {
    return context === "price" ? "No market ID" : "Needs market ID";
  }

  if (dashboardPriceState.status === "loading") {
    return context === "price" ? "Loading..." : "Awaiting price";
  }

  return "Price unavailable";
}

function showPanel(viewId) {
  tabButtons.forEach((button) => {
    const isActive = button.dataset.view === viewId;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-selected", String(isActive));
  });

  tabPanels.forEach((panel) => {
    const isActive = panel.id === viewId;
    panel.classList.toggle("active", isActive);
    panel.hidden = !isActive;
  });
}

function updateHash(view) {
  try {
    history.replaceState(null, "", `#${view}`);
  } catch (error) {
    window.location.hash = view;
  }
}

function createCell(content) {
  const cell = document.createElement("td");
  cell.textContent = content;
  return cell;
}

function getDashboardPositionKey(position) {
  const marketId = typeof position?.marketId === "string" ? position.marketId.trim().toLowerCase() : "";
  const coin = typeof position?.coin === "string" ? position.coin.trim().toLowerCase() : "";

  return marketId || coin;
}

function createDashboardCoinCell(position, isSelected) {
  const cell = document.createElement("td");

  cell.textContent = formatCoinDisplayLabel(position.coin, position.marketId);

  if (isSelected) {
    cell.classList.add("dashboard-selected-coin");
  }

  return cell;
}

function createActionButton(action, id, label, extraClass = "") {
  const button = document.createElement("button");

  button.type = "button";
  button.dataset.action = action;
  button.dataset.id = id;
  button.textContent = label;
  button.className = extraClass
    ? `table-action-button ${extraClass}`
    : "table-action-button";

  return button;
}

function createAllocationLegendItem(position, share, color) {
  const item = document.createElement("div");
  const main = document.createElement("div");
  const swatch = document.createElement("span");
  const labels = document.createElement("div");
  const coinName = document.createElement("strong");
  const quantity = document.createElement("span");
  const meta = document.createElement("div");
  const percentage = document.createElement("strong");
  const amount = document.createElement("span");

  item.className = "dashboard-legend-item";
  main.className = "dashboard-legend-main";
  swatch.className = "dashboard-legend-swatch";
  swatch.style.background = color;
  meta.className = "dashboard-legend-meta";

  coinName.textContent = formatCoinDisplayLabel(position.coin, position.marketId);
  quantity.textContent = `${formatNumber(position.openQuantity)} open qty`;
  percentage.textContent = formatPercentage(share);
  amount.textContent = formatCurrency(position.openCostBasis);

  labels.appendChild(coinName);
  labels.appendChild(quantity);
  main.appendChild(swatch);
  main.appendChild(labels);
  meta.appendChild(percentage);
  meta.appendChild(amount);
  item.appendChild(main);
  item.appendChild(meta);

  return item;
}

function getDashboardPositionMarketSnapshot(position) {
  const currentPrice = Number(dashboardPriceState.prices[position.marketId]);
  const hasCurrentPrice = Number.isFinite(currentPrice);
  const valueToday = hasCurrentPrice ? position.openQuantity * currentPrice : null;
  const lastUpdatedAt =
    Number(dashboardPriceState.updatedAts[position.marketId]) || dashboardPriceState.lastUpdatedAt || 0;
  const unrealizedProfitLoss =
    hasCurrentPrice && position.moneyDataComplete ? valueToday - position.openCostBasis : null;
  const totalProfitLoss =
    unrealizedProfitLoss !== null
      ? position.realizedProfitLoss + unrealizedProfitLoss
      : Math.abs(position.openQuantity) <= quantityEpsilon
        ? position.moneyDataComplete
          ? position.realizedProfitLoss
          : null
        : null;
  const totalRoi =
    position.moneyDataComplete && position.totalBuyCost > quantityEpsilon && totalProfitLoss !== null
      ? totalProfitLoss / position.totalBuyCost
      : null;

  return {
    currentPrice,
    hasCurrentPrice,
    valueToday,
    unrealizedProfitLoss,
    totalRoi,
    lastUpdatedAt
  };
}

function getDashboardPortfolioSummary(positions) {
  const summary = {
    openCoins: 0,
    pricedOpenCoins: 0,
    unpricedOpenCoins: 0,
    missingPriceLabels: [],
    portfolioValue: 0,
    realizedProfitLoss: 0,
    unrealizedProfitLoss: 0,
    totalProfitLoss: 0
  };

  positions.forEach((position) => {
    const marketSnapshot = getDashboardPositionMarketSnapshot(position);
    const isOpenPosition = position.openQuantity > quantityEpsilon;

    if (position.moneyDataComplete && Number.isFinite(position.realizedProfitLoss)) {
      summary.realizedProfitLoss += position.realizedProfitLoss;
    }

    if (!isOpenPosition) {
      return;
    }

    summary.openCoins += 1;

    if (marketSnapshot.hasCurrentPrice) {
      summary.pricedOpenCoins += 1;
      summary.portfolioValue += marketSnapshot.valueToday || 0;

      if (Number.isFinite(marketSnapshot.unrealizedProfitLoss)) {
        summary.unrealizedProfitLoss += marketSnapshot.unrealizedProfitLoss;
      }
    } else {
      summary.unpricedOpenCoins += 1;
      summary.missingPriceLabels.push(formatCoinDisplayLabel(position.coin, position.marketId));
    }
  });

  summary.totalProfitLoss = summary.realizedProfitLoss + summary.unrealizedProfitLoss;
  return summary;
}

function setDashboardStatusValue(element, label, status = "neutral") {
  if (!element) {
    return;
  }

  element.textContent = label;
  element.dataset.status = status;
}

function setMetricTrend(element, numericValue) {
  if (!element) {
    return;
  }

  if (!Number.isFinite(numericValue) || Math.abs(numericValue) <= quantityEpsilon) {
    delete element.dataset.trend;
    return;
  }

  element.dataset.trend = numericValue > 0 ? "positive" : "negative";
}

function createDashboardDetailStat(label, value, trend = "") {
  const item = document.createElement("div");
  const itemLabel = document.createElement("span");
  const itemValue = document.createElement("strong");

  item.className = "dashboard-detail-stat";
  itemLabel.textContent = label;
  itemValue.textContent = value;

  if (trend) {
    item.dataset.trend = trend;
  }

  item.appendChild(itemLabel);
  item.appendChild(itemValue);
  return item;
}

function renderDashboardPositionDetail(position, marketSnapshot) {
  const moneyPlaceholder = getDashboardMoneyPlaceholder();
  const hodlDays = getDaysSinceDate(position.firstTradeDate);
  const currentPriceDisplay = marketSnapshot.hasCurrentPrice
    ? formatPrice(marketSnapshot.currentPrice)
    : getDashboardPricePlaceholder(position, "price");
  const totalRoiDisplay = !position.moneyDataComplete
    ? moneyPlaceholder
    : position.totalBuyCost <= quantityEpsilon
    ? "-"
    : marketSnapshot.totalRoi !== null
      ? formatPercentage(marketSnapshot.totalRoi)
      : getDashboardPricePlaceholder(position, "value");
  const averageBuyPriceDisplay = position.moneyDataComplete
    ? position.averageBuyPrice
      ? formatPrice(position.averageBuyPrice)
      : "-"
    : moneyPlaceholder;
  const riskDisplay = position.moneyDataComplete
    ? formatCurrency(position.openCostBasis)
    : moneyPlaceholder;
  const realizedProfitLossDisplay = position.moneyDataComplete
    ? formatCurrency(position.realizedProfitLoss)
    : moneyPlaceholder;
  const unrealizedProfitLossDisplay = marketSnapshot.unrealizedProfitLoss !== null
    ? formatCurrency(marketSnapshot.unrealizedProfitLoss)
    : Math.abs(position.openQuantity) <= quantityEpsilon
      ? "$0.00"
      : position.moneyDataComplete
        ? getDashboardPricePlaceholder(position, "value")
        : moneyPlaceholder;

  dashboardDetailTitle.textContent = formatCoinDisplayLabel(position.coin, position.marketId);
  dashboardDetailCaption.textContent = "Targets are placeholders for now and will be connected to Strategy later.";
  dashboardDetailEmpty.hidden = true;
  dashboardDetailGrid.hidden = false;
  dashboardDetailGrid.innerHTML = "";

  const detailItems = [
    { label: "Coin", value: formatCoinDisplayLabel(position.coin, position.marketId) },
    { label: "Quantity", value: formatNumber(position.openQuantity) },
    { label: "Avg Cost", value: averageBuyPriceDisplay },
    { label: "Current Price", value: currentPriceDisplay },
    { label: "HODL Days", value: hodlDays === null ? "-" : `${hodlDays}` },
    {
      label: "ROI",
      value: totalRoiDisplay,
      trend: marketSnapshot.totalRoi > 0 ? "positive" : marketSnapshot.totalRoi < 0 ? "negative" : ""
    },
    { label: "Risk", value: riskDisplay },
    {
      label: "Realized P/L",
      value: realizedProfitLossDisplay,
      trend:
        position.moneyDataComplete && Number(position.realizedProfitLoss) > 0
          ? "positive"
          : position.moneyDataComplete && Number(position.realizedProfitLoss) < 0
            ? "negative"
            : ""
    },
    {
      label: "Unrealized P/L",
      value: unrealizedProfitLossDisplay,
      trend:
        Number.isFinite(marketSnapshot.unrealizedProfitLoss) && marketSnapshot.unrealizedProfitLoss > 0
          ? "positive"
          : Number.isFinite(marketSnapshot.unrealizedProfitLoss) && marketSnapshot.unrealizedProfitLoss < 0
            ? "negative"
            : ""
    },
    { label: "Target 1", value: formatCurrency(0) },
    { label: "Target 2", value: formatCurrency(0) },
    { label: "Target 3", value: formatCurrency(0) }
  ];

  detailItems.forEach((item) => {
    dashboardDetailGrid.appendChild(createDashboardDetailStat(item.label, item.value, item.trend));
  });
}

function refreshDashboardMarketData(forceRefresh = false) {
  const transactions = getStoredTransactions();

  if (!transactions.length) {
    return;
  }

  const dashboardData = getDashboardData(transactions);

  loadDashboardConversionRates(transactions, forceRefresh);
  loadDashboardPrices(dashboardData.positions, forceRefresh);
  renderDashboard();
}

function renderDashboard() {
  const transactions = getStoredTransactions();
  dashboardPositionBody.innerHTML = "";
  dashboardAllocationLegend.innerHTML = "";
  dashboardDetailGrid.innerHTML = "";

  if (transactions.length === 0) {
    selectedDashboardCoinKey = "";
    resetDashboardPriceState();
    resetDashboardConversionState();
    dashboardEmpty.hidden = false;
    dashboardContent.hidden = true;
    metricTotalTransactions.textContent = "0";
    metricOpenCoins.textContent = "0";
    metricTotalBuys.textContent = formatCurrency(0);
    metricTotalSells.textContent = formatCurrency(0);
    metricNetInvested.textContent = formatCurrency(0);
    metricTotalFees.textContent = formatCurrency(0);
    metricPortfolioValue.textContent = formatCurrency(0);
    metricRealizedProfitLoss.textContent = formatCurrency(0);
    metricUnrealizedProfitLoss.textContent = formatCurrency(0);
    metricTotalProfitLoss.textContent = formatCurrency(0);
    setMetricTrend(metricRealizedProfitLoss, 0);
    setMetricTrend(metricUnrealizedProfitLoss, 0);
    setMetricTrend(metricTotalProfitLoss, 0);
    setDashboardStatusValue(dashboardPriceStatus, "Waiting", "neutral");
    dashboardPriceDetail.textContent = "Add open positions with market IDs to start live pricing.";
    setDashboardStatusValue(dashboardPriceUpdated, "-", "neutral");
    dashboardPriceCoverage.textContent = "No live price coverage yet.";
    dashboardRefreshPricesButton.textContent = "Update Prices";
    dashboardRefreshPricesButton.disabled = true;
    setDashboardStatusValue(dashboardConversionStatus, "Base Currency", "neutral");
    dashboardConversionDetail.textContent =
      "Saved trades stay in their own currency in the logbook and convert only inside the dashboard.";
    dashboardPositionSummary.textContent = "";
    dashboardDetailTitle.textContent = "Choose a coin";
    dashboardDetailCaption.textContent = "Click a coin in the summary to open the full breakdown.";
    dashboardDetailEmpty.hidden = false;
    dashboardDetailGrid.hidden = true;
    dashboardAllocationSummary.textContent = "";
    dashboardAllocationEmpty.hidden = false;
    dashboardAllocationEmpty.textContent = "Add open positions to see the allocation chart.";
    dashboardAllocationChart.hidden = true;
    dashboardAllocationChart.style.background = "";
    dashboardAllocationChart.setAttribute("aria-label", "Coin allocation chart");
    dashboardAllocationTotal.textContent = formatCurrency(0);
    return;
  }

  const portfolioCurrency = getPortfolioCurrency();
  const distinctTransactionCurrencies = [
    ...new Set(transactions.map((transaction) => normalizeCurrencyCode(transaction.currency) || portfolioCurrency))
  ];
  const hasMixedStoredCurrencies = distinctTransactionCurrencies.length > 1;
  const needsCurrencyConversion = distinctTransactionCurrencies.some(
    (currencyCode) => currencyCode !== portfolioCurrency
  );

  loadDashboardConversionRates(transactions);

  const dashboardData = getDashboardData(transactions);
  const portfolioSummary = getDashboardPortfolioSummary(dashboardData.positions);
  const openCoinsWithPriceCoverage = portfolioSummary.openCoins === portfolioSummary.pricedOpenCoins;
  const missingPriceLabelSummary = formatShortLabelList(portfolioSummary.missingPriceLabels);
  const hasRefreshableMarketData =
    getDashboardPriceMarketIds(dashboardData.positions).length > 0 || needsCurrencyConversion;
  const availablePositionKeys = new Set(dashboardData.positions.map(getDashboardPositionKey));

  if (selectedDashboardCoinKey && !availablePositionKeys.has(selectedDashboardCoinKey)) {
    selectedDashboardCoinKey = "";
  }

  loadDashboardPrices(dashboardData.positions);

  const isMarketDataRefreshLoading =
    dashboardPriceState.status === "loading" || dashboardConversionState.status === "loading";

  dashboardEmpty.hidden = true;
  dashboardContent.hidden = false;

  metricTotalTransactions.textContent = `${dashboardData.totalTransactions}`;
  metricOpenCoins.textContent = `${dashboardData.openCoins}`;
  metricTotalBuys.textContent = dashboardData.hasConversionGaps
    ? getDashboardMoneyPlaceholder()
    : formatCurrency(dashboardData.totalBuyValue, true);
  metricTotalSells.textContent = dashboardData.hasConversionGaps
    ? getDashboardMoneyPlaceholder()
    : formatCurrency(dashboardData.totalSellValue, true);
  metricNetInvested.textContent = dashboardData.hasConversionGaps
    ? getDashboardMoneyPlaceholder()
    : formatCurrency(dashboardData.netInvested, true);
  metricTotalFees.textContent = dashboardData.hasConversionGaps
    ? getDashboardMoneyPlaceholder()
    : formatCurrency(dashboardData.totalFees, true);
  metricPortfolioValue.textContent =
    portfolioSummary.openCoins === 0 || portfolioSummary.pricedOpenCoins > 0
      ? formatCurrency(portfolioSummary.portfolioValue, true)
      : getDashboardPricePlaceholder({ marketId: "dashboard" }, "value");
  metricRealizedProfitLoss.textContent = dashboardData.hasConversionGaps
    ? getDashboardMoneyPlaceholder()
    : formatCurrency(portfolioSummary.realizedProfitLoss, true);
  metricUnrealizedProfitLoss.textContent = dashboardData.hasConversionGaps
    ? portfolioSummary.openCoins === 0
      ? formatCurrency(0, true)
      : getDashboardMoneyPlaceholder()
    : portfolioSummary.openCoins === 0 || portfolioSummary.pricedOpenCoins > 0
      ? formatCurrency(portfolioSummary.unrealizedProfitLoss, true)
      : getDashboardPricePlaceholder({ marketId: "dashboard" }, "value");
  metricTotalProfitLoss.textContent = dashboardData.hasConversionGaps
    ? getDashboardMoneyPlaceholder()
    : portfolioSummary.openCoins === 0 || portfolioSummary.pricedOpenCoins > 0
      ? formatCurrency(portfolioSummary.totalProfitLoss, true)
      : getDashboardPricePlaceholder({ marketId: "dashboard" }, "value");
  setMetricTrend(metricRealizedProfitLoss, dashboardData.hasConversionGaps ? Number.NaN : portfolioSummary.realizedProfitLoss);
  setMetricTrend(
    metricUnrealizedProfitLoss,
    dashboardData.hasConversionGaps ? Number.NaN : portfolioSummary.unrealizedProfitLoss
  );
  setMetricTrend(metricTotalProfitLoss, dashboardData.hasConversionGaps ? Number.NaN : portfolioSummary.totalProfitLoss);

  if (portfolioSummary.openCoins === 0) {
    setDashboardStatusValue(dashboardPriceStatus, "No Open Holdings", "neutral");
    dashboardPriceDetail.textContent = "Add or keep an open position to populate live pricing.";
  } else if (dashboardPriceState.status === "loading" && portfolioSummary.pricedOpenCoins === 0) {
    setDashboardStatusValue(dashboardPriceStatus, "Loading", "loading");
    dashboardPriceDetail.textContent = `Fetching live prices for ${portfolioSummary.openCoins} open coin${portfolioSummary.openCoins === 1 ? "" : "s"}.`;
  } else if (dashboardPriceState.status === "loading") {
    setDashboardStatusValue(dashboardPriceStatus, "Refreshing", "loading");
    dashboardPriceDetail.textContent = "Refreshing live prices while cached values stay visible.";
  } else if (dashboardPriceState.status === "error" && portfolioSummary.pricedOpenCoins > 0) {
    setDashboardStatusValue(dashboardPriceStatus, "Cached", "warning");
    dashboardPriceDetail.textContent = "Using last known prices while the refresh is unavailable.";
  } else if (dashboardPriceState.status === "error") {
    setDashboardStatusValue(dashboardPriceStatus, "Unavailable", "error");
    dashboardPriceDetail.textContent = "Live price lookup failed for the current dashboard set.";
  } else if (!openCoinsWithPriceCoverage) {
    setDashboardStatusValue(dashboardPriceStatus, "Partial", "warning");
    dashboardPriceDetail.textContent = missingPriceLabelSummary
      ? `Missing live prices for ${missingPriceLabelSummary}.`
      : "Some open positions are still missing a live price.";
  } else {
    setDashboardStatusValue(dashboardPriceStatus, "Live", "live");
    dashboardPriceDetail.textContent = `All ${portfolioSummary.openCoins} open coin${portfolioSummary.openCoins === 1 ? "" : "s"} have a live price.`;
  }

  if (dashboardPriceState.lastUpdatedAt > 0) {
    setDashboardStatusValue(dashboardPriceUpdated, formatRelativeTimeFromNow(dashboardPriceState.lastUpdatedAt), "neutral");
    dashboardPriceCoverage.textContent =
      portfolioSummary.openCoins > 0
        ? `${formatDateTime(dashboardPriceState.lastUpdatedAt)} | ${portfolioSummary.pricedOpenCoins}/${portfolioSummary.openCoins} open coins priced`
        : `${formatDateTime(dashboardPriceState.lastUpdatedAt)} | no open coins to price`;
  } else if (portfolioSummary.openCoins > 0 && dashboardPriceState.status === "loading") {
    setDashboardStatusValue(dashboardPriceUpdated, "Pending", "loading");
    dashboardPriceCoverage.textContent = "Waiting for the first live price response.";
  } else {
    setDashboardStatusValue(dashboardPriceUpdated, "-", "neutral");
    dashboardPriceCoverage.textContent = "No live price coverage yet.";
  }

  dashboardRefreshPricesButton.textContent = isMarketDataRefreshLoading ? "Updating..." : "Update Prices";
  dashboardRefreshPricesButton.disabled = isMarketDataRefreshLoading || !hasRefreshableMarketData;

  if (!needsCurrencyConversion) {
    setDashboardStatusValue(dashboardConversionStatus, "Base Currency", "neutral");
    dashboardConversionDetail.textContent = `All saved trades already align with ${portfolioCurrency.toUpperCase()} in the dashboard.`;
  } else if (dashboardData.hasConversionGaps && dashboardConversionState.status === "loading") {
    setDashboardStatusValue(dashboardConversionStatus, "Loading", "loading");
    dashboardConversionDetail.textContent = `Converting historical trade amounts into ${portfolioCurrency.toUpperCase()}.`;
  } else if (dashboardData.hasConversionGaps) {
    setDashboardStatusValue(dashboardConversionStatus, "Unavailable", "error");
    dashboardConversionDetail.textContent =
      dashboardConversionState.error || `Historical trade amounts could not be converted into ${portfolioCurrency.toUpperCase()}.`;
  } else if (dashboardConversionState.status === "error") {
    setDashboardStatusValue(dashboardConversionStatus, "Cached", "warning");
    dashboardConversionDetail.textContent = `Using cached FX rates to keep the dashboard in ${portfolioCurrency.toUpperCase()}.`;
  } else if (hasMixedStoredCurrencies) {
    setDashboardStatusValue(dashboardConversionStatus, "Mixed Inputs", "ready");
    dashboardConversionDetail.textContent = `Stored trade amounts are being converted from mixed currencies into ${portfolioCurrency.toUpperCase()}.`;
  } else {
    setDashboardStatusValue(dashboardConversionStatus, "Converted", "ready");
    dashboardConversionDetail.textContent = `Stored trade amounts are being converted into ${portfolioCurrency.toUpperCase()}.`;
  }

  if (dashboardData.hasConversionGaps) {
    dashboardPositionSummary.textContent =
      dashboardConversionState.status === "loading"
        ? `${dashboardData.openCoins} open / ${dashboardData.trackedCoins} tracked | currency conversion loading`
        : `${dashboardData.openCoins} open / ${dashboardData.trackedCoins} tracked | currency conversion unavailable`;
  } else if (dashboardConversionState.status === "error" && needsCurrencyConversion) {
    dashboardPositionSummary.textContent = `${dashboardData.openCoins} open / ${dashboardData.trackedCoins} tracked | using cached conversion rates`;
  } else if (dashboardPriceState.status === "loading") {
    dashboardPositionSummary.textContent = `${dashboardData.openCoins} open / ${dashboardData.trackedCoins} tracked | prices loading`;
  } else if (dashboardPriceState.status === "error") {
    dashboardPositionSummary.textContent = `${dashboardData.openCoins} open / ${dashboardData.trackedCoins} tracked | live prices unavailable`;
  } else if (needsCurrencyConversion && hasMixedStoredCurrencies) {
    dashboardPositionSummary.textContent = `${dashboardData.openCoins} open / ${dashboardData.trackedCoins} tracked | converted from mixed currencies to ${portfolioCurrency.toUpperCase()}`;
  } else if (needsCurrencyConversion) {
    dashboardPositionSummary.textContent = `${dashboardData.openCoins} open / ${dashboardData.trackedCoins} tracked | converted to ${portfolioCurrency.toUpperCase()}`;
  } else {
    dashboardPositionSummary.textContent = `${dashboardData.openCoins} open / ${dashboardData.trackedCoins} tracked`;
  }

  dashboardAllocationSummary.textContent = dashboardData.hasConversionGaps
    ? dashboardConversionState.status === "loading"
      ? "Waiting for conversion rates"
      : "Allocation unavailable"
    : `${dashboardData.allocationPositions.length} open coin${dashboardData.allocationPositions.length === 1 ? "" : "s"}`;

  dashboardData.positions.forEach((position) => {
    const row = document.createElement("tr");
    const positionKey = getDashboardPositionKey(position);
    const isSelected = positionKey === selectedDashboardCoinKey;
    const marketSnapshot = getDashboardPositionMarketSnapshot(position);
    const moneyPlaceholder = getDashboardMoneyPlaceholder();
    const currentPriceDisplay = marketSnapshot.hasCurrentPrice
      ? formatPrice(marketSnapshot.currentPrice)
      : getDashboardPricePlaceholder(position, "price");
    const totalRoiDisplay = !position.moneyDataComplete
      ? moneyPlaceholder
      : position.totalBuyCost <= quantityEpsilon
      ? "-"
      : marketSnapshot.totalRoi !== null
        ? formatPercentage(marketSnapshot.totalRoi)
        : getDashboardPricePlaceholder(position, "value");
    const averageBuyPriceDisplay = position.moneyDataComplete
      ? position.averageBuyPrice
        ? formatPrice(position.averageBuyPrice)
        : "-"
      : moneyPlaceholder;

    row.dataset.dashboardCoinKey = positionKey;
    row.tabIndex = 0;
    row.classList.add("dashboard-selectable-row");
    row.classList.toggle("dashboard-selected-row", isSelected);

    row.appendChild(createDashboardCoinCell(position, isSelected));
    row.appendChild(createCell(formatNumber(position.openQuantity)));
    row.appendChild(createCell(averageBuyPriceDisplay));
    row.appendChild(createCell(currentPriceDisplay));
    row.appendChild(createCell(totalRoiDisplay));

    dashboardPositionBody.appendChild(row);
  });

  const selectedPosition = dashboardData.positions.find(
    (position) => getDashboardPositionKey(position) === selectedDashboardCoinKey
  );

  if (selectedPosition) {
    renderDashboardPositionDetail(
      selectedPosition,
      getDashboardPositionMarketSnapshot(selectedPosition)
    );
  } else {
    dashboardDetailTitle.textContent = "Choose a coin";
    dashboardDetailCaption.textContent = "Click a coin in the summary to open the full breakdown.";
    dashboardDetailEmpty.hidden = false;
    dashboardDetailGrid.hidden = true;
  }

  if (dashboardData.hasConversionGaps) {
    dashboardAllocationEmpty.hidden = false;
    dashboardAllocationEmpty.textContent =
      dashboardConversionState.status === "loading"
        ? "Currency conversion is loading for the allocation chart."
        : "Currency conversion is unavailable for the allocation chart.";
    dashboardAllocationChart.hidden = true;
    dashboardAllocationChart.style.background = "";
    dashboardAllocationChart.setAttribute("aria-label", "Coin allocation chart");
    dashboardAllocationTotal.textContent = getDashboardMoneyPlaceholder();
  } else if (dashboardData.allocationPositions.length === 0) {
    dashboardAllocationEmpty.hidden = false;
    dashboardAllocationEmpty.textContent = "Add open positions to see the allocation chart.";
    dashboardAllocationChart.hidden = true;
    dashboardAllocationChart.style.background = "";
    dashboardAllocationChart.setAttribute("aria-label", "Coin allocation chart");
    dashboardAllocationTotal.textContent = formatCurrency(0);
  } else {
    let currentAngle = 0;

    const chartSegments = dashboardData.allocationPositions.map((position, index) => {
      const share = position.openCostBasis / dashboardData.totalOpenCostBasis;
      const startAngle = currentAngle;
      const endAngle =
        index === dashboardData.allocationPositions.length - 1
          ? 360
          : currentAngle + share * 360;
      const color = allocationChartColors[index % allocationChartColors.length];

      currentAngle = endAngle;
      dashboardAllocationLegend.appendChild(createAllocationLegendItem(position, share, color));

      return `${color} ${startAngle.toFixed(2)}deg ${endAngle.toFixed(2)}deg`;
    });

    dashboardAllocationEmpty.hidden = true;
    dashboardAllocationChart.hidden = false;
    dashboardAllocationChart.style.background = `conic-gradient(${chartSegments.join(", ")})`;
    dashboardAllocationChart.setAttribute(
      "aria-label",
      `Coin allocation chart showing ${dashboardData.allocationPositions.length} open coins.`
    );
    dashboardAllocationTotal.textContent = formatCurrency(
      dashboardData.totalOpenCostBasis,
      dashboardData.totalOpenCostBasis >= 10000
    );
  }
}

function getTransactionYear(transaction) {
  return transaction.transactionDate ? transaction.transactionDate.split("-")[0] : "";
}

function getTransactionMonth(transaction) {
  return transaction.transactionDate ? transaction.transactionDate.split("-")[1] : "";
}

function getTransactionCoinKey(transaction) {
  return transaction.marketId?.trim().toLowerCase() || transaction.coin.trim().toLowerCase();
}

function getActiveFilters() {
  return {
    year: filterYearSelect.value,
    month: filterMonthSelect.value,
    coin: filterCoinSelect.value,
    type: filterTypeSelect.value
  };
}

function hasActiveFilters() {
  const filters = getActiveFilters();
  return Boolean(filters.year || filters.month || filters.coin || filters.type);
}

function populateDynamicFilterOptions(transactions) {
  const selectedYear = filterYearSelect.value;
  const selectedCoin = filterCoinSelect.value;
  const years = [...new Set(transactions.map(getTransactionYear).filter(Boolean))].sort((a, b) => b.localeCompare(a));
  const coinEntries = new Map();

  transactions.forEach((transaction) => {
    const displayCoin = formatCoinDisplayLabel(transaction.coin, transaction.marketId);
    const coinKey = getTransactionCoinKey(transaction);

    if (displayCoin && !coinEntries.has(coinKey)) {
      coinEntries.set(coinKey, displayCoin);
    }
  });

  filterYearSelect.innerHTML = '<option value="">All Years</option>';
  years.forEach((year) => {
    const option = document.createElement("option");
    option.value = year;
    option.textContent = year;
    filterYearSelect.appendChild(option);
  });

  filterCoinSelect.innerHTML = '<option value="">All Coins</option>';
  [...coinEntries.entries()]
    .sort((left, right) => left[1].localeCompare(right[1]))
    .forEach(([coinKey, coinLabel]) => {
      const option = document.createElement("option");
      option.value = coinKey;
      option.textContent = coinLabel;
      filterCoinSelect.appendChild(option);
    });

  filterYearSelect.value = years.includes(selectedYear) ? selectedYear : "";
  filterCoinSelect.value = coinEntries.has(selectedCoin) ? selectedCoin : "";
}

function getFilteredTransactions(transactions) {
  const filters = getActiveFilters();

  return transactions.filter((transaction) => {
    if (filters.year && getTransactionYear(transaction) !== filters.year) {
      return false;
    }

    if (filters.month && getTransactionMonth(transaction) !== filters.month) {
      return false;
    }

    if (filters.coin && getTransactionCoinKey(transaction) !== filters.coin) {
      return false;
    }

    if (filters.type && transaction.type !== filters.type) {
      return false;
    }

    return true;
  });
}

function updateTradeLogEmptyState(totalTransactions, visibleTransactions) {
  if (visibleTransactions.length > 0) {
    emptyState.hidden = true;
    return;
  }

  emptyState.hidden = false;

  if (totalTransactions.length === 0) {
    emptyState.innerHTML = `
      <p>No transactions yet.</p>
      <span>Add your first trade from the Add Transaction tab to start building the log.</span>
    `;
    return;
  }

  emptyState.innerHTML = `
    <p>No matching transactions.</p>
    <span>Try another filter combination or clear the filters to see more trades.</span>
  `;
}

function updateFilterSummary(totalCount, visibleCount) {
  if (totalCount === 0) {
    filterSummary.textContent = "";
    return;
  }

  if (hasActiveFilters()) {
    filterSummary.textContent = `Showing ${visibleCount} of ${totalCount} transactions.`;
    return;
  }

  filterSummary.textContent = `Showing all ${totalCount} transactions.`;
}

function setCreateMode() {
  currentEditingId = null;
  marketIdWasEditedManually = false;
  editState.hidden = true;
  editState.textContent = "";
  submitButton.textContent = "Save Transaction";
  resetButton.textContent = "Clear Form";
}

function applyDefaultFormState() {
  closeCoinAutocompletePanels();
  setSelectedCoinMarketId(coinInput, "");
  setCreateMode();
  setTransactionType("buy");
  dateInput.value = getTodayForInput();
  updateDateLabel();
  updateRisk();
  updateMarketIdFromCoin();
}

function startEditingTransaction(transaction) {
  currentEditingId = transaction.id;
  coinInput.value = transaction.coin;
  setSelectedCoinMarketId(coinInput, transaction.marketId);
  marketIdInput.value = transaction.marketId;
  marketIdWasEditedManually = transaction.marketId.trim() !== getSuggestedMarketId(transaction.coin, transaction.marketId);
  setTransactionType(transaction.type);
  dateInput.value = transaction.transactionDate;
  coinPriceInput.value = transaction.coinPrice;
  quantityInput.value = transaction.quantity;
  commissionInput.value = transaction.commission;
  notesInput.value = transaction.notes || "";
  updateDateLabel();
  updateRisk();

  submitButton.textContent = "Update Transaction";
  resetButton.textContent = "Cancel Edit";
  editState.hidden = false;
  editState.textContent = `Editing ${transaction.coin} ${transaction.type} from ${formatDate(transaction.transactionDate)}.`;
  feedback.textContent = "";
  tradeLogFeedback.textContent = "";
  renderTradeLog();

  showPanel("add-transaction");
  updateHash("add-transaction");
  coinInput.focus();
}

function renderTradeLog() {
  const transactions = getStoredTransactions();
  populateDynamicFilterOptions(transactions);
  const filteredTransactions = getFilteredTransactions(transactions);
  tradeTableBody.innerHTML = "";
  updateTradeLogEmptyState(transactions, filteredTransactions);
  updateFilterSummary(transactions.length, filteredTransactions.length);

  filteredTransactions
    .slice()
    .sort(compareTransactionsByDateDesc)
    .forEach((transaction) => {
      const row = document.createElement("tr");
      const typeCell = document.createElement("td");
      const typeChip = document.createElement("span");
      const actionsCell = document.createElement("td");
      const actionsGroup = document.createElement("div");
      const transactionCurrency = transaction.currency || getPortfolioCurrency();
      const displayRisk =
        transaction.type === "sell"
          ? -Math.abs(Number(transaction.risk))
          : Number(transaction.risk);

      if (transaction.id === currentEditingId) {
        row.classList.add("is-editing-row");
      }

      typeChip.className = `type-chip ${transaction.type}`;
      typeChip.textContent = transaction.type;
      typeCell.appendChild(typeChip);

      actionsGroup.className = "table-action-group";
      actionsGroup.appendChild(createActionButton("edit", transaction.id, "Edit"));
      actionsGroup.appendChild(
        createActionButton("delete", transaction.id, "Delete", "table-action-button-delete")
      );
      actionsCell.appendChild(actionsGroup);

      row.appendChild(createCell(formatDate(transaction.transactionDate)));
      row.appendChild(typeCell);
      row.appendChild(createCell(formatCoinDisplayLabel(transaction.coin, transaction.marketId)));
      row.appendChild(createCell(formatPrice(transaction.coinPrice, transactionCurrency)));
      row.appendChild(createCell(formatNumber(transaction.quantity)));
      row.appendChild(createCell(formatCurrency(displayRisk, false, transactionCurrency)));
      row.appendChild(createCell(formatCurrency(transaction.commission, false, transactionCurrency)));
      row.appendChild(createCell(transaction.notes || "-"));
      row.appendChild(actionsCell);

      tradeTableBody.appendChild(row);
    });
}

function renderPortfolioViews() {
  renderDashboard();
  renderTradeLog();
}

function buildTransactionRecord(formData) {
  const rawCoin = formData.get("coin").trim();
  const submittedMarketId = formData.get("marketId").trim();
  const canonicalCoinData = getCanonicalCoinData(rawCoin, submittedMarketId);
  const coinPrice = Number(formData.get("coinPrice"));
  const quantity = Number(formData.get("quantity"));
  const calculatedRisk = coinPrice * quantity;
  const marketId = canonicalCoinData.marketId || submittedMarketId || slugifyCoin(rawCoin);

  return {
    id: generateId(),
    coin: canonicalCoinData.coin,
    marketId,
    currency: getPortfolioCurrency(),
    type: formData.get("type"),
    transactionDate: formData.get("transactionDate"),
    coinPrice,
    quantity,
    risk: Number.isFinite(calculatedRisk) ? calculatedRisk : 0,
    commission: Number(formData.get("commission") || 0),
    notes: formData.get("notes").trim(),
    createdAt: new Date().toISOString()
  };
}

coinAutocompleteControllers.push(
  createCoinAutocompleteController({
    input: coinInput,
    onSelect: (entry) => {
      marketIdWasEditedManually = false;
      marketIdInput.value = entry.id;
    }
  }),
  createCoinAutocompleteController({
    input: txidLookupCoinInput,
    onSelect: (entry) => {
      txidLookupCoinInput.value = entry.name;
    }
  }),
  createCoinAutocompleteController({
    input: txidReviewCoinInput,
    onSelect: (entry) => {
      txidMarketIdWasEditedManually = false;
      txidReviewMarketIdInput.value = entry.id;
      updateTxidReviewContext();
    }
  })
);

tabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const view = button.dataset.view;
    updateHash(view);
    showPanel(view);
  });
});

portfolioCurrencySelect.addEventListener("change", () => {
  const previousCurrency = getStoredPortfolioCurrency();
  const nextCurrency = getPortfolioCurrency();

  if (nextCurrency === previousCurrency) {
    portfolioCurrencyFeedback.textContent = "";
    return;
  }

  const hasTransactions = getStoredTransactions().length > 0;

  if (hasTransactions) {
    const confirmed = window.confirm(
      "Changing the portfolio currency affects dashboard pricing and all new entries. Saved trades keep their original currency, but the dashboard will convert them into the selected base currency. Continue?"
    );

    if (!confirmed) {
      portfolioCurrencySelect.value = previousCurrency;
      portfolioCurrencyFeedback.textContent = "Portfolio currency kept unchanged.";
      return;
    }
  }

  savePortfolioCurrency(nextCurrency);
  resetDashboardPriceState();
  resetDashboardConversionState();
  renderPortfolioViews();
  portfolioCurrencyFeedback.textContent = `Portfolio currency set to ${nextCurrency.toUpperCase()}.`;
});

dashboardRefreshPricesButton.addEventListener("click", () => {
  refreshDashboardMarketData(true);
});

dashboardPositionBody.addEventListener("click", (event) => {
  const dashboardRow = event.target.closest("tr[data-dashboard-coin-key]");

  if (!dashboardRow) {
    return;
  }

  const nextSelectionKey = dashboardRow.dataset.dashboardCoinKey;
  selectedDashboardCoinKey = selectedDashboardCoinKey === nextSelectionKey ? "" : nextSelectionKey;
  renderDashboard();
});

dashboardPositionBody.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") {
    return;
  }

  const dashboardRow = event.target.closest("tr[data-dashboard-coin-key]");

  if (!dashboardRow) {
    return;
  }

  event.preventDefault();

  const nextSelectionKey = dashboardRow.dataset.dashboardCoinKey;
  selectedDashboardCoinKey = selectedDashboardCoinKey === nextSelectionKey ? "" : nextSelectionKey;
  renderDashboard();
});

coinInput.addEventListener("input", () => {
  updateMarketIdFromCoin();
});
coinInput.addEventListener("blur", () => {
  window.setTimeout(async () => {
    if (document.activeElement === coinInput) {
      return;
    }

    await ensureCoinGeckoCatalogLoaded();
    normalizeCoinField();
  }, 120);
});
marketIdInput.addEventListener("input", syncMarketIdManualState);
coinPriceInput.addEventListener("input", updateRisk);
quantityInput.addEventListener("input", updateRisk);
txidLookupCoinInput.addEventListener("blur", () => {
  window.setTimeout(async () => {
    if (document.activeElement === txidLookupCoinInput) {
      return;
    }

    await ensureCoinGeckoCatalogLoaded();
    normalizeTxidLookupCoinField();
  }, 120);
});
txidReviewCoinInput.addEventListener("input", () => {
  updateTxidMarketIdFromCoin();
  updateTxidReviewContext();
});
txidReviewCoinInput.addEventListener("blur", () => {
  window.setTimeout(async () => {
    if (document.activeElement === txidReviewCoinInput) {
      return;
    }

    await ensureCoinGeckoCatalogLoaded();
    normalizeTxidReviewCoinField();
  }, 120);
});
txidReviewNetworkInput.addEventListener("input", updateTxidReviewContext);
txidReviewHashInput.addEventListener("input", updateTxidReviewContext);
txidReviewMarketIdInput.addEventListener("input", syncTxidMarketIdManualState);
txidCoinPriceInput.addEventListener("input", updateTxidRisk);
txidQuantityInput.addEventListener("input", updateTxidRisk);

typeInputs.forEach((input) => {
  input.addEventListener("change", updateDateLabel);
});

txidReviewTypeInputs.forEach((input) => {
  input.addEventListener("change", updateTxidDateLabel);
});

[filterYearSelect, filterMonthSelect, filterCoinSelect, filterTypeSelect].forEach((select) => {
  select.addEventListener("change", () => {
    renderTradeLog();
  });
});

clearFiltersButton.addEventListener("click", () => {
  filterYearSelect.value = "";
  filterMonthSelect.value = "";
  filterCoinSelect.value = "";
  filterTypeSelect.value = "";
  renderTradeLog();
});

tradeTableBody.addEventListener("click", (event) => {
  const actionButton = event.target.closest("button[data-action]");

  if (!actionButton) {
    return;
  }

  const action = actionButton.dataset.action;
  const transactionId = actionButton.dataset.id;
  const transactions = getStoredTransactions();
  const transaction = transactions.find((entry) => entry.id === transactionId);

  if (!transaction) {
    tradeLogFeedback.textContent = "That transaction no longer exists.";
    renderPortfolioViews();
    return;
  }

  if (action === "edit") {
    startEditingTransaction(transaction);
    return;
  }

  if (action === "delete") {
    const confirmed = window.confirm(`Delete the ${transaction.coin} ${transaction.type} transaction?`);

    if (!confirmed) {
      return;
    }

    const remainingTransactions = transactions.filter((entry) => entry.id !== transactionId);

    if (currentEditingId === transactionId) {
      form.reset();
    }

    saveTransactions(remainingTransactions);
    setCreateMode();
    renderPortfolioViews();
    tradeLogFeedback.textContent = `${transaction.coin} ${transaction.type} transaction deleted.`;
    showPanel("trade-log");
    updateHash("trade-log");
  }
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  await ensureCoinGeckoCatalogLoaded();

  const formData = new FormData(form);
  const draftedTransaction = buildTransactionRecord(formData);
  const transactions = getStoredTransactions();
  let savedTransaction = draftedTransaction;
  let formMessage = "";

  if (currentEditingId) {
    const existingIndex = transactions.findIndex((transaction) => transaction.id === currentEditingId);

    if (existingIndex === -1) {
      feedback.textContent = "That transaction could not be found. Please try again.";
      return;
    }

    const existingTransaction = transactions[existingIndex];
    savedTransaction = {
      ...existingTransaction,
      ...draftedTransaction,
      id: existingTransaction.id,
      createdAt: existingTransaction.createdAt,
      updatedAt: new Date().toISOString()
    };
    transactions[existingIndex] = savedTransaction;
    formMessage = `${savedTransaction.coin} ${savedTransaction.type} transaction updated.`;
  } else {
    transactions.push(savedTransaction);
    formMessage = `${savedTransaction.coin} ${savedTransaction.type} transaction saved.`;
  }

  saveTransactions(transactions);
  setCreateMode();
  renderPortfolioViews();

  suppressResetFeedbackClear = true;
  form.reset();
  feedback.textContent = formMessage;
  tradeLogFeedback.textContent = formMessage;
  showPanel("trade-log");
  updateHash("trade-log");
});

form.addEventListener("reset", () => {
  window.setTimeout(() => {
    if (suppressResetFeedbackClear) {
      suppressResetFeedbackClear = false;
    } else {
      feedback.textContent = "";
    }

    applyDefaultFormState();
  }, 0);
});

txidLookupForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await ensureCoinGeckoCatalogLoaded();
  txidLookupCoinInput.value = txidLookupCoinInput.value.trim();
  txidLookupNetworkInput.value = txidLookupNetworkInput.value.trim();
  txidLookupHashInput.value = txidLookupHashInput.value.trim();

  if (!txidLookupCoinInput.value || !txidLookupNetworkInput.value || !txidLookupHashInput.value) {
    txidFetchFeedback.textContent = "Please enter the coin, network, and transaction hash before fetching the review.";
    return;
  }

  txidPrepareReviewButton.disabled = true;
  txidPrepareReviewButton.textContent = "Fetching...";
  txidFetchFeedback.textContent = "Fetching live transaction data and historical price...";

  try {
    normalizeTxidLookupCoinField();

    const canonicalCoinData = getCanonicalCoinData(
      txidLookupCoinInput.value,
      getSelectedCoinMarketId(txidLookupCoinInput)
    );
    const liveFetchResult = await fetchTxidLivePrefill(
      canonicalCoinData,
      txidLookupNetworkInput.value,
      txidLookupHashInput.value
    );

    txidLookupNetworkInput.value = liveFetchResult.networkLabel;
    txidLookupHashInput.value = liveFetchResult.normalizedHash;
    prepareTxidReview(liveFetchResult);
    txidFetchFeedback.textContent = liveFetchResult.lookupMessage;
    txidReviewCoinInput.focus();
  } catch (error) {
    if (error.code === "invalid-hash") {
      txidFetchFeedback.textContent = error.message;
      hideTxidReview();
      return;
    }

    prepareTxidReview();
    txidReviewBadge.textContent = "Manual Review";
    txidReviewFeedback.textContent =
      error.code === "unsupported-network"
        ? "Live fetch is not available for this network yet, so the review form stayed manual."
        : "Live fetch could not prefill this transaction completely, so the review form stayed manual.";
    txidFetchFeedback.textContent = `${error.message} Review form opened for manual confirmation.`;
    txidReviewCoinInput.focus();
  } finally {
    txidPrepareReviewButton.disabled = false;
    txidPrepareReviewButton.textContent = "Fetch and Prepare Review";
  }
});

txidLookupForm.addEventListener("reset", () => {
  window.setTimeout(() => {
    setSelectedCoinMarketId(txidLookupCoinInput, "");

    if (suppressTxidLookupFeedbackClear) {
      suppressTxidLookupFeedbackClear = false;
    } else {
      txidFetchFeedback.textContent = "";
    }

    hideTxidReview();
  }, 0);
});

txidDiscardReviewButton.addEventListener("click", () => {
  hideTxidReview();
  txidFetchFeedback.textContent = "Review discarded. Prepare another transaction whenever you want.";
});

txidReviewForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await ensureCoinGeckoCatalogLoaded();

  const formData = new FormData(txidReviewForm);
  const savedTransaction = buildTxidTransactionRecord(formData);
  const transactions = getStoredTransactions();
  const successMessage = `${savedTransaction.coin} ${savedTransaction.type} transaction added from TXID review.`;

  if (!savedTransaction.coin || !savedTransaction.network || !savedTransaction.transactionHash) {
    txidReviewFeedback.textContent = "Please confirm the coin, network, and transaction hash before adding this entry.";
    return;
  }

  transactions.push(savedTransaction);
  saveTransactions(transactions);
  renderPortfolioViews();

  suppressTxidLookupFeedbackClear = true;
  txidLookupForm.reset();
  txidFetchFeedback.textContent = successMessage;
  tradeLogFeedback.textContent = successMessage;
  showPanel("trade-log");
  updateHash("trade-log");
});

clearTransactionsButton.addEventListener("click", () => {
  const hasTransactions = getStoredTransactions().length > 0;

  if (!hasTransactions) {
    tradeLogFeedback.textContent = "There are no transactions to clear.";
    return;
  }

  const confirmed = window.confirm("Clear all saved transactions from this browser?");

  if (!confirmed) {
    return;
  }

  localStorage.removeItem(STORAGE_KEY);
  filterYearSelect.value = "";
  filterMonthSelect.value = "";
  filterCoinSelect.value = "";
  filterTypeSelect.value = "";
  form.reset();
  setCreateMode();
  txidLookupForm.reset();
  renderPortfolioViews();
  tradeLogFeedback.textContent = "All transactions cleared from local storage.";
});

const initialView = window.location.hash.replace("#", "");
const hasCachedCoinGeckoCatalog = hydrateCoinGeckoCatalogFromStorage();
const initialPortfolioCurrency = getStoredPortfolioCurrency();

populatePortfolioCurrencyOptions([initialPortfolioCurrency]);
portfolioCurrencySelect.value = initialPortfolioCurrency;

if (hasCachedCoinGeckoCatalog) {
  normalizeStoredTransactionsWithCoinGeckoCatalog();
}

applyDefaultFormState();
applyDefaultTxidReviewState();
showPanel(validViews.includes(initialView) ? initialView : "add-transaction");
renderPortfolioViews();
ensureCoinGeckoCatalogLoaded();
ensureSupportedCurrenciesLoaded();
