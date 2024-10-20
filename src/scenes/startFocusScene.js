import { Scenes, Markup } from 'telegraf';
import db from '../db.js';
import { startFocusInterval, startFocusTimeout } from '../utils.js';

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
	const focusOption = ctx.match[1];
	const { focusPeriod, breakPeriod } = FocusOptions[focusOption];

	ctx.session.focusIntervalId = await startFocusInterval(ctx, focusPeriod);
	ctx.session.focusTimeoutId = startFocusTimeout(ctx, { focusPeriod, breakPeriod });

	console.log(
		`[focus: ${ctx.from.username}] session.focusIntervalId: ${ctx.session.focusIntervalId}; session.focusTimeoutId: ${ctx.session.focusTimeoutId}`
	);

	await ctx.answerCbQuery('Focus!');
	await ctx.deleteMessage();
	return ctx.scene.leave();
});

startFocusScene.action('cancelFocus', async (ctx) => {
	await ctx.answerCbQuery('Canceled!');
	await ctx.deleteMessage();
	return ctx.scene.leave();
});

export default startFocusScene;
