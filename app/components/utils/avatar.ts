// utils/avatar.ts
export function svgToDataUrl(svg: string) {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function randomSeed() {
  return Math.random().toString(36).slice(2, 10);
}
