/** Ausha serves its images in several sizes: ask for a small one in lists. */
export function aushaImage(
  url: string | null,
  size: 400 | 1400 = 400
): string | null {
  return url
    ? url.replace(/_\d+x\d+\.(jpe?g|png)$/, `_${size}x${size}.$1`)
    : null
}
