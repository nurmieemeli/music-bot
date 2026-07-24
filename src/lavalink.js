import { LavalinkManager } from "lavalink-client";
import { nowPlayingEmbed, infoEmbed, errorEmbed } from "./util/embeds.js";

async function sendToTextChannel(client, player, payload) {
  if (!player.textChannelId) return;
  try {
    const channel = await client.channels.fetch(player.textChannelId);
    if (channel?.isTextBased()) await channel.send(payload);
  } catch {
    // channel gone or no permission — ignore, playback continues regardless
  }
}

export function createLavalinkManager(client) {
  const manager = new LavalinkManager({
    nodes: [
      {
        id: "main",
        host: process.env.LAVALINK_HOST || "localhost",
        port: Number(process.env.LAVALINK_PORT) || 2333,
        authorization: process.env.LAVALINK_PASSWORD,
        retryAmount: 10,
        retryDelay: 10_000,
      },
    ],
    sendToShard: (guildId, payload) => client.guilds.cache.get(guildId)?.shard?.send(payload),
    client: {
      id: process.env.DISCORD_CLIENT_ID,
      username: "MusicBot",
    },
    autoSkip: true,
    playerOptions: {
      clientBasedPositionUpdateInterval: 150,
      defaultSearchPlatform: "ytsearch",
      volumeDecrementer: 0.75,
      onDisconnect: {
        autoReconnect: true,
        destroyPlayer: false,
      },
      onEmptyQueue: {
        destroyAfterMs: 30_000,
      },
    },
    queueOptions: {
      maxPreviousTracks: 25,
    },
  });

  manager.on("trackStart", (player) => {
    sendToTextChannel(client, player, { embeds: [nowPlayingEmbed(player)] });
  });

  manager.on("queueEnd", (player) => {
    sendToTextChannel(client, player, { embeds: [infoEmbed("Queue finished. Add more with `/play`.")] });
  });

  manager.on("trackError", (player, track) => {
    sendToTextChannel(client, player, {
      embeds: [errorEmbed(`Failed to play **${track?.info?.title ?? "track"}**, skipping.`)],
    });
  });

  manager.on("trackStuck", (player, track) => {
    sendToTextChannel(client, player, {
      embeds: [errorEmbed(`Playback stalled on **${track?.info?.title ?? "track"}**, skipping.`)],
    });
  });

  manager.nodeManager.on("connect", (node) => {
    console.log(`[Lavalink] Node "${node.id}" connected.`);
  });

  manager.nodeManager.on("error", (node, error) => {
    console.error(`[Lavalink] Node "${node.id}" error:`, error);
  });

  client.on("raw", (d) => client.lavalink.sendRawData(d));

  return manager;
}
