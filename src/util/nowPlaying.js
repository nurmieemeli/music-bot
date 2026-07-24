import { infoEmbed, nowPlayingEmbed } from "./embeds.js";
import { buildControlsRows } from "./controls.js";

async function fetchStoredMessage(client, player) {
  const stored = player.getData("nowPlayingMessage");
  if (!stored) return null;

  try {
    const channel = await client.channels.fetch(stored.channelId);
    if (!channel?.isTextBased()) return null;
    return await channel.messages.fetch(stored.messageId);
  } catch {
    return null;
  }
}

/** Edits the panel message in place if it exists, otherwise sends (and remembers) one. */
async function upsertPanel(client, player, payload) {
  const existing = await fetchStoredMessage(client, player);
  if (existing) {
    await existing.edit(payload).catch(() => {});
    return;
  }

  if (!player.textChannelId) return;
  const channel = await client.channels.fetch(player.textChannelId).catch(() => null);
  if (!channel?.isTextBased()) return;

  const message = await channel.send(payload).catch(() => null);
  if (message) player.setData("nowPlayingMessage", { channelId: channel.id, messageId: message.id });
}

/** The one visible message per guild — sent once, then edited in place for everything after. */
export async function showNowPlaying(client, player) {
  const track = player.queue.current;
  if (!track) return;
  await upsertPanel(client, player, { embeds: [nowPlayingEmbed(player)], components: buildControlsRows(player) });
}

/** Edits the panel in place (progress tick, button state change) without re-sending it. */
export async function refreshNowPlaying(client, player) {
  const existing = await fetchStoredMessage(client, player);
  if (!existing) return;
  await existing.edit({ embeds: [nowPlayingEmbed(player)], components: buildControlsRows(player) }).catch(() => {});
}

/** Flashes a plain status line into the same panel — used for errors, stalls, etc. Never posts a new message. */
export async function flashPanelStatus(client, player, embed) {
  await upsertPanel(client, player, { embeds: [embed], components: [] });
}

/** Replaces the panel with a plain status line and removes the buttons (queue end, disconnect). */
export async function finalizeNowPlaying(client, player, message) {
  const existing = await fetchStoredMessage(client, player);
  if (!existing) return;
  await existing.edit({ embeds: [infoEmbed(message)], components: [] }).catch(() => {});
}
