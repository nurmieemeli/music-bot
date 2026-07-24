import { SlashCommandBuilder, MessageFlags } from "discord.js";
import { requireActivePlayer } from "../util/voice.js";
import { infoEmbed } from "../util/embeds.js";
import { refreshNowPlaying } from "../util/nowPlaying.js";

export default {
  data: new SlashCommandBuilder()
    .setName("volume")
    .setDescription("Set the playback volume.")
    .addIntegerOption((opt) =>
      opt.setName("level").setDescription("0-150").setRequired(true).setMinValue(0).setMaxValue(150),
    ),

  async execute(interaction, client) {
    const player = await requireActivePlayer(interaction, client);
    if (!player) return;

    const level = interaction.options.getInteger("level", true);
    await player.setVolume(level);

    await interaction.reply({ embeds: [infoEmbed(`🔊 Volume set to ${level}%.`)], flags: MessageFlags.Ephemeral });
    await refreshNowPlaying(client, player);
  },
};
