import 'dotenv/config';
import { Telegraf, Scenes, session } from 'telegraf';
import customMenuScene from './scenes/customMenuScene.js';
import startFocusScene from './scenes/startFocusScene.js';
import { botCommands } from './utils.js';
import db from './db.js';

const bot = new Telegraf(process.env.BOT_TOKEN);
const stage = new Scenes.Stage([customMenuScene, startFocusScene]);

bot.use(session());
bot.use(stage.middleware());

bot.telegram.setMyCommands(botCommands);

bot.catch((err, ctx) => {
	console.error(`User ${ctx.from.username} (${ctx.from.id}) error:`, err.message);
	ctx.reply('Error, try to restart the Bot.');
});

bot.start(async (ctx) => {
	console.log('[Starting] first name:', ctx.from.first_name);
	console.log('[Starting] last name:', ctx.from.last_name);
	console.log('[Starting] username:', ctx.from.username);
	await ctx.deleteMessage();
	await ctx.reply('Hi, I am your Pomodoro Bot.\nUse the command /focus to start!');
	return db.createNewUser(ctx.from.id);
});

bot.command('focus', async (ctx) => {
	await ctx.deleteMessage();

	if (ctx.session.focusIntervalId || ctx.session.focusTimeoutId) {
		return ctx.reply('The focus has already started.');
	}
	if (ctx.session.breakIntervalId || ctx.session.breakTimeoutId) {
		return ctx.reply('You are taking a break now.');
	}
	return ctx.scene.enter('startFocus');
});

bot.command('abort_focus', async (ctx) => {
	await ctx.deleteMessage();
	const { focusIntervalId, focusTimeoutId } = ctx.session;

	if (focusTimeoutId || focusIntervalId) {
		clearInterval(focusIntervalId);
		clearTimeout(focusTimeoutId);
		delete ctx.session.focusIntervalId;
		delete ctx.session.focusTimeoutId;
		return ctx.reply('Focus aborted.');
	} else {
		return ctx.reply('The focus has not started yet.');
	}
});

bot.command('skip_break', async (ctx) => {
	await ctx.deleteMessage();
	const { breakIntervalId, breakTimeoutId } = ctx.session;

	if (breakTimeoutId) {
		clearInterval(breakIntervalId);
		clearTimeout(breakTimeoutId);
		delete ctx.session.breakIntervalId;
		delete ctx.session.breakTimeoutId;
		return ctx.reply('The break is skipped.');
	} else {
		return ctx.reply('The break has not started yet.');
	}
});

bot.command('custom', async (ctx) => {
	await ctx.deleteMessage();
	return ctx.scene.enter('customizationMenu');
});

bot.command('playlist', async (ctx) => {
	await ctx.deleteMessage();
	return ctx.reply(
		'To focus better, you can use a spotify [Playlist](https://open.spotify.com/playlist/0vvXsWCC9xrXsKd4FyS8kM?si=83d9e98fa29a48cd)',
		{
			parse_mode: 'MarkdownV2',
		}
	);
});

if (process.env.ENV === 'local') {
	bot.launch(() => console.log('Pomoboto bot is running locally.'));
} else {
	bot.launch(
		{
			webhook: {
				domain: process.env.WH_DOMAIN,
				port: process.env.WH_PORT || 443,
			},
		},
		() => console.log('Pomoboto bot is running on webhook.')
	);
}

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
