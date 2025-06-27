export const botCommands = [
  {
    command: '/start',
    description: 'Restart the Bot',
  },
  {
    command: '/focus',
    description: 'Start a new focus session (use /focus25, /focus50, ...)',
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
    command: '/playlist',
    description: 'Spotify playlist for concentration',
  },
];

export function startFocusTimeout(ctx, userSettings) {
  const { focusPeriod, breakPeriod } = userSettings;

  const timeoutId = setTimeout(async () => {
    ctx.session.breakIntervalId = await startBreakIntreval(ctx, breakPeriod);
    ctx.session.breakTimeoutId = startBreakTimeout(ctx, breakPeriod);
    delete ctx.session.focusIntervalId;
    delete ctx.session.focusTimeoutId;

    console.log(
      `[break: ${ctx.from.username}] session.breakIntervalId: ${ctx.session.breakIntervalId}; session.breakTimeoutId: ${ctx.session.breakTimeoutId}`
    );
  }, focusPeriod * 60 * 1000);

  return Number(timeoutId);
}

export function startBreakTimeout(ctx, breakPeriod) {
  const timeoutId = setTimeout(async () => {
    delete ctx.session.breakIntervalId;
    delete ctx.session.breakTimeoutId;
    return ctx.reply(
      `Break finished! Type /focus to start a new focus session!`
    );
  }, breakPeriod * 60 * 1000);

  return Number(timeoutId);
}

export async function startFocusInterval(ctx, focusPeriod) {
  let messageId;
  let timerValue = focusPeriod;
  const wakeInterval = Number(process.env.WAKE_INTERVAL);

  await ctx
    .reply(`Focus started! (${focusPeriod}/${focusPeriod} min)`)
    .then((data) => {
      messageId = data.message_id;
    });

  const intervalId = setInterval(async () => {
    if (wakeInterval && timerValue % wakeInterval === 0) {
      wakeContainer(`FocusInterval: timerValue = ${timerValue}`);
    }
    if (timerValue <= 0) {
      return clearInterval(intervalId);
    }
    await ctx
      .editMessageText(`Focus started! (${--timerValue}/${focusPeriod} min)`, {
        message_id: messageId,
      })
      .catch(async (err) => {
        console.error(
          '[startFocusInterval: catch] edit message error:',
          err.message
        );
        clearInterval(intervalId);
      });
  }, 60 * 1000);

  return Number(intervalId);
}

export async function startBreakIntreval(ctx, breakPeriod) {
  let messageId;
  let timerValue = breakPeriod;
  const wakeInterval = Number(process.env.WAKE_INTERVAL);

  await ctx
    .reply(`Focus finished! Have a break! (${breakPeriod}/${breakPeriod} min)`)
    .then((data) => {
      messageId = data.message_id;
    });

  const intervalId = setInterval(async () => {
    if (wakeInterval && timerValue % wakeInterval === 0) {
      wakeContainer(`BreakInterval: timerValue = ${timerValue}`);
    }
    if (timerValue <= 0) {
      return clearInterval(intervalId);
    }
    await ctx
      .editMessageText(
        `Focus finished! Have a break! (${--timerValue}/${breakPeriod} min)`,
        {
          message_id: messageId,
        }
      )
      .catch(async (err) => {
        console.error(
          '[startBreakIntreval: catch] edit message error:',
          err.message
        );
        clearInterval(intervalId);
      });
  }, 60 * 1000);

  return Number(intervalId);
}

export async function wakeContainer(message) {
  console.log(`[Waking] ${message}`);
  return fetch(process.env.WH_DOMAIN).catch((err) => {
    console.error('[Waking] Fetch error:', err.message);
  });
}
