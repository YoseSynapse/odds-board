/* THE ODDS BOARD — live board engine + desk lab + Wall of Sports / Film Room.
   Data honesty rules (non-negotiable):
   - Scores/status come ONLY from the ESPN public feed, rendered with fetch timestamps.
   - Prices shown in lessons are EDUCATIONAL SAMPLES unless the feed itself lists a line,
     in which case the provider is named on screen.
   - A failed feed shows an honest unavailable state. Nothing is ever fabricated. */

/* ===== LEAGUE REGISTRY — live feeds =====
   Verified against site.api.espn.com on Oct 29, 2026 (all returned data; CORS open).
   HOW TO ADD A LEAGUE: add one entry — { id, name, group, path }. It joins the tabs,
   the board, and the refresh cycle automatically. */
var LEAGUES = [
  { id: 'nfl',    name: 'NFL',               group: 'Football',   path: 'football/nfl' },
  { id: 'ncaaf',  name: 'NCAA Football',     group: 'Football',   path: 'football/college-football' },
  { id: 'nba',    name: 'NBA',               group: 'Basketball', path: 'basketball/nba' },
  { id: 'ncaamb', name: 'NCAA Basketball',   group: 'Basketball', path: 'basketball/mens-college-basketball' },
  { id: 'ncaawb', name: 'NCAA Women\'s Basketball', group: 'Basketball', path: 'basketball/womens-college-basketball' },
  { id: 'wnba',   name: 'WNBA',              group: 'Basketball', path: 'basketball/wnba' },
  { id: 'mlb',    name: 'MLB',               group: 'Baseball',   path: 'baseball/mlb' },
  { id: 'nhl',    name: 'NHL',               group: 'Hockey',     path: 'hockey/nhl' },
  { id: 'epl',    name: 'Premier League',    group: 'Soccer',     path: 'soccer/eng.1' },
  { id: 'laliga', name: 'La Liga',           group: 'Soccer',     path: 'soccer/esp.1' },
  { id: 'seriea', name: 'Serie A',           group: 'Soccer',     path: 'soccer/ita.1' },
  { id: 'bundes', name: 'Bundesliga',        group: 'Soccer',     path: 'soccer/ger.1' },
  { id: 'ligue1', name: 'Ligue 1',           group: 'Soccer',     path: 'soccer/fra.1' },
  { id: 'mls',    name: 'MLS',               group: 'Soccer',     path: 'soccer/usa.1' },
  { id: 'ucl',    name: 'Champions League',  group: 'Soccer',     path: 'soccer/uefa.champions' },
  { id: 'intl',   name: 'Internationals',    group: 'Soccer',     path: 'soccer/fifa.friendly' },
  { id: 'atp',    name: 'Tennis · ATP',      group: 'Tennis',     path: 'tennis/atp' },
  { id: 'wta',    name: 'Tennis · WTA',      group: 'Tennis',     path: 'tennis/wta' },
  { id: 'pga',    name: 'PGA Tour Golf',     group: 'Golf',       path: 'golf/pga' },
  { id: 'ufc',    name: 'UFC',               group: 'MMA',        path: 'mma/ufc' },
  { id: 'pfl',    name: 'PFL',               group: 'MMA',        path: 'mma/pfl' },
  { id: 'bell',   name: 'Bellator',          group: 'MMA',        path: 'mma/bellator' },
  { id: 'f1',     name: 'Formula 1',         group: 'Racing',     path: 'racing/f1' },
  { id: 'nascar', name: 'NASCAR Cup',        group: 'Racing',     path: 'racing/nascar-premier' },
  { id: 'indy',   name: 'IndyCar',           group: 'Racing',     path: 'racing/irl' }
];
var GROUPS = ['All', 'Football', 'Basketball', 'Baseball', 'Hockey', 'Soccer', 'Tennis', 'Golf', 'MMA', 'Racing'];

/* ===== WALL OF SPORTS — every sport with a real market =====
   feed: 'live' = public feed wired · 'edu' = education-only (no keyless public feed exists).
   HOW TO ADD A SPORT: add one entry. Markets are the sport's real market types;
   sample numbers inside `body` must be labeled SAMPLE — that rule never bends. */
