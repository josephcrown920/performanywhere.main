// Server-only gateway model catalog with a small cache.
// Model availability must come from the authenticated listing, never memory.

export type CatalogModel = {
  id: string;
  input: string[];
  output: string[];
};

export type Catalog = {
  models: CatalogModel[];
  fetchedAt: number;
  publicOnly: boolean;
};

const CACHE_TTL_MS = 5 * 60 * 1000;
let cache: Catalog | null = null;

export async function getCatalog(): Promise<Catalog> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) return cache;
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) return { models: [], fetchedAt: Date.now(), publicOnly: true };

  const response = await fetch("https://ai.gateway.lovable.dev/v1/models", {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!response.ok) {
    // Keep serving the previous catalog when a refresh fails.
    return cache ?? { models: [], fetchedAt: Date.now(), publicOnly: true };
  }
  const json = (await response.json()) as {
    data?: {
      id?: string;
      modalities?: { input?: string[]; output?: string[] };
    }[];
    meta?: { workspace_models?: string };
  };
  const models: CatalogModel[] = (json.data ?? [])
    .filter((m) => typeof m.id === "string")
    .map((m) => ({
      id: m.id as string,
      input: m.modalities?.input ?? [],
      output: m.modalities?.output ?? [],
    }));
  cache = {
    models,
    fetchedAt: Date.now(),
    publicOnly: (json.meta?.workspace_models ?? "").startsWith("public_only"),
  };
  return cache;
}

/** A model id may only be used when the live catalog lists it. */
export async function isKnownModel(id: string): Promise<boolean> {
  if (!id || !id.includes("/")) return false;
  const catalog = await getCatalog();
  return catalog.models.some((m) => m.id === id);
}
