import { SlashCommandBuilder } from "discord.js";
import { requireActivePlayer } from "../util/voice.js";
import { infoEmbed, errorEmbed } from "../util/embeds.js";

export default {
  data: new SlashCommandBuilder().setName("resume").setDescription("Resume playback."),

  async execute(interaction, client) {
    const player = await requireActivePlayer(interaction, client);
    if (!player) return;

    if (!player.paused) {
      await interaction.reply({ embeds: [errorEmbed("Not paused.")], ephemeral: true });
      return;
    }

    await player.resume();
    await interaction.reply({ embeds: [infoEmbed("▶️ Resumed.")] });
  },
};
