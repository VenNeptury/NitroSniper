import { Client, Collection, Message, TextChannel } from 'discord.js';
import fs from 'fs';
import fetch from 'node-fetch';
import path from 'path';
import { token, throttling, webhook, slaves, userAgent } from './config.json';

const nitroMatcher = /(discord.com\/gifts\/|discordapp.com\/gifts\/|discord.gift\/)([a-zA-Z0-9]+)/i;
const colors = {
	CYAN: 0x00ffff,
	RED: 0xff073a,
	GREEN: 0x39ff14
};

const snipedCodes = new Set<string>();
const logFile = path.join(__dirname, '../attempted_codes.log');
try {
	fs.readFileSync(logFile, 'utf8')
		.split('\n')
		.filter(x => Boolean(x))
		.forEach(x => snipedCodes.add(x));
} catch {
	// openSync(logFile, 'w');
}

const logFileStream = fs.createWriteStream(logFile, { flags: 'a', encoding: 'utf-8' });

let claims = 0;

const clients = new Collection<string, Client>();

if (!slaves.length) {
	console.warn('Please specify some slaves and try again');
	process.exit();
}

for (const slaveToken of slaves) {
	const client = new Client({
		ws: {
			// @ts-ignore
			$os: '',
			$browser: '',
			$device: ''
		}
	});

	initHandlers(client);
	client.once('ready', () => {
		client.user.setStatus('invisible');
		const user = `[${client.user.tag}](https://discord.com/users/${client.user.id}) ${client.user.bot ? '(BOT)' : '(USER)'}`;
		log(`Successfully initiated slave ${user} with ${client.guilds.size} servers`, client, colors.CYAN);
	});

	client.login(slaveToken);
	clients.set(slaveToken, client);
}

function initHandlers(client: Client) {
	client.on('message', handleMessage);
	client.on('messageUpdate', (_, msg) => handleMessage(msg));
}

function clearHandlers(client: Client) {
	client.removeListener('message', handleMessage);
	client.removeListener('messageUpdate', handleMessage);
}

async function handleMessage(msg: Message) {
	const match = msg.content.match(nitroMatcher);
	if (!match) return;

	const code = match[2];
	if (!code || snipedCodes.has(code)) return;

	const json = await fetch(`https://discord.com/api/v8/entitlements/gift-codes/${code}/redeem`, {
		method: 'POST',
		body: JSON.stringify({ channel_id: null, payment_source_id: null }),
		headers: {
			authorization: token,
			'user-agent': userAgent,
			'content-type': 'application/json'
		}
	})
		.then(res => res.json())
		.catch(() => void 0);
	if (!json) return;

	snipedCodes.add(code);
	logFileStream.write(`${code}\n`);

	const channel = msg.guild
		? `[${msg.guild.name} • ${(msg.channel as TextChannel).name}](${msg.url})`
		: `[${msg.author.tag}](https://discord.com/users/${msg.author.id})`;

	let output = `Found code \`${code}\`  [${channel}]\n\n`;

	if (json.consumed) {
		log(`${output}Enjoy your ${json.subscription_plan.name} :DD`, msg, colors.GREEN);

		claims++;

		if (claims >= throttling.maxClaims) {
			log(`Reached maximum amount of claims. Idling for ${throttling.cooldownInHours} hours.`, msg, colors.CYAN);

			claims = 0;
			clients.forEach(clearHandlers);

			setTimeout(() => {
				log(`Finished idling. Looking for codes again.`, msg, colors.CYAN);
				clients.forEach(initHandlers);
			}, 1000 * 60 * 60 * throttling.cooldownInHours);
		}
	} else log(`${output}Failed to redeem: ${json.message}`, msg);
}

function log(description: string, msg: Message | Client, color = colors.RED) {
	const body = createWebHookBody(description, msg, color);
	const consoleDescription = description.replace(/\[([^\]]+)\]\([^)]+\)/, '$1').replace(/\n+/, ' - ');

	console.log(`${new Date().toLocaleString()} • ${consoleDescription}`);

	if (webhook)
		fetch(webhook, {
			method: 'POST',
			body: JSON.stringify(body),
			headers: {
				'Content-Type': 'application/json'
			}
		}).catch(() => void 0);
}

function createWebHookBody(description: string, client: Message | Client, color = colors.RED) {
	client = client instanceof Message ? client.client : client;

	return {
		username: 'Nitro Sniper',
		avatar_url: client.user.displayAvatarURL,
		embeds: [
			{
				description,
				// author: { name: msg.user.tag, icon_url: msg.user.displayAvatarURL },
				color
			}
		]
	};
}
