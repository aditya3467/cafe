/** Prepared cleaned sequence, referenced in place without duplicating any images. */
export const FRAME_SEQUENCE = Object.freeze({
  directory: new URL('../assets/derived/hero/frames-clean/', import.meta.url).href,
  prefix: 'frame_', extension: '.png', padding: 6,
  first: 1, last: 239, count: 239, width: 1280, height: 720, hasAlpha: false,
});

export function getFrameSource(frameNumber) {
  const s = FRAME_SEQUENCE;
  if (!Number.isInteger(frameNumber) || frameNumber < s.first || frameNumber > s.last) {
    throw new RangeError(`Frame number must be an integer from ${s.first} to ${s.last}.`);
  }
  return `${s.directory}${s.prefix}${String(frameNumber).padStart(s.padding, '0')}${s.extension}`;
}
