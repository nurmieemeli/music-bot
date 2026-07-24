import { SlashCommandBuilder } from "discord.js";
import { requireActivePlayer } from "../util/voice.js";
import { infoEmbed } from "../util/embeds.js";

export default {
  data: new SlashCommandBuilder().setName("stop").setDescription("Stop playback, clear the queue, and leave the voice channel."),

  async execute(interaction, client) {
    const player = await requireActivePlayer(interaction, client);
    if (!player) return;

    await player.destroy();
    await interaction.reply({ embeds: [infoEmbed("⏹️ Stopped and left the voice channel.")], ephemeral: true });
  },
};