var SPORTS = [
  { name: 'NFL Football', feed: 'live', markets: ['Moneyline', 'Spread', 'Total', 'Player props', 'Futures'],
    body: 'The board that taught America the language. The spread is the headline price, the total is the second market, and −110 is the shelf price for both. <strong>SAMPLE:</strong> a −3.5 favorite must win by 4+ — win by exactly 3 and the ticket loses; that half-point is called the hook, and it decides more Sundays than any player.' },
  { name: 'College Football', feed: 'live', markets: ['Moneyline', 'Spread', 'Total', 'First-half lines'],
    body: 'Same skeleton as the NFL, wilder numbers: mismatches produce spreads the pros never see. <strong>SAMPLE:</strong> a −28 favorite is priced like a near-certainty — its moneyline might imply 95%+, meaning you risk a lot to win a little. The lesson: big minus prices are rent payments, not jackpots.' },
  { name: 'NBA Basketball', feed: 'live', markets: ['Moneyline', 'Spread', 'Total', 'Quarter lines', 'Player props'],
    body: 'High totals, fast line movement, and back-to-back fatigue baked into prices. <strong>SAMPLE:</strong> a total of 224.5 means the book expects roughly 112 points a side — the .5 guarantees no push. Every NBA price is a pace opinion in disguise.' },
  { name: 'College Basketball', feed: 'live', markets: ['Moneyline', 'Spread', 'Total', 'Futures (March)'],
    body: '300+ teams means softer prices and bigger disagreements between books — the education case for line shopping. March turns futures into the headline market: 68 teams, one board, every price an implied probability you can check with our converter.' },
  { name: 'WNBA', feed: 'live', markets: ['Moneyline', 'Spread', 'Total', 'Player props'],
    body: 'A growing board with the same math as the NBA at smaller totals. Lower scoring means each possession swings the implied probability more — a good league for learning how sensitive a price is to a single run.' },
  { name: 'Baseball · MLB', feed: 'live', markets: ['Moneyline', 'Run line (−1.5)', 'Total (O/U runs)', 'First-five innings'],
    body: 'Baseball barely uses a spread — the moneyline is the main market and the run line (−1.5) is its handicap cousin. <strong>SAMPLE:</strong> a −180 favorite implies 64.3%. Baseball favorites lose constantly; the season is 162 games of implied probability being humbled.' },
  { name: 'Hockey · NHL', feed: 'live', markets: ['Moneyline', 'Puck line (−1.5)', 'Total (O/U goals)', 'Regulation lines'],
    body: 'Low scores make hockey the variance sport: one bounce rewrites a price. The puck line at −1.5 pays plus-money because empty-net math cuts both ways. <strong>SAMPLE:</strong> a 6.5 total in a 3-goal-average league is the book begging for over money — ask why before admiring it.' },
  { name: 'Soccer', feed: 'live', markets: ['1X2 (win/draw/win)', 'Asian handicap', 'Total goals', 'Both teams to score'],
    body: 'Soccer has THREE moneyline outcomes — home, draw, away — so the vig hides across three prices instead of two. <strong>SAMPLE:</strong> home −120, draw +260, away +320 imply about 54% + 28% + 24% = 106%: that 6% overround is the fee, spread wider than the NFL\'s. The Asian handicap exists to delete the draw.' },
  { name: 'Tennis', feed: 'live', markets: ['Match winner', 'Set betting', 'Game handicap', 'Total games'],
    body: 'A two-player moneyline with no team to hide behind — form and surface are the whole handicap. Set betting (2–0 vs 2–1) is a margin market in disguise. <strong>SAMPLE:</strong> a −400 favorite implies 80%: at that price, one bad set is a catastrophe the payout never priced in.' },
  { name: 'Golf', feed: 'live', markets: ['Outright winner', 'Head-to-head', 'Top-5 / Top-10 finish', 'Each-way'],
    body: 'Outrights are the longest prices in sports: a 100+ player field means even the favorite might be +800 — an implied 11%. Head-to-heads are the teaching market: two golfers, one price each, pure probability. Each-way bets split your stake between winning and placing — two bets wearing one coat.' },
  { name: 'MMA', feed: 'live', markets: ['Moneyline', 'Method of victory', 'Round totals', 'Props'],
    body: 'A two-person moneyline where the underdog wins often enough to keep everyone honest. Method markets (KO / submission / decision) are conditional probabilities — you\'re pricing the path, not just the winner. <strong>SAMPLE:</strong> "wins by KO" at +200 inside a −150 moneyline tells you exactly how the book thinks the fight ends.' },
  { name: 'Boxing', feed: 'edu', markets: ['Moneyline', 'Method of victory', 'Round betting', 'Total rounds'],
    body: 'Boxing prices heavy favorites harder than any sport — a −2000 implies 95.2%, and the sport\'s history is a museum of those tickets dying. Method and round markets exist because the moneyline is so often unusable. No keyless public feed exists for boxing scoreboards, so this module is education-only for now — nothing here is a live price.' },
  { name: 'Formula 1', feed: 'live', markets: ['Race winner', 'Podium finish', 'Fastest lap', 'Head-to-head'],
    body: 'A 20-driver outright where qualifying rewrites the board overnight. Podium markets (top 3) are the each-way idea without the split stake. <strong>SAMPLE:</strong> the fastest-lap market prices a one-lap event inside a 60-lap race — the purest probability toy on any board.' },
  { name: 'NASCAR', feed: 'live', markets: ['Race winner', 'Top-3 / Top-10', 'Head-to-head', 'Stage bets'],
    body: '40 cars, one winner, and wrecks as a pricing factor no other sport has. Head-to-heads between two drivers are the classroom market. Superspeedways compress the field so much that the favorite\'s implied probability shrinks — the board literally prices chaos.' },
  { name: 'IndyCar', feed: 'live', markets: ['Race winner', 'Podium', 'Head-to-head'],
    body: 'The oval-versus-road-course split makes IndyCar two pricing sports in one calendar. The Indy 500 outright board is America\'s oldest lesson in long prices: 33 starters, and the favorite rarely implies more than ~20%.' },
  { name: 'Cricket', feed: 'edu', markets: ['Match winner', 'Top batsman', 'Total runs', 'In-play markets'],
    body: 'Cricket is where in-play pricing was perfected — prices move ball by ball, fastest in T20 leagues. Top-batsman markets are outrights in miniature: one winner from 22 players. No keyless public feed covers cricket scoreboards in a CORS-usable way, so the module runs education-only; the math, as ever, is identical.' },
  { name: 'Rugby', feed: 'edu', markets: ['Moneyline', 'Handicap', 'Total points', 'First tryscorer'],
    body: 'Union and league both price like the NFL\'s cousins: a handicap line, a total, and a moneyline — with the draw live often enough to matter in union. First-tryscorer is a first-scorer prop: glamorous price, brutal implied probability. Education-only until a public feed exists.' },
  { name: 'Esports', feed: 'edu', markets: ['Match winner', 'Map handicap', 'Total maps', 'Tournament outrights'],
    body: 'LoL, CS2, and Valorant boards borrow the series language of traditional sports: a best-of series gets a map handicap (−1.5 maps = win 2–0) exactly like a set market in tennis. Young market, fast-moving prices, same vig. Education-only — no keyless public scoreboard feed is CORS-usable today.' },
  { name: 'Darts', feed: 'edu', markets: ['Match winner', 'Set / leg handicaps', '180s markets', 'Checkout props'],
    body: 'The PDC board is a props goldmine: total 180s is a total like any other, priced off a per-leg rate. Leg handicaps teach the cleanest lesson in sports — a short race to a small number makes underdogs live in a way a long match never does. Education-only for now.' },
  { name: 'Table Tennis', feed: 'edu', markets: ['Match winner', 'Game handicap', 'Total points'],
    body: 'The fastest board in the building — matches end in minutes and prices swing per game. It is the purest demonstration that a price is just a probability estimate with a fee: at this speed, you can watch implied probability update rally by rally. Education-only; no public feed.' },
  { name: 'Horse Racing', feed: 'edu', markets: ['Win / Place / Show', 'Exacta', 'Trifecta', 'Daily double'],
    body: 'Racing runs on pari-mutuel pools, not fixed prices: the board is the crowd\'s money, and the track takes its cut (the takeout) before payouts. Win/Place/Show is a finish-position ladder; exotics like exactas and trifectas multiply difficulty exactly like parlays. <strong>SAMPLE:</strong> a 2-1 shot does not "pay double" — it returns $6 on $2, stake included. There is no free public live feed for racing — this module is education-only, with no live prices shown, ever.' },
  { name: 'The Talent Pipeline', feed: 'edu', markets: ['Star ratings', 'Composite rankings', 'Offer sheets', 'Signing classes'],
    body: 'Before a player ever reaches a priced board, they pass through the pipeline: high-school standout, recruiting rankings, offers, a Division 1 roster. A star rating is a probability estimate wearing a different coat — a five-star is the recruiting market saying this athlete most likely becomes a college starter, built from measurables, film, and level of competition, exactly the way a price is built from information. The Prospect Spotlight below is this board\'s outlet for that pipeline: exceptional prospects profiled in one standard format, built the way recruiters scan, so a standout is easier to evaluate and harder to overlook. The bright line, permanent: there is no board for high-school games here and there never will be — minors do not get priced. This module is evaluation, never odds.' }
];

