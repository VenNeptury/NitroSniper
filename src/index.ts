import { Client, Collection, Message } from 'discord.js';
import fetch from 'node-fetch';
import { token, throttling, webhook, slaves, userAgent } from './config.json';

const nitroMatcher = /(discord.com\/gifts\/|discordapp.com\/gifts\/|discord.gift\/)([a-zA-Z0-9]+)/i;

const snipedCodes = new Set<string>();
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
		log(`Successfully initiated slave ${client.user.tag} ${client.user.bot ? '(BOT)' : '(USER)'} with ${client.guilds.size} servers`, client);
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

	const res = await fetch(`https://discord.com/api/v8/entitlements/gift-codes/${code}/redeem`, {
		method: 'POST',
		body: JSON.stringify({ channel_id: null, payment_source_id: null }),
		headers: {
			authorization: token,
			'user-agent': userAgent,
			'content-type': 'application/json'
		}
	}).catch(() => void 0);
	if (!res) return;

	const json = await res.json();

	log(`Found code \`${code}\` on \`${msg.guild?.name || msg.author.username}\`. ${json.message}`, msg.client);

	if (json.message.includes('nitro')) {
		claims++;
		snipedCodes.add(code);

		if (claims >= throttling.maxClaims) {
			log(`Reached maximum amount of claims. Idling for ${throttling.cooldownInHours} hours.`);
			claims = 0;
			clients.forEach(clearHandlers);
			setTimeout(() => {
				log(`Finished idling. Looking for codes again.`);
				clients.forEach(initHandlers);
			}, 1000 * 60 * 60 * throttling.cooldownInHours);
		}
	}
}

function log(msg: string, slave?: Client) {
	console.log(`${new Date().toLocaleTimeString()} - ${msg}`);

	if (webhook)
		fetch(webhook, {
			method: 'POST',
			body: JSON.stringify({
				username: 'Nitro Sniper',
				avatar_url: slave?.user.displayAvatarURL,
				embeds: [
					{
						description: msg,
						timestamp: new Date().toISOString(),
						author: slave ? { name: slave.user.tag, icon_url: slave.user.displayAvatarURL } : null
					}
				]
			}),
			headers: {
				'Content-Type': 'application/json'
			}
		}).catch(() => void 0);
}
