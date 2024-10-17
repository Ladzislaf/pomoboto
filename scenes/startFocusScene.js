import { Scenes, Markup } from 'telegraf';
import db, { redis } from '../db.js';
import { setFocusInterval, setfocusTimeout } from '../utils.js';

const startFocusScene = new Scenes.BaseScene('startFocus');

const FocusOptions = {
	short: { focusPeriod: 25, breakPeriod: 5 },
	default: { focusPeriod: 50, breakPeriod: 10 },
	long: { focusPeriod: 75, breakPeriod: 15 },
	custom: {},
};

startFocusScene.enter(async (ctx) => {
	const userSettings = await db.getUserSettings(ctx.from.id);
	FocusOptions['custom'] = { focusPeriod: userSettings.focusPeriod, breakPeriod: userSettings.breakPeriod };

	return ctx.reply(
		'Select a session option:',
		Markup.inlineKeyboard([
			[
				Markup.button.callback('Short', 'start:short'),
				Markup.button.callback('Default', 'start:default'),
				Markup.button.callback('Long', 'start:long'),
				Markup.button.callback('Custom', 'start:custom'),
			],
			[Markup.button.callback('Cancel', 'cancelFocus')],
		])
	);
});

startFocusScene.action(/^start:([a-z]+)$/, async (ctx) => {
	if (ctx.session.focusStarted) {
		return ctx.answerCbQuery('Already started.');
	}

	const focusOption = ctx.match[1];
	const { focusPeriod, breakPeriod } = FocusOptions[focusOption];

	ctx.session.focusStarted = true;
	await ctx.deleteMessage();
	await ctx.answerCbQuery('Focus!');

	await ctx.reply(`Focus started! (${focusPeriod}/${focusPeriod} min)\n[${focusOption}]`).then((data) => {
		const interval = setFocusInterval(ctx, focusPeriod, data.message_id);
		redis.set(`${ctx.from.id}:focusInterval`, interval);
	});
	const timeout = setfocusTimeout(ctx, { focusPeriod, breakPeriod });
	redis.set(`${ctx.from.id}:focusTimeout`, timeout);

	return ctx.scene.leave();
});

startFocusScene.action('cancelFocus', async (ctx) => {
	await ctx.deleteMessage();
	await ctx.answerCbQuery('Canceled!');
	return ctx.scene.leave();
});

export default startFocusScene;
