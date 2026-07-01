export type SiteConfig = {
  developmentWebsite: boolean;
  productionWebsiteUrl: string;
};

type SiteConfigResponse = SiteConfig;

function isSiteConfigResponse(value: unknown): value is SiteConfigResponse {
  return typeof value === "object"
    && value !== null
    && "developmentWebsite" in value
    && typeof (value as { developmentWebsite?: unknown }).developmentWebsite === "boolean"
    && "productionWebsiteUrl" in value
    && typeof (value as { productionWebsiteUrl?: unknown }).productionWebsiteUrl === "string";
}

export async function fetchSiteConfig(): Promise<SiteConfig> {
  const response = await fetch("/api/site", {
    cache: "no-store",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Unable to load site configuration.");
  }

  const body: unknown = await response.json();

  if (!isSiteConfigResponse(body)) {
    throw new Error("Invalid site configuration response.");
  }

  return body;
}
