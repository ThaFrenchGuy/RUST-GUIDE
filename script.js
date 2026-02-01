(() => {
  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));

  // --------- Toast ----------
  const toast = $("#toast");
  let toastTimer;
  const showToast = (msg) => {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 1400);
  };

  // --------- Safe scroll lock (iOS friendly) ----------
  let scrollY = 0;
  const lockScroll = () => {
    scrollY = window.scrollY || 0;
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.width = "100%";
  };
  const unlockScroll = () => {
    const y = -parseInt(document.body.style.top || "0", 10) || scrollY;
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.left = "";
    document.body.style.right = "";
    document.body.style.width = "";
    window.scrollTo(0, y);
  };

  // --------- Tabs ----------
  const tabs = $$(".tab");
  const panels = {
    countdown: $("#panel-countdown"),
    guide: $("#panel-guide"),
    server: $("#panel-server"),
    rules: $("#panel-rules"),
    links: $("#panel-links"),
    settings: $("#panel-settings"),
  };
  let currentTab = "countdown";

  function setTab(name, opts={pushHash:true}) {
    if (!panels[name] || name === currentTab) return;
    Object.values(panels).forEach(p => p?.classList.remove("active"));
    panels[name].classList.add("active");
    tabs.forEach(t => t.setAttribute("aria-selected", t.dataset.tab === name ? "true" : "false"));
    currentTab = name;
    localStorage.setItem("fz_lastTab", name);
    if (opts.pushHash) location.hash = name;
    // Jump to top for clean transitions
    if (!document.body.classList.contains("noAnim")) window.scrollTo({ top: 0, behavior: "smooth" });
    else window.scrollTo(0,0);
  }

  tabs.forEach(t => t.addEventListener("click", () => setTab(t.dataset.tab)));

  // Init from hash or storage
  const initialTab = (() => {
    const h = (location.hash || "").replace("#", "").trim();
    if (h && panels[h]) return h;
    const saved = localStorage.getItem("fz_lastTab");
    if (saved && panels[saved]) return saved;
    return "countdown";
  })();
  setTab(initialTab, {pushHash:false});

  // --------- Sheet (menu) ----------
  const sheet = $("#sheet");
  const openSheet = () => {
    if (!sheet) return;
    sheet.classList.add("open");
    sheet.setAttribute("aria-hidden","false");
    lockScroll();
  };
  const closeSheet = () => {
    if (!sheet) return;
    sheet.classList.remove("open");
    sheet.setAttribute("aria-hidden","true");
    unlockScroll();
  };
  $("#menuBtn")?.addEventListener("click", openSheet);
  sheet?.addEventListener("click", (e) => {
    const t = e.target;
    if (!(t instanceof HTMLElement)) return;
    if (t.dataset.close === "sheet") closeSheet();
    if (t.dataset.goto) { setTab(t.dataset.goto); closeSheet(); }
  });

  // --------- Settings toggles ----------
  const tNoAnim = $("#tNoAnim");
  const tCompact = $("#tCompact");
  const tForceEN = $("#tForceEN");

  const applyPrefs = () => {
    const noAnim = localStorage.getItem("fz_noAnim") === "1";
    const compact = localStorage.getItem("fz_compact") === "1";
    const forceEN = localStorage.getItem("fz_forceEN") !== "0"; // default true

    document.body.classList.toggle("noAnim", noAnim);
    document.body.classList.toggle("compact", compact);
    if (tNoAnim) tNoAnim.checked = noAnim;
    if (tCompact) tCompact.checked = compact;
    if (tForceEN) tForceEN.checked = forceEN;
  };

  tNoAnim?.addEventListener("change", () => { localStorage.setItem("fz_noAnim", tNoAnim.checked ? "1" : "0"); applyPrefs(); });
  tCompact?.addEventListener("change", () => { localStorage.setItem("fz_compact", tCompact.checked ? "1" : "0"); applyPrefs(); });
  tForceEN?.addEventListener("change", () => { localStorage.setItem("fz_forceEN", tForceEN.checked ? "1" : "0"); applyPrefs(); updateWipeUI(true); });

  applyPrefs();

  // --------- Wipe timezone + countdown ----------
  const TZ_SELECT = $("#wipeTZ");
  const wipeHint = $("#wipeHint");
  const wipeTarget = $("#wipeTarget");
  const wipeLocal = $("#wipeLocal");

  const pad2 = (n) => String(n).padStart(2,"0");

  function getTZ(){
    return localStorage.getItem("fz_tz") || "America/Chicago";
  }
  function setTZ(tz){
    localStorage.setItem("fz_tz", tz);
  }
  if (TZ_SELECT){
    TZ_SELECT.value = getTZ();
    TZ_SELECT.addEventListener("change", () => {
      setTZ(TZ_SELECT.value);
      updateWipeUI(true);
      showToast("Timezone updated");
    });
  }
  $("#recalcWipe")?.addEventListener("click", () => updateWipeUI(true));

  function lastFridayOfMonth(year, monthIndex){
    // monthIndex: 0-11
    // Start from last day of month in UTC, then step back to Friday in target TZ (we calculate date components in TZ below)
    const d = new Date(Date.UTC(year, monthIndex + 1, 0)); // last day
    // find day-of-week in target TZ by formatting parts
    for (let i=0;i<7;i++){
      const probe = new Date(d.getTime() - i*86400000);
      const wd = new Intl.DateTimeFormat("en-US", { timeZone: getTZ(), weekday:"short" }).format(probe);
      if (wd.toLowerCase().startsWith("fri")) return probe;
    }
    return d;
  }

  function tzParts(date, tz){
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      year:"numeric", month:"2-digit", day:"2-digit",
      hour:"2-digit", minute:"2-digit", second:"2-digit", hour12:false
    }).formatToParts(date);
    const get = (t) => parts.find(p=>p.type===t)?.value;
    return {
      y: Number(get("year")),
      m: Number(get("month")) - 1,
      d: Number(get("day")),
      hh: Number(get("hour")),
      mm: Number(get("minute")),
      ss: Number(get("second"))
    };
  }

  function tzToUTCDate(y,m,d,hh,mm,tz){
    // Build a UTC date that corresponds to the given wall-clock time in tz.
    // We do a small adjustment loop because of DST offsets.
    // 1) Start with an approximate UTC time.
    let guess = new Date(Date.UTC(y,m,d,hh,mm,0));
    // 2) Compute what wall time that UTC would be in tz; adjust until match (max 5 iterations).
    for (let i=0;i<5;i++){
      const p = tzParts(guess, tz);
      const deltaMinutes = (p.hh - hh) * 60 + (p.mm - mm);
      const deltaDays = (p.y - y) * 365 + (p.m - m) * 31 + (p.d - d); // rough, ok for small diffs
      const delta = deltaMinutes + deltaDays*24*60;
      if (delta === 0) break;
      guess = new Date(guess.getTime() - delta * 60000);
    }
    return guess;
  }

  function nextWipeFrom(now = new Date()){
    const tz = getTZ();
    const nowParts = new Intl.DateTimeFormat("en-US", { timeZone: tz, year:"numeric", month:"2-digit" }).formatToParts(now);
    const y = Number(nowParts.find(x=>x.type==="year").value);
    const m = Number(nowParts.find(x=>x.type==="month").value) - 1;

    const lfThis = lastFridayOfMonth(y, m);
    const dThis = tzParts(lfThis, tz);
    const wipeThis = tzToUTCDate(dThis.y, dThis.m, dThis.d, 17, 0, tz); // 5:00 PM

    if (now.getTime() < wipeThis.getTime()) return wipeThis;

    const nextMonthProbe = new Date(Date.UTC(y, m+1, 1));
    const np = new Intl.DateTimeFormat("en-US", { timeZone: tz, year:"numeric", month:"2-digit" }).formatToParts(nextMonthProbe);
    const ny = Number(np.find(x=>x.type==="year").value);
    const nm = Number(np.find(x=>x.type==="month").value) - 1;

    const lfNext = lastFridayOfMonth(ny, nm);
    const dNext = tzParts(lfNext, tz);
    return tzToUTCDate(dNext.y, dNext.m, dNext.d, 17, 0, tz);
  }

  function fmt(date, tz=null){
    const forceEN = localStorage.getItem("fz_forceEN") !== "0";
    const locale = forceEN ? "en-US" : undefined;
    return date.toLocaleString(locale, {
      timeZone: tz || undefined,
      weekday:"short",
      year:"numeric", month:"short", day:"2-digit",
      hour:"numeric", minute:"2-digit",
      hour12:true
    });
  }

  let wipeAt = nextWipeFrom(new Date());

  function updateWipeUI(recalc=false){
    if (recalc) wipeAt = nextWipeFrom(new Date());
    const tz = getTZ();
    if (wipeTarget) wipeTarget.textContent = `Target: ${fmt(wipeAt, tz)} (${tz.replace("America/","US ")})`;
    if (wipeLocal) wipeLocal.textContent = `Your time: ${fmt(wipeAt, null)}`;
    if (wipeHint) wipeHint.textContent = `Next wipe: ${fmt(wipeAt, tz)} • Your time: ${fmt(wipeAt, null)}`;
  }
  updateWipeUI(true);

  function tick(){
    const ms = wipeAt.getTime() - Date.now();
    const dEl=$("#d"), hEl=$("#h"), mEl=$("#m"), sEl=$("#s");
    if (!dEl || !hEl || !mEl || !sEl) return;
    if (ms <= 0){
      dEl.textContent = "0"; hEl.textContent = "0"; mEl.textContent = "0"; sEl.textContent = "0";
      return;
    }
    const total = Math.floor(ms/1000);
    const d = Math.floor(total/86400);
    const h = Math.floor((total%86400)/3600);
    const m = Math.floor((total%3600)/60);
    const s = total%60;
    dEl.textContent = String(d);
    hEl.textContent = pad2(h);
    mEl.textContent = pad2(m);
    sEl.textContent = pad2(s);
  }
  tick();
  setInterval(tick, 250);

  $("#copyWipe")?.addEventListener("click", async () => {
    const tz = getTZ();
    const msg = `WIPE: Last Friday of the month @ 5:00 PM (${tz}).\nTarget: ${fmt(wipeAt, tz)}\nYour time: ${fmt(wipeAt)}\nDiscord: https://discord.gg/aUVKDV8nPk`;
    try { await navigator.clipboard.writeText(msg); showToast("Copied wipe info"); }
    catch {
      // fallback
      const ta = document.createElement("textarea");
      ta.value = msg;
      ta.style.position = "fixed"; ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
      showToast("Copied wipe info");
    }
  });

  // --------- Guide content (data-driven) ----------
  const GUIDE = {
    bases: [
      {
        title: "Starter base priorities (solo/duo)",
        tags: ["starter","2x1","airlock","early wipe"],
        bullets: [
          "Airlock first. Always.",
          "TC should not be visible from the front door line.",
          "More doors > bigger base (early).",
          "Roof access = mobility + defense."
        ],
        details: [
          { sum: "Fast upgrade order", body: [
            "Metal doors everywhere",
            "Honeycomb key side",
            "Roof control / peaks",
            "External TCs when you can afford them"
          ] }
        ]
      },
      {
        title: "Bunker basics (when it’s worth it)",
        tags: ["bunker","stability","raid cost"],
        bullets: [
          "Bunkers increase raid cost only if the rest of the base is already solid.",
          "If you skip doors/honeycomb to build a bunker, you made the base weaker."
        ],
        details: [
          { sum: "Rule", body: ["Bunker after you’re stable, not as your first build."] }
        ]
      },
      {
        title: "Solo vs Duo vs Clan layout (simple truth)",
        tags: ["solo","duo","clan","layout"],
        bullets: [
          "Solo: compact, hidden, fast upgrades, avoid roadside.",
          "Duo: split loot rooms; add peaks; secure roof.",
          "Clan: externals + compound planning or you get griefed."
        ]
      }
    ],
    building: [
      {
        title: "Building fundamentals that actually matter",
        tags: ["honeycomb","airlock","loot split","roof"],
        bullets: [
          "Honeycomb the TC + loot side first.",
          "Split value: don’t build a jackpot room.",
          "Roof access early is a defense multiplier.",
          "Avoid obvious front doors facing roads/monuments."
        ]
      },
      {
        title: "Common mistakes (free raids)",
        tags: ["mistakes","raid","doors"],
        bullets: [
          "No airlock",
          "Single door path to everything",
          "Loot all in one room",
          "TC right behind the front door",
          "Building too visible (roads/rivers/monument line)"
        ]
      }
    ],
    electricity: [
      {
        title: "Starter turret circuit (works everywhere)",
        tags: ["solar","battery","turret","basic"],
        code: "SOLAR → CHARGE CONTROLLER → SMALL BATTERY\nBATTERY OUT → (OPTIONAL SWITCH) → AUTO TURRET",
        bullets: [
          "Start with 1 turret before you build a whole power room.",
          "Hide components behind doors; raiders love free loot."
        ]
      },
      {
        title: "Electric item encyclopedia (quick meanings)",
        tags: ["branch","splitter","combiner","blocker","timer","hbhf","memory cell"],
        details: [
          { sum: "Branch", body: ["Takes a set amount of power off the main line; the rest passes through. Use it to feed fixed-load devices."] },
          { sum: "Splitter", body: ["Splits one input into 3 equal outputs (minus efficiency). Use for simple distribution."] },
          { sum: "Root combiner", body: ["Combines multiple power sources into one line. Essential for scaling solar/wind."] },
          { sum: "Blocker", body: ["Lets one power source take priority; blocks the other when active. Great for solar+wind setups."] },
          { sum: "Timer / Counter", body: ["Timer = output for a duration; Counter = output after X triggers. Good for traps/alarms."] },
          { sum: "HBHF sensor", body: ["Detects nearby players/animals. Use for smart lights, door traps, turret wake-up signals."] },
          { sum: "Memory cell", body: ["Stores on/off state based on inputs. Use for latch circuits and smart base logic."] },
          { sum: "Smart switch", body: ["Remote control via app (if enabled) or wired toggles. Useful but don’t rely on it for security."] }
        ]
      },
      {
        title: "System: turret + lights + alarm",
        tags: ["system","turret","lights","alarm"],
        bullets: [
          "Battery → branch: one branch to turret, pass-through to lights.",
          "HBHF triggers a siren/igniter for alarm (optional).",
          "Keep a manual kill-switch for maintenance."
        ]
      }
    ],
    industrial: [
      {
        title: "Starter auto-sort (fast & clean)",
        tags: ["industrial","conveyor","sorting","depot"],
        bullets: [
          "1 input dump box",
          "3–6 output boxes (comps/ore/guns/farm/deployables/trash)",
          "One conveyor input → outputs using include filters",
          "One 'return' box for leftovers"
        ]
      },
      {
        title: "Auto-smelt loop (basic)",
        tags: ["furnace","industrial","smelt"],
        bullets: [
          "Input box → furnace(s) → output box.",
          "Route wood/charcoal if your server needs it.",
          "Keep it behind doors (raiders target industrial rooms)."
        ]
      }
    ],
    farming: [
      {
        title: "Hemp first (cloth = power)",
        tags: ["hemp","cloth","meds","bags"],
        bullets: [
          "Cloth gives meds, bags, armor — it stabilizes wipe.",
          "Hide farms. Farms attract raids."
        ]
      },
      {
        title: "Teas that matter",
        tags: ["ore tea","wood tea","scrap tea"],
        bullets: [
          "Ore tea: faster node farming (snowball).",
          "Wood tea: faster base expansion.",
          "Scrap tea: better monument runs."
        ]
      },
      {
        title: "Genetics: the simple way",
        tags: ["genetics","cloning","berries"],
        bullets: [
          "Clone good plants. Don’t restart from seeds every time.",
          "Stabilize a 'good enough' line first, then improve."
        ]
      }
    ],
    monuments: [
      {
        title: "Monument rules that keep you alive",
        tags: ["recycler","route","risk"],
        bullets: [
          "Enter with a plan (value target + exit).",
          "Recycle in bursts and bank between runs.",
          "Assume counter after any loud action.",
          "Take value and leave—don’t hang around."
        ]
      },
      {
        title: "Dome (fast scrap)",
        tags: ["dome","route","jump"],
        bullets: [
          "Scout first, climb fast, leave fast.",
          "Don’t loot in the open; expect counters."
        ]
      },
      {
        title: "Train Yard / Water Treatment / Launch",
        tags: ["puzzle","cards","route"],
        bullets: [
          "Treat puzzles as routes, not hangouts.",
          "Learn entrances/exits and where you can get trapped.",
          "Bring only what you need; bank after."
        ]
      },
      {
        title: "Oil Rig (Small/Large) reality check",
        tags: ["oil rig","scientists","counter"],
        bullets: [
          "High reward, high counter rate.",
          "Go off-peak for safer runs.",
          "Control exits (boat/mini) or you get stuck."
        ]
      }
    ],
    pvp: [
      {
        title: "10 PvP rules",
        tags: ["pvp","positioning","cover"],
        bullets: [
          "Cover first. Shooting second.",
          "Never loot in the open.",
          "Always have an exit route.",
          "Third-party > fair fights.",
          "Reposition after damage.",
          "Don’t chase into unknown terrain.",
          "Heal behind cover only.",
          "Don’t roam stacked when rich.",
          "Sound is info. Use it.",
          "Leave when objective is done."
        ]
      }
    ],
    raiding: [
      {
        title: "Raid cost mindset",
        tags: ["raid","doors","walls","path"],
        bullets: [
          "Raiders pick the cheapest path. Don’t show it.",
          "Door paths are cheap defense early.",
          "Spread loot; avoid jackpot rooms."
        ]
      },
      {
        title: "Defense that works",
        tags: ["traps","turrets","externals"],
        bullets: [
          "Traps first, turrets later unless you’re rich.",
          "Turrets slow pushes; they don’t win alone.",
          "Externals raise cost and prevent griefing."
        ]
      }
    ]
  };

  // Render guide cards
  const savedKey = "fz_savedTopics";
  const getSaved = () => new Set(JSON.parse(localStorage.getItem(savedKey) || "[]"));
  const setSaved = (set) => localStorage.setItem(savedKey, JSON.stringify(Array.from(set)));

  function slug(s){
    return (s || "").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"").slice(0,64);
  }

  function cardHTML(topic, section){
    const id = `${section}-${slug(topic.title)}`;
    const tags = (topic.tags || []).join(" ");
    const bullets = (topic.bullets || []).map(x => `<li>${escapeHTML(x)}</li>`).join("");
    const code = topic.code ? `<pre class="code">${escapeHTML(topic.code)}</pre>` : "";
    const details = (topic.details || []).map(d => {
      const body = Array.isArray(d.body)
        ? `<ul class="ul">${d.body.map(x=>`<li>${escapeHTML(x)}</li>`).join("")}</ul>`
        : `<div>${escapeHTML(d.body || "")}</div>`;
      return `<details class="details"><summary>${escapeHTML(d.sum)}</summary><div class="body">${body}</div></details>`;
    }).join("");
    return `
      <article class="card topic" data-id="${id}" data-section="${section}" data-tags="${escapeHTML(tags)}">
        <div class="topicTop">
          <h2>${escapeHTML(topic.title)}</h2>
          <button class="star" data-star="${id}" aria-label="Save topic">★</button>
        </div>
        ${code}
        ${bullets ? `<ul class="ul">${bullets}</ul>` : ""}
        ${details}
      </article>
    `;
  }

  function escapeHTML(s){
    return String(s).replace(/[&<>"']/g, (c) => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
  }

  const sectionOrder = ["bases","building","electricity","industrial","farming","monuments","pvp","raiding"];
  sectionOrder.forEach(sec => {
    const mount = $(`#cards-${sec}`);
    if (!mount) return;
    mount.innerHTML = (GUIDE[sec] || []).map(t => cardHTML(t, sec)).join("");
  });

  // Saved UI
  const savedCount = $("#savedCount");
  const savedDrawer = $("#savedDrawer");
  const savedList = $("#savedList");
  const toggleSavedBtn = $("#toggleSaved");
  const closeSavedBtn = $("#closeSaved");

  function refreshSavedUI(){
    const saved = getSaved();
    if (savedCount) savedCount.textContent = String(saved.size);

    // Update star buttons
    $$("[data-star]").forEach(btn => {
      const id = btn.getAttribute("data-star") || "";
      btn.classList.toggle("saved", saved.has(id));
      btn.setAttribute("aria-label", saved.has(id) ? "Unsave topic" : "Save topic");
    });

    if (savedList){
      if (saved.size === 0){
        savedList.innerHTML = `<div class="muted" style="padding:8px 2px;">No saved topics yet. Tap ★ on any guide card.</div>`;
      } else {
        const items = [];
        saved.forEach(id => {
          const el = document.querySelector(`[data-id="${CSS.escape(id)}"]`);
          const title = el?.querySelector("h2")?.textContent?.trim() || id;
          const sec = el?.getAttribute("data-section") || "guide";
          items.push({id, title, sec});
        });
        // Keep stable order
        savedList.innerHTML = items.map(x => `
          <div class="savedItem" data-open="${escapeHTML(x.id)}">
            <div class="t">${escapeHTML(x.title)}</div>
            <div class="m">${escapeHTML(x.sec.toUpperCase())}</div>
          </div>
        `).join("");
      }
    }
  }

  document.addEventListener("click", (e) => {
    const t = e.target;
    if (!(t instanceof HTMLElement)) return;

    const starId = t.getAttribute("data-star");
    if (starId){
      const saved = getSaved();
      if (saved.has(starId)) { saved.delete(starId); showToast("Removed"); }
      else { saved.add(starId); showToast("Saved"); }
      setSaved(saved);
      refreshSavedUI();
      return;
    }

    const openId = t.closest(".savedItem")?.getAttribute("data-open");
    if (openId){
      openGuideTopic(openId);
      closeSaved();
      return;
    }
  });

  const openSaved = () => {
    if (!savedDrawer) return;
    savedDrawer.classList.add("open");
    savedDrawer.setAttribute("aria-hidden","false");
  };
  const closeSaved = () => {
    if (!savedDrawer) return;
    savedDrawer.classList.remove("open");
    savedDrawer.setAttribute("aria-hidden","true");
  };
  toggleSavedBtn?.addEventListener("click", () => {
    if (!savedDrawer) return;
    if (savedDrawer.classList.contains("open")) closeSaved();
    else { refreshSavedUI(); openSaved(); }
  });
  closeSavedBtn?.addEventListener("click", closeSaved);

  refreshSavedUI();

  // --------- Guide category chips ----------
  const chips = $$(".chip");
  const gpanels = {
    bases: $("#g-bases"),
    building: $("#g-building"),
    electricity: $("#g-electricity"),
    industrial: $("#g-industrial"),
    farming: $("#g-farming"),
    monuments: $("#g-monuments"),
    pvp: $("#g-pvp"),
    raiding: $("#g-raiding")
  };
  let currentG = "bases";

  function setG(name){
    if (!gpanels[name] || name === currentG) return;
    Object.values(gpanels).forEach(p => p?.classList.remove("active"));
    gpanels[name].classList.add("active");
    chips.forEach(c => c.setAttribute("aria-selected", c.dataset.gtab === name ? "true" : "false"));
    currentG = name;
    localStorage.setItem("fz_lastGuideTab", name);
    // Update hash for share: #guide/bases
    if (currentTab === "guide") location.hash = `guide/${name}`;
  }
  chips.forEach(c => c.addEventListener("click", () => setG(c.dataset.gtab)));

  const initG = (() => {
    const saved = localStorage.getItem("fz_lastGuideTab");
    if (saved && gpanels[saved]) return saved;
    return "bases";
  })();
  setG(initG);

  // --------- Guide search (filters visible cards) ----------
  const guideSearch = $("#guideSearch");
  function applyGuideSearch(q){
    q = (q || "").toLowerCase().trim();
    const cards = $$(`#g-${currentG} .topic`);
    if (!q){
      cards.forEach(c => c.style.opacity = "");
      return;
    }
    const terms = q.split(/\s+/).filter(Boolean);
    cards.forEach(c => {
      const hay = ((c.getAttribute("data-tags")||"") + " " + (c.textContent||"")).toLowerCase();
      const ok = terms.every(t => hay.includes(t));
      c.style.opacity = ok ? "1" : ".22";
    });
  }
  guideSearch?.addEventListener("input", () => applyGuideSearch(guideSearch.value));
  guideSearch?.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { guideSearch.value=""; applyGuideSearch(""); guideSearch.blur(); }
  });

  // --------- Quick Search (palette across ALL guide topics) ----------
  const palette = $("#palette");
  const paletteInput = $("#paletteInput");
  const paletteResults = $("#paletteResults");

  const openPalette = () => {
    if (!palette) return;
    palette.classList.add("open");
    palette.setAttribute("aria-hidden","false");
    lockScroll();
    setTimeout(() => paletteInput?.focus(), 0);
    renderPalette("");
  };
  const closePalette = () => {
    if (!palette) return;
    palette.classList.remove("open");
    palette.setAttribute("aria-hidden","true");
    unlockScroll();
  };

  $("#openPalette")?.addEventListener("click", () => { closeSheet(); openPalette(); });
  $("#guideOpenPalette")?.addEventListener("click", openPalette);
  document.addEventListener("keydown", (e) => {
    const isMac = navigator.platform.toUpperCase().includes("MAC");
    const cmdk = (isMac ? e.metaKey : e.ctrlKey) && e.key.toLowerCase() === "k";
    if (cmdk){
      e.preventDefault();
      if (palette?.classList.contains("open")) closePalette();
      else openPalette();
    }
    if (e.key === "Escape"){
      if (palette?.classList.contains("open")) closePalette();
      if (sheet?.classList.contains("open")) closeSheet();
      if (savedDrawer?.classList.contains("open")) closeSaved();
    }
  });

  palette?.addEventListener("click", (e) => {
    const t = e.target;
    if (!(t instanceof HTMLElement)) return;
    if (t.dataset.close === "palette") closePalette();
    const item = t.closest(".pItem");
    if (item){
      const id = item.getAttribute("data-id");
      if (id) openGuideTopic(id);
      closePalette();
    }
  });

  let paletteActive = 0;
  function guideIndex(){
    return $$(".topic").map(el => {
      const id = el.getAttribute("data-id") || "";
      const sec = el.getAttribute("data-section") || "";
      const title = el.querySelector("h2")?.textContent?.trim() || id;
      const text = (el.textContent || "").toLowerCase();
      return {id, sec, title, text};
    });
  }
  const INDEX = guideIndex();

  function scoreMatch(q, item){
    if (!q) return 0;
    const t = item.title.toLowerCase();
    if (t === q) return 100;
    if (t.startsWith(q)) return 80;
    if (t.includes(q)) return 60;
    if (item.text.includes(q)) return 40;
    return 0;
  }

  function renderPalette(q){
    q = (q || "").toLowerCase().trim();
    const terms = q.split(/\s+/).filter(Boolean);
    let items = INDEX.slice();

    if (terms.length){
      items = items
        .map(it => {
          const s = terms.reduce((acc, term) => acc + scoreMatch(term, it), 0);
          return { ...it, s };
        })
        .filter(it => it.s > 0)
        .sort((a,b) => b.s - a.s)
        .slice(0, 18);
    } else {
      items = items.slice(0, 18);
    }

    if (!paletteResults) return;
    paletteActive = 0;
    paletteResults.innerHTML = items.map((it, idx) => `
      <div class="pItem ${idx===0?"active":""}" role="option" aria-selected="${idx===0?"true":"false"}" data-id="${escapeHTML(it.id)}">
        <div class="pTitle">${escapeHTML(it.title)}</div>
        <div class="pMeta">${escapeHTML(it.sec.toUpperCase())}</div>
      </div>
    `).join("") || `<div class="muted" style="padding:8px 2px;">No results.</div>`;
  }

  function movePalette(dir){
    const items = $$(".pItem", paletteResults || document);
    if (!items.length) return;
    paletteActive = Math.max(0, Math.min(items.length-1, paletteActive + dir));
    items.forEach((el, idx) => {
      el.classList.toggle("active", idx===paletteActive);
      el.setAttribute("aria-selected", idx===paletteActive ? "true" : "false");
    });
    items[paletteActive].scrollIntoView({block:"nearest"});
  }

  paletteInput?.addEventListener("input", () => renderPalette(paletteInput.value));
  paletteInput?.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); movePalette(1); }
    if (e.key === "ArrowUp") { e.preventDefault(); movePalette(-1); }
    if (e.key === "Enter") {
      const items = $$(".pItem", paletteResults || document);
      const id = items[paletteActive]?.getAttribute("data-id");
      if (id) { openGuideTopic(id); closePalette(); }
    }
  });

  function openGuideTopic(id){
    // Ensure we are on Guide tab
    if (currentTab !== "guide") setTab("guide");
    // Switch guide subtab
    const el = document.querySelector(`[data-id="${CSS.escape(id)}"]`);
    const sec = el?.getAttribute("data-section");
    if (sec) setG(sec);
    // Scroll into view and flash
    setTimeout(() => {
      const target = document.querySelector(`[data-id="${CSS.escape(id)}"]`);
      if (!target) return;
      target.scrollIntoView({ behavior: document.body.classList.contains("noAnim") ? "auto" : "smooth", block: "start" });
      target.animate?.([{filter:"brightness(1.4)"},{filter:"brightness(1)"}], {duration: 650, easing:"ease-out"});
    }, 0);
  }

  // --------- Hash routing (supports #guide/bases and #settings, etc.) ----------
  function applyHash(){
    const raw = (location.hash || "").replace("#","").trim();
    if (!raw) return;
    const parts = raw.split("/");
    const tab = parts[0];
    if (panels[tab]) setTab(tab, {pushHash:false});
    if (tab === "guide" && parts[1] && gpanels[parts[1]]) setG(parts[1]);
  }
  window.addEventListener("hashchange", applyHash);
  applyHash();

})();
