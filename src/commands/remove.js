import { SlashCommandBuilder, MessageFlags } from "discord.js";
import { requireActivePlayer } from "../util/voice.js";
import { infoEmbed, errorEmbed } from "../util/embeds.js";

export default {
  data: new SlashCommandBuilder()
    .setName("remove")
    .setDescription("Remove a track from the queue.")
    .addIntegerOption((opt) =>
      opt.setName("position").setDescription("Queue position (see /queue)").setRequired(true).setMinValue(1),
    ),

  async execute(interaction, client) {
    const player = await requireActivePlayer(interaction, client);
    if (!player) return;

    const position = interaction.options.getInteger("position", true);
    const index = position - 1;

    if (index < 0 || index >= player.queue.tracks.length) {
      await interaction.reply({ embeds: [errorEmbed("Invalid queue position.")], flags: MessageFlags.Ephemeral });
      return;
    }

    const [removedTrack] = player.queue.tracks.slice(index, index + 1);
    await player.queue.remove(index);

    await interaction.reply({
      embeds: [infoEmbed(`🗑️ Removed **${removedTrack.info.title}** from the queue.`)],
      flags: MessageFlags.Ephemeral,
    });
  },
};
