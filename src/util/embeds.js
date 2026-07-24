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

export function nowPlayingEmbed(player) {
  const track = player.queue.current;
  if (!track) return infoEmbed("Nothing is playing.");

  const position = player.position ?? 0;
  const isStream = track.info.isStream;

  const embed = new EmbedBuilder()
    .setColor(COLOR)
    .setTitle("Now Playing")
    .setDescription(`[${track.info.title}](${track.info.uri})`)
    .addFields(
      { name: "Author", value: track.info.author || "Unknown", inline: true },
      {
        name: "Duration",
        value: isStream ? "🔴 LIVE" : `${formatDuration(position)} / ${formatDuration(track.info.duration)}`,
        inline: true,
      },
      { name: "Requested by", value: track.requester ? `<@${track.requester.id}>` : "Unknown", inline: true },
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