/* ===== Nav + cinematic reveals ===== */
var reduceM = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
(function () {
  var btn = document.getElementById('menuBtn'), links = document.getElementById('navLinks');
  if (btn && links) {
    btn.addEventListener('click', function () {
      var open = links.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    links.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { links.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); });
    });
  }
})();
(function () {
  var els = [].slice.call(document.querySelectorAll('.cine'));
  if (reduceM || !('IntersectionObserver' in window)) { els.forEach(function (e) { e.classList.add('in'); }); return; }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
  }, { threshold: .12 });
  els.forEach(function (e) { io.observe(e); });
})();

/* ===== Shared math ===== */
function impliedProb(odds) {
  if (odds < 0) return Math.abs(odds) / (Math.abs(odds) + 100) * 100;
  return 100 / (odds + 100) * 100;
}
function fmtOdds(odds) { return odds > 0 ? '+' + odds : '−' + Math.abs(odds); }
function parseAmerican(s) {
  if (s == null) return null;
  var v = parseInt(String(s).replace('−', '-'), 10);
  return isNaN(v) || v === 0 ? null : v;
}

/* ===== Desk lab: converter + parlay (carried over, unchanged logic) ===== */
(function () {
  var out = document.getElementById('probOut'), note = document.getElementById('probNote');
  if (!out || !note) return;
  var notes = {
    '-200': 'At −200 you risk $200 to win $100. The price says this side should win two times out of three — anything less and the price was too steep.',
    '-150': 'At −150 the break-even is 60%. Favorites at this price lose more often than casual fans expect — that is exactly why the implied number matters.',
    '-110': 'At −110 you must win 52.4% of the time just to break even. A coin flip wins 50% — that 2.4% gap, charged on both sides, is the vig.',
    '100': 'At +100 (even money) the break-even is exactly 50%. Notice how rarely a real board offers a clean +100 on both sides.',
    '150': 'At +150 you risk $100 to win $150, and the break-even drops to 40%. Underdog prices look generous — the implied number tells you how generous.',
    '250': 'At +250 the break-even is 28.6%. Long prices pay big because they are supposed to miss most of the time. The payout is not the probability.'
  };
  function show(odds) {
    var p = impliedProb(odds);
    out.textContent = p.toFixed(1) + '%';
    note.innerHTML = notes[String(odds)] ||
      ('At <strong>' + fmtOdds(odds) + '</strong> the implied probability — your break-even line — is <strong>' + p.toFixed(1) + '%</strong>. Win more often than that and the price was beatable; win less and the vig did its job.');
  }
  var btns = [].slice.call(document.querySelectorAll('[data-odds]'));
  btns.forEach(function (b) {
    b.addEventListener('click', function () {
      btns.forEach(function (x) { x.classList.remove('active'); });
      b.classList.add('active');
      show(parseInt(b.getAttribute('data-odds'), 10));
    });
  });
  var form = document.getElementById('convForm'), input = document.getElementById('convInput');
  if (form && input) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var val = parseAmerican((input.value || '').trim());
      if (val === null || (val > -100 && val < 100)) {
        note.innerHTML = 'Enter a valid American price: <strong>−100 or lower</strong> (like −110) or <strong>+100 or higher</strong> (like +150). Prices between −99 and +99 do not exist on a real board.';
        out.textContent = '—';
        return;
      }
      btns.forEach(function (x) { x.classList.remove('active'); });
      show(val);
    });
  }
})();
(function () {
  var out = document.getElementById('parlayOut'), note = document.getElementById('parlayNote');
  if (!out || !note) return;
  var dec = 1 + 100 / 110;
  function show(legs) {
    var total = Math.pow(dec, legs);
    var payout = Math.round((total - 1) * 100);
    var fair = Math.pow(0.5, legs) * 100;
    out.textContent = '+' + payout;
    note.innerHTML = legs + (legs === 1 ? ' leg' : ' legs') + ' at −110 pay' + (legs === 1 ? 's' : '') +
      ' about <strong>+' + payout + '</strong> — but at fair coin-flip odds all ' + legs +
      (legs === 1 ? ' hits ' : ' hit just ') + '<strong>' + fair.toFixed(1) + '%</strong> of the time. The payout multiplies. So does the vig.';
  }
  var btns = [].slice.call(document.querySelectorAll('[data-legs]'));
  btns.forEach(function (b) {
    b.addEventListener('click', function () {
      btns.forEach(function (x) { x.classList.remove('active'); });
      b.classList.add('active');
      show(parseInt(b.getAttribute('data-legs'), 10));
    });
  });
})();

