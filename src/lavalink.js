import { LavalinkManager } from "lavalink-client";
import { errorEmbed, infoEmbed } from "./util/embeds.js";
import { showNowPlaying, refreshNowPlaying, finalizeNowPlaying, flashPanelStatus } from "./util/nowPlaying.js";

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
    showNowPlaying(client, player);
  });

  manager.on("playerUpdate", (_oldPlayerJson, player) => {
    if (player.playing) refreshNowPlaying(client, player);
  });

  manager.on("queueEnd", (player) => {
    finalizeNowPlaying(client, player, "Queue finished. Add more with `/play`.");
  });

  manager.on("playerDestroy", (player) => {
    finalizeNowPlaying(client, player, "👋 Left the voice channel.");
  });

  // Bot got dragged/kicked out of the channel etc. — the player survives (autoReconnect:
  // true, destroyPlayer: false above), so playerDestroy won't fire here. Flash the panel
  // instead of leaving it stuck showing stale "now playing" info; a later trackStart or
  // playerUpdate overwrites this again automatically if it reconnects.
  manager.on("playerDisconnect", (player) => {
    flashPanelStatus(client, player, infoEmbed("👋 Left the voice channel."));
  });

  manager.on("trackError", (player, track) => {
    // autoSkip moves to the next track immediately after, which overwrites this.
    flashPanelStatus(client, player, errorEmbed(`Failed to play **${track?.info?.title ?? "track"}**, skipping.`));
  });

  manager.on("trackStuck", (player, track) => {
    flashPanelStatus(client, player, errorEmbed(`Playback stalled on **${track?.info?.title ?? "track"}**, skipping.`));
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
