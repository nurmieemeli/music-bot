import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";

const LOOP_EMOJI = { off: "🔁", track: "🔂", queue: "🔁" };

export function buildControlsRows(player) {
  const primaryRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("mb:pauseresume")
      .setEmoji(player.paused ? "▶️" : "⏸️")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("mb:skip").setEmoji("⏭️").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("mb:stop").setEmoji("⏹️").setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId("mb:loop")
      .setEmoji(LOOP_EMOJI[player.repeatMode] ?? "🔁")
      .setStyle(player.repeatMode !== "off" ? ButtonStyle.Success : ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("mb:shuffle").setEmoji("🔀").setStyle(ButtonStyle.Secondary),
  );

  const volumeRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("mb:voldown")
      .setEmoji("🔉")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(player.volume <= 0),
    new ButtonBuilder()
      .setCustomId("mb:volup")
      .setEmoji("🔊")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(player.volume >= 150),
  );

  return [primaryRow, volumeRow];
}
