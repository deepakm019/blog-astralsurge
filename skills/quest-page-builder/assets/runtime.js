
(function(){
/*__DATA__*/
  function blank(){
    return {xp:0, read:{}, answered:{}, attempted:{}, realms:{}, bosses:{}, badges:{}, stats:{tries:0, right:0}, daily:{day:'', done:false, ok:false, streak:0, last:''}};
  }
  var S;
  function load(){ try{ var s = JSON.parse(localStorage.getItem(KEY)); return s ? Object.assign(blank(), s) : blank(); }catch(e){ return blank(); } }
  function save(){ try{ localStorage.setItem(KEY, JSON.stringify(S)); }catch(e){} }
  S = load();

  var msg = '';
  var tmp = {};

  function esc(s){ return String(s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function dayKey(d){ d = d || new Date(); return d.getFullYear() + '-' + (d.getMonth()+1) + '-' + d.getDate(); }
  function hashStr(s){ var h = 0; for(var i=0;i<s.length;i++){ h = (h*31 + s.charCodeAt(i)) >>> 0; } return h; }
  function levelOf(xp){ return Math.floor(xp/100) + 1; }
  function levelTitle(lvl){ return TITLES[Math.min(lvl-1, TITLES.length-1)]; }
  function gain(n){ S.xp += n; }
  function correctCount(){ return Object.keys(S.answered).filter(function(k){ return S.answered[k] && S.answered[k].ok; }).length; }
  function realmById(id){ for(var i=0;i<REALMS.length;i++){ if(REALMS[i].id===id) return REALMS[i]; } return null; }
  function realmQs(r){ return QS.filter(function(q){ return q.realm===r.id; }); }
  function readDone(r){ return r.sections.every(function(id){ return !!S.read[id]; }); }
  function qsDone(r){ return realmQs(r).every(function(q){ return S.answered[q.id] && S.answered[q.id].ok; }); }
  function cleared(r){ return readDone(r) && qsDone(r); }
  function todayQ(){ return QS[hashStr(dayKey()) % QS.length]; }

  function checkRealms(){
    REALMS.forEach(function(r){
      if(cleared(r) && !S.realms[r.id]){ S.realms[r.id] = true; gain(R.realm); msg = 'Realm cleared: ' + r.name + '. +' + R.realm + ' XP'; }
    });
  }
  function badgeList(){
    var list = [
      {id:'first', name:'First Step', how:'Read or answer anything', on: Object.keys(S.read).length + Object.keys(S.answered).length > 0},
      {id:'sharp', name:'Sharp Eye', how:'Get 10 quiz answers right', on: correctCount() >= 10},
      {id:'streak', name:'On a Roll', how:'Reach a 3-day streak', on: S.daily.streak >= 3}
    ];
    REALMS.forEach(function(r){
      list.push({id:'realm-'+r.id, name:'Realm Clear: '+r.name, how:'Read every section and answer every question in '+r.name, on: !!S.realms[r.id]});
      list.push({id:'boss-'+r.id, name:'Boss Slain: '+r.boss.name, how:'Defeat the '+r.name+' boss', on: !!S.bosses[r.id]});
    });
    return list;
  }
  function checkBadges(){
    badgeList().forEach(function(b){
      if(b.on && !S.badges[b.id]){ S.badges[b.id] = true; msg = 'Badge unlocked: ' + b.name; }
    });
  }

  function markRead(id){
    if(S.read[id]) return;
    S.read[id] = true; gain(R.concept); msg = 'Section read. +' + R.concept + ' XP';
    checkRealms(); checkBadges(); save(); refresh();
  }

  function answerQuestion(qid, i){
    var q = null;
    for(var k=0;k<QS.length;k++){ if(QS[k].id===qid){ q = QS[k]; break; } }
    if(!q) return;
    var prev = S.answered[qid];
    if(prev && prev.ok) return;
    S.stats.tries++;
    if(i === q.a){
      S.stats.right++;
      S.answered[qid] = {ok:true}; gain(R.correct); msg = 'Correct. +' + R.correct + ' XP';
      tmp[qid] = {ok:true};
    } else {
      if(!S.attempted[qid]){ S.attempted[qid] = true; gain(R.wrong); }
      tmp[qid] = {ok:false, pick:i};
      msg = 'Not quite. Try another option.';
    }
    checkRealms(); checkBadges(); save(); refresh();
  }

  function answerDaily(i){
    var t = dayKey(), d = S.daily;
    if(d.day === t && d.done) return;
    var q = todayQ();
    var ok = i === q.a;
    var y = dayKey(new Date(Date.now() - 86400000));
    if(d.last !== t){ d.streak = (d.last === y) ? d.streak + 1 : 1; d.last = t; }
    d.day = t; d.done = true; d.ok = ok;
    S.stats.tries++; if(ok) S.stats.right++;
    gain(R.daily + (ok ? R.dailyCorrect : 0));
    if(ok){ S.answered[q.id] = {ok:true}; tmp[q.id] = {ok:true}; msg = 'Daily answered correctly. +' + (R.daily + R.dailyCorrect) + ' XP'; }
    else { tmp[q.id] = {ok:false, pick:i}; msg = 'Daily answered. +' + R.daily + ' XP. Try again tomorrow for the bonus.'; }
    checkRealms(); checkBadges(); save(); refresh();
  }

  function answerBoss(realmId, i){
    var r = realmById(realmId);
    if(!r || S.bosses[r.id] || !cleared(r)) return;
    if(i === r.boss.a){
      S.bosses[r.id] = true; gain(R.boss); msg = 'Boss defeated: ' + r.boss.name + '. +' + R.boss + ' XP';
      checkBadges(); save(); refresh();
    } else {
      tmp['boss-'+r.id] = {ok:false, pick:i}; msg = 'Not quite. The boss is still standing.';
      refresh();
    }
  }

  function renderSummary(){
    var lvl = levelOf(S.xp);
    var totalItems = REALMS.reduce(function(n,r){ return n + r.sections.length; }, 0) + QS.length;
    var doneItems = Object.keys(S.read).length + Object.keys(S.answered).length;
    var pct = Math.round(100 * doneItems / totalItems);
    return '<div class="agx-q"><div class="agx-kicker" style="font-family:var(--mono);font-size:.78rem;text-transform:uppercase;letter-spacing:.1em;color:var(--accent)">Your progress · ' + esc(levelTitle(lvl)) + '</div>' +
      '<h3 style="margin:.3em 0 0;color:var(--text)">Level ' + lvl + ' · ' + S.xp + ' XP · ' + S.daily.streak + '-day streak</h3>' +
      '<div class="agx-bar"><span style="width:' + (S.xp % 100) + '%"></span></div>' +
      '<p class="agx-note" style="margin:8px 0 0">' + (100 - (S.xp % 100)) + ' XP to level ' + (lvl + 1) + '. ' + pct + '% of the material covered.</p>' +
      '<div class="agx-grid" style="margin-top:12px">' +
        '<div class="agx-stat"><span class="agx-note">Sections read</span><b>' + Object.keys(S.read).length + ' / ' + REALMS.reduce(function(n,r){ return n + r.sections.length; }, 0) + '</b></div>' +
        '<div class="agx-stat"><span class="agx-note">Quiz accuracy</span><b>' + (S.stats.tries ? Math.round(100 * S.stats.right / S.stats.tries) : 0) + '%</b></div>' +
        '<div class="agx-stat"><span class="agx-note">Questions answered</span><b>' + correctCount() + ' / ' + QS.length + '</b></div>' +
      '</div>' +
    '</div>';
  }

  function renderDaily(){
    var t = dayKey(), d = S.daily, q = todayQ();
    var done = d.day === t && d.done;
    var st = tmp[q.id];
    var body = '<div class="agx-q"><div class="agx-note">Daily question · +' + (R.daily + R.dailyCorrect) + ' XP if correct · ' + d.streak + '-day streak</div>' +
      '<p style="margin:8px 0 4px;color:var(--text)"><b>' + esc(q.q) + '</b></p>';
    body += q.o.map(function(text, i){
      var cls = 'agx-opt';
      if(done){ if(i === q.a) cls += ' right'; else if(d.ok === false && st && st.pick === i) cls += ' wrong'; }
      else if(st && st.pick === i && !st.ok) cls += ' wrong';
      return '<button class="' + cls + '" data-daily="1" data-i="' + i + '"' + (done ? ' disabled' : '') + '>' + esc(text) + '</button>';
    }).join('');
    if(done){ body += '<p class="agx-note" style="margin-top:8px">' + (d.ok ? 'Answered correctly today.' : 'Answered today. Come back tomorrow for a new question.') + ' ' + esc(q.ex) + '</p>'; }
    return body + '</div>';
  }

  function renderRealms(){
    return REALMS.map(function(r){
      var rs = r.sections.filter(function(id){ return !!S.read[id]; }).length;
      var qs = realmQs(r);
      var okQ = qs.filter(function(q){ return S.answered[q.id] && S.answered[q.id].ok; }).length;
      var head = '<div class="agx-q"><span class="agx-note" style="font-family:var(--mono);text-transform:uppercase;font-size:.78rem;letter-spacing:.08em">Realm</span>' +
        '<h3 style="margin:.2em 0 0;color:var(--text)">' + esc(r.name) + '</h3>' +
        '<p class="agx-note" style="margin:6px 0 0">' + rs + ' of ' + r.sections.length + ' sections read · ' + okQ + ' of ' + qs.length + ' questions correct · ' + (S.realms[r.id] ? 'cleared' : 'in progress') + '</p>';
      head += qs.map(function(q){
        var st = tmp[q.id], answered = S.answered[q.id] && S.answered[q.id].ok;
        var out = q.o.map(function(text, i){
          var cls = 'agx-opt';
          if(answered){ if(i === q.a) cls += ' right'; }
          else if(st && st.pick === i && !st.ok) cls += ' wrong';
          return '<button class="' + cls + '" data-q="' + q.id + '" data-i="' + i + '"' + (answered ? ' disabled' : '') + '>' + esc(text) + '</button>';
        }).join('');
        return '<p style="margin:14px 0 2px;color:var(--text)"><b>' + esc(q.q) + '</b></p>' + out + (answered ? '<p class="agx-note" style="margin:6px 0 0">' + esc(q.ex) + '</p>' : '');
      }).join('');
      if(cleared(r)){
        if(S.bosses[r.id]){
          head += '<div class="agx-q agx-boss" style="margin-top:16px"><span class="agx-note">Realm boss</span><h3 style="margin:.2em 0 0;color:var(--text)">' + esc(r.boss.name) + ': defeated</h3><p class="agx-note" style="margin:6px 0 0">' + esc(r.boss.ex) + '</p></div>';
        } else {
          var bst = tmp['boss-'+r.id];
          head += '<div class="agx-q agx-boss" style="margin-top:16px"><span class="agx-note">Realm boss · +' + R.boss + ' XP</span><h3 style="margin:.2em 0 0;color:var(--text)">' + esc(r.boss.name) + '</h3><p style="margin:8px 0 2px;color:var(--text)">' + esc(r.boss.q) + '</p>' +
            r.boss.o.map(function(text, i){
              var cls = 'agx-opt' + (bst && bst.pick === i ? ' wrong' : '');
              return '<button class="' + cls + '" data-boss="' + r.id + '" data-i="' + i + '">' + esc(text) + '</button>';
            }).join('') + '</div>';
        }
      } else {
        head += '<p class="agx-note" style="margin-top:14px">Boss locked. Read every section and answer every question to face ' + esc(r.boss.name) + '.</p>';
      }
      return head + '</div>';
    }).join('');
  }

  function renderBadges(){
    return '<h3 style="margin:22px 0 10px;color:var(--text)">Badges</h3><div class="agx-grid">' +
      badgeList().map(function(b){
        return '<div class="agx-badge ' + (b.on ? 'on' : '') + '"><b style="color:var(--text)">' + esc(b.name) + '</b><div class="agx-note" style="font-size:.85rem;margin-top:4px">' + (b.on ? 'Unlocked' : esc(b.how)) + '</div></div>';
      }).join('') + '</div>';
  }

  var root = document.getElementById('agx');
  var body = document.getElementById('agx-body');
  var reader = document.getElementById('agx-reader');
  var pager = document.getElementById('agx-pager');
  var chapterGrid = document.getElementById('agx-chapters');
  var diagramGrid = document.getElementById('agx-diagrams');
  var practiceEl = document.getElementById('agx-practice');
  var progressEl = document.getElementById('agx-progress');
  if(!root || !body || !reader) return;

  var chapters = [];
  var current = 0;
  var tab = 'read';

  function realmOf(id){
    for(var i = 0; i < REALMS.length; i++){ if(REALMS[i].sections.indexOf(id) !== -1) return REALMS[i]; }
    return null;
  }

  function msgHtml(){ return msg ? '<p class="agx-msg" role="status">' + esc(msg) + '</p>' : ''; }

  function buildChapters(){
    var cur = null;
    Array.prototype.slice.call(body.children).forEach(function(el){
      if(el.tagName === 'H2'){
        cur = {id: el.id, title: el.textContent.replace(/^[0-9]+\.\s*/, ''), nodes: [], realm: realmOf(el.id), box: null};
        chapters.push(cur);
      }
      if(cur) cur.nodes.push(el);
    });
    chapters.forEach(function(c){
      if(c.realm){
        var box = document.createElement('div');
        box.className = 'agx-readbox';
        box.innerHTML = '<button class="agx-btn" data-read="' + c.id + '"></button><span class="agx-note">Realm: ' + esc(c.realm.name) + '</span>';
        c.box = box;
      }
    });
    body.innerHTML = '';
  }

  function buildDiagrams(){
    diagramGrid.innerHTML = '';
    var count = 0;
    chapters.forEach(function(c){
      c.nodes.forEach(function(n){
        if(!n.querySelectorAll) return;
        var list = [];
        if(n.classList && n.classList.contains('figure')) list.push(n);
        Array.prototype.slice.call(n.querySelectorAll('.figure')).forEach(function(f){ list.push(f); });
        list.forEach(function(f){
          var card = document.createElement('div');
          card.className = 'agx-q agx-diag';
          card.innerHTML = '<span class="agx-note">' + esc(c.title) + '</span>';
          card.appendChild(f.cloneNode(true));
          diagramGrid.appendChild(card);
          count++;
        });
      });
    });
    if(!count){ diagramGrid.innerHTML = '<p class="agx-note">No diagrams found.</p>'; }
  }

  function updateReadButtons(){
    root.querySelectorAll('[data-read]').forEach(function(b){
      var done = !!S.read[b.getAttribute('data-read')];
      b.textContent = done ? 'Read · +' + R.concept + ' XP earned' : 'Mark as read · +' + R.concept + ' XP';
      b.disabled = done;
    });
  }

  function renderPager(){
    pager.innerHTML =
      '<button class="agx-btn" data-prev="1"' + (current === 0 ? ' disabled' : '') + '>Previous</button>' +
      '<span class="agx-note">Chapter ' + (current + 1) + ' of ' + chapters.length + '</span>' +
      '<button class="agx-btn" data-next="1"' + (current === chapters.length - 1 ? ' disabled' : '') + '>Next</button>' +
      msgHtml();
  }

  function showChapter(i){
    if(i < 0 || i >= chapters.length) return;
    current = i;
    var c = chapters[i];
    reader.innerHTML = '';
    c.nodes.forEach(function(n){ reader.appendChild(n); });
    if(c.box) reader.appendChild(c.box);
    renderPager();
    updateReadButtons();
  }

  function renderChapters(){
    chapterGrid.innerHTML = chapters.map(function(c, i){
      var status = c.realm ? (S.read[c.id] ? 'Read' : 'Not read yet') : 'Reference';
      return '<button class="agx-card" data-go="' + i + '"><span class="agx-note">Chapter ' + (i + 1) + (c.realm ? ' · ' + esc(c.realm.name) : '') + '</span><b style="display:block;margin-top:4px;color:var(--text)">' + esc(c.title) + '</b><span class="agx-note">' + status + '</span></button>';
    }).join('');
  }

  function renderPractice(){
    practiceEl.innerHTML = msgHtml() +
      '<h3 style="margin:22px 0 10px;color:var(--text)">Daily question</h3>' + renderDaily() +
      '<h3 style="margin:26px 0 10px;color:var(--text)">Realms and bosses</h3>' +
      '<div class="agx-cols">' + renderRealms() + '</div>';
  }

  function renderProgress(){
    progressEl.innerHTML = msgHtml() +
      renderSummary() +
      renderBadges() +
      '<div class="agx-q" style="margin-top:22px"><h3 style="margin:0 0 6px;color:var(--text)">Reset progress</h3><p class="agx-note" style="margin:0 0 10px">Clears XP, streaks, badges, answers and reads stored in this browser.</p><button class="agx-btn" data-reset="1">Reset</button></div>';
  }

  function refresh(){
    if(tab === 'read') showChapter(current);
    if(tab === 'diagrams') buildDiagrams();
    if(tab === 'chapters') renderChapters();
    if(tab === 'practice') renderPractice();
    if(tab === 'progress') renderProgress();
    msg = '';
  }

  function showTab(name){
    tab = name;
    root.querySelectorAll('[data-tab]').forEach(function(b){
      b.setAttribute('aria-selected', String(b.getAttribute('data-tab') === name));
    });
    ['read','chapters','diagrams','practice','progress'].forEach(function(t){
      document.getElementById('agx-p-' + t).hidden = (t !== name);
    });
    refresh();
  }

  function scrollToTabs(){
    var el = root.querySelector('.agx-tabs');
    if(el && el.scrollIntoView){ el.scrollIntoView({block: 'start'}); }
  }

  root.addEventListener('click', function(e){
    var t = e.target.closest ? e.target.closest('button') : null;
    if(!t || t.disabled) return;
    if(t.hasAttribute('data-tab')){ showTab(t.getAttribute('data-tab')); return; }
    if(t.hasAttribute('data-go')){ current = +t.getAttribute('data-go'); showTab('read'); return; }
    if(t.hasAttribute('data-prev')){ showChapter(current - 1); scrollToTabs(); return; }
    if(t.hasAttribute('data-next')){ showChapter(current + 1); scrollToTabs(); return; }
    if(t.hasAttribute('data-read')){ markRead(t.getAttribute('data-read')); return; }
    if(t.hasAttribute('data-q')){ answerQuestion(t.getAttribute('data-q'), +t.getAttribute('data-i')); return; }
    if(t.hasAttribute('data-daily')){ answerDaily(+t.getAttribute('data-i')); return; }
    if(t.hasAttribute('data-boss')){ answerBoss(t.getAttribute('data-boss'), +t.getAttribute('data-i')); return; }
    if(t.hasAttribute('data-reset')){
      if(!t.dataset.armed){
        t.dataset.armed = '1'; t.textContent = 'Tap again to confirm';
        setTimeout(function(){ t.dataset.armed = ''; t.textContent = 'Reset'; }, 3000);
        return;
      }
      S = blank(); tmp = {}; msg = 'Progress reset'; save(); refresh();
    }
  });

  buildChapters();
  checkRealms(); checkBadges(); save();
  showTab('read');
})();
