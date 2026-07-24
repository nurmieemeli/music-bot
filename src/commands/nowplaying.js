import { SlashCommandBuilder } from "discord.js";
import { requireActivePlayer } from "../util/voice.js";
import { nowPlayingEmbed } from "../util/embeds.js";

export default {
  data: new SlashCommandBuilder().setName("nowplaying").setDescription("Show the currently playing track."),

  async execute(interaction, client) {
    const player = await requireActivePlayer(interaction, client);
    if (!player) return;

    await interaction.reply({ embeds: [nowPlayingEmbed(player)] });
  },
};
