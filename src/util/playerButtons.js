import { MessageFlags } from "discord.js";
import { errorEmbed } from "./embeds.js";
import { getVoiceChannel } from "./voice.js";
import { refreshNowPlaying } from "./nowPlaying.js";

const LOOP_MODES = ["off", "track", "queue"];

export async function handlePlayerButton(interaction, client) {
  const player = client.lavalink.getPlayer(interaction.guildId);
  if (!player) {
    await interaction.reply({ embeds: [errorEmbed("Nothing is playing.")], flags: MessageFlags.Ephemeral });
    return;
  }

  const voiceChannel = getVoiceChannel(interaction);
  if (!voiceChannel || voiceChannel.id !== player.voiceChannelId) {
    await interaction.reply({
      embeds: [errorEmbed("You need to be in the same voice channel as the bot.")],
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const action = interaction.customId.split(":")[1];

  // These trigger trackStart/trackEnd/queueEnd events, which already update the message.
  if (action === "stop") {
    await interaction.deferUpdate();
    await player.destroy();
    return;
  }
  if (action === "skip") {
    await interaction.deferUpdate();
    await player.skip();
    return;
  }

  switch (action) {
    case "pauseresume":
      if (player.paused) await player.resume();
      else await player.pause();
      break;
    case "loop": {
      const next = LOOP_MODES[(LOOP_MODES.indexOf(player.repeatMode) + 1) % LOOP_MODES.length];
      await player.setRepeatMode(next);
      break;
    }
    case "voldown":
      await player.setVolume(Math.max(0, player.volume - 10));
      break;
    case "volup":
      await player.setVolume(Math.min(150, player.volume + 10));
      break;
    case "shuffle":
      await player.queue.shuffle();
      break;
    default:
      break;
  }

  await interaction.deferUpdate();
  await refreshNowPlaying(client, player);
}
