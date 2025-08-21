/* Mobile LaLiga app JS: teams list, round-robin fixture generator, UI actions. */

/* ====== DATA: INTER CUP DE VILLAGE 4 8 teams (2024/25 style) ======
   Source: INTER CUP DE VILLAGE 4/ Wikipedia teams list. */
const TEAMS = [
  "Intwari FC","Rukundo FC","Intare Batinya FC","Rukundo FC","Intore FC",
  "Miravyo FC","Amasipiri FC","Ninga Academy"
  ];


/* ====== UI SELECTORS ====== */
const hamburger = document.getElementById('hamburger');
const mobileNav = document.getElementById('mobileNav');
const navItems = document.querySelectorAll('.nav-item');
const pages = document.querySelectorAll('.page');
const aboutContent = document.getElementById('aboutContent');
const playersList = document.getElementById('playersList');
const roundSelect = document.getElementById('roundSelect');
const fixturesList = document.getElementById('fixturesList');
const standingsTableBody = document.querySelector('#standingsTable tbody');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const resultBox = document.getElementById('resultBox');

/* ====== NAV TOGGLE ====== */
hamburger.addEventListener('click', ()=> mobileNav.classList.toggle('show'));

/* Activate nav link -> show section only */
navItems.forEach(item=>{
  item.addEventListener('click', (e)=>{
    e.preventDefault();
    const sec = item.getAttribute('data-section');
    // activate nav visual
    document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
    item.classList.add('active');
    // show only requested page
    pages.forEach(p=>p.classList.remove('active'));
    document.getElementById(sec).classList.add('active');
    // close mobile nav
    mobileNav.classList.remove('show');

    // special: if opening about -> render champion, else hide
    if(sec === 'about') renderChampion();
  });
});

/* Accordion for Service */
document.querySelectorAll('.accordion').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    const panel = btn.nextElementSibling;
    panel.style.display = (panel.style.display === 'flex') ? 'none' : 'flex';
    panel.style.flexDirection = 'column';
  });
});

/* ====== INITIAL RENDER: players sample + standings + fixtures ====== */
function init(){
  renderPlayersSample();
  initStandings();
  initFixturesGenerator();
  renderRoundOptions();
  renderRound(1);
}
init();

/* ====== PLAYERS (sample list) ====== */
function renderPlayersSample(){
  const sample = [


    {name:"Robert Lewandowski", team:"FC Barcelona"},
    {name:"Kylian Mbappé", team:"Real Madrid"},
    {name:"Álvaro Morata", team:"Atlético Madrid"},
    {name:"Mikel Oyarzabal", team:"Real Sociedad"},
    {name:"Iago Aspas", team:"Celta Vigo"}
  ];
  playersList.innerHTML = sample.map(p=>`<li>${p.name} — <small>${p.team}</small></li>`).join('');
}

/* ====== STANDINGS: start with zeros, sort by points desc when updated ====== */
let STANDINGS = TEAMS.map((t,i)=>({
  pos: i+1, team: t, played:0, win:0, draw:0, loss:0, pts:0
}));

function initStandings(){
  renderStandings();
}
function renderStandings(){
  // sort by pts desc, tie-break by name
  STANDINGS.sort((a,b)=> b.pts - a.pts || a.team.localeCompare(b.team));
  // reassign positions
  STANDINGS.forEach((s,i)=> s.pos = i+1);
  standingsTableBody.innerHTML = STANDINGS.map(s=>`
    <tr>
      <td>${s.pos}</td>
      <td style="text-align:left;padding-left:10px">${s.team}</td>
      <td>${s.played}</td><td>${s.win}</td><td>${s.draw}</td><td>${s.loss}</td><td>${s.pts}</td>
    </tr>
  `).join('');
}

