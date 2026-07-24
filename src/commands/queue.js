import { SlashCommandBuilder } from "discord.js";
import { requireActivePlayer } from "../util/voice.js";
import { queueEmbed } from "../util/embeds.js";

export default {
  data: new SlashCommandBuilder()
    .setName("queue")
    .setDescription("Show the current queue.")
    .addIntegerOption((opt) => opt.setName("page").setDescription("Page number").setMinValue(1)),

  async execute(interaction, client) {
    const player = await requireActivePlayer(interaction, client);
    if (!player) return;

    const page = (interaction.options.getInteger("page") ?? 1) - 1;
    await interaction.reply({ embeds: [queueEmbed(player, Math.max(0, page))], ephemeral: true });
  },
};
