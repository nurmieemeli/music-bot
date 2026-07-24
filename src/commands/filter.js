import { SlashCommandBuilder } from "discord.js";
import { requireActivePlayer } from "../util/voice.js";
import { infoEmbed } from "../util/embeds.js";

const APPLY = {
  bassboost: (fm) => fm.setEQPreset("BassboostMedium"),
  nightcore: (fm) => fm.toggleNightcore(),
  vaporwave: (fm) => fm.toggleVaporwave(),
  karaoke: (fm) => fm.toggleKaraoke(),
  "8d": (fm) => fm.toggleRotation(0.2),
  clear: (fm) => fm.resetFilters(),
};

const LABELS = {
  bassboost: "🎚️ Bassboost enabled.",
  nightcore: "⏫ Nightcore enabled.",
  vaporwave: "🌊 Vaporwave enabled.",
  karaoke: "🎤 Karaoke filter enabled.",
  "8d": "🎧 8D audio enabled.",
  clear: "🧹 Filters cleared.",
};

export default {
  data: new SlashCommandBuilder()
    .setName("filter")
    .setDescription("Apply an audio filter to playback.")
    .addStringOption((opt) =>
      opt
        .setName("type")
        .setDescription("Filter to apply")
        .setRequired(true)
        .addChoices(
          { name: "Bassboost", value: "bassboost" },
          { name: "Nightcore", value: "nightcore" },
          { name: "Vaporwave", value: "vaporwave" },
          { name: "Karaoke", value: "karaoke" },
          { name: "8D", value: "8d" },
          { name: "Clear filters", value: "clear" },
        ),
    ),

  async execute(interaction, client) {
    const player = await requireActivePlayer(interaction, client);
    if (!player) return;

    const type = interaction.options.getString("type", true);
    await APPLY[type](player.filterManager);

    await interaction.reply({ embeds: [infoEmbed(LABELS[type])], ephemeral: true });
  },
};
