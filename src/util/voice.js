import { PermissionsBitField, MessageFlags } from "discord.js";
import { errorEmbed } from "./embeds.js";

export function getVoiceChannel(interaction) {
  return interaction.member?.voice?.channel ?? null;
}

/** Replies with an ephemeral error whether or not the interaction was already deferred. */
async function replyError(interaction, message) {
  const payload = { embeds: [errorEmbed(message)] };
  if (interaction.deferred || interaction.replied) {
    await interaction.editReply(payload);
  } else {
    await interaction.reply({ ...payload, flags: MessageFlags.Ephemeral });
  }
}

/**
 * Gets the existing player for the guild, or creates+connects a new one in the
 * invoking member's voice channel. Replies with an error and returns null if the
 * member isn't in a voice channel, or is in a different one than an active player.
 */
export async function getOrCreatePlayer(interaction, client) {
  const voiceChannel = getVoiceChannel(interaction);
  const existing = client.lavalink.getPlayer(interaction.guildId);

  if (!voiceChannel) {
    if (existing) return existing;
    await replyError(interaction, "Join a voice channel first.");
    return null;
  }

  if (existing && existing.voiceChannelId !== voiceChannel.id) {
    await replyError(interaction, "I'm already playing in another voice channel in this server.");
    return null;
  }

  if (existing) return existing;

  const permissions = voiceChannel.permissionsFor(interaction.guild.members.me);
  if (!permissions?.has(PermissionsBitField.Flags.Connect) || !permissions?.has(PermissionsBitField.Flags.Speak)) {
    await replyError(interaction, "I don't have permission to join or speak in that voice channel.");
    return null;
  }

  const player = client.lavalink.createPlayer({
    guildId: interaction.guildId,
    voiceChannelId: voiceChannel.id,
    textChannelId: interaction.channelId,
    selfDeaf: true,
    selfMute: false,
    volume: 100,
  });

  await player.connect();
  return player;
}

/**
 * For control commands (skip/pause/stop/...): requires an active player and the
 * invoking member to be in the same voice channel as the bot.
 */
export async function requireActivePlayer(interaction, client) {
  const player = client.lavalink.getPlayer(interaction.guildId);
  if (!player) {
    await replyError(interaction, "Nothing is playing.");
    return null;
  }

  const voiceChannel = getVoiceChannel(interaction);
  if (!voiceChannel || voiceChannel.id !== player.voiceChannelId) {
    await replyError(interaction, "You need to be in the same voice channel as the bot.");
    return null;
  }

  return player;
}
