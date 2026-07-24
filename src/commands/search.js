import { SlashCommandBuilder, StringSelectMenuBuilder, ActionRowBuilder, MessageFlags } from "discord.js";
import { getOrCreatePlayer } from "../util/voice.js";
import { errorEmbed, infoEmbed } from "../util/embeds.js";
import { formatDuration } from "../util/time.js";
import { respondWithSuggestions } from "../util/youtubeSuggest.js";

const PENDING_TTL_MS = 60_000;
const pendingSearches = new Map();

export default {
  data: new SlashCommandBuilder()
    .setName("search")
    .setDescription("Search YouTube and pick a result to queue.")
    .addStringOption((opt) =>
      opt.setName("query").setDescription("What to search for").setRequired(true).setAutocomplete(true),
    ),

  autocomplete: respondWithSuggestions,

  async execute(interaction, client) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const player = await getOrCreatePlayer(interaction, client);
    if (!player) return;

    const query = interaction.options.getString("query", true);
    const res = await player.search({ query: `ytsearch:${query}` }, interaction.user);

    if (res.loadType === "error" || res.loadType === "empty" || res.tracks.length === 0) {
      await interaction.editReply({ embeds: [errorEmbed("No results found for that query.")] });
      return;
    }

    const tracks = res.tracks.slice(0, 5);
    const token = interaction.id;

    const timer = setTimeout(() => pendingSearches.delete(token), PENDING_TTL_MS);
    pendingSearches.set(token, { tracks, requesterId: interaction.user.id, timer });

    const menu = new StringSelectMenuBuilder()
      .setCustomId(`search-select:${token}`)
      .setPlaceholder("Choose a track to queue")
      .addOptions(
        tracks.map((t, i) => ({
          label: t.info.title.slice(0, 100),
          description: `${t.info.author ?? "Unknown"} • ${formatDuration(t.info.duration)}`.slice(0, 100),
          value: String(i),
        })),
      );

    await interaction.editReply({
      embeds: [infoEmbed(`Results for **${query}** — pick one below (expires in 60s):`)],
      components: [new ActionRowBuilder().addComponents(menu)],
    });
  },
};

export async function handleSearchSelect(interaction, client) {
  const token = interaction.customId.split(":")[1];
  const pending = pendingSearches.get(token);

  if (!pending) {
    await interaction.update({ embeds: [errorEmbed("This search has expired.")], components: [] });
    return;
  }

  if (interaction.user.id !== pending.requesterId) {
    await interaction.reply({ embeds: [errorEmbed("Only the person who searched can pick a result.")], flags: MessageFlags.Ephemeral });
    return;
  }

  clearTimeout(pending.timer);
  pendingSearches.delete(token);

  const track = pending.tracks[Number(interaction.values[0])];

  const player = client.lavalink.getPlayer(interaction.guildId);
  if (!player) {
    await interaction.update({ embeds: [errorEmbed("I'm no longer connected to a voice channel.")], components: [] });
    return;
  }

  await player.queue.add(track);
  await interaction.update({
    embeds: [infoEmbed(`✅ Queued [${track.info.title}](${track.info.uri})`)],
    components: [],
  });

  if (!player.playing && !player.paused) await player.play();
}
