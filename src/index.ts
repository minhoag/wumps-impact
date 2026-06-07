import "dotenv/config";
import { Client, Collection, GatewayIntentBits, Partials } from "discord.js";
import loadEvents from "./handlers/event";
import loadMessage from "./handlers/message";
import loadSlash from "./handlers/slash";
import type { BotClient } from "./types/bot";

const token = process.env.TOKEN;
if (!token) {
	console.error("TOKEN is required in environment.");
	process.exit(1);
}

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.GuildMessageReactions,
		GatewayIntentBits.DirectMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildVoiceStates,
	],
	partials: [
		Partials.Channel,
		Partials.Message,
		Partials.User,
		Partials.GuildMember,
		Partials.Reaction,
	],
}) as BotClient;

client.commands = new Collection();
client.events = new Collection();
client.slash = new Collection();
client.aliases = new Collection();

void loadEvents(client);
void loadSlash(client);
void loadMessage(client);

void client.login(token).catch((error) => {
	console.error("Failed to login:", error);
	process.exit(1);
});

client.on("error", (error) => console.error("[CLIENT ERROR]", error));
client.on("shardError", (error) => console.error("[SHARD ERROR]", error));
process.on("uncaughtException", (err) =>
	console.error("[UNCAUGHT EXCEPTION]", err),
);
process.on("unhandledRejection", (reason) =>
	console.error("[UNHANDLED REJECTION]", reason),
);

export default client;
