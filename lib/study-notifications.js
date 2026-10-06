const TIME_ZONE = 'America/Vancouver';
const GOAL = 150;
const UNIT_NAMES = {
  exercise_science: '运动科学', assessment: '客户咨询与体适能测试',
  technique_safety: '训练技术与安全', program_design: '训练计划设计',
  nutrition: '运动营养学', facility_management: '场馆设计与安全',
  practical_video: '实操动作与视频题',
};

function dateKey(now) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now);
  const part = type => parts.find(p => p.type === type).value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

function shiftDay(key, offset) {
  const date = new Date(`${key}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
}

function count(value) {
  return Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0;
}

function buildMessage(kind, progress, now = new Date()) {
  const today = dateKey(now);
  const daily = progress.game?.daily || {};
  const answered = count(daily[today]?.answered);
  const footer = '\n\n基于最后一次成功同步的进度；未同步的答题可能尚未计入。\n打开复习 App：https://nsca-cpt-review-app.vercel.app/';
  if (kind === 'daily') {
    if (answered >= GOAL) return { shouldSend: false, reason: 'goal-complete' };
    const remaining = GOAL - answered;
    return {
      shouldSend: true, period: today,
      subject: `NSCA 每日打卡：还差 ${remaining} 题`,
      text: `今天已完成 ${answered}/${GOAL} 题，还差 ${remaining} 题。\n可以先做 ${Math.min(25, remaining)} 题，休息后再继续。答错的题也会计入练习量，并收进错题本。${footer}`,
    };
  }
  // Calendar dates, rather than 24-hour subtraction, keep DST boundaries stable.
  const weekday = new Date(`${today}T12:00:00Z`).getUTCDay();
  const start = shiftDay(today, -((weekday + 6) % 7));
  let total = 0;
  let correct = 0;
  let goalDays = 0;
  for (let day = start; day <= today; day = shiftDay(day, 1)) {
    const attempts = count(daily[day]?.answered);
    total += attempts;
    correct += Math.min(attempts, count(daily[day]?.correct));
    if (attempts >= GOAL) goalDays++;
  }
  const wrong = Object.values(progress.wrong || {}).filter(item => {
    if (!item || !Number.isFinite(Date.parse(item.lastAt))) return false;
    const date = new Date(item.lastAt);
    return date <= now && dateKey(date) >= start && dateKey(date) <= today;
  });
  const units = {};
  for (const item of wrong) {
    const name = UNIT_NAMES[item.unit] || '其他单元';
    units[name] = (units[name] || 0) + 1;
  }
  const topics = Object.entries(units).sort((a, b) => b[1] - a[1])
    .map(([name, amount]) => `- ${name}：${amount} 题`).join('\n');
  return {
    shouldSend: true, period: start,
    subject: `NSCA 本周复盘：练习 ${total} 题，达标 ${goalDays} 天`,
    text: `${start} 至 ${today}（截至发送时，温哥华时间）\n练习：${total} 题；正确：${correct} 题${total ? `；正确率：${Math.round(correct / total * 100)}%` : ''}。\n达到每日 150 题：${goalDays} 天。\n\n本周最近一次答错、且仍在错题本：${wrong.length} 题。\n${topics || '没有符合条件的错题。'}\n\n${wrong.length ? '下次先复习错题最多的单元，再做一组 25 题。' : '下一次从一组 25 题开始，逐步完成每日目标。'}\n这不是全部历史错误次数；已移出错题本的题目不计入。${footer}`,
  };
}

module.exports = { buildMessage, dateKey };