/* ===== LIVE BOARD ENGINE ===== */
var boardState = { group: 'All', cache: {}, lastOk: null };
var API = 'https://site.api.espn.com/apis/site/v2/sports/';

function leaguesFor(group) {
  return LEAGUES.filter(function (l) { return group === 'All' || l.group === group; });
}
function fetchLeague(l) {
  return fetch(API + l.path + '/scoreboard', { cache: 'no-store' })
    .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(function (d) { return { ok: true, events: d.events || [], at: new Date() }; })
    .catch(function () { return { ok: false, events: [], at: new Date() }; });
}
function normEvent(ev, league) {
  try {
    var comp = (ev.competitions && ev.competitions[0]) || {};
    var st = (ev.status && ev.status.type) || {};
    var cs = comp.competitors || [];
    var home = null, away = null;
    cs.forEach(function (c) {
      if (c.homeAway === 'home') home = c; else if (c.homeAway === 'away') away = c;
    });
    var odds = null;
    if (comp.odds && comp.odds[0]) {
      var o = comp.odds[0];
      odds = {
        details: o.details || null,
        overUnder: (o.overUnder != null ? o.overUnder : null),
        provider: (o.provider && o.provider.name) || 'feed',
        homeML: parseAmerican(o.homeTeamOdds && o.homeTeamOdds.summary),
        awayML: parseAmerican(o.awayTeamOdds && o.awayTeamOdds.summary)
      };
    }
    function side(c) {
      if (!c) return null;
      return {
        name: (c.team && (c.team.displayName || c.team.shortDisplayName)) || c.displayName || '—',
        score: (c.score != null && c.score !== '') ? String(c.score) : null,
        record: (c.records && c.records[0] && c.records[0].summary) || null,
        winner: !!c.winner
      };
    }
    return {
      id: ev.id, league: league, name: ev.name || '',
      state: st.state || 'pre',
      detail: st.detail || st.shortDetail || '',
      date: ev.date || null,
      isPair: !!(home && away),
      home: side(home), away: side(away),
      field: cs.slice(0, 6).map(function (c) {
        return { name: (c.athlete && c.athlete.displayName) || (c.team && c.team.displayName) || c.displayName || '—',
                 score: (c.score != null && c.score !== '') ? String(c.score) : null };
      }),
      odds: odds
    };
  } catch (e) { return null; }
}
function phaseLabel(state, group) {
  if (state === 'in') return 'Live now';
  if (state === 'post') return group === 'Soccer' ? 'Full-time' : 'Final';
  return 'Upcoming';
}
function el(tag, cls, text) {
  var n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}
