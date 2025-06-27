import { Scenes } from 'telegraf';
import { startFocusInterval, startFocusTimeout } from '../utils.js';

const startFocusScene = new Scenes.BaseScene('startFocus');

startFocusScene.enter(async (ctx) => {
  const focusPeriod = ctx.scene.state.focusPeriod;
  const breakPeriod = Math.ceil(focusPeriod / 5);

  ctx.session.focusIntervalId = await startFocusInterval(ctx, focusPeriod);
  ctx.session.focusTimeoutId = startFocusTimeout(ctx, {
    focusPeriod,
    breakPeriod,
  });

  return ctx.scene.leave();
});

export default startFocusScene;
