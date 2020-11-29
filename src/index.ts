import { Client, Message, TextChannel } from 'discord.js';
import fetch from 'node-fetch';
import { token, throttling, logChannel } from './config.json';

const nitroMatcher = /(discord.com\/gifts\/|discordapp.com\/gifts\/|discord.gift\/)([a-zA-Z0-9]+)/i;
const snipedCodes = new Set<string>();
let claims = 0;

const client = new Client();

client.once('ready', () => log(`Successfully logged in as ${client.user.tag}\nSniping Nitro on ${client.guilds.size} servers`));

client.on('raw', (packet: any) => {
	if ('MESSAGE_UPDATE' !== packet.t) return;
	const channel = client.channels.get(packet.d.channel_id) as TextChannel;
	if (!channel) return;
	if (channel.messages.has(packet.d.id)) return;
	channel
		.fetchMessage(packet.d.id)
		.then(msg => client.emit('messageUpdate', null, msg))
		.catch(() => null);
});

client.on('message', handleMessage);
client.on('messageUpdate', (_, msg) => handleMessage(msg));

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
			'user-agent':
				'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) discord/0.0.308 Chrome/78.0.3904.130 Electron/7.3.2 Safari/537.36',
			'content-type': 'application/json',
			acccept: '*/*',
			'accept-language': 'en-GB',
			'accept-encoding': 'gzip, deflate, br',
			referer: msg.guild ? `https://discord.com/channels/${msg.guild.id}/${msg.channel.id}` : ''
		}
	}).catch(() => null);
	if (!res) return;

	const json = await res.json();

	log(`${new Date().toLocaleTimeString()} - Found code ${code} on ${msg.guild?.name || msg.author.username}. ${json.message}`);

	if (json.message.includes('nitro')) {
		claims++;
		snipedCodes.add(code);

		if (claims >= throttling.maxClaims) {
			log(`Reached maximum amount of claims. Idling for ${throttling.cooldownInHours} hours.`);
			claims = 0;
			client.removeListener('message', handleMessage);
			client.removeListener('messageUpdate', handleMessage);
			setTimeout(() => {
				log(`Finished idling. Looking for codes again.`);
				client.on('message', handleMessage);
				client.on('messageUpdate', (_, msg) => handleMessage(msg));
			}, 1000 * 60 * 60 * throttling.cooldownInHours);
		}
	}
}

function log(msg: string) {
	console.log(msg);
	if (logChannel) (client.channels.get(logChannel) as TextChannel)?.send(msg).catch(() => null);
}

client.login(token);