function gameCard(g) {
  var card = document.createElement(g.isPair ? 'button' : 'div');
  card.className = 'game-card';
  if (g.isPair) card.type = 'button';
  var top = el('div', 'game-top');
  var status = el('span', 'game-status' + (g.state === 'in' ? ' live' : g.state === 'post' ? ' final' : ''));
  if (g.state === 'in') { var d = el('span', 'live-dot'); d.setAttribute('aria-hidden', 'true'); status.appendChild(d); }
  var label = g.state === 'in' ? (g.detail || 'LIVE') :
              g.state === 'post' ? phaseLabel('post', g.league.group).toUpperCase() :
              (g.date ? new Date(g.date).toLocaleString([], { weekday: 'short', hour: 'numeric', minute: '2-digit' }) : 'Scheduled');
  status.appendChild(document.createTextNode(label));
  top.appendChild(status);
  top.appendChild(el('span', 'game-status', g.league.name));
  card.appendChild(top);
  if (g.isPair) {
    var tape = el('div', 'tape');
    [g.away, g.home].forEach(function (s, idx) {
      if (!s) return;
      var row = el('div', 'tape-row' + (g.state === 'post' && s.winner ? ' winner' : ''));
      var nm = el('span', 'tape-name', s.name + (idx === 1 ? '' : ''));
      if (s.record) nm.appendChild(el('span', 'tape-rec', s.record));
      row.appendChild(nm);
      row.appendChild(el('span', 'tape-score', s.score != null ? s.score : '—'));
      tape.appendChild(row);
      if (idx === 0) { var vs = el('div', 'tape-vs'); vs.appendChild(document.createTextNode('VS')); tape.appendChild(vs); }
    });
    card.appendChild(tape);
    var note = el('p', 'game-note');
    note.innerHTML = 'Tap for the breakdown — <span class="open-hint">Read This Game →</span>';
    card.appendChild(note);
    card.addEventListener('click', function () { openReadGame(g); });
  } else {
    card.appendChild(el('p', 'tape-name', g.name));
    g.field.forEach(function (f) {
      var row = el('div', 'tape-row');
      row.appendChild(el('span', 'tape-name', f.name));
      row.appendChild(el('span', 'tape-score', f.score != null ? f.score : ''));
      card.appendChild(row);
    });
  }
  return card;
}
function renderBoard() {
  var root = document.getElementById('boardRoot');
  root.innerHTML = '';
  leaguesFor(boardState.group).forEach(function (l) {
    var c = boardState.cache[l.id];
    var block = el('div', 'league-block');
    var head = el('div', 'league-head');
    head.appendChild(el('h3', null, l.name));
    var state = el('span', 'league-state');
    if (!c) state.textContent = 'Loading…';
    else if (c.ok) state.textContent = 'Feed OK · ' + c.at.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' });
    else if (c.stale) { state.textContent = 'Refresh failed — showing last confirmed board · ' + c.at.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }); state.classList.add('err'); }
    else { state.textContent = 'Live feed unavailable right now'; state.classList.add('err'); }
    head.appendChild(state);
    block.appendChild(head);
    if (c && c.ok) {
      var games = c.events.map(function (ev) { return normEvent(ev, l); }).filter(Boolean);
      if (!games.length) {
        block.appendChild(el('div', 'empty-note', 'No games on the board today for ' + l.name + '. The Film Room segment below still teaches this board.'));
      } else {
        ['in', 'pre', 'post'].forEach(function (ph) {
          var gs = games.filter(function (g) { return g.state === ph; });
          if (!gs.length) return;
          block.appendChild(el('p', 'phase-label' + (ph === 'in' ? ' live' : ''), ph === 'in' ? '● Live now' : ph === 'pre' ? 'Upcoming' : phaseLabel('post', l.group)));
          var grid = el('div', 'game-grid');
          gs.forEach(function (g) { grid.appendChild(gameCard(g)); });
          block.appendChild(grid);
        });
      }
    } else if (c && c.stale) {
      block.appendChild(el('div', 'empty-note', 'The ' + l.name + ' feed did not answer on the last refresh. Last confirmed board shown above its timestamp — we never fill gaps with guesses.'));
      renderStaleGames(block, c, l);
    } else if (c) {
      block.appendChild(el('div', 'empty-note', 'Live feed unavailable right now for ' + l.name + ' — scores are never faked here. The education on this page, including the ' + l.name + ' Film Room segment, still works.'));
    }
    root.appendChild(block);
  });
}
function renderStaleGames(block, c, l) {
  var games = c.events.map(function (ev) { return normEvent(ev, l); }).filter(Boolean);
  if (!games.length) return;
  var grid = el('div', 'game-grid');
  games.forEach(function (g) { grid.appendChild(gameCard(g)); });
  block.appendChild(grid);
}
function updateStamp(anyOk, anyStale) {
  var s = document.getElementById('boardStamp');
  if (!s) return;
  s.classList.toggle('stale', !!anyStale);
  if (boardState.lastOk) {
    s.textContent = (anyStale ? 'Partial refresh — last full update ' : 'Last updated ') +
      boardState.lastOk.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' }) +
      ' · auto-refresh 60s · Source: ESPN public feed';
  } else {
    s.textContent = 'Live feed unavailable right now — education below still works.';
  }
}
function loadBoard() {
  var ls = leaguesFor(boardState.group);
  var anyStale = false;
  Promise.all(ls.map(function (l) {
    return fetchLeague(l).then(function (res) {
      if (res.ok) { boardState.cache[l.id] = res; boardState.lastOk = res.at; }
      else {
        var prev = boardState.cache[l.id];
        if (prev && prev.ok) { prev.stale = true; anyStale = true; }
        else boardState.cache[l.id] = res;
      }
    });
  })).then(function () {
    var anyOk = ls.some(function (l) { var c = boardState.cache[l.id]; return c && c.ok; });
    renderBoard();
    updateStamp(anyOk, anyStale);
  });
}
(function () {
  var tabs = document.getElementById('leagueTabs');
  if (!tabs) return;
  GROUPS.forEach(function (g) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'ltab' + (g === 'All' ? ' active' : '');
    b.textContent = g; b.setAttribute('aria-pressed', g === 'All' ? 'true' : 'false');
    b.addEventListener('click', function () {
      boardState.group = g;
      tabs.querySelectorAll('.ltab').forEach(function (x) { x.classList.remove('active'); x.setAttribute('aria-pressed', 'false'); });
      b.classList.add('active'); b.setAttribute('aria-pressed', 'true');
      renderBoard(); loadBoard();
    });
    tabs.appendChild(b);
  });
  document.getElementById('refreshBtn').addEventListener('click', loadBoard);
  renderBoard(); loadBoard();
  setInterval(function () { if (!document.hidden) loadBoard(); }, 60000);
})();

