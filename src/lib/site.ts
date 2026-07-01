export type SiteConfig = {
  developmentWebsite: boolean;
  productionWebsiteUrl: string;
};

type SiteConfigResponse = SiteConfig;

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

  return response.json() as Promise<SiteConfigResponse>;
}
