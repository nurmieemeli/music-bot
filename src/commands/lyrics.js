import { SlashCommandBuilder } from "discord.js";
import { fetchLyrics } from "../util/lyrics.js";
import { requireActivePlayer } from "../util/voice.js";
import { infoEmbed, errorEmbed } from "../util/embeds.js";

const EMBED_DESCRIPTION_LIMIT = 4096;

export default {
  data: new SlashCommandBuilder().setName("lyrics").setDescription("Get lyrics for the currently playing track."),

  async execute(interaction, client) {
    const player = await requireActivePlayer(interaction, client);
    if (!player) return;

    const track = player.queue.current;
    if (!track) {
      await interaction.reply({ embeds: [errorEmbed("Nothing is playing.")], ephemeral: true });
      return;
    }

    await interaction.deferReply();

    if (!process.env.GENIUS_API_KEY) {
      await interaction.editReply({ embeds: [errorEmbed("Lyrics lookup isn't configured (missing GENIUS_API_KEY).")] });
      return;
    }

    const result = await fetchLyrics({
      apiKey: process.env.GENIUS_API_KEY,
      title: track.info.title,
      artist: track.info.author ?? "",
    }).catch(() => null);

    if (!result) {
      await interaction.editReply({ embeds: [errorEmbed(`No lyrics found for **${track.info.title}**.`)] });
      return;
    }

    const truncated =
      result.lyrics.length > EMBED_DESCRIPTION_LIMIT
        ? `${result.lyrics.slice(0, EMBED_DESCRIPTION_LIMIT - 20)}\n…(truncated)`
        : result.lyrics;

    await interaction.editReply({
      embeds: [infoEmbed(truncated).setTitle(`Lyrics: ${result.title}`).setURL(result.url)],
    });
  },
};