/* ===== READ THIS GAME ===== */
function openReadGame(g) {
  var panel = document.getElementById('readGame');
  if (!panel || !g.isPair) return;
  var home = g.home, away = g.away;
  document.getElementById('rgTitle').textContent = away.name + ' at ' + home.name + ' — ' + g.league.name;
  var hasLine = g.odds && (g.odds.homeML != null || g.odds.details || g.odds.overUnder != null);
  var src = document.getElementById('rgSource');
  var unit = g.league.group === 'Soccer' || g.league.group === 'Hockey' ? 'goals' : g.league.group === 'Baseball' ? 'runs' : 'points';
  var mlH, mlA, mlNote;
  if (hasLine && g.odds.homeML != null && g.odds.awayML != null) {
    mlH = g.odds.homeML; mlA = g.odds.awayML;
    src.textContent = 'Line listed in the ESPN feed · provider: ' + g.odds.provider + ' · shown for education, exactly as the feed lists it.';
    mlNote = 'These are the feed\'s real listed prices.';
  } else {
    mlH = -150; mlA = 130;
    src.textContent = 'The feed lists no line for this game — every price in this breakdown is an EDUCATIONAL SAMPLE, labeled as such.';
    mlNote = 'Sample prices, using this matchup\'s teams.';
  }
  var favIsHome = mlH <= mlA;
  var fav = favIsHome ? home : away, dog = favIsHome ? away : home;
  var favML = favIsHome ? mlH : mlA, dogML = favIsHome ? mlA : mlH;
  document.getElementById('rgMl').innerHTML =
    '<strong>' + fav.name + '</strong> is the favorite at <strong>' + fmtOdds(favML) + '</strong> — an implied probability of <strong>' +
    impliedProb(favML).toFixed(1) + '%</strong>. <strong>' + dog.name + '</strong> is the underdog at <strong>' + fmtOdds(dogML) +
    '</strong> (' + impliedProb(dogML).toFixed(1) + '%). Add the two implied numbers: they exceed 100%. The excess is the vig — the book\'s fee, visible if you do the arithmetic. ' + mlNote;
  var spreadTxt;
  if (hasLine && g.odds.details) {
    spreadTxt = 'The feed lists the spread as <strong>' + g.odds.details + '</strong>. Read it as: the favorite must win by more than that margin for a spread ticket to cash; the underdog can lose by less — or win outright. The spread is not a prediction of the score. It is a price set to split the action.';
  } else {
    spreadTxt = '<strong>SAMPLE:</strong> if ' + fav.name + ' were listed at <strong>−3.5</strong>, they would need to win by 4 or more ' + unit + ' to cover. ' + dog.name + ' at +3.5 cashes on a win or a loss by 3 or fewer. That half-point — the hook — exists so the ticket can never push.';
  }
  document.getElementById('rgSpread').innerHTML = spreadTxt;
  var totalTxt;
  if (hasLine && g.odds.overUnder != null) {
    totalTxt = 'The feed lists the total at <strong>' + g.odds.overUnder + '</strong>. One number, two opinions: over means the combined ' + unit + ' beat it, under means they don\'t. The total is the book pricing the game\'s pace, not its winner.';
  } else {
    var sampleTotal = g.league.group === 'Basketball' ? '224.5' : g.league.group === 'Baseball' ? '8.5' : g.league.group === 'Soccer' ? '2.5' : g.league.group === 'Hockey' ? '6.5' : '47.5';
    totalTxt = '<strong>SAMPLE:</strong> if the total were <strong>' + sampleTotal + '</strong>, the bet is on combined ' + unit + ' — over or under that line, regardless of who wins. It is the one mainstream market where your team can lose and your ticket still cashes.';
  }
  document.getElementById('rgTotal').innerHTML = totalTxt;
  panel.hidden = false;
  var steps = panel.querySelectorAll('.rg-step');
  steps.forEach(function (s) { s.classList.remove('on'); });
  steps.forEach(function (s, i) {
    if (reduceM) { s.classList.add('on'); return; }
    setTimeout(function () { s.classList.add('on'); }, 160 * (i + 1));
  });
  panel.scrollIntoView({ behavior: reduceM ? 'auto' : 'smooth', block: 'nearest' });
}
(function () {
  var close = document.getElementById('rgClose');
  if (close) close.addEventListener('click', function () { document.getElementById('readGame').hidden = true; });
})();

