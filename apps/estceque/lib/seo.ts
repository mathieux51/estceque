import type { Metadata } from 'next'

const DEFAULT_IMAGE = { url: '/mascotte.jpeg', width: 1400, height: 1400 }

const SUFFIX = " | Est-ce que t'entends"

/**
 * The page title, never cut: search engines rank on all of it even when they
 * only show about 60 characters, and the end often tells episodes apart. The
 * site name is added only when the result stays short.
 */
export function pageTitle(title: string): Metadata['title'] {
  return title.length + SUFFIX.length <= 65 ? title : { absolute: title }
}

/** Metadata of a page: title, description, canonical address and previews. */
export function pageMetadata({
  title,
  description,
  path,
  image,
  type = 'website',
  publishedTime,
}: {
  title: string
  description: string
  path: string
  image?: string | null
  type?: 'website' | 'article'
  publishedTime?: string
}): Metadata {
  const images = image
    ? [{ url: image, width: 1400, height: 1400 }]
    : [DEFAULT_IMAGE]
  return {
    title: pageTitle(title),
    description,
    alternates: { canonical: path },
    openGraph: {
      type,
      title,
      description,
      url: path,
      images,
      ...(publishedTime ? { publishedTime } : {}),
    },
    twitter: {
      card: 'summary',
      title,
      description,
      images: images.map((i) => i.url),
    },
  }
}
