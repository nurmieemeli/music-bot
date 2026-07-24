import { errorEmbed } from "./embeds.js";

export function getVoiceChannel(interaction) {
  return interaction.member?.voice?.channel ?? null;
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
    await interaction.reply({ embeds: [errorEmbed("Join a voice channel first.")], ephemeral: true });
    return null;
  }

  if (existing && existing.voiceChannelId !== voiceChannel.id) {
    await interaction.reply({
      embeds: [errorEmbed("I'm already playing in another voice channel in this server.")],
      ephemeral: true,
    });
    return null;
  }

  if (existing) return existing;

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
    await interaction.reply({ embeds: [errorEmbed("Nothing is playing.")], ephemeral: true });
    return null;
  }

  const voiceChannel = getVoiceChannel(interaction);
  if (!voiceChannel || voiceChannel.id !== player.voiceChannelId) {
    await interaction.reply({
      embeds: [errorEmbed("You need to be in the same voice channel as the bot.")],
      ephemeral: true,
    });
    return null;
  }

  return player;
}