/* ===== WALL OF SPORTS + FILM ROOM ===== */
(function () {
  var grid = document.getElementById('wallGrid');
  if (!grid) return;
  var file = document.getElementById('frFile'), title = document.getElementById('frTitle'),
      feed = document.getElementById('frFeed'), body = document.getElementById('frBody'),
      markets = document.getElementById('frMarkets');
  function select(i) {
    var s = SPORTS[i];
    file.textContent = 'FILM ROOM · SEGMENT ' + String(i + 1).padStart(2, '0') + ' / ' + SPORTS.length;
    title.textContent = s.name;
    feed.textContent = s.feed === 'live'
      ? 'Coverage: LIVE BOARD — this sport\'s scores run on the live board above (ESPN public feed).'
      : 'Coverage: EDUCATION MODULE — no keyless public live feed exists for this sport; nothing here is presented as a live price.';
    body.innerHTML = s.body;
    markets.innerHTML = '';
    s.markets.forEach(function (m) { markets.appendChild(el('span', null, m)); });
    grid.querySelectorAll('.tile').forEach(function (t, j) {
      t.classList.toggle('active', j === i);
      t.setAttribute('aria-pressed', j === i ? 'true' : 'false');
    });
  }
  SPORTS.forEach(function (s, i) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'tile'; b.setAttribute('aria-pressed', 'false');
    var nm = el('span', 'tile-name', s.name);
    var badge = el('span', 'tile-badge ' + (s.feed === 'live' ? 'badge-live' : 'badge-edu'), s.feed === 'live' ? '● LIVE FEED' : 'EDUCATION MODULE');
    b.appendChild(nm); b.appendChild(badge);
    b.addEventListener('click', function () {
      select(i);
      document.querySelector('.filmroom').scrollIntoView({ behavior: reduceM ? 'auto' : 'smooth', block: 'nearest' });
    });
    grid.appendChild(b);
  });
})();

