// A deterministic, stable id derived from a resolution's content. Used as the
// `origin` for Love Map learnings so re-saving the same refocus resolution
// upserts the same rows instead of creating duplicates.
export function learningOrigin(agree: string[], wayback: string): string {
  const seed = [...agree, wayback].join('|');
  let hash = 5381;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) + hash + seed.charCodeAt(i)) | 0;
  }
  return (hash >>> 0).toString(36);
}
