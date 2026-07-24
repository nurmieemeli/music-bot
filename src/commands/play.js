import { SlashCommandBuilder } from "discord.js";
import { getOrCreatePlayer } from "../util/voice.js";
import { errorEmbed, infoEmbed } from "../util/embeds.js";
import { respondWithSuggestions } from "../util/youtubeSuggest.js";
import { extractYoutubeVideoId } from "../util/youtubeUrl.js";

export default {
  data: new SlashCommandBuilder()
    .setName("play")
    .setDescription("Play a song from a YouTube, Spotify, or SoundCloud link, or a search query.")
    .addStringOption((opt) =>
      opt.setName("query").setDescription("A link or search text").setRequired(true).setAutocomplete(true),
    ),

  autocomplete: respondWithSuggestions,

  async execute(interaction, client) {
    await interaction.deferReply({ ephemeral: true });

    const player = await getOrCreatePlayer(interaction, client);
    if (!player) return;

    const rawQuery = interaction.options.getString("query", true);
    const videoId = extractYoutubeVideoId(rawQuery);
    const query = videoId ? `ytsearch:${videoId}` : rawQuery;
    const res = await player.search({ query }, interaction.user);

    if (res.loadType === "error") {
      await interaction.editReply({ embeds: [errorEmbed(res.exception?.message ?? "Failed to load that track.")] });
      return;
    }

    if (res.loadType === "empty" || res.tracks.length === 0) {
      await interaction.editReply({ embeds: [errorEmbed("No results found for that query.")] });
      return;
    }

    if (res.loadType === "playlist") {
      await player.queue.add(res.tracks);
      await interaction.editReply({
        embeds: [
          infoEmbed(
            `📜 Queued **${res.tracks.length}** tracks from playlist **${res.playlist?.name ?? "playlist"}**.`,
          ),
        ],
      });
    } else {
      const track = res.tracks[0];
      await player.queue.add(track);
      await interaction.editReply({
        embeds: [infoEmbed(`✅ Queued [${track.info.title}](${track.info.uri})`)],
      });
    }

    if (!player.playing && !player.paused) await player.play();
  },
};