/* Brand banner parallax — the banner leans toward the visitor pointer. */
(function () {
  var strip = document.querySelector(".banner-strip");
  if (!strip) return;
  var img = strip.querySelector(".banner-img");
  if (!img) return;
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  strip.addEventListener("pointerenter", function () { img.style.animation = "none"; });
  strip.addEventListener("pointermove", function (e) {
    var r = strip.getBoundingClientRect();
    var x = (e.clientX - r.left) / r.width - 0.5;
    var y = (e.clientY - r.top) / r.height - 0.5;
    img.style.transform = "scale(1.1) translate(" + (x * -16) + "px," + (y * -10) + "px)";
  });
  strip.addEventListener("pointerleave", function () { img.style.transform = ""; img.style.animation = ""; });
})();

/* Merch view toggle — flip a garment card between its front and back print. */
(function () {
  document.querySelectorAll(".view-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var card = btn.closest("article");
      if (!card) return;
      var front = card.querySelector(".view-front");
      var back = card.querySelector(".view-back");
      if (!back) return;
      var showBack = btn.getAttribute("data-view") === "back";
      if (front) front.hidden = showBack;
      back.hidden = !showBack;
      card.querySelectorAll(".view-btn").forEach(function (b) { b.classList.toggle("on", b === btn); });
    });
  });
})();

/* Highlight voting — one pick per showcase, saved on this device (localStorage). */
(function () {
  var wall = document.getElementById("highlights");
  if (!wall) return;
  var KEY = "ob-highlight-vote";
  var btns = Array.prototype.slice.call(wall.querySelectorAll(".vote-btn:not([disabled])"));
  function paint(pick) {
    btns.forEach(function (b) {
      var mine = b.getAttribute("data-vote") === pick;
      b.classList.toggle("on", mine);
      b.setAttribute("aria-pressed", mine ? "true" : "false");
      var st = b.parentNode.querySelector(".vote-state");
      if (st) st.textContent = mine ? "Your vote" : "";
    });
  }
  var saved = null;
  try { saved = window.localStorage.getItem(KEY); } catch (e) { saved = null; }
  if (saved) paint(saved);
  btns.forEach(function (b) {
    b.addEventListener("click", function () {
      var pick = b.getAttribute("data-vote");
      var current = null;
      try { current = window.localStorage.getItem(KEY); } catch (e) { current = null; }
      var next = current === pick ? null : pick;
      try {
        if (next) window.localStorage.setItem(KEY, next); else window.localStorage.removeItem(KEY);
      } catch (e) { /* storage unavailable: the pick still paints for this visit */ }
      paint(next);
    });
  });
})();

/* Desk Log sport filter — chips narrow the moves list; the awards table stays put. */
(function () {
  var chips = Array.prototype.slice.call(document.querySelectorAll(".log-chip"));
  if (!chips.length) return;
  var entries = Array.prototype.slice.call(document.querySelectorAll(".log-entry"));
  var empty = document.querySelector(".log-empty");
  chips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      var f = chip.getAttribute("data-filter");
      chips.forEach(function (c) {
        var on = c === chip;
        c.classList.toggle("on", on);
        c.setAttribute("aria-pressed", on ? "true" : "false");
      });
      var visible = 0;
      entries.forEach(function (e) {
        var show = f === "all" || e.getAttribute("data-sport") === f;
        e.style.display = show ? "" : "none";
        if (show) visible++;
      });
      if (empty) empty.hidden = visible !== 0;
    });
  });
})();

