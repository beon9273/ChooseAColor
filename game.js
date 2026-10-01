/* Choose A Color Square
   2-4 players share one screen. First to exactly 1,000 points wins. */
(() => {
  'use strict';

  // ---------- rules ----------
  const N = 100;
  const MIN = -1000, MAX = 1000, TARGET = 1000;
  const HINT_COST = 500, ROLL_COST = 25;
  const PATH_LEN = 5;              // squares in the guaranteed Cheat Path
  const COOLDOWN = 3;              // turns a square stays locked after it's picked
  const MAX_ROUNDS = 25;           // turns per player; extra turns and Treat Code re-picks don't count
  const TREAT_MS = 3000;           // how long a Treat Code shows the numbers
  const NEXT_TURN_MS = 1700;
  const ROWS = 'ABCDEFGHIJ';
  const PLAYER_COLORS = ['#ff5d8f', '#48cae4', '#ffc93c', '#80ed99'];
  const WHEEL = [1, 0, 2, 1, 3, 1, 0, 2, 1, 5, 1, 2];
  const WHEEL_COLORS = ['#ff5d8f', '#ff9f1c', '#ffd23f', '#80ed99', '#48cae4', '#9d7bff'];
  const SPECIAL_SET = ['zero', 'zero', 'gift', 'gift', 'swap', 'treat'];
  const SPECIALS = {
    zero:  { label: 'Lose It All', short: 'ZERO',  icon: '💀' },
    gift:  { label: 'Gift Wrap',   short: 'GIFT',  icon: '🎁' },
    swap:  { label: 'Switcheroo',  short: 'SWAP',  icon: '🔄' },
    treat: { label: 'Treat Code',  short: 'TREAT', icon: '🍬' },
  };
  const PATTERNS = [
    ['solid', 'Glossy'], ['dots', 'Polka-Dot'], ['stripes', 'Striped'], ['exes', 'X-Stitch'],
    ['checker', 'Checkered'], ['rainbow', 'Rainbow'], ['tiedye', 'Tie-Dye'], ['zigzag', 'Zigzag'],
    ['bullseye', 'Bullseye'], ['sunburst', 'Sunburst'], ['plaid', 'Plaid'], ['grid', 'Graph-Paper'],
  ];
  const HUE_NAMES = ['Red', 'Scarlet', 'Vermilion', 'Orange', 'Tangerine', 'Amber', 'Gold', 'Lemon',
    'Lime', 'Chartreuse', 'Green', 'Emerald', 'Jade', 'Mint', 'Teal', 'Cyan', 'Sky', 'Azure', 'Cobalt',
    'Blue', 'Indigo', 'Violet', 'Purple', 'Orchid', 'Magenta', 'Fuchsia', 'Hot Pink', 'Rose', 'Crimson', 'Ruby'];

  // ---------- helpers ----------
  const $ = (id) => document.getElementById(id);
  const ri = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const shuffle = (arr) => {
    for (let i = arr.length - 1; i > 0; i--) { const j = ri(0, i); [arr[i], arr[j]] = [arr[j], arr[i]]; }
    return arr;
  };
  const num = (v) => Math.abs(v).toLocaleString('en-US');
  const signed = (v) => (v > 0 ? '+' : v < 0 ? '−' : '') + num(v);
  const scoreText = (v) => (v < 0 ? '−' : '') + num(v);
  const short = (v) => {
    const a = Math.abs(v), s = v > 0 ? '+' : v < 0 ? '−' : '';
    if (a < 10000) return s + a.toLocaleString('en-US');
    if (a < 1e6) return s + Math.round(a / 1000) + 'K';
    return s + (a / 1e6).toFixed(a % 1e6 ? 2 : 0) + 'M';
  };
  const coord = (i) => ROWS[Math.floor(i / 10)] + ((i % 10) + 1);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // ---------- square looks ----------
  function patternCss(kind, h, s, l) {
    const c = (dh = 0, dl = 0, a = 1) => `hsla(${(h + dh + 360) % 360},${s}%,${clamp(l + dl, 8, 92)}%,${a})`;
    const base = c();
    const alt = l > 54 ? c(0, -28) : c(0, 30);
    switch (kind) {
      case 'solid': return `linear-gradient(150deg, ${c(0, 12)}, ${c(0, -10)})`;
      case 'dots': return `radial-gradient(circle, ${alt} 0 22%, transparent 26%) 0 0/34% 34%, ${base}`;
      case 'stripes': return `repeating-linear-gradient(45deg, ${base} 0 6px, ${alt} 6px 11px)`;
      case 'exes': {
        const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='14' height='14'><path d='M3.5 3.5l7 7M10.5 3.5l-7 7' stroke='${alt}' stroke-width='2.2' stroke-linecap='round'/></svg>`;
        return `url("data:image/svg+xml,${encodeURIComponent(svg)}") 0 0/14px 14px, ${base}`;
      }
      case 'checker': return `repeating-conic-gradient(${base} 0 25%, ${alt} 0 50%) 0 0/14px 14px`;
      case 'rainbow': return `linear-gradient(135deg, ${[0, 50, 100, 160, 220, 280].map((d) => c(d)).join(', ')})`;
      case 'tiedye': return `repeating-radial-gradient(circle at 38% 62%, transparent 0 5px, hsla(0,0%,100%,.28) 6px 7px), ` +
        `conic-gradient(from ${h}deg at 38% 62%, ${c(0)}, ${c(70, 8)}, ${c(150)}, ${c(230, -6)}, ${c(300, 6)}, ${c(0)})`;
      case 'zigzag': return `linear-gradient(135deg, ${alt} 25%, transparent 25%) -7px 0/14px 14px, ` +
        `linear-gradient(225deg, ${alt} 25%, transparent 25%) -7px 0/14px 14px, ` +
        `linear-gradient(315deg, ${alt} 25%, transparent 25%) 0 0/14px 14px, ` +
        `linear-gradient(45deg, ${alt} 25%, transparent 25%) 0 0/14px 14px, ${base}`;
      case 'bullseye': return `repeating-radial-gradient(circle, ${base} 0 4px, ${alt} 4px 8px)`;
      case 'sunburst': return `repeating-conic-gradient(from ${h}deg, ${base} 0 15deg, ${alt} 15deg 30deg)`;
      case 'plaid': {
        const dl = l > 54 ? -30 : 30;
        return `repeating-linear-gradient(0deg, ${c(0, dl, .45)} 0 4px, transparent 4px 13px), ` +
          `repeating-linear-gradient(90deg, ${c(40, dl, .45)} 0 4px, transparent 4px 13px), ${base}`;
      }
      case 'grid': return `linear-gradient(${alt} 1.5px, transparent 1.5px) 0 0/9px 9px, ` +
        `linear-gradient(90deg, ${alt} 1.5px, transparent 1.5px) 0 0/9px 9px, ${base}`;
    }
    return base;
  }

  function makeLooks() {
    const pats = shuffle(Array.from({ length: N }, (_, i) => PATTERNS[i % PATTERNS.length]));
    const offset = ri(0, 359);
    return pats.map((p, i) => {
      const h = Math.round((offset + i * 137.508) % 360);   // golden-angle spacing keeps every hue different
      const l = [56, 46, 64, 50][i % 4];
      const s = [82, 72, 90, 78][(i >> 2) % 4];
      return { bg: patternCss(p[0], h, s, l), name: `${p[1]} ${HUE_NAMES[Math.floor(h / 12) % 30]}` };
    });
  }

  // ---------- state ----------
  let S = freshState();
  function freshState() {
    return { phase: 'setup', count: 2, players: [], cur: 0, looks: [], board: [], path: [], known: 0, round: 1, endReason: 'exact',
      picked: null, reveal: false, busy: false, log: [], result: '', winner: null };
  }
  const curP = () => S.players[S.cur];
  const others = () => S.players.filter((_, i) => i !== S.cur);
  const randomOther = () => { const o = others(); return o[ri(0, o.length - 1)]; };

  // Five non-zero numbers that add up to exactly 1,000, with no earlier step landing on 1,000.
  function makePathValues() {
    for (;;) {
      const v = Array.from({ length: PATH_LEN - 1 }, () => ri(MIN, MAX));
      const last = TARGET - v.reduce((a, b) => a + b, 0);
      if (last < MIN || last > MAX) continue;
      const all = [...v, last];
      if (all.some((x) => x === 0)) continue;
      let sum = 0, early = false;
      for (let i = 0; i < PATH_LEN - 1; i++) { sum += all[i]; if (sum === TARGET) early = true; }
      if (!early) return all;
    }
  }

  // The board is set once per game: specials, then the Cheat Path, then random numbers everywhere else.
  function genBoard() {
    S.board = Array.from({ length: N }, () => ({ v: ri(MIN, MAX), sp: null, cd: 0, step: -1 }));
    const idx = shuffle([...Array(N).keys()]);
    SPECIAL_SET.forEach((sp, j) => { S.board[idx[j]].sp = sp; S.board[idx[j]].v = 0; });
    const values = makePathValues();
    S.path = values.map((v, k) => {
      const i = idx[SPECIAL_SET.length + k];
      S.board[i].v = v;
      S.board[i].step = k;
      return i;
    });
    S.known = 0;
    S.picked = null;
    S.reveal = false;
  }

  // Running total after each step of the path, starting from 0.
  function pathTotals() {
    let sum = 0;
    return S.path.map((i) => (sum += S.board[i].v));
  }

  function addLog(text, player) {
    S.log.unshift({ text, color: player ? player.color : null });
    S.log = S.log.slice(0, 40);
  }
  function say(html) { S.result = html; }

  // ---------- game actions ----------
  function startGame(keepPlayers) {
    if (!keepPlayers) {
      S.players = Array.from({ length: S.count }, (_, i) => {
        const type = $('type' + (i + 1)).value;
        return {
          name: ($('name' + (i + 1)).value.trim() || `Player ${i + 1}`),
          color: PLAYER_COLORS[i], score: 0, extra: 0, ai: type === 'human' ? null : type,
        };
      });
    } else {
      S.players.forEach((p) => { p.score = 0; p.extra = 0; });
    }
    S.looks = makeLooks();
    S.cur = 0; S.log = []; S.winner = null; S.busy = false; S.phase = 'play'; S.round = 1;
    resetAiTurn();
    genBoard();
    say(`Pick any square, <b>${esc(curP().name)}</b>. Somewhere on this board, five squares add up to exactly 1,000.`);
    $('winModal').hidden = true;
    render();
  }

  // Human clicks are ignored while the computer is playing its turn.
  const blocked = (byAi) => S.phase !== 'play' || S.busy || (!!curP().ai && !byAi);

  function pick(i, byAi) {
    if (blocked(byAi)) return;
    const t = S.board[i];
    if (t.cd > 0) return;
    const p = curP();
    const where = `<b>${coord(i)}</b>`;
    S.busy = true;
    S.picked = i;
    t.cd = COOLDOWN + 1;   // counts down at the start of each turn, so it sits out the next 3
    let msg;

    if (t.sp === 'treat') {
      S.reveal = true;
      S.peeked = true;   // a computer player gets to "remember" what it saw
      msg = `${where} was a <b>Treat Code</b>! Every number is showing for 3 seconds. ${esc(p.name)} picks again.`;
      addLog(`${p.name} found a Treat Code on ${coord(i)}.`, p);
      say(msg);
      render();
      setTimeout(() => {
        S.reveal = false; S.picked = null; S.busy = false;
        say(`Time's up. Pick again, <b>${esc(p.name)}</b>.`);
        render();
      }, TREAT_MS);
      return;
    }

    if (!t.sp) {
      p.score += t.v;
      msg = `${esc(p.name)} picked ${where} and got <b>${signed(t.v)}</b>.`;
      if (t.step >= 0 && t.step < S.known) msg += ` That's step ${t.step + 1} of the Cheat Path.`;
      addLog(`${p.name} picked ${coord(i)}: ${signed(t.v)}`, p);
    } else if (t.sp === 'zero') {
      p.score = 0;
      msg = `${where} was <b>Lose It All</b>. ${esc(p.name)} drops to 0.`;
      addLog(`${p.name} hit Lose It All on ${coord(i)}.`, p);
    } else if (t.sp === 'gift') {
      const o = randomOther();
      msg = `${where} was <b>Gift Wrap</b>. ${esc(p.name)} gives ${scoreText(p.score)} points to ${esc(o.name)}.`;
      addLog(`${p.name} gift-wrapped ${scoreText(p.score)} points to ${o.name}.`, p);
      o.score += p.score;
      p.score = 0;
    } else if (t.sp === 'swap') {
      const o = randomOther();
      [p.score, o.score] = [o.score, p.score];
      msg = `${where} was a <b>Switcheroo</b>. ${esc(p.name)} swaps scores with ${esc(o.name)}.`;
      addLog(`${p.name} swapped scores with ${o.name}.`, p);
    }
    say(msg);
    render();
    if (checkWin()) return;
    setTimeout(nextTurn, NEXT_TURN_MS);
  }

  // Tick every cooldown. A square that isn't on the Cheat Path gets a fresh number when it unlocks.
  function tickCooldowns() {
    S.board.forEach((t) => {
      if (t.cd <= 0) return;
      t.cd--;
      if (t.cd === 0 && !t.sp && t.step < 0) t.v = ri(MIN, MAX);
    });
  }

  function nextTurn() {
    if (S.phase !== 'play') return;
    const p = curP();
    if (p.extra > 0) {
      p.extra--;
      addLog(`${p.name} used an extra turn (${p.extra} left).`, p);
      say(`${esc(p.name)} uses an extra turn.`);
    } else {
      S.cur = (S.cur + 1) % S.players.length;
      if (S.cur === 0) {
        S.round++;
        if (S.round > MAX_ROUNDS) { endByRounds(); return; }
        addLog(S.round === MAX_ROUNDS ? `Final round!` : `Round ${S.round} of ${MAX_ROUNDS}.`);
      }
      say(S.round === MAX_ROUNDS
        ? `<b>Final round.</b> Your last pick, <b>${esc(curP().name)}</b>.`
        : `Your pick, <b>${esc(curP().name)}</b>.`);
    }
    tickCooldowns();
    resetAiTurn();
    S.picked = null;
    S.busy = false;
    render();
  }

  // Out of rounds: whoever is closest to 1,000 wins. Ties go to the earlier player in turn order.
  function endByRounds() {
    S.round = MAX_ROUNDS;
    let w = 0;
    S.players.forEach((p, i) => {
      if (Math.abs(p.score - TARGET) < Math.abs(S.players[w].score - TARGET)) w = i;
    });
    S.phase = 'win';
    S.winner = w;
    S.endReason = 'rounds';
    S.busy = true;
    S.picked = null;
    addLog(`${MAX_ROUNDS} rounds are up. ${S.players[w].name} is closest to 1,000!`, S.players[w]);
    say(`<b>Time's up!</b> All ${MAX_ROUNDS} rounds are done.`);
    render();
    setTimeout(showWin, 900);
  }

  // Whoever sits on exactly 1,000 wins; the current player gets priority.
  function checkWin() {
    const order = [S.cur, ...S.players.map((_, i) => i).filter((i) => i !== S.cur)];
    const w = order.find((i) => S.players[i].score === TARGET);
    if (w === undefined) return false;
    S.phase = 'win';
    S.winner = w;
    S.endReason = 'exact';
    S.busy = true;
    addLog(`${S.players[w].name} hit exactly 1,000!`, S.players[w]);
    render();
    setTimeout(showWin, 900);
    return true;
  }

  const canBuy = (cost, byAi) => !blocked(byAi) && curP().score >= cost;

  // Each Cheat Code reveals the next square on the path.
  function buyHint(byAi) {
    if (!canBuy(HINT_COST, byAi) || S.known >= PATH_LEN) return;
    const p = curP();
    p.score -= HINT_COST;
    const i = S.path[S.known];
    S.known++;
    addLog(`${p.name} bought a Cheat Code: step ${S.known} is ${coord(i)}.`, p);
    if (checkWin()) return;
    say(`<b>Cheat Code:</b> step ${S.known} of the Cheat Path is <b>${coord(i)}</b>, the ${esc(S.looks[i].name)} square (${signed(S.board[i].v)}). ` +
      `The path only works if you start it at 0 points.`);
    render();
  }

  // Free, and doesn't use up the turn.
  function zeroOut(byAi) {
    if (blocked(byAi)) return;
    const p = curP();
    if (p.score === 0) return;
    addLog(`${p.name} zeroed out their score (was ${scoreText(p.score)}).`, p);
    p.score = 0;
    say(`${esc(p.name)} zeroed out. Score is 0, ready to start the Cheat Path.`);
    render();
  }

  function buyRoll(byAi) {
    if (!canBuy(ROLL_COST, byAi)) return;
    const p = curP();
    p.score -= ROLL_COST;
    addLog(`${p.name} bought an Extra Roll.`, p);
    if (checkWin()) return;
    S.busy = true;
    render();
    openWheel();
  }

  // ---------- computer players ----------
  // Chances (0-1) that each level makes a smart move when one is available.
  //  follow: take the next known Cheat Path step when it's on the path
  //  peek:   "sense" a square that lands exactly on 1,000
  //  memory: use what it saw during a Treat Code
  //  hint:   buy a Cheat Code when it can afford one
  //  zero:   zero out to start the Cheat Path (or to escape a negative score)
  //  roll:   buy an Extra Roll
  //  dodge:  steer away from Lose It All and Gift Wrap
  const AI = {
    easy:   { label: 'Easy',   follow: 0.3,  peek: 0,    memory: 0,   hint: 0,   zero: 0,   roll: 0.1,  dodge: 0 },
    medium: { label: 'Medium', follow: 0.85, peek: 0.08, memory: 0.6, hint: 0.6, zero: 0.7, roll: 0.12, dodge: 0.3 },
    hard:   { label: 'Hard',   follow: 1,    peek: 0.3,  memory: 1,   hint: 1,   zero: 1,   roll: 1,    dodge: 0.8, rollBeforeZero: true },
  };
  const AI_DELAY = 950;
  const AI_MAX_ACTIONS = 4;   // shop/zero actions per turn before it has to pick a square
  let aiTimer = null;
  const chance = (p) => Math.random() < p;

  function resetAiTurn() { S.aiActions = 0; S.aiRolled = false; S.peeked = false; }

  function scheduleAi() {
    if (aiTimer || S.phase !== 'play' || S.busy || !curP().ai) return;
    aiTimer = setTimeout(aiTurn, AI_DELAY);
  }

  // How far along the Cheat Path the current score is: 0 = ready for step 1, -1 = off the path.
  function pathPos(score) {
    if (score === 0) return 0;
    const k = pathTotals().indexOf(score);
    return k >= 0 && k < PATH_LEN - 1 ? k + 1 : -1;
  }

  function closestIdx(score) {
    let best = -1, bestD = Infinity;
    S.board.forEach((t, i) => {
      if (t.cd > 0 || t.sp) return;
      const d = Math.abs(score + t.v - TARGET);
      if (d < bestD) { bestD = d; best = i; }
    });
    return best;
  }

  function randomIdx(dodge, score) {
    let open = S.board.map((_, i) => i).filter((i) => S.board[i].cd === 0);
    if (score > 0 && chance(dodge)) {
      const safer = open.filter((i) => S.board[i].sp !== 'zero' && S.board[i].sp !== 'gift');
      if (safer.length) open = safer;
    }
    return open[ri(0, open.length - 1)];
  }

  function aiTurn() {
    aiTimer = null;
    if (S.phase !== 'play' || S.busy) return;
    const p = curP();
    if (!p.ai) return;
    const L = AI[p.ai];
    const open = (i) => S.board[i].cd === 0;
    const pos = pathPos(p.score);
    const picksLeft = (MAX_ROUNDS - S.round) + 1 + p.extra;   // picks this player still gets, including this one
    const canAct = S.aiActions < AI_MAX_ACTIONS;

    // 1. Next step of the Cheat Path, if it's known and unlocked.
    if (pos >= 0 && pos < S.known && open(S.path[pos]) && chance(L.follow)) return pick(S.path[pos], true);

    // 2. A square that lands exactly on 1,000.
    const exact = S.board.findIndex((t, i) => open(i) && !t.sp && p.score + t.v === TARGET);
    if (exact >= 0 && chance(S.peeked ? L.memory : L.peek)) return pick(exact, true);
    if (S.peeked && chance(L.memory)) { const c = closestIdx(p.score); if (c >= 0) return pick(c, true); }

    if (canAct) {
      S.aiActions++;
      // 3. Escape a negative score.
      if (p.score < 0 && chance(L.zero)) return zeroOut(true);
      // 4. Buy the next Cheat Code (only when not already walking the path).
      if (pos < 0 && S.known < PATH_LEN && p.score >= HINT_COST && chance(L.hint)) return buyHint(true);
      // 5. Extra Roll. Hard only spends on it right before zeroing out, when the points are free.
      const readyToZero = pos < 0 && S.known === PATH_LEN && picksLeft >= PATH_LEN && open(S.path[0]);
      if (!S.aiRolled && p.score >= ROLL_COST && pos < 0 && (L.rollBeforeZero ? readyToZero : true) && chance(L.roll)) {
        S.aiRolled = true;
        return buyRoll(true);
      }
      // 6. Zero out to start the full Cheat Path, if there are enough picks left to finish it.
      if (readyToZero && p.score !== 0 && chance(L.zero)) return zeroOut(true);
    }

    // 7. Otherwise, a random square.
    pick(randomIdx(L.dodge, p.score), true);
  }

  // ---------- spinning wheel ----------
  const wheel = { rot: 0, speed: 0.012, mode: 'idle', last: 0, from: 0, to: 0, t0: 0, dur: 3200, k: 0, raf: 0 };
  const TAU = Math.PI * 2;
  const SEG = TAU / WHEEL.length;

  function openWheel() {
    $('wheelModal').hidden = false;
    const p = curP();
    const btn = $('wheelBtn');
    $('wheelSub').textContent = p.ai ? `${p.name} is spinning…` : 'Hit stop to see how many extra turns you win.';
    btn.textContent = 'Stop';
    btn.disabled = !!p.ai;
    btn.dataset.mode = 'stop';
    wheel.mode = 'spinning';
    wheel.last = performance.now();
    cancelAnimationFrame(wheel.raf);
    wheel.raf = requestAnimationFrame(wheelLoop);
    if (p.ai) setTimeout(stopWheel, ri(900, 1800));
    else btn.focus();
  }

  function stopWheel() {
    if (wheel.mode !== 'spinning') return;
    wheel.k = ri(0, WHEEL.length - 1);
    // Pointer is at the top (angle 3π/2). Land the middle of segment k under it.
    let target = 1.5 * Math.PI - (wheel.k + 0.5) * SEG + (Math.random() - 0.5) * SEG * 0.6;
    wheel.from = wheel.rot;
    let to = wheel.from + (wheel.speed * wheel.dur) / 3;
    to += (((target - to) % TAU) + TAU) % TAU;
    wheel.to = to;
    wheel.t0 = performance.now();
    wheel.mode = 'stopping';
    $('wheelBtn').disabled = true;
  }

  function wheelLoop(t) {
    const dt = t - wheel.last;
    wheel.last = t;
    if (wheel.mode === 'spinning') {
      wheel.rot += wheel.speed * dt;
    } else if (wheel.mode === 'stopping') {
      const p = Math.min(1, (t - wheel.t0) / wheel.dur);
      wheel.rot = wheel.from + (wheel.to - wheel.from) * (1 - Math.pow(1 - p, 3));
      if (p >= 1) { wheel.mode = 'done'; drawWheel(); wheelLanded(); return; }
    }
    drawWheel();
    if (wheel.mode === 'spinning' || wheel.mode === 'stopping') wheel.raf = requestAnimationFrame(wheelLoop);
  }

  function wheelLanded() {
    const n = WHEEL[wheel.k];
    $('wheelSub').textContent = n === 0 ? 'Zero extra turns. Ouch.' : `You win ${n} extra turn${n > 1 ? 's' : ''}!`;
    const btn = $('wheelBtn');
    btn.textContent = n === 0 ? 'Back to the board' : `Collect ${n}`;
    btn.dataset.mode = 'collect';
    if (curP().ai) { btn.disabled = true; setTimeout(collectWheel, 1300); return; }
    btn.disabled = false;
    btn.focus();
  }

  function collectWheel() {
    const n = WHEEL[wheel.k];
    const p = curP();
    p.extra += n;
    addLog(`${p.name} spun ${n} extra turn${n === 1 ? '' : 's'}.`, p);
    say(n ? `${esc(p.name)} won <b>${n} extra turn${n > 1 ? 's' : ''}</b>. Now pick a square.` : `No extra turns this time, ${esc(p.name)}. Pick a square.`);
    $('wheelModal').hidden = true;
    wheel.mode = 'idle';
    S.busy = false;
    render();
  }

  function drawWheel() {
    const cv = $('wheelCanvas');
    const dpr = window.devicePixelRatio || 1;
    const size = cv.clientWidth || 300;
    if (cv.width !== Math.round(size * dpr)) { cv.width = Math.round(size * dpr); cv.height = Math.round(size * dpr); }
    const ctx = cv.getContext('2d');
    const r = size / 2;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);
    ctx.save();
    ctx.translate(r, r);
    WHEEL.forEach((n, i) => {
      const a0 = wheel.rot + i * SEG, a1 = a0 + SEG;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, r - 6, a0, a1);
      ctx.closePath();
      ctx.fillStyle = WHEEL_COLORS[i % WHEEL_COLORS.length];
      ctx.fill();
      ctx.strokeStyle = '#1a1230';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.save();
      ctx.rotate(a0 + SEG / 2);
      ctx.fillStyle = '#1a1230';
      ctx.font = `${Math.round(r * 0.2)}px Bungee, 'Arial Black', sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(n), r * 0.7, 0);
      ctx.restore();
    });
    ctx.beginPath();
    ctx.arc(0, 0, r - 4, 0, TAU);
    ctx.strokeStyle = '#fff4e2';
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.14, 0, TAU);
    ctx.fillStyle = '#1a1230';
    ctx.fill();
    ctx.strokeStyle = '#ffb627';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.restore();
  }

  // ---------- win screen ----------
  function showWin() {
    const w = S.players[S.winner];
    $('winTitle').textContent = `${w.name} Wins`;
    const rest = S.players.filter((p) => p !== w)
      .sort((a, b) => Math.abs(a.score - TARGET) - Math.abs(b.score - TARGET));
    const tied = rest.filter((p) => Math.abs(p.score - TARGET) === Math.abs(w.score - TARGET));
    $('winSub').textContent = S.endReason === 'rounds'
      ? `All ${MAX_ROUNDS} rounds are done, and ${w.name} finished closest to 1,000.` +
        (tied.length ? ` Tied with ${tied.map((p) => p.name).join(' and ')}; the tie goes to the earlier player.` : '')
      : 'Landed on exactly 1,000 points.';
    const order = [w, ...rest];
    const suffix = ['st', 'nd', 'rd', 'th'];
    $('standings').innerHTML =
      `<div class="st-head"><span>Place</span><span>Player</span><span>Score</span></div>` +
      order.map((p, i) => {
        const off = Math.abs(p.score - TARGET);
        return `<div class="st-row${i === 0 ? ' first' : ''}" style="--pc:${p.color};--d:${0.25 + i * 0.18}s">
          <span class="st-place p${i + 1}">${i + 1}<sup>${suffix[i]}</sup></span>
          <span class="st-name">${esc(p.name)}<small>${off === 0 ? 'Exactly 1,000!' : `${num(off)} away from 1,000`}</small></span>
          <span class="st-score">${scoreText(p.score)}</span>
        </div>`;
      }).join('');
    $('winModal').hidden = false;
    $('againBtn').focus();
  }

  // ---------- rendering ----------
  const boardEl = $('board');
  const squares = [];
  function buildBoard() {
    $('colLabels').innerHTML = Array.from({ length: 10 }, (_, i) => `<span>${i + 1}</span>`).join('');
    $('rowLabels').innerHTML = [...ROWS].map((r) => `<span>${r}</span>`).join('');
    for (let i = 0; i < N; i++) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'sq';
      b.innerHTML = '<span class="chip"></span><span class="cd"></span><span class="step"></span>';
      b.addEventListener('click', () => pick(i));
      boardEl.appendChild(b);
      squares.push(b);
    }
  }

  function renderCheatPath() {
    const totals = pathTotals();
    const steps = S.path.map((i, k) => {
      if (k >= S.known) {
        return `<li class="cp-step hidden-step"><span class="cp-n">Step ${k + 1}</span>
          <span class="cp-q">?</span><span class="cp-note">${k === S.known ? 'Buy a Cheat Code to reveal' : 'Locked'}</span></li>`;
      }
      const t = S.board[i];
      return `<li class="cp-step${t.cd > 0 ? ' cooling' : ''}"><span class="cp-n">Step ${k + 1}</span>
        <span class="cp-sq" style="background:${S.looks[i].bg}"></span>
        <span class="cp-coord">${coord(i)}</span>
        <span class="cp-val ${t.v > 0 ? 'pos' : 'neg'}">${signed(t.v)}</span>
        <span class="cp-note">${t.cd > 0 ? `Locked ${t.cd} more turn${t.cd > 1 ? 's' : ''}` : `Total: ${scoreText(totals[k])}`}</span></li>`;
    }).join('');
    $('cheatPath').innerHTML = `<div class="cp-head"><h2>Cheat Path</h2>
      <p>Five squares that add up to exactly 1,000, but only if you start at <b>0 points</b>. ${S.known}/${PATH_LEN} revealed.</p></div>
      <ol class="cp-steps">${steps}</ol>`;
  }

  function render() {
    $('setup').hidden = S.phase !== 'setup';
    $('game').hidden = S.phase === 'setup';
    $('cheatPath').hidden = S.phase === 'setup';
    if (S.phase === 'setup') { renderSetup(); return; }

    const p = curP();
    renderCheatPath();

    // players
    $('players').innerHTML = S.players.map((pl, i) => {
      const gap = TARGET - pl.score;
      const zero = i === S.cur && S.phase === 'play' && !pl.ai
        ? `<button type="button" class="zero-btn" id="zeroBtn"${S.busy || pl.score === 0 ? ' disabled' : ''}>Zero out my score</button>` : '';
      return `<div class="pcard${i === S.cur ? ' active' : ''}" style="--pc:${pl.color}">
        <div class="pname"><span>${esc(pl.name)}</span>${pl.extra ? `<span class="pill">+${pl.extra} turn${pl.extra > 1 ? 's' : ''}</span>` : ''}</div>
        ${pl.ai ? `<div class="cpu-tag ${pl.ai}">Computer · ${AI[pl.ai].label}</div>` : ''}
        <div class="pscore">${scoreText(pl.score)}</div>
        <div class="pneed${gap === 0 ? ' bang' : ''}">${gap === 0 ? 'Exactly 1,000!' : `Needs ${signed(gap)} to hit 1,000`}</div>
        ${zero}
      </div>`;
    }).join('');

    // banner
    $('turnLabel').style.setProperty('--pc', p.color);
    $('turnLabel').innerHTML = `<span class="dot"></span><span><span class="who">${esc(p.name)}</span>'s turn</span>` +
      (p.extra ? `<span class="pill" style="--pc:${p.color}">${p.extra} extra</span>` : '') +
      (p.ai && S.phase === 'play' ? `<span class="thinking">thinking<i>.</i><i>.</i><i>.</i></span>` : '') +
      `<span class="round${S.round === MAX_ROUNDS ? ' final' : ''}">Round ${S.round} of ${MAX_ROUNDS}</span>`;
    $('result').innerHTML = S.result;
    const bar = $('treatBar');
    if (S.reveal && bar.hidden) { bar.hidden = false; bar.innerHTML = '<span></span>'; }
    if (!S.reveal) bar.hidden = true;

    // board
    boardEl.classList.toggle('locked', S.busy || !!p.ai);
    squares.forEach((b, i) => {
      const t = S.board[i], look = S.looks[i];
      b.style.background = look.bg;
      const show = S.reveal || S.picked === i;
      const cooling = t.cd > 0 && S.picked !== i;
      const known = t.step >= 0 && t.step < S.known;
      b.classList.toggle('show', show);
      b.classList.toggle('picked', S.picked === i && !S.reveal);
      b.classList.toggle('cool', cooling);
      b.classList.toggle('on-path', known);
      b.disabled = cooling;
      const [chip, cd, step] = b.children;
      if (t.sp) {
        chip.className = 'chip spec';
        chip.innerHTML = `<span><span class="ico">${SPECIALS[t.sp].icon}</span>${SPECIALS[t.sp].short}</span>`;
      } else {
        chip.className = 'chip ' + (t.v > 0 ? 'pos' : t.v < 0 ? 'neg' : '');
        chip.textContent = short(t.v);
      }
      cd.textContent = cooling && !show ? String(t.cd) : '';
      step.textContent = known ? String(t.step + 1) : '';
      const state = cooling ? `, locked for ${t.cd} more turn${t.cd > 1 ? 's' : ''}` : '';
      const pathNote = known ? `, Cheat Path step ${t.step + 1}` : '';
      b.setAttribute('aria-label', show
        ? `${coord(i)} ${look.name}: ${t.sp ? SPECIALS[t.sp].label : signed(t.v)}${pathNote}${state}`
        : `${coord(i)} ${look.name}${pathNote}${state}`);
      b.title = `${coord(i)} · ${look.name}${pathNote}${state}`;
    });

    // shop
    const hintBtn = $('hintBtn');
    const allKnown = S.known >= PATH_LEN;
    hintBtn.disabled = !canBuy(HINT_COST) || allKnown;
    $('hintDesc').textContent = allKnown ? 'The whole Cheat Path is revealed.'
      : p.score < HINT_COST ? `Reveals step ${S.known + 1} of the Cheat Path. You need 500 points; you have ${scoreText(p.score)}.`
      : `Reveals step ${S.known + 1} of the Cheat Path.`;
    $('rollBtn').disabled = !canBuy(ROLL_COST);

    // log
    $('log').innerHTML = S.log.length
      ? S.log.map((e) => `<li style="--pc:${e.color || 'var(--line)'}">${esc(e.text)}</li>`).join('')
      : '<li class="empty">Nothing yet. Pick a square!</li>';

    scheduleAi();
  }

  function renderSetup() {
    [2, 3, 4].forEach((n) => $('count' + n).setAttribute('aria-checked', String(S.count === n)));
    document.querySelectorAll('.name-field').forEach((el, i) => { el.hidden = i >= S.count; });
  }

  // Switching a slot to a computer gives it a robot name, unless the name was already customised.
  const CPU_NAMES = { easy: 'Robo Rookie', medium: 'Robo Pro', hard: 'Robo Boss' };
  const isDefaultName = (v, n) => v === '' || v === `Player ${n}` || Object.values(CPU_NAMES).includes(v);
  function setSlotType(n, type) {
    const input = $('name' + n);
    $('type' + n).value = type;
    if (isDefaultName(input.value.trim(), n)) input.value = type === 'human' ? `Player ${n}` : CPU_NAMES[type];
  }

  // ---------- wiring ----------
  document.querySelectorAll('.count').forEach((b) => {
    b.setAttribute('role', 'radio');
    b.addEventListener('click', () => { S.count = Number(b.dataset.count); renderSetup(); });
  });
  $('startBtn').addEventListener('click', () => startGame(false));
  $('hintBtn').addEventListener('click', () => buyHint(false));
  $('rollBtn').addEventListener('click', () => buyRoll(false));
  [1, 2, 3, 4].forEach((n) => $('type' + n).addEventListener('change', (e) => setSlotType(n, e.target.value)));
  document.querySelectorAll('.ai-btn').forEach((b) => b.addEventListener('click', () => {
    S.count = 2;
    setSlotType(1, 'human');
    setSlotType(2, b.dataset.level);
    renderSetup();
    startGame(false);
  }));
  $('wheelBtn').addEventListener('click', () => {
    if ($('wheelBtn').dataset.mode === 'collect') collectWheel(); else stopWheel();
  });
  $('againBtn').addEventListener('click', () => startGame(true));
  $('newBtn').addEventListener('click', toSetup);
  $('quitBtn').addEventListener('click', toSetup);
  $('players').addEventListener('click', (e) => { if (e.target.closest('#zeroBtn')) zeroOut(false); });
  function toSetup() {
    const count = S.count;
    S = freshState();
    S.count = count;
    $('winModal').hidden = true;
    $('wheelModal').hidden = true;
    render();
  }

  // ---------- boot (keeps a game in progress across page updates when hosted) ----------
  function start(data) {
    buildBoard();
    if (data && data.phase && data.phase !== 'setup' && data.players && data.players.length && Array.isArray(data.path) && data.path.length) {
      S = Object.assign(freshState(), data);
      S.reveal = false; S.picked = null;
      if (S.phase === 'play') { S.busy = false; }
      render();
      if (S.phase === 'win') showWin();
    } else {
      render();
    }
  }
  if (window.claude && window.claude.hot && window.claude.hot.snapshot) {
    window.claude.hot.snapshot(() => JSON.parse(JSON.stringify(S)));
  }
  if (window.claude && window.claude.hot && window.claude.hot.ready) window.claude.hot.ready(start);
  else start((window.claude && window.claude.hot && window.claude.hot.data) || {});
})();
