export const localeOptions = [
  { value: "en", label: "English" },
  { value: "tr", label: "Türkçe" }
] as const;

export type AppLocale = (typeof localeOptions)[number]["value"];

export const defaultLocale: AppLocale = "en";
export const localeCookieName = "prismfolio-locale";

const localeValueSet = new Set<string>(localeOptions.map((locale) => locale.value));

export function normalizeLocale(value: string | null | undefined): AppLocale | null {
  if (!value) {
    return null;
  }

  const normalizedValue = value.trim().toLowerCase();

  if (localeValueSet.has(normalizedValue)) {
    return normalizedValue as AppLocale;
  }

  const primaryTag = normalizedValue.split("-")[0];

  if (localeValueSet.has(primaryTag)) {
    return primaryTag as AppLocale;
  }

  return null;
}
