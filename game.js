/* Choose A Color Square
   A game invented by Connor. 2-4 players share one screen. First to exactly 1,000 points wins. */
(() => {
  'use strict';

  // ---------- rules ----------
  const N = 100;
  const MIN = -1000, MAX = 1000, TARGET = 1000;
  const HINT_COST = 500, ROLL_COST = 25;
  const PATH_LEN = 5;              // squares in the guaranteed Cheat Path
  const COOLDOWN = 3;              // turns a square stays locked after it's picked
  const MAX_ROUNDS = 25;           // turns per player; extra turns and Treat Code re-picks don't count
  const SPECIAL_COUNT = 25;        // special squares on the board at all times
  const MIN_SQUARES = 50;          // the dog stops chewing when the board gets this small
  const TREAT_MS = 3000;           // how long a Treat Code shows the numbers
  const QUIZ_MS = 5000;            // time limit for a Pop Quiz
  const REVEAL_MS = 5000;          // how long the big "you picked" card stays up (tap to close sooner)
  const NEXT_TURN_MS = 600;
  const ROWS = 'ABCDEFGHIJ';
  const PLAYER_COLORS = ['#ff5d8f', '#48cae4', '#ffc93c', '#80ed99'];
  const WHEEL_COLORS = ['#ff5d8f', '#ff9f1c', '#ffd23f', '#80ed99', '#48cae4', '#9d7bff'];
  const ROLL_WHEEL = [1, 0, 2, 1, 3, 1, 0, 2, 1, 5, 1, 2];
  const RICKROLL_URL = 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0';
  const RICKROLL_LINK = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
  const EENY = ['Eeny,', 'meeny,', 'miny,', 'moe,', 'Catch', 'a', 'tiger', 'by', 'the', 'toe.',
    'If', 'he', 'hollers,', 'let', 'him', 'go,', 'Eeny,', 'meeny,', 'miny,', 'MOE!'];

  // Every special square. `unique` means only one can be on the board.
  const SPECIALS = {
    zero:       { label: 'Lose It All',  short: 'ZERO',  icon: '💀', desc: 'Your score drops to 0.' },
    gift:       { label: 'Gift Wrap',    short: 'GIFT',  icon: '🎁', desc: 'All your points go to another player.' },
    swap:       { label: 'Switcheroo',   short: 'SWAP',  icon: '🔄', desc: 'Swap scores with another player.' },
    treat:      { label: 'Treat Code',   short: 'TREAT', icon: '🍬', desc: 'Every square shows its number for 3 seconds, then you pick again.' },
    bonus:      { label: 'Bonus Round',  short: 'BONUS', icon: '⭐', desc: 'Everyone rolls once. The highest roll wins the game!' },
    death:      { label: 'Death',        short: 'DEATH', icon: '⚰️', desc: "You're out of the game! If only one player is left, they win." },
    negative:   { label: 'Negative',     short: 'NEG',   icon: '➖', desc: "Everyone's score flips between plus and minus." },
    shuffle:    { label: 'Shuffle',      short: 'SHUFL', icon: '🔀', desc: 'Everyone gives their points to someone else.' },
    distribute: { label: 'Distribute',   short: 'SPLIT', icon: '🥧', desc: 'All the points go in one pot and get split evenly.' },
    pots:       { label: 'Magic Pots',   short: 'POTS',  icon: '🏺', desc: 'Pick one of 3 pots and win whatever is inside.' },
    reshuffle:  { label: 'Reshuffle',    short: 'MIX',   icon: '🃏', desc: 'Every hidden card moves to a new square.' },
    quiz:       { label: 'Pop Quiz',     short: 'QUIZ',  icon: '🧮', desc: 'Solve a math problem in 5 seconds to win the points.' },
    dog:        { label: 'Dog',          short: 'DOG',   icon: '🐕', desc: 'A dog chews up some squares. They are gone for good.' },
    tornado:    { label: 'Tornado',      short: 'WIND',  icon: '🌪️', desc: 'A tornado blows every square to a new spot.' },
    s999:       { label: '999',          short: '999',   icon: '9️⃣', desc: 'Your score becomes 999.' },
    s333:       { label: '333',          short: '333',   icon: '3️⃣', desc: 'Your score becomes 333.' },
    badluck:    { label: 'Bad Luck',     short: '−1',    icon: '🌧️', desc: 'Your score becomes −1.' },
    duck:       { label: 'Duck',         short: 'QUACK', icon: '🦆', desc: 'A giant duck yells QUACK. That is all.' },
    eeny:       { label: 'Eeny Meeny Miny Moe', short: 'EENY', icon: '👇', desc: 'The rhyme picks a player, and that player wins the game!', unique: true },
    reset:      { label: 'Reset',        short: 'RESET', icon: '🔁', desc: 'The whole game starts over. Everyone goes back to 0.' },
    nose:       { label: 'No One Nose',  short: 'NOSE',  icon: '👃', desc: 'Spin a wheel of special squares and get whatever it lands on.' },
    rick:       { label: '$100,000 Prize', short: '$100K', icon: '💰', desc: 'You won $100,000! Click to claim it.' },
    hug:        { label: 'Hug Yo Mom',   short: 'HUG',   icon: '🤗', desc: 'Everyone has to go hug their mom.' },
    trick:      { label: 'Trick or Treat (But Not For Me)', short: 'TRICK', icon: '🎃', desc: 'Spin the wheel. Trick gives you +100,000. Treat gives you +1,000.' },
  };
  const SPECIAL_TYPES = Object.keys(SPECIALS);
  const REPEATABLE = SPECIAL_TYPES.filter((k) => !SPECIALS[k].unique);

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
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const chance = (p) => Math.random() < p;
  const pickOne = (arr) => arr[ri(0, arr.length - 1)];
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
  const listNames = (names) => names.length < 2 ? names.join('') : names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1];

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
    return { phase: 'setup', count: 2, players: [], cur: 0, looks: [], board: [], path: [], known: 0, round: 1,
      endReason: 'exact', picked: null, reveal: false, busy: false, log: [], result: '', winner: null, outCount: 0 };
  }
  const curP = () => S.players[S.cur];
  const activeIdx = () => S.players.map((_, i) => i).filter((i) => !S.players[i].out);
  const others = () => activeIdx().filter((i) => i !== S.cur).map((i) => S.players[i]);
  const randomOther = () => { const o = others(); return o.length ? pickOne(o) : null; };
  // Active players in turn order, starting with the current player.
  const fromCurrent = () => { const a = activeIdx(); const k = Math.max(0, a.indexOf(S.cur)); return [...a.slice(k), ...a.slice(0, k)]; };

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

  // Board setup: 25 specials (one of every kind plus one extra), then the Cheat Path, then random numbers.
  function genBoard() {
    S.board = Array.from({ length: N }, () => ({ v: ri(MIN, MAX), sp: null, cd: 0, step: -1, gone: false }));
    const idx = shuffle([...Array(N).keys()]);
    const types = shuffle([...SPECIAL_TYPES, ...Array.from({ length: SPECIAL_COUNT - SPECIAL_TYPES.length }, () => pickOne(REPEATABLE))]);
    types.forEach((sp, j) => { S.board[idx[j]].sp = sp; S.board[idx[j]].v = 0; });
    const values = makePathValues();
    values.forEach((v, k) => {
      const t = S.board[idx[SPECIAL_COUNT + k]];
      t.v = v;
      t.step = k;
    });
    syncPath();
    S.known = 0;
    S.picked = null;
    S.reveal = false;
  }
  // Where each Cheat Path step sits now (squares can move around).
  function syncPath() {
    S.path = Array.from({ length: PATH_LEN }, (_, k) => S.board.findIndex((t) => t.step === k));
  }
  // Keep exactly 25 specials on the board by turning plain squares into specials when some are lost.
  function ensureSpecials() {
    let count = S.board.filter((t) => !t.gone && t.sp).length;
    const plain = shuffle(S.board.filter((t) => !t.gone && !t.sp && t.step < 0));
    while (count < SPECIAL_COUNT && plain.length) {
      const t = plain.pop();
      const hasUnique = (k) => S.board.some((x) => !x.gone && x.sp === k);
      const choices = SPECIAL_TYPES.filter((k) => !SPECIALS[k].unique || !hasUnique(k));
      t.sp = pickOne(choices);
      t.v = 0;
      count++;
    }
  }
  function pathTotals() {
    let sum = 0;
    return S.path.map((i) => (sum += S.board[i].v));
  }

  function addLog(text, player) {
    S.log.unshift({ text, color: player ? player.color : null });
    S.log = S.log.slice(0, 50);
  }
  function say(html) { S.result = html; }

  // ---------- game flow ----------
  function startGame(keepPlayers) {
    if (!keepPlayers) {
      S.players = Array.from({ length: S.count }, (_, i) => {
        const type = $('type' + (i + 1)).value;
        return {
          name: ($('name' + (i + 1)).value.trim() || `Player ${i + 1}`),
          color: PLAYER_COLORS[i], score: 0, extra: 0, out: false, outAt: 0, ai: type === 'human' ? null : type,
        };
      });
    }
    S.players.forEach((p) => { p.score = 0; p.extra = 0; p.out = false; p.outAt = 0; });
    S.looks = makeLooks();
    S.cur = 0; S.log = []; S.winner = null; S.busy = false; S.phase = 'play'; S.round = 1; S.outCount = 0;
    resetAiTurn();
    genBoard();
    say(`Pick any square, <b>${esc(curP().name)}</b>. 25 of them are special, and five of them add up to exactly 1,000.`);
    $('winModal').hidden = true;
    render();
  }

  // Human clicks are ignored while the computer is playing its turn.
  const blocked = (byAi) => S.phase !== 'play' || S.busy || (!!curP().ai && !byAi);

  async function pick(i, byAi) {
    if (blocked(byAi)) return;
    const t = S.board[i];
    if (t.cd > 0 || t.gone) return;
    const p = curP();
    S.busy = true;
    S.picked = i;
    t.cd = COOLDOWN + 1;   // counts down at the start of each turn, so it sits out the next 3
    render();
    try {
      await revealCard(i, p);
      const outcome = t.sp ? await runSpecial(t.sp, p) : applyNumber(t, i, p);
      finishTurn(outcome);
    } catch (err) {
      console.error(err);
      finishTurn('next');
    }
  }

  function applyNumber(t, i, p) {
    p.score += t.v;
    let msg = `${esc(p.name)} picked <b>${coord(i)}</b> and got <b>${signed(t.v)}</b>.`;
    if (t.step >= 0 && t.step < S.known) msg += ` That's step ${t.step + 1} of the Cheat Path.`;
    addLog(`${p.name} picked ${coord(i)}: ${signed(t.v)}`, p);
    say(msg);
    return 'next';
  }

  // outcome: 'next' ends the turn, 'again' lets the same player pick again, 'over' means the game ended.
  function finishTurn(outcome) {
    if (S.phase !== 'play') return;
    if (outcome === 'again') { S.busy = false; S.picked = null; render(); return; }
    render();
    if (checkWin()) return;
    setTimeout(nextTurn, NEXT_TURN_MS);
  }

  function tickCooldowns() {
    S.board.forEach((t) => {
      if (t.cd <= 0 || t.gone) return;
      t.cd--;
      if (t.cd === 0 && !t.sp && t.step < 0) t.v = ri(MIN, MAX);   // plain squares get a fresh number
    });
  }

  function nextTurn() {
    if (S.phase !== 'play') return;
    const p = curP();
    if (p.extra > 0 && !p.out) {
      p.extra--;
      addLog(`${p.name} used an extra turn (${p.extra} left).`, p);
      say(`${esc(p.name)} uses an extra turn.`);
    } else {
      const n = S.players.length;
      let j = S.cur;
      do { j = (j + 1) % n; } while (S.players[j].out);
      if (j <= S.cur) {
        S.round++;
        if (S.round > MAX_ROUNDS) { endByRounds(); return; }
        addLog(S.round === MAX_ROUNDS ? 'Final round!' : `Round ${S.round} of ${MAX_ROUNDS}.`);
      }
      S.cur = j;
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

  function winGame(w, reason) {
    S.phase = 'win';
    S.winner = w;
    S.endReason = reason;
    S.busy = true;
    S.picked = null;
    render();
    setTimeout(showWin, 700);
  }

  // Out of rounds: whoever is still in and closest to 1,000 wins. Ties go to the earlier player.
  function endByRounds() {
    S.round = MAX_ROUNDS;
    const a = activeIdx();
    let w = a[0];
    a.forEach((i) => { if (Math.abs(S.players[i].score - TARGET) < Math.abs(S.players[w].score - TARGET)) w = i; });
    addLog(`${MAX_ROUNDS} rounds are up. ${S.players[w].name} is closest to 1,000!`, S.players[w]);
    say(`<b>Time's up!</b> All ${MAX_ROUNDS} rounds are done.`);
    winGame(w, 'rounds');
  }

  // Whoever is still in and sits on exactly 1,000 wins; the current player gets priority.
  function checkWin() {
    const order = fromCurrent();
    const w = order.find((i) => S.players[i].score === TARGET);
    if (w === undefined) return false;
    addLog(`${S.players[w].name} hit exactly 1,000!`, S.players[w]);
    winGame(w, 'exact');
    return true;
  }

  const canBuy = (cost, byAi) => !blocked(byAi) && curP().score >= cost;

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

  function zeroOut(byAi) {
    if (blocked(byAi)) return;
    const p = curP();
    if (p.score === 0) return;
    addLog(`${p.name} zeroed out their score (was ${scoreText(p.score)}).`, p);
    p.score = 0;
    say(`${esc(p.name)} zeroed out. Score is 0, ready to start the Cheat Path.`);
    render();
  }

  async function buyRoll(byAi) {
    if (!canBuy(ROLL_COST, byAi)) return;
    const p = curP();
    p.score -= ROLL_COST;
    addLog(`${p.name} bought an Extra Roll.`, p);
    if (checkWin()) return;
    S.busy = true;
    render();
    const segs = ROLL_WHEEL.map((n, i) => ({ label: String(n), color: WHEEL_COLORS[i % WHEEL_COLORS.length] }));
    const k = await spinWheel(segs, 'Extra Roll', 'Hit stop to see how many extra turns you win.', (k) => {
      const n = ROLL_WHEEL[k];
      return n === 0 ? 'Zero extra turns. Ouch.' : `You win ${n} extra turn${n > 1 ? 's' : ''}!`;
    });
    const n = ROLL_WHEEL[k];
    p.extra += n;
    addLog(`${p.name} spun ${n} extra turn${n === 1 ? '' : 's'}.`, p);
    say(n ? `${esc(p.name)} won <b>${n} extra turn${n > 1 ? 's' : ''}</b>. Now pick a square.` : `No extra turns this time, ${esc(p.name)}. Pick a square.`);
    S.busy = false;
    render();
  }

  // ---------- big reveal card ----------
  function revealCard(i, p) {
    const t = S.board[i], look = S.looks[i];
    const sp = t.sp && SPECIALS[t.sp];
    const body = sp
      ? `<div class="rv-special"><span class="rv-ico">${sp.icon}</span><b>${esc(sp.label)}</b><p>${esc(sp.desc)}</p></div>`
      : `<div class="rv-value ${t.v > 0 ? 'pos' : t.v < 0 ? 'neg' : ''}">${signed(t.v)}</div>` +
        (t.step >= 0 && t.step < S.known ? `<div class="rv-path">Cheat Path step ${t.step + 1}</div>` : '');
    const box = $('reveal');
    $('revealCard').innerHTML = `
      <div class="rv-who" style="--pc:${p.color}"><span class="rv-dot"></span>${esc(p.name)} picked</div>
      <div class="rv-swatch" style="background:${look.bg}"><span>${coord(i)}</span></div>
      <div class="rv-name">${esc(look.name)} · Row ${coord(i)[0]}, Column ${(i % 10) + 1}</div>
      ${body}
      <div class="rv-tap">Tap to continue</div>`;
    box.hidden = false;
    return new Promise((resolve) => {
      let done = false;
      const finish = () => { if (done) return; done = true; box.hidden = true; box.onclick = null; resolve(); };
      box.onclick = finish;
      setTimeout(finish, REVEAL_MS);
    });
  }

  // ---------- pop-up screens for special squares ----------
  // Shows html in the effect pop-up. Buttons with data-choice close it with that value.
  // o.auto: close by itself after ms.  o.actor + o.ai: a computer player answers by itself after o.aiDelay.
  // o.aiOnly: only the computer may answer (humans can't click its choice for it).
  function fx(html, o = {}) {
    return new Promise((resolve) => {
      const box = $('fx'), body = $('fxBody');
      const actor = o.actor || curP();
      body.className = 'modal fx-modal ' + (o.cls || '');
      body.innerHTML = html;
      box.hidden = false;
      let done = false;
      const timers = [];
      const finish = (v) => {
        if (done) return;
        done = true;
        timers.forEach(clearTimeout);
        body.onclick = null;
        box.hidden = true;
        body.innerHTML = '';
        resolve(v);
      };
      body.onclick = (e) => {
        const b = e.target.closest('[data-choice]');
        if (!b || b.disabled) return;
        if (o.aiOnly && actor.ai) return;
        finish(b.dataset.choice);
      };
      if (o.auto) timers.push(setTimeout(() => finish('auto'), o.auto));
      if (o.ai && actor.ai) timers.push(setTimeout(() => finish(o.ai()), o.aiDelay || 1400));
      if (o.onOpen) o.onOpen(body, finish, timers);
      const first = body.querySelector('[data-choice]');
      if (first && !actor.ai) first.focus();
    });
  }

  const okBtn = (label = 'OK') => `<button type="button" class="big-btn" data-choice="ok">${esc(label)}</button>`;
  const announce = (icon, title, html, ms = 2800) => fx(
    `<div class="fx-ico">${icon}</div><h2>${title}</h2><div class="fx-text">${html}</div>${okBtn()}`, { auto: ms });
  const scoreTable = (rows) => `<div class="fx-scores">${rows.map((r) =>
    `<div class="fx-score" style="--pc:${r.p.color}"><span>${esc(r.p.name)}</span><span>${scoreText(r.before)} → <b>${scoreText(r.p.score)}</b></span></div>`).join('')}</div>`;

  async function runSpecial(type, p) {
    const sp = SPECIALS[type];
    const name = esc(p.name);
    switch (type) {
      case 'zero': {
        p.score = 0;
        addLog(`${p.name} hit Lose It All.`, p);
        say(`<b>Lose It All.</b> ${name} drops to 0.`);
        return 'next';
      }
      case 'gift': {
        const o = randomOther();
        if (!o) return 'next';
        addLog(`${p.name} gift-wrapped ${scoreText(p.score)} points to ${o.name}.`, p);
        say(`<b>Gift Wrap.</b> ${name} gives ${scoreText(p.score)} points to ${esc(o.name)}.`);
        o.score += p.score;
        p.score = 0;
        return 'next';
      }
      case 'swap': {
        const o = randomOther();
        if (!o) return 'next';
        [p.score, o.score] = [o.score, p.score];
        addLog(`${p.name} swapped scores with ${o.name}.`, p);
        say(`<b>Switcheroo.</b> ${name} swaps scores with ${esc(o.name)}.`);
        return 'next';
      }
      case 'treat': {
        S.reveal = true;
        S.peeked = true;   // a computer player gets to "remember" what it saw
        addLog(`${p.name} found a Treat Code.`, p);
        say(`<b>Treat Code!</b> Every number is showing for 3 seconds. ${name} picks again.`);
        render();
        await sleep(TREAT_MS);
        S.reveal = false;
        say(`Time's up. Pick again, <b>${name}</b>.`);
        return 'again';
      }
      case 'bonus': {
        const w = await bonusRound();
        addLog(`${S.players[w].name} won the Bonus Round!`, S.players[w]);
        winGame(w, 'bonus');
        return 'over';
      }
      case 'death': {
        p.out = true;
        p.outAt = ++S.outCount;
        p.extra = 0;
        addLog(`${p.name} hit Death and is out!`, p);
        say(`<b>Death.</b> ${name} is out of the game.`);
        render();
        const left = activeIdx();
        await announce('⚰️', `${name} is out!`, left.length === 1
          ? `Only <b>${esc(S.players[left[0]].name)}</b> is left standing.`
          : `${left.length} players are still in the game.`, 3000);
        if (left.length === 1) { winGame(left[0], 'last'); return 'over'; }
        return 'next';
      }
      case 'negative': {
        const rows = activeIdx().map((i) => ({ p: S.players[i], before: S.players[i].score }));
        rows.forEach((r) => { r.p.score = -r.p.score; });
        addLog(`${p.name} hit Negative. Everyone's score flipped!`, p);
        say(`<b>Negative!</b> Everyone's score flipped.`);
        render();
        await announce(sp.icon, 'Negative!', `Everyone's score flips sign.${scoreTable(rows)}`, 3400);
        return 'next';
      }
      case 'shuffle': {
        const a = activeIdx();
        const rows = a.map((i) => ({ p: S.players[i], before: S.players[i].score }));
        const perm = derange(a.length);
        const gives = [];
        rows.forEach((r, j) => { rows[perm[j]].p.score = r.before; gives.push(`${esc(r.p.name)} → ${esc(rows[perm[j]].p.name)}`); });
        addLog(`${p.name} hit Shuffle. Everyone passed their points along!`, p);
        say(`<b>Shuffle!</b> Everyone gave their points to someone else.`);
        render();
        await announce(sp.icon, 'Shuffle!', `<p class="fx-small">${gives.join(' · ')}</p>${scoreTable(rows)}`, 3800);
        return 'next';
      }
      case 'distribute': {
        const a = activeIdx();
        const rows = a.map((i) => ({ p: S.players[i], before: S.players[i].score }));
        const total = rows.reduce((s, r) => s + r.before, 0);
        const each = Math.trunc(total / a.length);
        const extra = total - each * a.length;
        rows.forEach((r) => { r.p.score = each; });
        p.score += extra;   // any leftover goes to whoever picked the square
        addLog(`${p.name} hit Distribute. Everyone now has ${scoreText(each)}.`, p);
        say(`<b>Distribute!</b> The pot of ${scoreText(total)} was split evenly.`);
        render();
        await announce(sp.icon, 'Distribute!', `The pot of <b>${scoreText(total)}</b> gets split ${a.length} ways` +
          (extra ? ` (${name} keeps the leftover ${scoreText(extra)})` : '') + `.${scoreTable(rows)}`, 3600);
        return 'next';
      }
      case 'pots': return magicPots(p);
      case 'reshuffle': {
        const live = S.board.map((_, i) => i).filter((i) => !S.board[i].gone);
        const moved = shuffle(live.map((i) => S.board[i]));
        live.forEach((i, j) => { S.board[i] = moved[j]; });
        syncPath();
        S.picked = null;
        addLog(`${p.name} hit Reshuffle. Every card moved!`, p);
        say(`<b>Reshuffle!</b> Every hidden card moved to a new square. Same colors, new secrets.`);
        boardFx('mixing', 900);
        render();
        await sleep(900);
        return 'next';
      }
      case 'quiz': return popQuiz(p);
      case 'dog': {
        const chewable = shuffle(S.board.map((_, i) => i).filter((i) => !S.board[i].gone && S.board[i].step < 0 && i !== S.picked));
        const room = S.board.filter((t) => !t.gone).length - MIN_SQUARES;
        const bites = chewable.slice(0, clamp(ri(3, 5), 0, Math.max(0, room)));
        bites.forEach((i) => { const t = S.board[i]; t.gone = true; t.sp = null; t.cd = 0; });
        ensureSpecials();
        const where = bites.map(coord);
        addLog(bites.length ? `A dog chewed up ${listNames(where)}.` : 'A dog showed up but was too full to chew anything.', p);
        say(bites.length ? `<b>Dog!</b> It chewed up ${listNames(where)}. Those squares are gone for good.` : `<b>Dog!</b> It sniffed around and left.`);
        render();
        await announce('🐕', 'Bad dog!', bites.length
          ? `The dog chewed up <b>${listNames(where)}</b>. Those squares are gone for good.`
          : 'The dog is too full to chew anything. Good dog.', 3000);
        return 'next';
      }
      case 'tornado': {
        const order = shuffle([...Array(N).keys()]);
        const board = order.map((i) => S.board[i]);
        const looks = order.map((i) => S.looks[i]);
        S.board = board;
        S.looks = looks;
        syncPath();
        S.picked = null;
        addLog(`${p.name} hit a Tornado. The whole board blew around!`, p);
        say(`<b>Tornado!</b> Every square blew to a new spot. Look for your colors!`);
        boardFx('tornado', 1400);
        render();
        await sleep(1400);
        return 'next';
      }
      case 's999': case 's333': case 'badluck': {
        const v = type === 's999' ? 999 : type === 's333' ? 333 : -1;
        p.score = v;
        addLog(`${p.name}'s score was set to ${scoreText(v)}.`, p);
        say(`<b>${esc(sp.label)}.</b> ${name}'s score is now <b>${scoreText(v)}</b>.`);
        return 'next';
      }
      case 'duck': {
        quack();
        addLog(`A giant duck yelled QUACK.`, p);
        say(`<b>QUACK.</b> That's it. That's the square.`);
        await fx(`<div class="giant-duck">🦆</div><div class="quack">QUACK!</div>`, { cls: 'duck-fx', auto: 2300 });
        return 'next';
      }
      case 'eeny': {
        const w = await eenyMeeny();
        addLog(`Eeny meeny miny moe picked ${S.players[w].name}!`, S.players[w]);
        winGame(w, 'eeny');
        return 'over';
      }
      case 'reset': {
        await announce(sp.icon, 'Reset!', 'The whole game starts over. Everyone goes back to 0 with a brand-new board.', 3000);
        resetGame(p);
        return 'next';
      }
      case 'nose': {
        const types = SPECIAL_TYPES.filter((k) => k !== 'nose');
        const segs = types.map((k, i) => ({ label: SPECIALS[k].icon, color: WHEEL_COLORS[i % WHEEL_COLORS.length] }));
        const k = await spinWheel(segs, 'No One Nose', 'Stop the wheel to get a special square.',
          (k) => `It's <b>${SPECIALS[types[k]].icon} ${esc(SPECIALS[types[k]].label)}</b>! ${esc(SPECIALS[types[k]].desc)}`);
        addLog(`No One Nose landed on ${SPECIALS[types[k]].label}.`, p);
        return runSpecial(types[k], p);
      }
      case 'rick': return rickRoll(p);
      case 'hug': {
        addLog('Everyone had to go hug their mom.', p);
        say(`<b>Hug Yo Mom.</b> Did everyone do it?`);
        await fx(`<div class="fx-ico">🤗</div><h2>Hug Yo Mom!</h2>
          <div class="fx-text">Everyone has to go hug their mom. Right now. Go!</div>${okBtn('We hugged our moms')}`,
          { ai: () => 'ok', aiDelay: 7000 });
        return 'next';
      }
      case 'trick': {
        const segs = Array.from({ length: 8 }, (_, i) => i % 2
          ? { label: 'TREAT', color: '#9d7bff' } : { label: 'TRICK', color: '#ff9f1c' });
        const k = await spinWheel(segs, 'Trick or Treat', 'But not for me. Stop the wheel!',
          (k) => k % 2 ? 'Treat! You get <b>+1,000</b>.' : 'Trick! You get <b>+100,000</b>. Good luck getting back to 1,000.');
        const v = k % 2 ? 1000 : 100000;
        p.score += v;
        addLog(`${p.name} got ${k % 2 ? 'Treat' : 'Trick'}: ${signed(v)}.`, p);
        say(`<b>${k % 2 ? 'Treat' : 'Trick'}!</b> ${name} gets <b>${signed(v)}</b>.`);
        return 'next';
      }
    }
    return 'next';
  }

  function derange(n) {
    if (n < 2) return [0];
    for (;;) {
      const p = shuffle([...Array(n).keys()]);
      if (p.every((v, i) => v !== i)) return p;
    }
  }

  function boardFx(cls, ms) {
    const b = $('board');
    b.classList.remove(cls);
    void b.offsetWidth;
    b.classList.add(cls);
    setTimeout(() => b.classList.remove(cls), ms);
  }

  // Full reset: everyone back in at 0, new board, round 1. The player after the last one goes first.
  function resetGame(p) {
    S.players.forEach((pl) => { pl.score = 0; pl.extra = 0; pl.out = false; pl.outAt = 0; });
    S.outCount = 0;
    S.looks = makeLooks();
    genBoard();
    S.round = 0;                       // nextTurn wraps to player 1 and makes this round 1
    S.cur = S.players.length - 1;
    addLog(`${p.name} hit Reset. The whole game started over!`, p);
    say(`<b>Reset!</b> Everyone is back to 0 on a brand-new board.`);
  }

  // Everyone still in rolls once; the highest roll wins. Ties roll again.
  async function bonusRound() {
    let field = fromCurrent();
    let tieRound = 0;
    for (;;) {
      const rolls = {};
      for (const idx of field) {
        const pl = S.players[idx];
        const rows = field.map((j) => `<div class="fx-score${j === idx ? ' now' : ''}" style="--pc:${S.players[j].color}">
            <span>${esc(S.players[j].name)}</span><b>${j in rolls ? signed(rolls[j]) : j === idx ? 'rolling next' : '…'}</b></div>`).join('');
        await fx(`<div class="fx-ico">⭐</div><h2>Bonus Round${tieRound ? ' tiebreak' : ''}</h2>
          <div class="fx-text">Everyone rolls once. The highest roll wins the game!</div>
          <div class="fx-scores">${rows}</div>
          <button type="button" class="big-btn" data-choice="roll" style="--pc:${pl.color}">${esc(pl.name)}, roll!</button>`,
          { actor: pl, ai: () => 'roll', aiDelay: 1100, aiOnly: true });
        rolls[idx] = ri(MIN, MAX);
        await fx(`<div class="fx-ico">🎲</div><h2>${esc(pl.name)} rolls…</h2><div class="roll-num" id="rollNum">0</div>`, {
          auto: 1300,
          onOpen: (body, finish, timers) => {
            const el = body.querySelector('#rollNum');
            const iv = setInterval(() => { el.textContent = signed(ri(MIN, MAX)); }, 60);
            timers.push(setTimeout(() => { clearInterval(iv); el.textContent = signed(rolls[idx]); el.classList.add('final'); }, 800));
            timers.push(setTimeout(() => clearInterval(iv), 1300));
          },
        });
      }
      const best = Math.max(...field.map((j) => rolls[j]));
      const top = field.filter((j) => rolls[j] === best);
      const rows = field.map((j) => `<div class="fx-score${rolls[j] === best ? ' now' : ''}" style="--pc:${S.players[j].color}">
          <span>${esc(S.players[j].name)}</span><b>${signed(rolls[j])}</b></div>`).join('');
      if (top.length === 1) {
        await fx(`<div class="fx-ico">🏆</div><h2>${esc(S.players[top[0]].name)} wins the Bonus Round!</h2>
          <div class="fx-scores">${rows}</div>${okBtn()}`, { auto: 3500 });
        return top[0];
      }
      await fx(`<div class="fx-ico">🤝</div><h2>It's a tie!</h2>
        <div class="fx-text">${listNames(top.map((j) => esc(S.players[j].name)))} roll again.</div>
        <div class="fx-scores">${rows}</div>${okBtn()}`, { auto: 3000 });
      field = top;
      tieRound++;
    }
  }

  // The rhyme counts around the players still in, starting from a random player so nobody can predict it.
  function eenyMeeny() {
    const base = fromCurrent();
    const startAt = ri(0, base.length - 1);
    const field = [...base.slice(startAt), ...base.slice(0, startAt)];
    const winner = field[(EENY.length - 1) % field.length];
    const chips = field.map((j) => `<span class="eeny-chip" data-p="${j}" style="--pc:${S.players[j].color}">${esc(S.players[j].name)}</span>`).join('');
    return fx(`<div class="fx-ico">👇</div><h2>Eeny Meeny Miny Moe</h2>
      <div class="eeny-word" id="eenyWord">Ready…</div>
      <div class="eeny-chips">${chips}</div>
      <div class="fx-text" id="eenyResult">Whoever the rhyme lands on wins the game!</div>
      <button type="button" class="big-btn" data-choice="ok" id="eenyOk" hidden>OK</button>`, {
      onOpen: (body, finish, timers) => {
        const word = body.querySelector('#eenyWord');
        const all = [...body.querySelectorAll('.eeny-chip')];
        EENY.forEach((w, k) => timers.push(setTimeout(() => {
          word.textContent = w;
          all.forEach((c, n) => c.classList.toggle('on', n === k % field.length));
          if (k === EENY.length - 1) {
            all[k % field.length].classList.add('win');
            body.querySelector('#eenyResult').innerHTML = `<b>${esc(S.players[winner].name)}</b> wins the game!`;
            body.querySelector('#eenyOk').hidden = false;
            timers.push(setTimeout(() => finish('auto'), 3000));
          }
        }, 500 + k * 420)));
      },
    }).then(() => winner);
  }

  async function magicPots(p) {
    const pots = [ri(MIN, MAX), ri(MIN, MAX), ri(MIN, MAX)];
    const L = p.ai ? AI[p.ai] : null;
    const aiPick = () => String(L && chance(L.memory * 0.5) ? pots.indexOf(Math.max(...pots)) : ri(0, 2));
    const potBtns = pots.map((_, k) => `<button type="button" class="pot" data-choice="${k}"><span>🏺</span>Pot ${k + 1}</button>`).join('');
    const choice = Number(await fx(`<div class="fx-ico">✨</div><h2>Magic Pots</h2>
      <div class="fx-text">${esc(p.name)}, pick a pot. Whatever is inside is yours, good or bad.</div>
      <div class="pots">${potBtns}</div>`, { ai: aiPick, aiDelay: 1500, aiOnly: true }));
    const v = pots[choice];
    p.score += v;
    addLog(`${p.name} opened Magic Pot ${choice + 1}: ${signed(v)}.`, p);
    say(`<b>Magic Pots.</b> ${esc(p.name)} opened pot ${choice + 1} and got <b>${signed(v)}</b>.`);
    render();
    const opened = pots.map((x, k) => `<div class="pot open${k === choice ? ' chosen' : ''}"><span>🏺</span>Pot ${k + 1}
      <b class="${x > 0 ? 'pos' : 'neg'}">${signed(x)}</b></div>`).join('');
    await fx(`<div class="fx-ico">✨</div><h2>${signed(v)}!</h2><div class="pots">${opened}</div>${okBtn()}`, { auto: 3000 });
    return 'next';
  }

  function makeProblem() {
    const kind = ri(0, 2);
    let a, b, ans, text;
    if (kind === 0) { a = ri(2, 20); b = ri(2, 20); ans = a + b; text = `${a} + ${b}`; }
    else if (kind === 1) { a = ri(10, 30); b = ri(1, a); ans = a - b; text = `${a} − ${b}`; }
    else { a = ri(2, 9); b = ri(2, 9); ans = a * b; text = `${a} × ${b}`; }
    const opts = new Set([ans]);
    while (opts.size < 4) { const d = ans + ri(-6, 6); if (d >= 0 && d !== ans) opts.add(d); }
    return { text, ans, opts: shuffle([...opts]) };
  }

  async function popQuiz(p) {
    const prize = ri(100, 1000);
    const q = makeProblem();
    const L = p.ai ? AI[p.ai] : null;
    const aiRight = { easy: 0.6, medium: 0.85, hard: 1 }[p.ai] || 0;
    const aiAnswer = () => String(chance(aiRight) ? q.ans : pickOne(q.opts.filter((x) => x !== q.ans)));
    const btns = q.opts.map((x) => `<button type="button" class="quiz-opt" data-choice="${x}">${x}</button>`).join('');
    const got = await fx(`<div class="fx-ico">🧮</div><h2>Pop Quiz!</h2>
      <div class="fx-text">${esc(p.name)}, answer in 5 seconds to win <b>${signed(prize)}</b>.</div>
      <div class="quiz-q">${q.text} = ?</div>
      <div class="quiz-opts">${btns}</div>
      <div class="quiz-timer"><span></span></div>`,
      { auto: QUIZ_MS, ai: aiAnswer, aiDelay: L ? ri(1200, 3800) : 0, aiOnly: true });
    const right = Number(got) === q.ans;
    if (right) p.score += prize;
    addLog(right ? `${p.name} aced the Pop Quiz: ${signed(prize)}.` : `${p.name} missed the Pop Quiz.`, p);
    say(right ? `<b>Pop Quiz:</b> correct! ${esc(p.name)} wins <b>${signed(prize)}</b>.` : `<b>Pop Quiz:</b> no points this turn.`);
    render();
    await announce(right ? '✅' : '❌', right ? 'Correct!' : got === 'auto' ? "Time's up!" : 'Wrong!',
      right ? `${esc(p.name)} wins <b>${signed(prize)}</b>.` : `${q.text} = <b>${q.ans}</b>. No points this turn.`, 2400);
    return 'next';
  }

  async function rickRoll(p) {
    addLog(`${p.name} won $100,000! (Or did they?)`, p);
    await fx(`<div class="fx-ico money">💰</div><h2>CONGRATULATIONS!</h2>
      <div class="fx-text">${esc(p.name)}, you won <b>$100,000</b>!</div>
      <button type="button" class="big-btn claim" data-choice="claim">Claim my $100,000</button>`,
      { ai: () => 'claim', aiDelay: 1600 });
    say(`<b>Rickrolled!</b> There was no $100,000.`);
    await fx(`<h2>You just got Rickrolled!</h2>
      <div class="rick-frame"><iframe src="${RICKROLL_URL}" title="Never Gonna Give You Up"
        allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe></div>
      <p class="fx-small">Video not showing? <a href="${RICKROLL_LINK}" target="_blank" rel="noopener">Watch it here</a>.</p>
      ${okBtn('Never gonna give you up')}`, { cls: 'rick-fx', ai: () => 'ok', aiDelay: 15000 });
    return 'next';
  }

  // Two quick quacks, made with the Web Audio API so no sound file is needed.
  let audio = null;
  function quack() {
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      const t = audio.currentTime;
      [0, 0.34].forEach((d) => {
        const o = audio.createOscillator(), f = audio.createBiquadFilter(), g = audio.createGain();
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(560, t + d);
        o.frequency.exponentialRampToValueAtTime(250, t + d + 0.26);
        f.type = 'bandpass'; f.frequency.value = 1150; f.Q.value = 2.2;
        g.gain.setValueAtTime(0.0001, t + d);
        g.gain.exponentialRampToValueAtTime(0.6, t + d + 0.03);
        g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.3);
        o.connect(f); f.connect(g); g.connect(audio.destination);
        o.start(t + d); o.stop(t + d + 0.32);
      });
    } catch (e) { /* no sound available */ }
  }

  // ---------- spinning wheel (Extra Roll, No One Nose, Trick or Treat) ----------
  const wheel = { rot: 0, speed: 0.012, mode: 'idle', last: 0, from: 0, to: 0, t0: 0, dur: 3200, k: 0, raf: 0,
    segs: [], describe: null, done: null, actor: null };
  const TAU = Math.PI * 2;

  function spinWheel(segs, title, sub, describe, actor = curP()) {
    return new Promise((resolve) => {
      Object.assign(wheel, { segs, describe, done: resolve, actor });
      const btn = $('wheelBtn');
      $('wheelTitle').textContent = title;
      $('wheelSub').textContent = actor.ai ? `${actor.name} is spinning…` : sub;
      btn.textContent = 'Stop';
      btn.disabled = !!actor.ai;
      btn.dataset.mode = 'stop';
      $('wheelModal').hidden = false;
      wheel.mode = 'spinning';
      wheel.last = performance.now();
      cancelAnimationFrame(wheel.raf);
      wheel.raf = requestAnimationFrame(wheelLoop);
      if (actor.ai) setTimeout(stopWheel, ri(900, 1800));
      else btn.focus();
    });
  }

  function stopWheel() {
    if (wheel.mode !== 'spinning') return;
    const seg = TAU / wheel.segs.length;
    wheel.k = ri(0, wheel.segs.length - 1);
    // Pointer is at the top (angle 3π/2). Land the middle of segment k under it.
    const target = 1.5 * Math.PI - (wheel.k + 0.5) * seg + (Math.random() - 0.5) * seg * 0.6;
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
    $('wheelSub').innerHTML = wheel.describe(wheel.k);
    const btn = $('wheelBtn');
    btn.textContent = 'OK';
    btn.dataset.mode = 'done';
    if (wheel.actor.ai) { btn.disabled = true; setTimeout(closeWheel, 1600); return; }
    btn.disabled = false;
    btn.focus();
  }

  function closeWheel() {
    if (wheel.mode !== 'done') return;
    wheel.mode = 'idle';
    $('wheelModal').hidden = true;
    const done = wheel.done;
    wheel.done = null;
    if (done) done(wheel.k);
  }

  function drawWheel() {
    const cv = $('wheelCanvas');
    const dpr = window.devicePixelRatio || 1;
    const size = cv.clientWidth || 300;
    if (cv.width !== Math.round(size * dpr)) { cv.width = Math.round(size * dpr); cv.height = Math.round(size * dpr); }
    const ctx = cv.getContext('2d');
    const r = size / 2;
    const n = wheel.segs.length;
    const seg = TAU / n;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);
    ctx.save();
    ctx.translate(r, r);
    wheel.segs.forEach((s, i) => {
      const a0 = wheel.rot + i * seg, a1 = a0 + seg;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, r - 6, a0, a1);
      ctx.closePath();
      ctx.fillStyle = s.color;
      ctx.fill();
      ctx.strokeStyle = '#1a1230';
      ctx.lineWidth = n > 12 ? 2 : 3;
      ctx.stroke();
      ctx.save();
      ctx.rotate(a0 + seg / 2);
      ctx.fillStyle = '#1a1230';
      const fs = n > 12 ? r * 0.12 : s.label.length > 2 ? r * 0.12 : r * 0.2;
      ctx.font = `${Math.round(fs)}px Bungee, 'Arial Black', sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(s.label, r * (s.label.length > 2 ? 0.64 : 0.74), 0);
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

  // ---------- computer players ----------
  // Chances (0-1) that each level makes a smart move when one is available.
  //  follow: take the next known Cheat Path step when it's on the path
  //  peek:   "sense" a square that lands exactly on 1,000
  //  memory: use what it saw during a Treat Code
  //  hint:   buy a Cheat Code when it can afford one
  //  zero:   zero out to start the Cheat Path (or to escape a negative score)
  //  roll:   buy an Extra Roll
  //  dodge:  steer away from the worst special squares
  const AI = {
    easy:   { label: 'Easy',   follow: 0.3,  peek: 0,    memory: 0,   hint: 0,   zero: 0,   roll: 0.1,  dodge: 0 },
    medium: { label: 'Medium', follow: 0.85, peek: 0.08, memory: 0.6, hint: 0.6, zero: 0.7, roll: 0.12, dodge: 0.3 },
    hard:   { label: 'Hard',   follow: 1,    peek: 0.3,  memory: 1,   hint: 1,   zero: 1,   roll: 1,    dodge: 0.8, rollBeforeZero: true },
  };
  const AVOID = ['zero', 'gift', 'death', 'badluck', 'trick'];
  const AI_DELAY = 950;
  const AI_MAX_ACTIONS = 4;   // shop/zero actions per turn before it has to pick a square
  let aiTimer = null;

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

  const isOpen = (i) => S.board[i].cd === 0 && !S.board[i].gone;

  function closestIdx(score) {
    let best = -1, bestD = Infinity;
    S.board.forEach((t, i) => {
      if (!isOpen(i) || t.sp) return;
      const d = Math.abs(score + t.v - TARGET);
      if (d < bestD) { bestD = d; best = i; }
    });
    return best;
  }

  function randomIdx(dodge) {
    let open = S.board.map((_, i) => i).filter(isOpen);
    if (chance(dodge)) {
      const safer = open.filter((i) => !AVOID.includes(S.board[i].sp));
      if (safer.length) open = safer;
    }
    return pickOne(open);
  }

  function aiTurn() {
    aiTimer = null;
    if (S.phase !== 'play' || S.busy) return;
    const p = curP();
    if (!p.ai) return;
    const L = AI[p.ai];
    const pos = pathPos(p.score);
    const picksLeft = (MAX_ROUNDS - S.round) + 1 + p.extra;   // picks this player still gets, including this one
    const canAct = S.aiActions < AI_MAX_ACTIONS;

    // 1. Next step of the Cheat Path, if it's known and unlocked.
    if (pos >= 0 && pos < S.known && isOpen(S.path[pos]) && chance(L.follow)) return pick(S.path[pos], true);

    // 2. A square that lands exactly on 1,000.
    const exact = S.board.findIndex((t, i) => isOpen(i) && !t.sp && p.score + t.v === TARGET);
    if (exact >= 0 && chance(S.peeked ? L.memory : L.peek)) return pick(exact, true);
    if (S.peeked && chance(L.memory)) { const c = closestIdx(p.score); if (c >= 0) return pick(c, true); }

    if (canAct) {
      S.aiActions++;
      // 3. Escape a negative score.
      if (p.score < 0 && chance(L.zero)) return zeroOut(true);
      // 4. Buy the next Cheat Code (only when not already walking the path).
      if (pos < 0 && S.known < PATH_LEN && p.score >= HINT_COST && chance(L.hint)) return buyHint(true);
      // 5. Extra Roll. Hard only spends on it right before zeroing out, when the points are free.
      const readyToZero = pos < 0 && S.known === PATH_LEN && picksLeft >= PATH_LEN && isOpen(S.path[0]);
      if (!S.aiRolled && p.score >= ROLL_COST && pos < 0 && (L.rollBeforeZero ? readyToZero : true) && chance(L.roll)) {
        S.aiRolled = true;
        return buyRoll(true);
      }
      // 6. Zero out to start the full Cheat Path, if there are enough picks left to finish it.
      if (readyToZero && p.score !== 0 && chance(L.zero)) return zeroOut(true);
    }

    // 7. Otherwise, a random square.
    pick(randomIdx(L.dodge), true);
  }

  // ---------- win screen ----------
  function showWin() {
    const w = S.players[S.winner];
    $('winTitle').textContent = `${w.name} Wins`;
    const rest = S.players.filter((p) => p !== w && !p.out)
      .sort((a, b) => Math.abs(a.score - TARGET) - Math.abs(b.score - TARGET));
    const outs = S.players.filter((p) => p !== w && p.out).sort((a, b) => b.outAt - a.outAt);
    const tied = rest.filter((p) => Math.abs(p.score - TARGET) === Math.abs(w.score - TARGET));
    const why = {
      exact: 'Landed on exactly 1,000 points.',
      rounds: `All ${MAX_ROUNDS} rounds are done, and ${w.name} finished closest to 1,000.` +
        (tied.length ? ` Tied with ${listNames(tied.map((p) => p.name))}; the tie goes to the earlier player.` : ''),
      last: 'Everyone else is out. Last one standing!',
      bonus: 'Rolled the highest number in the Bonus Round.',
      eeny: 'Eeny, meeny, miny, moe picked them!',
    };
    $('winSub').textContent = why[S.endReason] || why.exact;
    const order = [w, ...rest, ...outs];
    const suffix = ['st', 'nd', 'rd', 'th'];
    $('standings').innerHTML =
      `<div class="st-head"><span>Place</span><span>Player</span><span>Score</span></div>` +
      order.map((p, i) => {
        const off = Math.abs(p.score - TARGET);
        const note = p.out ? 'Out (hit Death)' : off === 0 ? 'Exactly 1,000!' : `${num(off)} away from 1,000`;
        return `<div class="st-row${i === 0 ? ' first' : ''}" style="--pc:${p.color};--d:${0.25 + i * 0.18}s">
          <span class="st-place p${i + 1}">${i + 1}<sup>${suffix[i]}</sup></span>
          <span class="st-name">${esc(p.name)}<small>${note}</small></span>
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
      b.addEventListener('click', () => pick(i, false));
      boardEl.appendChild(b);
      squares.push(b);
    }
    const list = $('specList');
    if (list) {
      list.innerHTML = SPECIAL_TYPES.map((k) =>
        `<li><span class="spec-ico">${SPECIALS[k].icon}</span><b>${esc(SPECIALS[k].label)}</b> ${esc(SPECIALS[k].desc)}</li>`).join('');
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
      return `<div class="pcard${i === S.cur ? ' active' : ''}${pl.out ? ' out' : ''}" style="--pc:${pl.color}">
        <div class="pname"><span>${esc(pl.name)}</span>${pl.out ? '<span class="pill out-pill">Out</span>'
          : pl.extra ? `<span class="pill">+${pl.extra} turn${pl.extra > 1 ? 's' : ''}</span>` : ''}</div>
        ${pl.ai ? `<div class="cpu-tag ${pl.ai}">Computer · ${AI[pl.ai].label}</div>` : ''}
        <div class="pscore">${scoreText(pl.score)}</div>
        <div class="pneed${gap === 0 ? ' bang' : ''}">${pl.out ? 'Knocked out by Death' : gap === 0 ? 'Exactly 1,000!' : `Needs ${signed(gap)} to hit 1,000`}</div>
        ${zero}
      </div>`;
    }).join('');

    // banner
    $('turnLabel').style.setProperty('--pc', p.color);
    $('turnLabel').innerHTML = `<span class="dot"></span><span><span class="who">${esc(p.name)}</span>'s turn</span>` +
      (p.extra ? `<span class="pill" style="--pc:${p.color}">${p.extra} extra</span>` : '') +
      (p.ai && S.phase === 'play' ? `<span class="thinking">thinking<i>.</i><i>.</i><i>.</i></span>` : '') +
      `<span class="round${S.round === MAX_ROUNDS ? ' final' : ''}">Round ${Math.max(1, S.round)} of ${MAX_ROUNDS}</span>`;
    $('result').innerHTML = S.result;
    const bar = $('treatBar');
    if (S.reveal && bar.hidden) { bar.hidden = false; bar.innerHTML = '<span></span>'; }
    if (!S.reveal) bar.hidden = true;

    // board
    boardEl.classList.toggle('locked', S.busy || !!p.ai);
    squares.forEach((b, i) => {
      const t = S.board[i], look = S.looks[i];
      const [chip, cd, step] = b.children;
      b.classList.toggle('gone', t.gone);
      if (t.gone) {
        b.style.background = '';
        b.classList.remove('show', 'picked', 'cool', 'on-path');
        b.disabled = true;
        chip.textContent = '';
        cd.textContent = '🦴';
        step.textContent = '';
        b.setAttribute('aria-label', `${coord(i)} chewed up by the dog`);
        b.title = `${coord(i)} · chewed up by the dog`;
        return;
      }
      b.style.background = look.bg;
      const show = S.reveal || S.picked === i;
      const cooling = t.cd > 0 && S.picked !== i;
      const known = t.step >= 0 && t.step < S.known;
      b.classList.toggle('show', show);
      b.classList.toggle('picked', S.picked === i && !S.reveal);
      b.classList.toggle('cool', cooling);
      b.classList.toggle('on-path', known);
      b.disabled = cooling;
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
    const allKnown = S.known >= PATH_LEN;
    $('hintBtn').disabled = !canBuy(HINT_COST) || allKnown;
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
    if ($('wheelBtn').dataset.mode === 'done') closeWheel(); else stopWheel();
  });
  $('againBtn').addEventListener('click', () => startGame(true));
  $('newBtn').addEventListener('click', toSetup);
  $('quitBtn').addEventListener('click', toSetup);
  $('players').addEventListener('click', (e) => { if (e.target.closest('#zeroBtn')) zeroOut(false); });
  function toSetup() {
    const count = S.count;
    S = freshState();
    S.count = count;
    ['winModal', 'wheelModal', 'fx', 'reveal'].forEach((id) => { $(id).hidden = true; });
    render();
  }

  // ---------- boot (keeps a game in progress across page updates when hosted) ----------
  function start(data) {
    buildBoard();
    const ok = data && data.phase && data.phase !== 'setup' && data.players && data.players.length &&
      Array.isArray(data.path) && data.path.length && data.board && data.board.length === N && 'gone' in data.board[0];
    if (ok) {
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

// ---------- install as an app ----------
(() => {
  const box = document.getElementById('installBox');
  const btn = document.getElementById('installBtn');
  const tip = document.getElementById('installTip');
  const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  const hosted = (location.protocol === 'https:' || location.hostname === 'localhost') &&
    !!document.querySelector('link[rel="manifest"]');

  // Offline cache. Only works on a real website (like GitHub Pages), not when opened as a file.
  if (hosted && 'serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
  if (standalone || !hosted) return;

  // Android / Chrome / Edge: offer a real install button.
  let promptEvent = null;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    promptEvent = e;
    box.hidden = false;
    btn.hidden = false;
  });
  btn.addEventListener('click', async () => {
    if (!promptEvent) return;
    promptEvent.prompt();
    await promptEvent.userChoice.catch(() => {});
    promptEvent = null;
    box.hidden = true;
  });
  window.addEventListener('appinstalled', () => { box.hidden = true; });

  // iPhone / iPad Safari has no install button, so explain the Share menu instead.
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (ios) { box.hidden = false; tip.hidden = false; }
})();
