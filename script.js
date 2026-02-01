// script.js — FuZion Rust Compendium
(() => {
  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

  // ---------- Storage keys ----------
  const K = {
    tz: "fz_tz",
    beginner: "fz_beginner",
    noAnim: "fz_noAnim",
    compact: "fz_compact",
    light: "fz_light",
    saved: "fz_saved_topics",
    progress: "fz_topic_progress",
    section: "fz_section",
  };

  // ---------- Content (seed + expandable) ----------
  // Add more topics anytime. The renderer + search auto-picks them up.
  const SECTIONS = [
    { id:"wipe",       name:"Wipe Plan",     icon:"⏱", desc:"Timelines, checklists, early snowball." },
    { id:"building",   name:"Building",      icon:"🧱", desc:"Core building mechanics + strength basics." },
    { id:"bases",      name:"Bases",         icon:"🏠", desc:"Solo / Duo / Trio / Clan base templates + concepts." },
    { id:"electricity",name:"Electricity",   icon:"⚡", desc:"Every electrical item + ready circuits." },
    { id:"farming",    name:"Farming & Teas",icon:"🌿", desc:"Cloth, berries, teas, genetics, water." },
    { id:"industrial", name:"Industrial",    icon:"🏭", desc:"Auto-sorting, auto-crafting, upkeep feeders." },
    { id:"monuments",  name:"Monuments",     icon:"🏗", desc:"Safe monument routes + what to bring." },
    { id:"pvp",        name:"PvP",           icon:"🎯", desc:"Positioning, fights, roaming rules." },
    { id:"links",      name:"Links",         icon:"🔗", desc:"Curated channels, playlists, tools, official docs." },
    { id:"saved",      name:"Saved",         icon:"★", desc:"Your bookmarks." },
  ];

  const TOPICS = [
    // WIPE
    {
      id:"wipe-90",
      section:"wipe",
      title:"First 90 minutes (realistic)",
      level:"beginner",
      tags:["wipe","starter","timeline","solo","duo"],
      summary:"The fastest safe path: base down + bank scrap + upgrades.",
      blocks:[
        { k:"Goal", v:"A base that survives + a recycler loop that prints scrap." },
        { k:"Rule", v:"Bank early. No roaming stacked. No ego fights." },
      ],
      steps:[
        "0–10: tools, bag, bow path, 1 stash.",
        "10–25: 2x1 + airlock + TC (immediate).",
        "25–45: furnace down + small scrap loop, recycle in bursts.",
        "45–90: doors upgraded, honeycomb the TC/loot side, roof access plan."
      ],
      mistakes:[
        "Building roadside or next to big clans.",
        "Recycling while fully geared.",
        "Farming too much before you have doors + TC secured."
      ]
    },
    {
      id:"wipe-checklist",
      section:"wipe",
      title:"Wipe checklist (copy/paste)",
      level:"beginner",
      tags:["wipe","checklist","discord"],
      summary:"Use this to keep the squad disciplined.",
      blocks:[
        { k:"Checklist", v:"Bag(s), stash insurance, 2x1+airlock, furnace, door upgrades, scrap route, depot schedule." },
        { k:"Discord message", v:"WIPE: last Friday @ 5PM (US). Base down fast, bank scrap early, no roaming stacked." },
      ],
      steps:[ "Copy message → pin it.", "Assign roles: builder / recycler / farmer / scout.", "Decide your first monument loop." ],
      links:[
        { t:"Rust Wiki — Building blocks (official)", d:"Official Facepunch wiki entry point", u:"https://wiki.facepunch.com/rust/Building" }
      ]
    },

    // BUILDING
    {
      id:"build-strength",
      section:"building",
      title:"Base strength fundamentals",
      level:"beginner",
      tags:["building","strength","honeycomb","doors","tc"],
      summary:"If you understand this, your bases instantly get harder to raid.",
      blocks:[
        { k:"Concept", v:"Raiders pick the cheapest path. Your job is to make every path expensive and unclear." },
        { k:"Priority order", v:"Doors/frames → key honeycomb → roof control → externals → compound." },
      ],
      steps:[
        "Always airlock first. No exceptions.",
        "Hide TC from door line-of-sight (don’t advertise).",
        "Honeycomb the TC/loot side first (not random sides).",
        "Add roof access + peaks when you can afford the upgrades."
      ],
      mistakes:[
        "Single straight door path to loot/TC.",
        "Windows too early.",
        "Overbuilding (big base = big raid magnet)."
      ]
    },
    {
      id:"build-placement",
      section:"building",
      title:"Where to build (quick decision)",
      level:"beginner",
      tags:["building","placement","terrain","recycler"],
      summary:"Build location matters more than most people admit.",
      blocks:[
        { k:"Good", v:"Near a recycler route but not on the main road; terrain cover; multiple escape lines." },
        { k:"Bad", v:"Roadside, beach spam, next to giant compounds, or directly under monument roofs." },
      ],
      steps:[
        "Pick 1 recycler path you can run safely.",
        "Pick 1 fallback route home that avoids open fields.",
        "Avoid 'main artery' roads early wipe."
      ]
    },

    // BASES
    {
      id:"base-solo-2x1",
      section:"bases",
      title:"Solo: 2x1 → 2x2 upgrade path",
      level:"beginner",
      tags:["bases","solo","2x1","2x2","starter"],
      summary:"Fast, safe, expandable. Stops 'one death = reset'.",
      blocks:[
        { k:"Why it works", v:"You get doors and TC security early, then expand only when you're stable." },
      ],
      steps:[
        "Build 2x1 + airlock. TC deep.",
        "Add furnace + box immediately.",
        "Upgrade entry doors to metal first.",
        "Expand into 2x2 when you can, then honeycomb TC/loot side."
      ],
      mistakes:[ "Greeding loot room before door upgrades.", "No roof access plan." ]
    },
    {
      id:"base-bunker-types",
      section:"bases",
      title:"Bunker concepts (what they are)",
      level:"advanced",
      tags:["bases","bunker","raidcost","concepts"],
      summary:"Bunkers raise raid cost by forcing raiders into worse options.",
      blocks:[
        { k:"Reality check", v:"A bunker is not magic. If you advertise loot, you still get raided." },
      ],
      steps:[
        "Use bunkers when you can afford upgrades and upkeep.",
        "Hide your 'value rooms' and spread loot.",
        "Pair bunker with roof control + externals (later)."
      ],
      mistakes:[ "Using a bunker but leaving a cheap door path.", "Overcomplicating early wipe." ]
    },

    // ELECTRICITY — items
    {
      id:"elec-overview",
      section:"electricity",
      title:"Electricity basics (how power actually flows)",
      level:"beginner",
      tags:["electricity","battery","solar","wind","branch","splitter"],
      summary:"Stop guessing. Understand one rule: power + logic are separate.",
      blocks:[
        { k:"Rule #1", v:"Power paths deliver watts. Logic inputs (like 'turn on') control behavior." },
        { k:"Best starter setup", v:"Solar → Charge Controller → Small Battery → Branches (lights/turret)." },
      ],
      steps:[
        "Use a battery. Direct solar to devices is unstable.",
        "Branch out of the battery to keep critical devices powered.",
        "Hide wiring and components behind doors."
      ]
    },
    {
      id:"elec-item-battery",
      section:"electricity",
      title:"Item: Batteries (small/medium/large)",
      level:"beginner",
      tags:["electricity","battery"],
      summary:"The battery is the brain of reliable power.",
      blocks:[
        { k:"What it does", v:"Stores power and outputs a stable amount to your base." },
        { k:"Common use", v:"Battery out → branches → lights/turrets/alarms." },
      ],
      steps:[
        "Charge via charge controller (solar/wind).",
        "Keep battery inside core (raiders love batteries).",
        "Use branches so a single device can't starve everything."
      ],
      mistakes:[ "Trying to run turrets directly off solar.", "Leaving battery exposed in honeycomb." ]
    },
    {
      id:"elec-item-branch",
      section:"electricity",
      title:"Item: Electrical Branch",
      level:"beginner",
      tags:["electricity","branch"],
      summary:"Give each subsystem a guaranteed budget.",
      blocks:[
        { k:"What it does", v:"Takes power in and guarantees a set amount on the 'Branch Out' while passing the rest." },
      ],
      steps:[
        "Put your critical line on branch out (e.g., lights).",
        "Pass-through feeds less critical systems."
      ]
    },
    {
      id:"elec-item-splitter",
      section:"electricity",
      title:"Item: Splitter",
      level:"beginner",
      tags:["electricity","splitter"],
      summary:"Evenly splits output — useful but easy to misuse.",
      blocks:[
        { k:"What it does", v:"Divides incoming power across multiple outputs." },
        { k:"When to use", v:"Simple lighting runs, non-critical loads." },
      ],
      mistakes:[ "Using splitter for turrets (branching is safer)." ]
    },
    {
      id:"elec-item-blocker",
      section:"electricity",
      title:"Item: Blocker",
      level:"advanced",
      tags:["electricity","blocker","priority"],
      summary:"Priority logic: source A preferred, source B only if needed.",
      blocks:[
        { k:"Use", v:"Prevent backflow or enforce source priority with combiners." },
      ]
    },
    {
      id:"elec-circuit-turret",
      section:"electricity",
      title:"Circuit: Simple turret power (stable)",
      level:"beginner",
      tags:["electricity","turret","circuit","defense"],
      summary:"A turret that stays on reliably.",
      blocks:[
        { k:"Circuit", v:"Solar → Charge Controller → Small Battery → (Switch optional) → Turret" },
      ],
      steps:[
        "Put turret behind a door or in honeycomb.",
        "Give turret its own branch so it doesn't get starved."
      ]
    },
    {
      id:"elec-circuit-hbhf",
      section:"electricity",
      title:"Circuit: HBHF alarm (raid warning)",
      level:"advanced",
      tags:["electricity","hbhf","alarm","circuit"],
      summary:"HBHF triggers alarms/lights when players are nearby.",
      blocks:[
        { k:"Circuit", v:"HBHF → OR switch → alarm + lights" },
      ],
      steps:[ "Place HBHF on outer wall or bunker edge.", "Use it to light up the base at night when someone is close." ]
    },

    // FARMING
    {
      id:"farm-basics",
      section:"farming",
      title:"Farming basics (cloth + teas)",
      level:"beginner",
      tags:["farming","hemp","berries","teas","water"],
      summary:"Quiet power: cloth, meds, scrap teas. Keep it hidden.",
      blocks:[
        { k:"Start with", v:"Hemp for cloth → meds. Then berries for teas." },
        { k:"Security", v:"Farms attract raids. Build them inside, not visible." },
      ],
      steps:[
        "Start hemp first (consistent cloth).",
        "Add water + light only when safe.",
        "Scale into berries/teas after doors/TC are secure."
      ],
      mistakes:[ "Visible farm rooms.", "Over-investing before your base is safe." ]
    },
    {
      id:"farm-genetics",
      section:"farming",
      title:"Genetics (GGGYYY etc.)",
      level:"advanced",
      tags:["farming","genetics","cloning"],
      summary:"Optimize later. Early game = stability + security.",
      blocks:[
        { k:"Meaning (official)", v:"Genes affect growth rate, yield, hardiness, water usage, etc." },
      ],
      steps:[ "Clone your best plants and keep a 'bank' of clones.", "Improve one trait at a time." ]
    },

    // INDUSTRIAL
    {
      id:"ind-overview",
      section:"industrial",
      title:"Industrial system overview",
      level:"beginner",
      tags:["industrial","conveyor","adapter","automation"],
      summary:"Auto-sort loot and auto-craft so you spend time outside.",
      blocks:[
        { k:"Core idea", v:"Input box → conveyor filters → output boxes." },
      ],
      steps:[
        "Start with one 'dump box'.",
        "Route comps/ore/meds/ammo into separate boxes.",
        "Hide everything behind doors."
      ]
    },
    {
      id:"ind-autosort",
      section:"industrial",
      title:"Auto-sorting starter (minimal parts)",
      level:"beginner",
      tags:["industrial","sorting","starter"],
      summary:"A simple sorter that stops box chaos.",
      blocks:[
        { k:"Layout", v:"Dump box → conveyor → (storage adapters) → target boxes" },
      ],
      steps:[
        "Build 1 dump box near entrance.",
        "Use 1 conveyor to push filtered items to 2–4 boxes.",
        "Add more conveyors later (don’t overbuild)."
      ]
    },
    {
      id:"ind-tc-upkeep",
      section:"industrial",
      title:"Auto TC upkeep feeder",
      level:"advanced",
      tags:["industrial","tc","upkeep"],
      summary:"Auto-feed stone/metal/wood to TC from a storage.",
      steps:[
        "Keep a 'materials' box feeding TC box via conveyor filters.",
        "Separate upkeep from loot so teammates don’t steal it."
      ]
    },

    // MONUMENTS
    {
      id:"mon-loops",
      section:"monuments",
      title:"Safe monument loops (for scrap)",
      level:"beginner",
      tags:["monuments","scrap","recycle","routes"],
      summary:"Your wipe is won by your recycler path.",
      steps:[
        "Recycle in bursts. Depot between bursts.",
        "Avoid running the same route at the same time every hour.",
        "Bring cheap kits; save your best gear for when you control the area."
      ]
    },

    // PVP
    {
      id:"pvp-rules",
      section:"pvp",
      title:"10 PvP rules that actually matter",
      level:"beginner",
      tags:["pvp","positioning","roam"],
      summary:"Positioning beats aim in most real fights.",
      steps:[
        "Cover first, shooting second.",
        "Never loot in the open.",
        "Always have an escape route.",
        "Reposition after damage (don’t re-peek).",
        "Disengage if you’re carrying value."
      ]
    },

    // LINKS
    {
      id:"links-core",
      section:"links",
      title:"Curated learning (bases, electricity, farming, industrial)",
      level:"beginner",
      tags:["links","youtube","tools","wiki"],
      summary:"Start here instead of random videos.",
      links:[
        { t:"Evil Wurst — Base building channel", d:"High-quality base builds + concepts", u:"https://www.youtube.com/c/EvilWurst" },
        { t:"Evil Wurst — Starter base playlist", d:"Starter templates and upgrades", u:"https://www.youtube.com/playlist?list=PLZdY0C_JDhvRie5u5ar2vg2i7JCfHYrTb" },
        { t:"Evil Wurst — Bases playlist", d:"Many strong base patterns", u:"https://www.youtube.com/playlist?list=PLZdY0C_JDhvQckd2Pby2b_PraZA2Mt-jY" },
        { t:"Rustrician.io", d:"Electricity simulator + handbook", u:"https://www.rustrician.io/" },
        { t:"Rust Wiki — Farming Basics (official)", d:"Facepunch official farming basics", u:"https://wiki.facepunch.com/rust/Farming_Basics" },
        { t:"Rust Wiki — Farming & Genetics (official)", d:"Official genetics gene meanings", u:"https://wiki.facepunch.com/rust/Farming" },
        { t:"Rust — Industrial Update (official)", d:"Patch notes introducing industrial", u:"https://rust.facepunch.com/news/industrial-update" },
        { t:"Industrial guide (Corrosion Hour)", d:"Explains industrial system parts & use cases", u:"https://www.corrosionhour.com/rust-industrial-system-guide/" }
      ]
    },

    // SAVED placeholder view
    {
      id:"saved-view",
      section:"saved",
      title:"Your saved topics",
      level:"beginner",
      tags:["saved"],
      summary:"Bookmark topics with ★. They show up here.",
    },
  ];

  // ---------- UI elements ----------
  const side = $("#side");
  const menuBtn = $("#menuBtn");
  const closeSide = $("#closeSide");
  const overlay = $("#overlay");

  const nav = $("#nav");
  const bottomNav = $("#bottomNav");

  const sectionHost = $("#sectionHost");
  const toast = $("#toast");

  const cmdBtn = $("#cmdBtn");
  const palette = $("#palette");
  const paletteInput = $("#paletteInput");
  const paletteResults = $("#paletteResults");
  const paletteClose = $("#paletteClose");

  const sheet = $("#sheet");
  const settingsBtn = $("#settingsBtn");
  const sheetClose = $("#sheetClose");
  const tzSelect = $("#tzSelect");

  const subline = $("#subline");
  const countdown = $("#countdown");
  const nextWipeLine = $("#nextWipeLine");
  const recalcBtn = $("#recalcBtn");
  const savedCount = $("#savedCount");
  const gotoSavedBtn = $("#gotoSaved");

  const themeBtn = $("#themeBtn");

  // ---------- Toast ----------
  let toastTimer = null;
  function showToast(msg){
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 1200);
  }

  // ---------- Settings state ----------
  function getSavedSet(){
    try{
      return new Set(JSON.parse(localStorage.getItem(K.saved) || "[]"));
    }catch{
      return new Set();
    }
  }
  function setSavedSet(set){
    localStorage.setItem(K.saved, JSON.stringify(Array.from(set)));
    updateSavedUI();
  }
  function getProgressMap(){
    try{
      return JSON.parse(localStorage.getItem(K.progress) || "{}");
    }catch{
      return {};
    }
  }
  function setProgressMap(map){
    localStorage.setItem(K.progress, JSON.stringify(map));
  }

  function applyModes(){
    const beginner = localStorage.getItem(K.beginner) === "1";
    const noAnim = localStorage.getItem(K.noAnim) === "1";
    const compact = localStorage.getItem(K.compact) === "1";
    const light = localStorage.getItem(K.light) === "1";

    document.body.classList.toggle("beginner", beginner);
    document.body.classList.toggle("no-anim", noAnim);
    document.body.classList.toggle("compact", compact);
    document.body.classList.toggle("light", light);

    $("#toggleBeginner").checked = beginner;
    $("#toggleNoAnim").checked = noAnim;
    $("#toggleCompact").checked = compact;
  }

  function bindSettings(){
    $("#toggleBeginner").addEventListener("change", (e) => {
      localStorage.setItem(K.beginner, e.target.checked ? "1" : "0");
      applyModes();
      renderSection(getCurrentSectionId());
    });
    $("#toggleNoAnim").addEventListener("change", (e) => {
      localStorage.setItem(K.noAnim, e.target.checked ? "1" : "0");
      applyModes();
    });
    $("#toggleCompact").addEventListener("change", (e) => {
      localStorage.setItem(K.compact, e.target.checked ? "1" : "0");
      applyModes();
      renderSection(getCurrentSectionId());
    });
    tzSelect.addEventListener("change", () => {
      localStorage.setItem(K.tz, tzSelect.value);
      updateWipeUI();
      showToast("Timezone updated");
    });

    themeBtn.addEventListener("click", () => {
      const light = localStorage.getItem(K.light) === "1";
      localStorage.setItem(K.light, light ? "0" : "1");
      applyModes();
    });
  }

  function openSheet(){
    sheet.classList.add("open");
    overlay.hidden = false;
  }
  function closeSheet(){
    sheet.classList.remove("open");
    if (!palette.classList.contains("open")) overlay.hidden = true;
  }

  settingsBtn.addEventListener("click", openSheet);
  sheetClose.addEventListener("click", closeSheet);

  // ---------- Sidebar ----------
  function openSide(){
    side.classList.add("open");
    overlay.hidden = false;
  }
  function closeSideFn(){
    side.classList.remove("open");
    if (!palette.classList.contains("open") && !sheet.classList.contains("open")) overlay.hidden = true;
  }
  menuBtn.addEventListener("click", openSide);
  closeSide.addEventListener("click", closeSideFn);

  overlay.addEventListener("click", () => {
    closeSideFn();
    closePalette();
    closeSheet();
  });

  // ---------- Wipe calculation (Last Friday @ 5PM in chosen TZ) ----------
  function getTZ(){
    return localStorage.getItem(K.tz) || "America/Chicago";
  }

  function lastFridayOfMonthUTC(year, monthIndex){
    const lastDay = new Date(Date.UTC(year, monthIndex + 1, 0));
    const day = lastDay.getUTCDay(); // 0 Sun ... 5 Fri
    const diff = (day >= 5) ? (day - 5) : (day + 2);
    return new Date(Date.UTC(year, monthIndex + 1, 0 - diff));
  }

  function tzDateParts(date, timeZone){
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year:"numeric", month:"2-digit", day:"2-digit",
      hour:"2-digit", minute:"2-digit", second:"2-digit",
      hour12:false
    }).formatToParts(date);
    const get = (t) => parts.find(p => p.type === t)?.value;
    return {
      y: Number(get("year")),
      m: Number(get("month")) - 1,
      d: Number(get("day")),
      hh: Number(get("hour")),
      mm: Number(get("minute")),
      ss: Number(get("second")),
    };
  }

  // Convert "local time in timezone" to a UTC Date (robust enough for DST)
  function tzLocalToUTCDate(y, m, d, hh, mm, timeZone){
    let guess = new Date(Date.UTC(y, m, d, hh, mm, 0));
    const obs = tzDateParts(guess, timeZone);
    const intended = Date.UTC(y, m, d, hh, mm, 0);
    const observed = Date.UTC(obs.y, obs.m, obs.d, obs.hh, obs.mm, 0);
    const deltaMs = intended - observed;
    return new Date(guess.getTime() + deltaMs);
  }

  function buildWipeForMonthUTC(year, monthIndex, timeZone){
    const lf = lastFridayOfMonthUTC(year, monthIndex);
    // We need the LAST FRIDAY date in the chosen timezone (not UTC),
    // so we take lf UTC and reformat to timezone date, then set 17:00 local in that timezone.
    const lfLocal = tzDateParts(lf, timeZone);
    return tzLocalToUTCDate(lfLocal.y, lfLocal.m, lfLocal.d, 17, 0, timeZone);
  }

  function nextWipeUTC(now = new Date()){
    const tz = getTZ();
    const nowLocal = tzDateParts(now, tz);
    const wipeThisMonth = buildWipeForMonthUTC(nowLocal.y, nowLocal.m, tz);
    if (now.getTime() < wipeThisMonth.getTime()) return wipeThisMonth;

    // next month in that timezone
    const nextMonthUTC = tzLocalToUTCDate(nowLocal.y, nowLocal.m + 1, 1, 0, 0, tz);
    const nmLocal = tzDateParts(nextMonthUTC, tz);
    return buildWipeForMonthUTC(nmLocal.y, nmLocal.m, tz);
  }

  function fmtInTZ(date, tz){
    return date.toLocaleString("en-US", {
      timeZone: tz,
      weekday:"long",
      year:"numeric",
      month:"short",
      day:"2-digit",
      hour:"numeric",
      minute:"2-digit",
      hour12:true
    });
  }
  function fmtLocal(date){
    return date.toLocaleString("en-US", {
      weekday:"long",
      year:"numeric",
      month:"short",
      day:"2-digit",
      hour:"numeric",
      minute:"2-digit",
      hour12:true
    });
  }

  function updateWipeUI(){
    const tz = getTZ();
    tzSelect.value = tz;

    const wipe = nextWipeUTC(new Date());
    const inTZ = fmtInTZ(wipe, tz);
    const inLocal = fmtLocal(wipe);

    subline.textContent = `Last Friday • 5PM (${tz.replace("America/","")})`;
    nextWipeLine.textContent = `Wipe: ${inTZ} • Your time: ${inLocal}`;

    // countdown
    function tick(){
      const now = new Date().getTime();
      const t = wipe.getTime() - now;
      if (t <= 0){
        countdown.textContent = "WIPE LIVE";
        return;
      }
      const s = Math.floor(t / 1000);
      const d = Math.floor(s / 86400);
      const h = Math.floor((s % 86400) / 3600);
      const m = Math.floor((s % 3600) / 60);
      const sec = s % 60;
      countdown.textContent = `${d}d ${h}h ${m}m ${sec}s`;
    }
    tick();
    clearInterval(updateWipeUI._timer);
    updateWipeUI._timer = setInterval(tick, 1000);
  }

  recalcBtn.addEventListener("click", () => {
    updateWipeUI();
    showToast("Recalculated");
  });

  // ---------- Render navigation ----------
  function renderNav(){
    nav.innerHTML = "";
    bottomNav.innerHTML = "";

    for (const s of SECTIONS){
      const item = document.createElement("div");
      item.className = "nav-item";
      item.dataset.section = s.id;
      item.innerHTML = `
        <div class="left">
          <div class="ic">${s.icon}</div>
          <div class="txt">
            <div class="name">${s.name}</div>
            <div class="meta">${s.desc}</div>
          </div>
        </div>
      `;
      item.addEventListener("click", () => {
        goToSection(s.id);
        closeSideFn();
      });
      nav.appendChild(item);

      const b = document.createElement("div");
      b.className = "bitem";
      b.dataset.section = s.id;
      b.textContent = `${s.icon} ${s.name}`;
      b.addEventListener("click", () => goToSection(s.id));
      bottomNav.appendChild(b);
    }
  }

  function setNavActive(sectionId){
    $$(".nav-item").forEach(el => el.classList.toggle("active", el.dataset.section === sectionId));
    $$(".bitem").forEach(el => el.classList.toggle("active", el.dataset.section === sectionId));
  }

  // ---------- Render section content ----------
  function getCurrentSectionId(){
    return localStorage.getItem(K.section) || "wipe";
  }

  function topicMatchesMode(topic){
    const beginner = localStorage.getItem(K.beginner) === "1";
    if (!beginner) return true;
    return topic.level !== "advanced";
  }

  function renderSection(sectionId){
    sectionHost.innerHTML = "";
    const s = SECTIONS.find(x => x.id === sectionId) || SECTIONS[0];

    // section header
    const head = document.createElement("div");
    head.className = "section-head";
    head.innerHTML = `
      <div>
        <h2>${s.icon} ${s.name}</h2>
        <div class="sub muted">${s.desc}</div>
      </div>
      <div class="filters" id="filters"></div>
    `;
    sectionHost.appendChild(head);

    const grid = document.createElement("div");
    grid.className = "grid";
    sectionHost.appendChild(grid);

    const savedSet = getSavedSet();
    const progressMap = getProgressMap();

    const list = TOPICS.filter(t => t.section === sectionId && topicMatchesMode(t));

    if (sectionId === "saved"){
      const savedTopics = TOPICS.filter(t => savedSet.has(t.id) && topicMatchesMode(t));
      if (!savedTopics.length){
        const empty = document.createElement("div");
        empty.className = "card";
        empty.innerHTML = `
          <div class="card-top">
            <div>
              <div class="card-title">No saved topics yet</div>
              <div class="card-meta">Tap ★ on any topic to save it.</div>
            </div>
          </div>
        `;
        grid.appendChild(empty);
        return;
      }
      savedTopics.forEach(t => grid.appendChild(renderTopicCard(t, savedSet, progressMap)));
      return;
    }

    // Optional: filters by tag group
    const filterWrap = $("#filters");
    const tagPool = new Set();
    list.forEach(t => (t.tags || []).forEach(tag => tagPool.add(tag)));
    const topTags = Array.from(tagPool).slice(0, 10); // keep simple
    let activeTag = null;

    if (topTags.length){
      const allChip = makeChip("All", true, () => { activeTag = null; refresh(); });
      filterWrap.appendChild(allChip);

      topTags.forEach(tag => {
        filterWrap.appendChild(makeChip(tag, false, () => { activeTag = tag; refresh(); }));
      });
    }

    function refresh(){
      // chip UI
      $$(".chip", filterWrap).forEach(c => {
        const isAll = c.dataset.tag === "__all__";
        c.classList.toggle("active", (isAll && activeTag === null) || (!isAll && c.dataset.tag === activeTag));
      });

      grid.innerHTML = "";
      const filtered = activeTag ? list.filter(t => (t.tags || []).includes(activeTag)) : list;
      if (!filtered.length){
        const empty = document.createElement("div");
        empty.className = "card";
        empty.innerHTML = `<div class="card-title">No results for this filter.</div>`;
        grid.appendChild(empty);
        return;
      }
      filtered.forEach(t => grid.appendChild(renderTopicCard(t, savedSet, progressMap)));
    }

    refresh();
  }

  function makeChip(tag, active, onClick){
    const c = document.createElement("div");
    c.className = "chip" + (active ? " active" : "");
    c.dataset.tag = tag === "All" ? "__all__" : tag;
    c.textContent = tag;
    c.addEventListener("click", onClick);
    return c;
  }

  function renderTopicCard(topic, savedSet, progressMap){
    const card = document.createElement("article");
    card.className = "card" + ((localStorage.getItem(K.compact) === "1") ? " compact" : "");
    card.dataset.topic = topic.id;

    const starred = savedSet.has(topic.id);

    const meta = [];
    if (topic.level) meta.push(topic.level);
    if (topic.tags?.length) meta.push(topic.tags.slice(0, 4).join(" • "));

    card.innerHTML = `
      <div class="card-top">
        <div class="left">
          <h3 class="card-title">${escapeHTML(topic.title)}</h3>
          <div class="card-meta">${escapeHTML(topic.summary || "")}</div>
        </div>
        <div class="card-actions">
          <button class="star ${starred ? "on" : ""}" aria-label="Save topic" title="Save">★</button>
          <button class="expand" aria-label="Expand topic" title="Expand">▾</button>
        </div>
      </div>
      <div class="pills">${(topic.tags||[]).slice(0,6).map(t => `<span class="pill">${escapeHTML(t)}</span>`).join("")}</div>
      <div class="card-body"></div>
    `;

    const starBtn = $(".star", card);
    const expBtn = $(".expand", card);
    const body = $(".card-body", card);

    function fillBody(){
      if (body.dataset.filled === "1") return;
      body.dataset.filled = "1";

      // Key/Value blocks
      if (topic.blocks?.length){
        const kv = document.createElement("div");
        kv.className = "kv";
        kv.innerHTML = topic.blocks.map(b => `
          <div class="k">${escapeHTML(b.k)}</div>
          <div class="v">${escapeHTML(b.v)}</div>
        `).join("");
        body.appendChild(kv);
      }

      // Steps with progress
      if (topic.steps?.length){
        const steps = document.createElement("div");
        steps.className = "steps";
        const prog = progressMap[topic.id] || [];
        steps.innerHTML = topic.steps.map((s, i) => {
          const checked = prog.includes(i);
          return `
            <label class="step">
              <input type="checkbox" ${checked ? "checked" : ""} data-step="${i}" />
              <div class="txt">${escapeHTML(s)}</div>
            </label>
          `;
        }).join("");
        body.appendChild(steps);

        // bind
        $$("input[type=checkbox][data-step]", steps).forEach(cb => {
          cb.addEventListener("change", () => {
            const idx = Number(cb.dataset.step);
            const cur = new Set(progressMap[topic.id] || []);
            if (cb.checked) cur.add(idx); else cur.delete(idx);
            progressMap[topic.id] = Array.from(cur).sort((a,b)=>a-b);
            setProgressMap(progressMap);
          });
        });
      }

      // Mistakes
      if (topic.mistakes?.length){
        const m = document.createElement("div");
        m.className = "kv";
        m.innerHTML = `
          <div class="k">Common mistakes</div>
          <div class="v">
            <ul class="ul">${topic.mistakes.map(x => `<li>${escapeHTML(x)}</li>`).join("")}</ul>
          </div>
        `;
        body.appendChild(m);
      }

      // Links
      if (topic.links?.length){
        const links = document.createElement("div");
        links.className = "links";
        links.innerHTML = topic.links.map(l => `
          <a class="link" href="${l.u}" target="_blank" rel="noreferrer">
            <div class="l">
              <div class="t">${escapeHTML(l.t)}</div>
              <div class="d">${escapeHTML(l.d || "")}</div>
            </div>
            <div class="go">↗</div>
          </a>
        `).join("");
        body.appendChild(links);
      }
    }

    function toggleOpen(force){
      const open = (typeof force === "boolean") ? force : !card.classList.contains("open");
      if (open){
        fillBody();
        card.classList.add("open");
        expBtn.textContent = "▴";
        // micro snap scroll into view
        card.scrollIntoView({ behavior: (document.body.classList.contains("no-anim") ? "auto" : "smooth"), block:"start" });
      } else {
        card.classList.remove("open");
        expBtn.textContent = "▾";
      }
    }

    expBtn.addEventListener("click", () => toggleOpen());
    card.addEventListener("dblclick", () => toggleOpen(true));

    starBtn.addEventListener("click", () => {
      if (savedSet.has(topic.id)) savedSet.delete(topic.id);
      else savedSet.add(topic.id);
      setSavedSet(savedSet);
      starBtn.classList.toggle("on", savedSet.has(topic.id));
      showToast(savedSet.has(topic.id) ? "Saved" : "Removed");
    });

    return card;
  }

  // ---------- Section routing ----------
  function goToSection(sectionId){
    localStorage.setItem(K.section, sectionId);
    setNavActive(sectionId);
    renderSection(sectionId);
    // Focus main for accessibility
    $("#main").focus({ preventScroll:true });
    // Collapse hero when navigating away on small screens
    if (window.matchMedia("(max-width: 980px)").matches){
      document.getElementById("hero").scrollIntoView({ behavior: document.body.classList.contains("no-anim") ? "auto" : "smooth", block:"start" });
    }
  }

  // hero buttons
  $$("[data-goto]").forEach(btn => {
    btn.addEventListener("click", () => goToSection(btn.dataset.goto));
  });

  gotoSavedBtn.addEventListener("click", () => goToSection("saved"));

  // ---------- Saved UI ----------
  function updateSavedUI(){
    const set = getSavedSet();
    savedCount.textContent = `${set.size} topic${set.size===1 ? "" : "s"}`;
  }

  // ---------- Command palette ----------
  function openPalette(){
    palette.classList.add("open");
    overlay.hidden = false;
    paletteInput.value = "";
    paletteInput.focus();
    renderPaletteResults("");
  }
  function closePalette(){
    palette.classList.remove("open");
    if (!side.classList.contains("open") && !sheet.classList.contains("open")) overlay.hidden = true;
  }

  cmdBtn.addEventListener("click", openPalette);
  paletteClose.addEventListener("click", closePalette);

  function scoreTopic(topic, q){
    const hay = (topic.title + " " + (topic.summary||"") + " " + (topic.tags||[]).join(" ")).toLowerCase();
    const terms = q.toLowerCase().trim().split(/\s+/).filter(Boolean);
    if (!terms.length) return 1;
    let score = 0;
    for (const t of terms){
      if (hay.includes(t)) score += 2;
      // light fuzzy
      if (topic.title.toLowerCase().includes(t)) score += 2;
    }
    return score;
  }

  let paletteActiveIndex = 0;
  let paletteList = [];

  function renderPaletteResults(q){
    const sectionId = getCurrentSectionId();
    const allow = (t) => topicMatchesMode(t) && t.section !== "saved";

    paletteList = TOPICS.filter(allow)
      .map(t => ({ t, s: scoreTopic(t, q) }))
      .filter(x => q.trim() ? x.s > 0 : true)
      .sort((a,b) => b.s - a.s)
      .slice(0, 30);

    paletteActiveIndex = 0;
    paletteResults.innerHTML = "";

    if (!paletteList.length){
      paletteResults.innerHTML = `<div class="res"><div class="t">No results</div><div class="m">Try different keywords.</div></div>`;
      return;
    }

    paletteList.forEach((x, i) => {
      const div = document.createElement("div");
      div.className = "res" + (i===0 ? " active" : "");
      div.innerHTML = `
        <div class="t">${escapeHTML(x.t.title)}</div>
        <div class="m">${escapeHTML(SECTIONS.find(s=>s.id===x.t.section)?.name || "")} • ${escapeHTML(x.t.summary || "")}</div>
        <div class="tags">${(x.t.tags||[]).slice(0,6).map(tag => `<span class="tag">${escapeHTML(tag)}</span>`).join("")}</div>
      `;
      div.addEventListener("click", () => openTopicFromPalette(x.t));
      paletteResults.appendChild(div);
    });
  }

  function setPaletteActive(i){
    const max = paletteList.length - 1;
    paletteActiveIndex = clamp(i, 0, max);
    $$(".res", paletteResults).forEach((r, idx) => r.classList.toggle("active", idx === paletteActiveIndex));
    const el = $$(".res", paletteResults)[paletteActiveIndex];
    if (el) el.scrollIntoView({ block:"nearest" });
  }

  function openTopicFromPalette(topic){
    closePalette();
    goToSection(topic.section);

    // expand card
    requestAnimationFrame(() => {
      const card = document.querySelector(`[data-topic="${topic.id}"]`);
      if (card){
        const exp = card.querySelector(".expand");
        if (exp) exp.click();
      }
    });
  }

  paletteInput.addEventListener("input", () => renderPaletteResults(paletteInput.value));
  paletteInput.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { e.preventDefault(); closePalette(); return; }
    if (e.key === "ArrowDown") { e.preventDefault(); setPaletteActive(paletteActiveIndex + 1); return; }
    if (e.key === "ArrowUp") { e.preventDefault(); setPaletteActive(paletteActiveIndex - 1); return; }
    if (e.key === "Enter") {
      e.preventDefault();
      const item = paletteList[paletteActiveIndex];
      if (item) openTopicFromPalette(item.t);
    }
  });

  window.addEventListener("keydown", (e) => {
    const isMac = navigator.platform.toUpperCase().includes("MAC");
    const mod = isMac ? e.metaKey : e.ctrlKey;
    if (mod && e.key.toLowerCase() === "k") {
      e.preventDefault();
      if (palette.classList.contains("open")) closePalette();
      else openPalette();
    }
    if (e.key === "Escape") {
      if (side.classList.contains("open")) closeSideFn();
      if (sheet.classList.contains("open")) closeSheet();
    }
  });

  // ---------- Bug-proof helpers ----------
  function escapeHTML(s){
    return String(s).replace(/[&<>"']/g, (c) => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
  }

  // ---------- Init ----------
  function init(){
    // default settings
    if (localStorage.getItem(K.tz) === null) localStorage.setItem(K.tz, "America/Chicago");
    if (localStorage.getItem(K.beginner) === null) localStorage.setItem(K.beginner, "0");
    if (localStorage.getItem(K.noAnim) === null) localStorage.setItem(K.noAnim, "0");
    if (localStorage.getItem(K.compact) === null) localStorage.setItem(K.compact, "0");
    if (localStorage.getItem(K.light) === null) localStorage.setItem(K.light, "0");

    applyModes();
    bindSettings();
    renderNav();
    updateSavedUI();
    updateWipeUI();

    const sectionId = getCurrentSectionId();
    setNavActive(sectionId);
    renderSection(sectionId);
  }

  init();
})();
