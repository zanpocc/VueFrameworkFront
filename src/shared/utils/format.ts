/**
 * Format a byte count as a human-readable size string.
 *
 * @example
 * ```ts
 * formatSize(512)       // '512 B'
 * formatSize(2048)      // '2.0 KB'
 * formatSize(3145728)   // '3.0 MB'
 * ```
 */
export function formatSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
