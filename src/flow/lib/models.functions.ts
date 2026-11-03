import { createServerFn } from "@tanstack/react-start";

import { getCatalog } from "@/flow/lib/gateway-catalog.server";

export const listModels = createServerFn({ method: "GET" }).handler(async () => {
  const catalog = await getCatalog();
  return {
    publicOnly: catalog.publicOnly,
    models: catalog.models.map((m) => ({
      id: m.id,
      input: m.input,
      output: m.output,
    })),
  };
});

export type ModelCatalogResult = Awaited<ReturnType<typeof listModels>>;
