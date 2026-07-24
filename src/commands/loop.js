import { SlashCommandBuilder } from "discord.js";
import { requireActivePlayer } from "../util/voice.js";
import { infoEmbed } from "../util/embeds.js";

export default {
  data: new SlashCommandBuilder()
    .setName("loop")
    .setDescription("Set the loop mode.")
    .addStringOption((opt) =>
      opt
        .setName("mode")
        .setDescription("Loop mode")
        .setRequired(true)
        .addChoices(
          { name: "Off", value: "off" },
          { name: "Track", value: "track" },
          { name: "Queue", value: "queue" },
        ),
    ),

  async execute(interaction, client) {
    const player = await requireActivePlayer(interaction, client);
    if (!player) return;

    const mode = interaction.options.getString("mode", true);
    await player.setRepeatMode(mode);

    const labels = { off: "🔁 Loop disabled.", track: "🔂 Looping current track.", queue: "🔁 Looping the queue." };
    await interaction.reply({ embeds: [infoEmbed(labels[mode])] });
  },
};
