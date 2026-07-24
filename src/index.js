import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client, Collection, GatewayIntentBits } from "discord.js";
import { createLavalinkManager } from "./lavalink.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
});

client.commands = new Collection();
client.lavalink = createLavalinkManager(client);

async function loadCommands() {
  const commandsDir = path.join(__dirname, "commands");
  const files = fs.readdirSync(commandsDir).filter((f) => f.endsWith(".js"));

  for (const file of files) {
    const command = (await import(`./commands/${file}`)).default;
    if (!command?.data || !command?.execute) {
      console.warn(`[Commands] Skipping ${file} — missing "data" or "execute" export.`);
      continue;
    }
    client.commands.set(command.data.name, command);
  }
  console.log(`[Commands] Loaded ${client.commands.size} command(s).`);
}

async function loadEvents() {
  const eventsDir = path.join(__dirname, "events");
  const files = fs.readdirSync(eventsDir).filter((f) => f.endsWith(".js"));

  for (const file of files) {
    const event = (await import(`./events/${file}`)).default;
    if (!event?.name || !event?.execute) {
      console.warn(`[Events] Skipping ${file} — missing "name" or "execute" export.`);
      continue;
    }
    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args, client));
    } else {
      client.on(event.name, (...args) => event.execute(...args, client));
    }
  }
  console.log(`[Events] Loaded ${files.length} event handler(s).`);
}

await loadCommands();
await loadEvents();

client.login(process.env.DISCORD_TOKEN).catch((err) => {
  console.error("[Discord] Failed to log in:", err.message);
  process.exit(1);
});
