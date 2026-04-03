export function formatMessage(
  template: string,
  replacements: Record<string, string | number | null | undefined>
) {
  return template.replace(/\{(\w+)\}/g, (_match, key: string) => {
    const value = replacements[key];

    return value === null || value === undefined ? "" : String(value);
  });
}
