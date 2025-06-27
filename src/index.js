import 'dotenv/config';
import { Telegraf, Scenes, session } from 'telegraf';
import startFocusScene from './scenes/startFocusScene.js';
import { botCommands } from './utils.js';

const bot = new Telegraf(process.env.BOT_TOKEN);
const stage = new Scenes.Stage([startFocusScene]);

bot.use(session());
bot.use(stage.middleware());

bot.telegram.setMyCommands(botCommands);

bot.catch((err, ctx) => {
  console.error(
    `User ${ctx.from.username} (${ctx.from.id}) error:`,
    err.message
  );
  ctx.reply('Error, try to restart the Bot.');
});

bot.start(async (ctx) => {
  console.log('[Starting] first name:', ctx.from.first_name);
  console.log('[Starting] last name:', ctx.from.last_name);
  console.log('[Starting] username:', ctx.from.username);
  await ctx.deleteMessage();
  return ctx.reply(
    'Hi, I am your Pomodoro Bot.\nUse the command /focus50 to start!'
  );
});

bot.command(/^focus(\d*)$/, (ctx) => {
  const focusPeriod = parseInt(ctx.match[1], 10);

  if (isNaN(focusPeriod)) {
    return ctx.reply(
      'You need to specify the focus period.\nUse /focus25, /focus50, /focus75'
    );
  }
  if (focusPeriod < 25 || focusPeriod > 120) {
    return ctx.reply('25 - 120');
  }
  if (ctx.session.focusIntervalId || ctx.session.focusTimeoutId) {
    return ctx.reply('The focus has already started.');
  }
  if (ctx.session.breakIntervalId || ctx.session.breakTimeoutId) {
    return ctx.reply('You are taking a break now.');
  }
  return ctx.scene.enter('startFocus', { focusPeriod });
});

bot.command('abort_focus', async (ctx) => {
  await ctx.deleteMessage();
  const { focusIntervalId, focusTimeoutId } = ctx.session;

  console.log(
    `[abort_focus: ${ctx.from.username}] focusIntervalId: ${focusIntervalId}; focusTimeoutId: ${focusTimeoutId}`
  );

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

  console.log(
    `[skip_break: ${ctx.from.username}] breakIntervalId: ${breakIntervalId}; breakTimeoutId: ${breakTimeoutId}`
  );

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

bot.command('playlist', async (ctx) => {
  await ctx.deleteMessage();
  return ctx.reply(
    'To focus better, you can use a spotify [Playlist](https://open.spotify.com/playlist/0vvXsWCC9xrXsKd4FyS8kM?si=83d9e98fa29a48cd)',
    { parse_mode: 'MarkdownV2' }
  );
});

if (process.env.ENV === 'DEV') {
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
