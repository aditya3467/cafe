/** Q85 derivatives approved after the nine-frame pilot. PNG originals stay intact. */
export const FRAME_SEQUENCE = Object.freeze({
  directory: new URL('../assets/derived/hero/frames-webp-q85/', import.meta.url).href,
  pngDirectory: new URL('../assets/derived/hero/frames-clean/', import.meta.url).href,
  prefix: 'frame_', extension: '.webp', padding: 6,
  first: 1, last: 239, count: 239, width: 1280, height: 720, hasAlpha: false,
});

export function getFrameSource(frameNumber, format = 'webp') {
  const s = FRAME_SEQUENCE;
  if (!Number.isInteger(frameNumber) || frameNumber < s.first || frameNumber > s.last) {
    throw new RangeError(`Frame number must be an integer from ${s.first} to ${s.last}.`);
  }
  const png = format === 'png';
  return `${png ? s.pngDirectory : s.directory}${s.prefix}${String(frameNumber).padStart(s.padding, '0')}${png ? '.png' : s.extension}`;
}
