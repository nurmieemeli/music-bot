const ENDPOINT = "https://suggestqueries-clients6.youtube.com/complete/search";

/** Fast, lightweight search-term suggestions for slash command autocomplete (not track resolution). */
export async function getSuggestions(query) {
  const url = `${ENDPOINT}?client=youtube&ds=yt&q=${encodeURIComponent(query)}`;
  const res = await fetch(url);
  if (!res.ok) return [];

  const body = await res.text();
  const match = body.match(/^window\.google\.ac\.h\((.*)\)$/s);
  if (!match) return [];

  let data;
  try {
    data = JSON.parse(match[1]);
  } catch {
    return [];
  }

  const suggestions = data?.[1] ?? [];
  return suggestions.map((entry) => String(entry[0]).replace(/<\/?b>/g, "")).slice(0, 25);
}

/** Shared autocomplete handler for any command with a free-text "query" option. */
export async function respondWithSuggestions(interaction) {
  const focused = interaction.options.getFocused();

  if (!focused || focused.length < 2 || /^https?:\/\//i.test(focused)) {
    await interaction.respond([]);
    return;
  }

  const suggestions = await getSuggestions(focused).catch(() => []);
  await interaction.respond(suggestions.map((s) => ({ name: s.slice(0, 100), value: s.slice(0, 100) })));
}
