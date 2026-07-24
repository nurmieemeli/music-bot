import { EmbedBuilder } from "discord.js";
import { formatDuration } from "./time.js";

const COLOR = 0x1db954;
const COLOR_ERROR = 0xed4245;

export function errorEmbed(message) {
  return new EmbedBuilder().setColor(COLOR_ERROR).setDescription(`❌ ${message}`);
}

export function infoEmbed(message) {
  return new EmbedBuilder().setColor(COLOR).setDescription(message);
}

const LOOP_LABELS = { off: "Off", track: "🔂 Track", queue: "🔁 Queue" };
const PROGRESS_BAR_LENGTH = 20;

function progressBar(position, duration) {
  if (!Number.isFinite(duration) || duration <= 0) return "▬".repeat(PROGRESS_BAR_LENGTH);

  const ratio = Math.min(1, Math.max(0, position / duration));
  const filled = Math.round(ratio * (PROGRESS_BAR_LENGTH - 1));
  return "▬".repeat(filled) + "🔘" + "▬".repeat(Math.max(0, PROGRESS_BAR_LENGTH - filled - 1));
}

export function nowPlayingEmbed(player) {
  const track = player.queue.current;
  if (!track) return infoEmbed("Nothing is playing.");

  const position = player.position ?? 0;
  const isStream = track.info.isStream;

  const embed = new EmbedBuilder()
    .setColor(COLOR)
    .setTitle(player.paused ? "Paused" : "Now Playing")
    .setDescription(
      isStream
        ? `[${track.info.title}](${track.info.uri})\n\n🔴 LIVE`
        : `[${track.info.title}](${track.info.uri})\n\n${progressBar(position, track.info.duration)}\n${formatDuration(position)} / ${formatDuration(track.info.duration)}`,
    )
    .addFields(
      { name: "Author", value: track.info.author || "Unknown", inline: true },
      { name: "Requested by", value: track.requester ? `<@${track.requester.id}>` : "Unknown", inline: true },
      { name: "Volume", value: `${player.volume}%`, inline: true },
      { name: "Loop", value: LOOP_LABELS[player.repeatMode] ?? "Off", inline: true },
    )
    .setFooter({ text: `Source: ${track.info.sourceName}` });

  if (track.info.artworkUrl) embed.setThumbnail(track.info.artworkUrl);

  return embed;
}

export function queueEmbed(player, page = 0, perPage = 10) {
  const tracks = player.queue.tracks;
  const start = page * perPage;
  const pageTracks = tracks.slice(start, start + perPage);

  const embed = new EmbedBuilder().setColor(COLOR).setTitle("Queue");

  const current = player.queue.current;
  if (current) {
    embed.setDescription(`**Now Playing:** [${current.info.title}](${current.info.uri})`);
  }

  if (pageTracks.length === 0) {
    embed.addFields({ name: "Up Next", value: "Queue is empty." });
  } else {
    const lines = pageTracks.map(
      (t, i) => `**${start + i + 1}.** [${t.info.title}](${t.info.uri}) — ${formatDuration(t.info.duration)}`,
    );
    embed.addFields({ name: "Up Next", value: lines.join("\n") });
  }

  embed.setFooter({
    text: `${tracks.length} track(s) queued • Page ${page + 1}/${Math.max(1, Math.ceil(tracks.length / perPage))}`,
  });

  return embed;
}
