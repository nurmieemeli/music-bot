const ENTITIES = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  "#x27": "'",
  "#39": "'",
  apos: "'",
  nbsp: " ",
};

function decodeEntities(str) {
  return str.replace(/&(#x?[0-9a-f]+|[a-z0-9]+);/gi, (match, code) => {
    if (code[0] === "#") {
      const codePoint = code[1]?.toLowerCase() === "x" ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : match;
    }
    return ENTITIES[code.toLowerCase()] ?? match;
  });
}

function extractLyricsContainers(html) {
  const openTagRe = /<div[^>]*data-lyrics-container=["']true["'][^>]*>/gi;
  const blocks = [];
  let match;

  while ((match = openTagRe.exec(html))) {
    const start = match.index + match[0].length;
    let depth = 1;
    let cursor = start;
    const tagRe = /<div\b[^>]*>|<\/div>/gi;
    tagRe.lastIndex = start;

    let tagMatch;
    while ((tagMatch = tagRe.exec(html))) {
      if (tagMatch[0].startsWith("</")) depth--;
      else depth++;

      if (depth === 0) {
        cursor = tagMatch.index;
        break;
      }
    }

    blocks.push(html.slice(start, cursor));
    openTagRe.lastIndex = cursor;
  }

  return blocks;
}

function htmlToText(fragment) {
  return decodeEntities(
    fragment
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div)>/gi, "\n")
      .replace(/<[^>]+>/g, ""),
  )
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Looks up a song on Genius and scrapes its lyrics page.
 * Returns null if no confident match or no lyrics were found.
 */
export async function fetchLyrics({ apiKey, title, artist }) {
  const query = [title, artist].filter(Boolean).join(" ");
  const searchRes = await fetch(`https://api.genius.com/search?q=${encodeURIComponent(query)}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!searchRes.ok) return null;

  const searchData = await searchRes.json();
  const hits = searchData?.response?.hits?.filter((h) => h.type === "song") ?? [];
  if (hits.length === 0) return null;

  const best = hits[0].result;

  const pageRes = await fetch(best.url);
  if (!pageRes.ok) return null;
  const html = await pageRes.text();

  const blocks = extractLyricsContainers(html);
  if (blocks.length === 0) return null;

  const lyrics = blocks.map(htmlToText).join("\n\n").trim();
  if (!lyrics) return null;

  return { lyrics, title: best.full_title ?? best.title, url: best.url };
}
