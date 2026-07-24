const VIDEO_ID_PATTERNS = [
  /(?:https?:\/\/)?(?:www\.|music\.|m\.)?youtube\.com\/watch\?(?:[^ ]*&)?v=([\w-]{11})/,
  /(?:https?:\/\/)?(?:www\.|m\.)?youtu\.be\/([\w-]{11})/,
  /(?:https?:\/\/)?(?:www\.|m\.)?youtube\.com\/shorts\/([\w-]{11})/,
];

/**
 * Extracts an 11-char YouTube video ID from a watch/youtu.be/shorts URL, or
 * null if the text isn't one. Direct video-URL loads route through a
 * youtube-source code path that skips the TV client (our only OAuth-capable
 * one, needed since YouTube now gates most videos behind login) — searching
 * by the same ID instead hits the path that does include it.
 */
export function extractYoutubeVideoId(text) {
  for (const pattern of VIDEO_ID_PATTERNS) {
    const match = text.match(pattern);
    if (match) return match[1];
  }
  return null;
}
