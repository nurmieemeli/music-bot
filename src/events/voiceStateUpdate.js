const EMPTY_CHANNEL_TIMEOUT_MS = 15_000;
const emptyChannelTimers = new Map();

export default {
  name: "voiceStateUpdate",
  async execute(oldState, newState, client) {
    const guildId = oldState.guild?.id ?? newState.guild?.id;
    const player = client.lavalink.getPlayer(guildId);
    if (!player) return;

    const voiceChannel = oldState.guild.channels.cache.get(player.voiceChannelId);
    if (!voiceChannel) return;

    const humanCount = voiceChannel.members.filter((m) => !m.user.bot).size;

    if (humanCount === 0) {
      if (emptyChannelTimers.has(guildId)) return;
      const timer = setTimeout(async () => {
        emptyChannelTimers.delete(guildId);
        const stillThere = client.lavalink.getPlayer(guildId);
        if (!stillThere) return;
        const channel = oldState.guild.channels.cache.get(stillThere.voiceChannelId);
        const stillEmpty = !channel || channel.members.filter((m) => !m.user.bot).size === 0;
        if (stillEmpty) await stillThere.destroy().catch(() => {});
      }, EMPTY_CHANNEL_TIMEOUT_MS);
      emptyChannelTimers.set(guildId, timer);
    } else {
      const timer = emptyChannelTimers.get(guildId);
      if (timer) {
        clearTimeout(timer);
        emptyChannelTimers.delete(guildId);
      }
    }
  },
};
