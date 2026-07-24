import { SlashCommandBuilder, MessageFlags } from "discord.js";
import { requireActivePlayer } from "../util/voice.js";
import { infoEmbed, errorEmbed } from "../util/embeds.js";

export default {
  data: new SlashCommandBuilder().setName("skip").setDescription("Skip the current track."),

  async execute(interaction, client) {
    const player = await requireActivePlayer(interaction, client);
    if (!player) return;

    if (!player.queue.current) {
      await interaction.reply({ embeds: [errorEmbed("Nothing is playing.")], flags: MessageFlags.Ephemeral });
      return;
    }

    const skipped = player.queue.current;
    await player.skip();
    await interaction.reply({ embeds: [infoEmbed(`⏭️ Skipped **${skipped.info.title}**.`)], flags: MessageFlags.Ephemeral });
  },
};
