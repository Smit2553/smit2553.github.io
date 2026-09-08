import { createContext, useContext, useEffect, type ReactNode } from "react";

const defaultSiteUrl = "https://smit.codestacx.com";
const MetadataBaseUrlContext = createContext(defaultSiteUrl);

type MetadataProviderProps = {
  baseUrl?: string;
  children: ReactNode;
};

export function MetadataProvider({ baseUrl, children }: MetadataProviderProps) {
  return (
    <MetadataBaseUrlContext.Provider value={baseUrl || defaultSiteUrl}>
      {children}
    </MetadataBaseUrlContext.Provider>
  );
}

type PageMetadataProps = {
  canonicalPath: string;
  description: string;
  imageUrl?: string | null;
  noIndex?: boolean;
  title: string;
  type?: "article" | "website";
};

function setMetaTag(selector: string, attributes: Record<string, string>, content: string): void {
  let element = document.head.querySelector<HTMLMetaElement>(selector);

  if (!element) {
    element = document.createElement("meta");
    Object.entries(attributes).forEach(([name, value]) => element?.setAttribute(name, value));
    document.head.append(element);
  }

  element.setAttribute("content", content);
}

function getAbsoluteUrl(value: string, baseUrl: string): string {
  try {
    return new URL(value, `${baseUrl.replace(/\/$/, "")}/`).toString();
  } catch {
    return new URL(value, `${defaultSiteUrl}/`).toString();
  }
}

export default function PageMetadata({
  canonicalPath,
  description,
  imageUrl,
  noIndex = false,
  title,
  type = "website",
}: PageMetadataProps) {
  const baseUrl = useContext(MetadataBaseUrlContext);

  useEffect(() => {
    const canonicalUrl = getAbsoluteUrl(canonicalPath, baseUrl);
    let canonicalLink = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');

    document.title = title;
    setMetaTag('meta[name="description"]', { name: "description" }, description);
    setMetaTag(
      'meta[name="robots"]',
      { name: "robots" },
      noIndex ? "noindex, nofollow" : "index, follow",
    );
    setMetaTag('meta[property="og:title"]', { property: "og:title" }, title);
    setMetaTag('meta[property="og:description"]', { property: "og:description" }, description);
    setMetaTag('meta[property="og:type"]', { property: "og:type" }, type);
    setMetaTag('meta[property="og:url"]', { property: "og:url" }, canonicalUrl);
    setMetaTag('meta[property="og:site_name"]', { property: "og:site_name" }, "Smit Devrukhkar");
    setMetaTag('meta[name="twitter:title"]', { name: "twitter:title" }, title);
    setMetaTag('meta[name="twitter:description"]', { name: "twitter:description" }, description);
    setMetaTag(
      'meta[name="twitter:card"]',
      { name: "twitter:card" },
      imageUrl ? "summary_large_image" : "summary",
    );

    if (imageUrl) {
      const absoluteImageUrl = getAbsoluteUrl(imageUrl, baseUrl);
      setMetaTag('meta[property="og:image"]', { property: "og:image" }, absoluteImageUrl);
      setMetaTag('meta[name="twitter:image"]', { name: "twitter:image" }, absoluteImageUrl);
    } else {
      document.head.querySelector('meta[property="og:image"]')?.remove();
      document.head.querySelector('meta[name="twitter:image"]')?.remove();
    }

    if (!canonicalLink) {
      canonicalLink = document.createElement("link");
      canonicalLink.setAttribute("rel", "canonical");
      document.head.append(canonicalLink);
    }

    canonicalLink.setAttribute("href", canonicalUrl);
  }, [baseUrl, canonicalPath, description, imageUrl, noIndex, title, type]);

  return null;
}
