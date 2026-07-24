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

/** Sends the now-playing message, or edits the existing one in place for a new track. */
export async function showNowPlaying(client, player) {
  const track = player.queue.current;
  if (!track) return;

  const payload = { embeds: [nowPlayingEmbed(player)], components: buildControlsRows(player) };

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

/** Edits the existing now-playing message in place (progress tick, button state change). */
export async function refreshNowPlaying(client, player) {
  const existing = await fetchStoredMessage(client, player);
  if (!existing) return;
  await existing.edit({ embeds: [nowPlayingEmbed(player)], components: buildControlsRows(player) }).catch(() => {});
}

/** Replaces the now-playing message with a plain status line and removes the buttons. */
export async function finalizeNowPlaying(client, player, message) {
  const existing = await fetchStoredMessage(client, player);
  if (!existing) return;
  await existing.edit({ embeds: [infoEmbed(message)], components: [] }).catch(() => {});
}
