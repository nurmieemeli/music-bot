import { errorEmbed } from "../util/embeds.js";
import { handleSearchSelect } from "../commands/search.js";

export default {
  name: "interactionCreate",
  async execute(interaction, client) {
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;

      try {
        await command.execute(interaction, client);
      } catch (err) {
        console.error(`[Command:${interaction.commandName}]`, err);
        const payload = { embeds: [errorEmbed("Something went wrong running that command.")], ephemeral: true };
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(payload).catch(() => {});
        } else {
          await interaction.reply(payload).catch(() => {});
        }
      }
      return;
    }

    if (interaction.isStringSelectMenu() && interaction.customId.startsWith("search-select:")) {
      try {
        await handleSearchSelect(interaction, client);
      } catch (err) {
        console.error("[SearchSelect]", err);
        await interaction
          .reply({ embeds: [errorEmbed("Something went wrong queueing that track.")], ephemeral: true })
          .catch(() => {});
      }
    }
  },
};