/* ====== FIXTURES: Round-robin generator (circle method) ====== */
function generateFixtures(teams){
  // if odd, add bye
  const list = teams.slice();
  const isOdd = (list.length % 2 !== 0);
  if(isOdd) list.push(null); // bye
  const n = list.length;
  const rounds = n - 1;
  const half = n / 2;
  const schedule = [];

  const teamsArr = list.slice();
  for(let round=0; round<rounds; round++){
    const pairs = [];
    for(let i=0;i<half;i++){
      const t1 = teamsArr[i];
      const t2 = teamsArr[n-1-i];
      if(t1 && t2){
        // alternate home/away by round parity to balance
        if(round % 2 === 0) pairs.push({home:t1, away:t2});
        else pairs.push({home:t2, away:t1});
      }
    }
    schedule.push(pairs);
    // rotate (except first)
    teamsArr.splice(1,0,teamsArr.pop());
  }

  // Create double round (home/away reversed for second half)
  const fullSchedule = [];
  for(let r=0;r<schedule.length;r++){
    fullSchedule.push(schedule[r]); // first half
  }
  for(let r=0;r<schedule.length;r++){
    // reverse fixtures
    const rev = schedule[r].map(m => ({home:m.away, away:m.home}));
    fullSchedule.push(rev);
  }
  return fullSchedule; // array of 2*(n-1) rounds (for 20 teams => 38 rounds)
}

let FIXTURES = generateFixtures(TEAMS);

/* Render round options in select */
function renderRoundOptions(){
  roundSelect.innerHTML = '';
  for(let i=0;i<FIXTURES.length;i++){
    const opt = document.createElement('option');
    opt.value = i+1;
    opt.textContent = `Round ${i+1}`;
    roundSelect.appendChild(opt);
  }
  roundSelect.addEventListener('change', ()=> renderRound(Number(roundSelect.value)));
}

/* Render a given round to UI */
function renderRound(roundNo){
  const idx = roundNo - 1;
  const matches = FIXTURES[idx] || [];
  fixturesList.innerHTML = matches.map(m => {
    return `<li>
      <div class="team"><span>${m.home}</span> <small>vs</small> <span>${m.away}</span></div>
      <div class="meta"><small>Round ${roundNo}</small></div>
    </li>`;
  }).join('') || '<li><em>No matches</em></li>';
}

/* init fixtures controls default */
document.addEventListener('DOMContentLoaded', ()=> {
  // ensure roundSelect exists then set to 1
  if(roundSelect.options.length) roundSelect.value = 1;
});

/* ====== SEARCH: find team and show its fixtures + info ====== */
function searchTeam(){
  const query = (searchInput.value || '').trim().toLowerCase();
  if(!query) return showResult(`<p>Ivyanditse birabura. Andika izina ry’ikipe.</p>`);
  // find team by name (partial)
  const found = TEAMS.find(t=> t.toLowerCase().includes(query));
  if(!found) return showResult(`<p>Team "${query}" ntiyonzwe.</p>`);
  // build team info + upcoming fixtures (next 3 matches simulation from fixture list)
  const matches = [];
  // flatten fixtures with round numbers
  for(let r=0;r<FIXTURES.length;r++){
    for(const m of FIXTURES[r]){
      if(m.home === found || m.away === found){
        matches.push({round: r+1, home: m.home, away: m.away});
      }
    }
  }
  const next3 = matches.slice(0,3);
  let html = `<h3>${found}</h3>`;
  html += `<p>Sample info: ${found} - LaLiga team.</p>`;
  html += `<h4>Next matches</h4>`;
  html += `<ul>`;
  next3.forEach(m => html += `<li>Round ${m.round}: ${m.home} vs ${m.away}</li>`);
  html += `</ul>`;
  // show
  // switch to searchResult page
  pages.forEach(p=>p.classList.remove('active'));
  document.getElementById('searchResult').classList.add('active');
  // mark no nav active
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  showResult(html);
}

function showResult(html){
  resultBox.innerHTML = html;
}

/* connect search button */
searchBtn.addEventListener('click', searchTeam);
searchInput.addEventListener('keydown', (e)=>{ if(e.key === 'Enter') searchTeam(); });

/* render champion in About */
function renderChampion(){
  aboutContent.innerHTML = `
    <p><strong>Champion ${CHAMPION.season}:</strong> ${CHAMPION.team}</p>
    <p>${CHAMPION.note}</p>
  `;
}

/* expose renderRound to global for select change handler */