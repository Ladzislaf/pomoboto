import 'dotenv/config';
import { Telegraf, Scenes, session } from 'telegraf';
import userSettingScene from './scenes/userSettingScene.js';
import { botCommands, showMenuKeyboard, setFocusInterval, setfocusTimeout, changeSettingAction } from './utils.js';
import db, { redis } from './db.js';

const bot = new Telegraf(process.env.BOT_TOKEN);
const stage = new Scenes.Stage([userSettingScene]);

bot.use(session());
bot.use(stage.middleware());

bot.telegram.setMyCommands(botCommands);

bot.catch((err, ctx) => {
	console.error(`User ${ctx.from.username} (${ctx.from.id}) error:`, err.message);
	ctx.reply('Error, try to restart the Bot.');
});

bot.start(async (ctx) => {
	console.log('[Start] first name:', ctx.from.first_name);
	console.log('[Start] last name:', ctx.from.last_name);
	console.log('[Start] username:', ctx.from.username);
	await ctx.deleteMessage();
	await showMenuKeyboard(ctx);
	return db.createNewUser(ctx.from.id);
});

bot.command('cancel_focus', async (ctx) => {
	const focusTimeout = await redis.get(`${ctx.from.id}:focusTimeout`);
	const focusInterval = await redis.get(`${ctx.from.id}:focusInterval`);
	console.log('[Cancel command] focusInterval', Boolean(focusTimeout));
	console.log('[Cancel command] focusTimeout', Boolean(focusInterval));
	await ctx.deleteMessage();
	if (focusTimeout) {
		ctx.session.focusStarted = false;
		clearInterval(focusInterval);
		clearTimeout(focusTimeout);
		redis.del(`${ctx.from.id}:focusTimeout`);
		redis.del(`${ctx.from.id}:focusInterval`);
		return ctx.reply('Focus canceled.');
	} else {
		return ctx.reply('The focus has not started yet.');
	}
});

bot.command('skip_break', async (ctx) => {
	const breakTimeout = await redis.get(`${ctx.from.id}:breakTimeout`);
	const breakInterval = await redis.get(`${ctx.from.id}:breakInterval`);
	console.log('[Skip command] breakInterval', Boolean(breakInterval));
	console.log('[Skip command] breakTimeout', Boolean(breakTimeout));
	await ctx.deleteMessage();
	if (breakTimeout) {
		ctx.session.focusStarted = false;
		clearInterval(breakInterval);
		clearTimeout(breakTimeout);
		redis.del(`${ctx.from.id}:breakTimeout`);
		redis.del(`${ctx.from.id}:breakInterval`);
		return ctx.reply('Break skiped.');
	} else {
		return ctx.reply('The break has not started yet.');
	}
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

bot.action('startFocus', async (ctx) => {
	const focusTimeout = await redis.get(`${ctx.from.id}:focusTimeout`);
	const focusInterval = await redis.get(`${ctx.from.id}:focusInterval`);
	console.log('[Action startFocus before] focusInterval', Boolean(focusInterval));
	console.log('[Action startFocus before] focusTimeout', Boolean(focusTimeout));
	if (ctx.session.focusStarted) {
		return ctx.answerCbQuery('Already started.');
	}
	ctx.session.focusStarted = true;
	const userSettings = await db.getUserSettings(ctx.from.id);
	await ctx.answerCbQuery('Focus!');
	await ctx.reply(`Focus started! (${userSettings.focusPeriod}/${userSettings.focusPeriod} min)`).then((data) => {
		const interval = setFocusInterval(ctx, userSettings.focusPeriod, data.message_id);
		redis.set(`${ctx.from.id}:focusInterval`, interval);
	});
	const timeout = setfocusTimeout(ctx, userSettings);
	redis.set(`${ctx.from.id}:focusTimeout`, timeout);
});

bot.action('focusPeriod', async (ctx) => {
	return changeSettingAction(ctx, 'focusPeriod', 'userSetting');
});

bot.action('breakPeriod', async (ctx) => {
	return changeSettingAction(ctx, 'breakPeriod', 'userSetting');
});

bot.action('showPeriods', async (ctx) => {
	const { focusPeriod, breakPeriod } = await db.getUserSettings(ctx.from.id);
	await ctx.reply(`Focus period | ${focusPeriod} [min]\n` + `Break period | ${breakPeriod} [min]\n`);
	return ctx.answerCbQuery('Periods.');
});

bot.action('closeMenu', async (ctx) => {
	await ctx.deleteMessage();
	await ctx.answerCbQuery('Menu closed!');
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
