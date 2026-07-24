import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { REST, Routes } from "discord.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const commandsDir = path.join(__dirname, "commands");
const files = fs.readdirSync(commandsDir).filter((f) => f.endsWith(".js"));

const commandData = [];
for (const file of files) {
  const command = (await import(`./commands/${file}`)).default;
  if (command?.data) commandData.push(command.data.toJSON());
}

const rest = new REST().setToken(process.env.DISCORD_TOKEN);

try {
  const guildId = process.env.DEPLOY_GUILD_ID;

  const route = guildId
    ? Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, guildId)
    : Routes.applicationCommands(process.env.DISCORD_CLIENT_ID);

  const result = await rest.put(route, { body: commandData });

  console.log(
    `Registered ${result.length} slash command(s) ${guildId ? `to guild ${guildId}` : "globally (may take up to 1 hour to propagate)"}.`,
  );
} catch (err) {
  console.error("Failed to register commands:", err);
  process.exit(1);
}
