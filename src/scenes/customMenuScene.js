import { Scenes } from 'telegraf';
import { message } from 'telegraf/filters';

const customMenuScene = new Scenes.BaseScene('customizationMenu');

customMenuScene.enter(async (ctx) => {
  const { focusPeriod, breakPeriod } = await db.getUserSettings(ctx.from.id);
  return ctx.reply(
    `Current custom periods:\n` +
      `Focus = ${focusPeriod} [min]\n` +
      `Break = ${breakPeriod} [min]\n` +
      `Focus and break values must be between 5 and 180 min.\n` +
      `To change custom periods, send new values.\n` +
      `Format: focus-break (50-10).`
  );
});

customMenuScene.on(message('text'), async (ctx) => {
  const regex = /^(\d{1,3})-(\d{1,3})$/;

  if (!regex.test(ctx.message.text)) {
    await ctx.deleteMessage();
    return ctx.reply('Incorrect message. Format: focus-break (50-10)');
  } else {
    const newFocusPeriod = +ctx.message.text.match(regex)[1];
    const newBreakPeriod = +ctx.message.text.match(regex)[2];

    if (
      newFocusPeriod < 5 ||
      newFocusPeriod > 180 ||
      newBreakPeriod < 5 ||
      newBreakPeriod > 180
    ) {
      await ctx.deleteMessage();
      return ctx.reply('Focus and break values must be between 5 and 180 min.');
    } else {
      await db.updateUserSettings(ctx.from.id, 'focusPeriod', newFocusPeriod);
      await db.updateUserSettings(ctx.from.id, 'breakPeriod', newBreakPeriod);
      await ctx.deleteMessage();
      await ctx.reply(`Success!`);
      return ctx.scene.leave();
    }
  }
});

export default customMenuScene;
