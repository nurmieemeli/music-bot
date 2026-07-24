import { SlashCommandBuilder } from "discord.js";
import { getOrCreatePlayer } from "../util/voice.js";
import { errorEmbed, infoEmbed } from "../util/embeds.js";

export default {
  data: new SlashCommandBuilder()
    .setName("playlist")
    .setDescription("Queue an entire YouTube, Spotify, or SoundCloud playlist.")
    .addStringOption((opt) => opt.setName("url").setDescription("Playlist link").setRequired(true)),

  async execute(interaction, client) {
    await interaction.deferReply({ ephemeral: true });

    const player = await getOrCreatePlayer(interaction, client);
    if (!player) return;

    const url = interaction.options.getString("url", true);
    const res = await player.search({ query: url }, interaction.user);

    if (res.loadType === "error") {
      await interaction.editReply({ embeds: [errorEmbed(res.exception?.message ?? "Failed to load that playlist.")] });
      return;
    }

    if (res.loadType !== "playlist" || res.tracks.length === 0) {
      await interaction.editReply({
        embeds: [errorEmbed("That doesn't look like a playlist link. Use `/play` for single tracks.")],
      });
      return;
    }

    await player.queue.add(res.tracks);
    await interaction.editReply({
      embeds: [infoEmbed(`📜 Queued **${res.tracks.length}** tracks from **${res.playlist?.name ?? "playlist"}**.`)],
    });

    if (!player.playing && !player.paused) await player.play();
  },
};
