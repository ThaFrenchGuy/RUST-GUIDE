(() => {
  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));

  const toast = $("#toast");
  let toastTimer;
  const showToast = (msg) => {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 1200);
  };

  // ---------------- Tabs (animated) ----------------
  const tabs = $$(".tab");
  const panels = {
    home: $("#panel-home"),
    wipe: $("#panel-wipe"),
    bases: $("#panel-bases"),
    electric: $("#panel-electric"),
    farming: $("#panel-farming"),
    pvp: $("#panel-pvp"),
    raid: $("#panel-raid"),
    links: $("#panel-links"),
    settings: $("#panel-settings"),
  };

  let current = "home";
  let switching = false;

  function ripple(el, e){
    if (document.body.classList.contains("no-anim") || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const r = document.createElement("span");
    r.className = "ripple";
    const rect = el.getBoundingClientRect();
    r.style.left = `${e.clientX - rect.left}px`;
    r.style.top = `${e.clientY - rect.top}px`;
    el.appendChild(r);
    r.addEventListener("animationend", () => r.remove(), { once:true });
  }

  function selectTab(name){
    tabs.forEach(t => t.setAttribute("aria-selected", t.dataset.tab === name ? "true" : "false"));
  }

  function showPanel(name){
    if (!panels[name] || name === current || switching) return;
    switching = true;

    const from = panels[current];
    const to = panels[name];

    selectTab(name);
    localStorage.setItem("rg_lastTab", name);

    from.classList.remove("active", "is-entering");
    from.classList.add("is-leaving");

    const finishOut = () => {
      from.classList.remove("is-leaving");
      from.style.display = "none";

      to.style.display = "block";
      to.classList.add("active", "is-entering");

      const finishIn = () => {
        to.classList.remove("is-entering");
        current = name;
        switching = false;
      };

      if (document.body.classList.contains("no-anim") || matchMedia("(prefers-reduced-motion: reduce)").matches) {
        to.classList.remove("is-entering");
        current = name;
        switching = false;
      } else {
        to.addEventListener("animationend", finishIn, { once:true });
      }
    };

    if (document.body.classList.contains("no-anim") || matchMedia("(prefers-reduced-motion: reduce)").matches) {
      from.classList.remove("is-leaving");
      from.style.display = "none";
      to.style.display = "block";
      to.classList.add("active");
      current = name;
      switching = false;
    } else {
      from.addEventListener("animationend", finishOut, { once:true });
    }
  }

  tabs.forEach(t => t.addEventListener("click", (e) => { ripple(t, e); showPanel(t.dataset.tab); }));

  // Init panel state
  Object.values(panels).forEach(p => { if (p && !p.classList.contains("active")) p.style.display = "none"; });
  const last = localStorage.getItem("rg_lastTab");
  if (last && panels[last]) {
    $("#panel-home").classList.remove("active");
    $("#panel-home").style.display = "none";
    panels[last].classList.add("active");
    panels[last].style.display = "block";
    current = last;
    selectTab(last);
  }

  // ---------------- Copy helpers ----------------
  $$("[data-copy]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const sel = btn.getAttribute("data-copy");
      const el = sel ? $(sel) : null;
      const text = el ? el.textContent.trim() : "";
      if (!text) return showToast("Nothing to copy");
      try {
        await navigator.clipboard.writeText(text);
        showToast("Copied");
      } catch {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        ta.remove();
        showToast("Copied");
      }
    });
  });

  $("#copyWipe")?.addEventListener("click", async () => {
    const msg = $("#wipeMsg")?.textContent?.trim() || "WIPE: Last Friday @ 5PM US Central (Chicago)";
    try { await navigator.clipboard.writeText(msg); showToast("Wipe message copied"); }
    catch { showToast("Copy failed"); }
  });

  // ---------------- Search (dims non-matching cards) ----------------
  const search = $("#search");
  const clear = $("#clear");
  const items = $$(".card, details.acc");

  function applySearch(q){
    q = (q || "").toLowerCase().trim();
    if (!q){ items.forEach(i => i.classList.remove("dim","match")); return; }
    const terms = q.split(/\s+/).filter(Boolean);
    items.forEach(i => {
      const hay = ((i.getAttribute("data-search") || "") + " " + (i.textContent || "")).toLowerCase();
      const ok = terms.every(t => hay.includes(t));
      i.classList.toggle("dim", !ok);
      i.classList.toggle("match", ok);
    });
  }

  const extraStyle = document.createElement("style");
  extraStyle.textContent = `.dim{opacity:.22; filter:saturate(.6)} .match{outline:1px solid rgba(111,255,214,.22); outline-offset:2px}`;
  document.head.appendChild(extraStyle);

  search?.addEventListener("input", () => applySearch(search.value));
  search?.addEventListener("keydown", (e) => { if (e.key === "Escape") { search.value=""; applySearch(""); search.blur(); } });
  clear?.addEventListener("click", () => { if (!search) return; search.value=""; applySearch(""); search.focus(); });

  // ---------------- Scroll reveal ----------------
  function initReveal(){
    const reveal = $$(".reveal");
    if (!reveal.length) return;

    if (document.body.classList.contains("no-anim") || matchMedia("(prefers-reduced-motion: reduce)").matches) {
      reveal.forEach(r => r.classList.add("in"));
      return;
    }

    const io = new IntersectionObserver((entries) => {
      for (const en of entries){
        if (en.isIntersecting){ en.target.classList.add("in"); io.unobserve(en.target); }
      }
    }, { rootMargin: "120px 0px" });

    reveal.forEach(r => io.observe(r));
  }

  // ---------------- Settings (persist) ----------------
  const set = (k,v) => localStorage.setItem(k, v ? "1" : "0");
  const get = (k) => localStorage.getItem(k) === "1";

  function applySettings(){
    document.body.classList.toggle("beginner", get("rg_beginner"));
    document.body.classList.toggle("no-anim", get("rg_noanim"));
    document.body.classList.toggle("high-contrast", get("rg_contrast"));
    document.body.classList.toggle("compact", get("rg_compact"));

    const b = $("#tBeginner");
    const a = $("#tNoAnim");
    const c = $("#tContrast");
    const m = $("#tCompact");
    if (b) b.checked = get("rg_beginner");
    if (a) a.checked = get("rg_noanim");
    if (c) c.checked = get("rg_contrast");
    if (m) m.checked = get("rg_compact");
  }

  $("#tBeginner")?.addEventListener("change", (e) => { set("rg_beginner", e.target.checked); applySettings(); });
  $("#tNoAnim")?.addEventListener("change", (e) => { set("rg_noanim", e.target.checked); applySettings(); });
  $("#tContrast")?.addEventListener("change", (e) => { set("rg_contrast", e.target.checked); applySettings(); });
  $("#tCompact")?.addEventListener("change", (e) => { set("rg_compact", e.target.checked); applySettings(); });

  applySettings();

  // ---------------- Wipe schedule: last Friday @ 5PM America/Chicago ----------------
  const TZ = "America/Chicago";

  function lastFriday(year, monthIndex){
    // monthIndex: 0-11
    const lastDayUTC = new Date(Date.UTC(year, monthIndex + 1, 0));
    const dow = lastDayUTC.getUTCDay(); // 0 Sun .. 5 Fri
    const diff = dow >= 5 ? (dow - 5) : (dow + 2);
    return new Date(Date.UTC(year, monthIndex + 1, 0 - diff));
  }

  function chicagoToUTC(y,m,d,h,mi){
    // Create a UTC guess, then correct using observed Chicago wall-clock.
    let guess = new Date(Date.UTC(y,m,d,h,mi,0));
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: TZ,
      year:"numeric", month:"2-digit", day:"2-digit",
      hour:"2-digit", minute:"2-digit", hour12:false
    }).formatToParts(guess);

    const p = (t) => parts.find(x => x.type === t)?.value;
    const oy = Number(p("year"));
    const om = Number(p("month")) - 1;
    const od = Number(p("day"));
    const oh = Number(p("hour"));
    const omin = Number(p("minute"));

    const intended = Date.UTC(y,m,d,h,mi,0);
    const observed = Date.UTC(oy,om,od,oh,omin,0);
    guess = new Date(guess.getTime() + (intended - observed));
    return guess;
  }

  function nextWipe(now = new Date()){
    // read Chicago year/month from now
    const parts = new Intl.DateTimeFormat("en-US", { timeZone: TZ, year:"numeric", month:"2-digit" }).formatToParts(now);
    const y = Number(parts.find(x=>x.type==="year").value);
    const m = Number(parts.find(x=>x.type==="month").value) - 1;

    function wipeFor(yy, mm){
      const lf = lastFriday(yy, mm);
      const dparts = new Intl.DateTimeFormat("en-US", { timeZone: TZ, year:"numeric", month:"2-digit", day:"2-digit" }).formatToParts(lf);
      const dy = Number(dparts.find(x=>x.type==="year").value);
      const dm = Number(dparts.find(x=>x.type==="month").value) - 1;
      const dd = Number(dparts.find(x=>x.type==="day").value);
      return chicagoToUTC(dy, dm, dd, 17, 0); // 5:00 PM
    }

    const thisMonth = wipeFor(y, m);
    if (now.getTime() < thisMonth.getTime()) return thisMonth;

    const nextMonth = new Date(Date.UTC(y, m + 1, 1));
    const np = new Intl.DateTimeFormat("en-US", { timeZone: TZ, year:"numeric", month:"2-digit" }).formatToParts(nextMonth);
    const ny = Number(np.find(x=>x.type==="year").value);
    const nm = Number(np.find(x=>x.type==="month").value) - 1;
    return wipeFor(ny, nm);
  }

  function fmtCentral(date){
    // Force English output even on French devices
    return date.toLocaleString("en-US", {
      timeZone: TZ,
      weekday:"long", year:"numeric", month:"short", day:"2-digit",
      hour:"numeric", minute:"2-digit", hour12:true
    });
  }

  function fmtLocal(date){
    return date.toLocaleString("en-US", {
      weekday:"long", year:"numeric", month:"short", day:"2-digit",
      hour:"numeric", minute:"2-digit", hour12:true
    });
  }

  const wipeCentral = $("#wipeCentral");
  const wipeLocal = $("#wipeLocal");
  const wipeCountdown = $("#wipeCountdown");

  const wipeAt = nextWipe(new Date());
  if (wipeCentral) wipeCentral.textContent = fmtCentral(wipeAt);
  if (wipeLocal) wipeLocal.textContent = fmtLocal(wipeAt);

  function tick(){
    if (!wipeCountdown) return;
    const ms = wipeAt.getTime() - Date.now();
    if (ms <= 0) { wipeCountdown.textContent = "WIPED."; return; }
    const s = Math.floor(ms/1000);
    const d = Math.floor(s/86400);
    const h = Math.floor((s%86400)/3600);
    const m = Math.floor((s%3600)/60);
    const sec = s%60;
    wipeCountdown.textContent = `${d}d ${h}h ${m}m ${sec}s`;
  }
  tick();
  setInterval(tick, 1000);

  initReveal();
})();
