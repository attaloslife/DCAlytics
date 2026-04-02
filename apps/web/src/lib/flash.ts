type SearchParamsRecord = Record<string, string | string[] | undefined>;

export async function resolveSearchParams(
  searchParams?: SearchParamsRecord | Promise<SearchParamsRecord>
): Promise<SearchParamsRecord> {
  return searchParams ? await searchParams : {};
}

export function getSingleSearchParam(
  searchParams: SearchParamsRecord,
  key: string
): string {
  const value = searchParams[key];

  if (Array.isArray(value)) {
    return value[0] || "";
  }

  return value || "";
}

export async function getFlashMessages(
  searchParams?: SearchParamsRecord | Promise<SearchParamsRecord>
) {
  const resolvedSearchParams = await resolveSearchParams(searchParams);

  return {
    message: getSingleSearchParam(resolvedSearchParams, "message"),
    error: getSingleSearchParam(resolvedSearchParams, "error")
  };
}

export function buildPathWithNotice(
  path: string,
  notice: {
    message?: string;
    error?: string;
    fields?: Record<string, string | undefined>;
  }
) {
  const url = new URL(path, "http://localhost");

  if (notice.message) {
    url.searchParams.set("message", notice.message);
  }

  if (notice.error) {
    url.searchParams.set("error", notice.error);
  }

  for (const [key, value] of Object.entries(notice.fields || {})) {
    if (!value) {
      continue;
    }

    url.searchParams.set(key, value);
  }

  return `${url.pathname}${url.search}`;
}
