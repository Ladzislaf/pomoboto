import { redis } from './db.js';

export const botCommands = [
	{
		command: '/start',
		description: 'Restart the Bot',
	},
	{
		command: '/focus',
		description: 'Start a new focus session',
	},
	{
		command: '/abort_focus',
		description: 'Abort the current focus session',
	},
	{
		command: '/skip_break',
		description: 'Skip the break',
	},
	{
		command: '/custom',
		description: 'Configure custom periods',
	},
	{
		command: '/playlist',
		description: 'Spotify playlist for concentration',
	},
];

export function setfocusTimeout(ctx, userSettings) {
	const { focusPeriod, breakPeriod } = userSettings;
	return setTimeout(async () => {
		redis.del(`${ctx.from.id}:focusTimeout`);
		await ctx.reply(`Focus finished! Have a break! (${breakPeriod}/${breakPeriod} min)`).then((data) => {
			const interval = setBreakIntreval(ctx, breakPeriod, data.message_id);
			redis.set(`${ctx.from.id}:breakInterval`, interval);
		});
		const timeout = setBreakTimeout(ctx, breakPeriod);
		redis.set(`${ctx.from.id}:breakTimeout`, timeout);
	}, focusPeriod * 60 * 1000);
}

export function setBreakTimeout(ctx, breakPeriod) {
	return setTimeout(async () => {
		ctx.session.focusStarted = false;
		redis.del(`${ctx.from.id}:breakTimeout`);
		return ctx.reply(`Break finished! Type /focus to start a new focus session!`);
	}, breakPeriod * 60 * 1000);
}

export function setFocusInterval(ctx, focusPeriod, messageId) {
	let timerValue = focusPeriod;
	const wakeInterval = Number(process.env.WAKE_INTERVAL);
	wakeContainer();

	return setInterval(async () => {
		if (wakeInterval && timerValue % wakeInterval === 0) {
			await wakeContainer();
		}
		if (timerValue <= 0) {
			const focusInterval = await redis.get(`${ctx.from.id}:focusInterval`);
			clearInterval(focusInterval);
			redis.del(`${ctx.from.id}:focusInterval`);
			return;
		}
		await ctx
			.editMessageText(`Focus started! (${--timerValue}/${focusPeriod} min)`, {
				message_id: messageId,
			})
			.catch(async (err) => {
				console.error('[setFocusIntreval edit message catch] error:', err.message);

				const focusInterval = await redis.get(`${ctx.from.id}:focusInterval`);
				focusInterval && clearInterval(focusInterval);
				redis.del(`${ctx.from.id}:focusInterval`);
			});
	}, 60 * 1000);
}

export function setBreakIntreval(ctx, breakPeriod, messageId) {
	let timerValue = breakPeriod;
	const wakeInterval = Number(process.env.WAKE_INTERVAL);
	wakeContainer();

	return setInterval(async () => {
		if (wakeInterval && timerValue % wakeInterval === 0) {
			await wakeContainer();
		}
		if (timerValue <= 0) {
			const breakInterval = await redis.get(`${ctx.from.id}:breakInterval`);
			clearInterval(breakInterval);
			redis.del(`${ctx.from.id}:breakInterval`);
			return;
		}
		await ctx
			.editMessageText(`Focus finished! Have a break! (${--timerValue}/${breakPeriod} min)`, {
				message_id: messageId,
			})
			.catch(async (err) => {
				console.error('[setBreakIntreval edit message catch] error:', err.message);

				const breakInterval = await redis.get(`${ctx.from.id}:breakInterval`);
				breakInterval && clearInterval(breakInterval);
				redis.del(`${ctx.from.id}:breakInterval`);
			});
	}, 60 * 1000);
}

export async function wakeContainer() {
	console.log('[wakeContainer] Waking container up...');
	return fetch(process.env.WH_DOMAIN).catch((err) => {
		console.error('[wakeContainer] Fetch error:', err.message);
	});
}
