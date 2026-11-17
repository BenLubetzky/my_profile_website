/* =========================================================
   Shared site behaviour: language switch, search palette,
   header, reveal-on-scroll, and small page interactions.
   Loaded before bg.js.
   ========================================================= */
(() => {
  document.documentElement.classList.add("js");
  const base = document.body.dataset.base || "";
  const EMAIL = "lubetzkyben@gmail.com";

  const PROJECTS = [
    { id: "bookmatch", name: "BookMatch", url: "work/bookmatch.html", cat: { en: "Full stack · Recommendations", pt: "Full stack · Recomendações" }, kw: "books swipe pgvector nextjs fastapi postgresql recommendations livros" },
    { id: "ledgerdrop", name: "LedgerDrop", url: "work/ledgerdrop.html", cat: { en: "Full stack · AI", pt: "Full stack · IA" }, kw: "invoices pdf extraction review openai docker render faturas" },
    { id: "support", name: "Customer Support Agent", namePt: "Agente de apoio ao cliente", url: "work/support-agent.html", cat: { en: "Backend · AI", pt: "Backend · IA" }, kw: "chat orders refunds rag chromadb tools agent apoio cliente" },
    { id: "paper", name: "Research Paper Assistant", namePt: "Assistente de artigos científicos", url: "work/paper-assistant.html", cat: { en: "RAG · Runs locally", pt: "RAG · Corre localmente" }, kw: "papers citations computer vision bm25 chromadb artigos" },
    { id: "spanish", name: "Spanish Learning Website", namePt: "Site para aprender espanhol", url: "work/spanish.html", cat: { en: "Frontend · Web app", pt: "Frontend · App web" }, kw: "flashcards vocabulary javascript speech espanhol" },
    { id: "arcface", name: "ArcFace Face Recognition", url: "https://github.com/BenLubetzky/face_recognition_arcface", cat: { en: "Machine learning", pt: "Machine learning" }, kw: "pytorch face recognition" },
    { id: "car", name: "Car Detection", url: "https://github.com/BenLubetzky/car_detection", cat: { en: "Machine learning", pt: "Machine learning" }, kw: "yolo object detection" },
    { id: "mri", name: "Brain MRI Tumor Detection", url: "https://github.com/BenLubetzky/brainMRI_tumor_detection", cat: { en: "Machine learning", pt: "Machine learning" }, kw: "cnn medical classification" },
  ];
  const abs = (u) => (/^(https?:|mailto:|tel:)/.test(u) ? u : base + u);
  window.SITE = { base, PROJECTS, EMAIL };

  // ---------- Language ----------
  const ATTRS = ["placeholder", "aria-label", "title", "content", "alt"];
  let lang = "en";
  let saved = null;
  try { saved = localStorage.getItem("lang"); } catch (e) {}
  if (saved === "en" || saved === "pt") lang = saved;
  else if ((navigator.language || "").toLowerCase().startsWith("pt")) lang = "pt";

  function applyLang(next) {
    lang = next;
    document.documentElement.lang = lang === "pt" ? "pt-PT" : "en";
    document.querySelectorAll("[data-pt]").forEach((el) => {
      if (!("en" in el.dataset)) el.dataset.en = el.innerHTML;
      el.innerHTML = lang === "pt" ? el.dataset.pt : el.dataset.en;
    });
    ATTRS.forEach((a) => {
      document.querySelectorAll(`[data-pt-${a}]`).forEach((el) => {
        const key = "en" + a.replace(/(^|-)(\w)/g, (_, __, c) => c.toUpperCase());
        if (!(key in el.dataset)) el.dataset[key] = el.getAttribute(a) || "";
        el.setAttribute(a, lang === "pt" ? el.getAttribute(`data-pt-${a}`) : el.dataset[key]);
      });
    });
    document.querySelectorAll(".lang button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === lang)));
    try { localStorage.setItem("lang", lang); } catch (e) {}
    document.dispatchEvent(new CustomEvent("langchange", { detail: lang }));
  }
  document.querySelectorAll(".lang button").forEach((b) => b.addEventListener("click", () => applyLang(b.dataset.lang)));
  const T = (en, pt) => (lang === "pt" ? pt : en);

  // ---------- Header ----------
  const header = document.querySelector(".site-header");
  const onScroll = () => header && header.classList.toggle("scrolled", scrollY > 12);
  onScroll();
  addEventListener("scroll", onScroll, { passive: true });

  const navLinks = [...document.querySelectorAll(".nav a[href*='#']")];
  const sections = navLinks.map((a) => document.getElementById(a.getAttribute("href").split("#")[1])).filter(Boolean);
  if (sections.length && "IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        navLinks.forEach((a) => a.classList.toggle("active", a.getAttribute("href").endsWith("#" + en.target.id)));
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach((s) => io.observe(s));
  }

  // Mobile drawer
  const drawer = document.querySelector(".drawer");
  const openDrawer = (open) => {
    if (!drawer) return;
    drawer.classList.toggle("open", open);
    document.querySelectorAll(".menu-btn").forEach((b) => b.setAttribute("aria-expanded", String(open)));
    document.body.style.overflow = open ? "hidden" : "";
  };
  document.querySelectorAll(".menu-btn").forEach((b) => b.addEventListener("click", () => openDrawer(true)));
  if (drawer) {
    drawer.querySelector(".close").addEventListener("click", () => openDrawer(false));
    drawer.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => openDrawer(false)));
  }

  // ---------- Reveal ----------
  const reveals = document.querySelectorAll("[data-reveal]");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -8% 0px" });
    reveals.forEach((el) => io.observe(el));
  } else reveals.forEach((el) => el.classList.add("in"));

  // ---------- Typed role ----------
  const typed = document.querySelector("[data-typed]");
  let typeTimer;
  function typeRole() {
    if (!typed) return;
    clearTimeout(typeTimer);
    const text = T(typed.dataset.typed, typed.dataset.typedPt || typed.dataset.typed);
    const out = typed.querySelector(".out");
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { out.textContent = text; return; }
    let i = 0;
    out.textContent = "";
    const step = () => { out.textContent = text.slice(0, ++i); if (i < text.length) typeTimer = setTimeout(step, 38 + Math.random() * 40); };
    typeTimer = setTimeout(step, 450);
  }

  // ---------- Copy email ----------
  document.querySelectorAll("[data-copy]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const label = btn.querySelector(".lbl") || btn;
      const prev = label.innerHTML;
      try { await navigator.clipboard.writeText(btn.dataset.copy); label.innerHTML = `<span class="ok-msg">${T("Copied", "Copiado")}</span>`; }
      catch (e) { location.href = "mailto:" + btn.dataset.copy; return; }
      setTimeout(() => (label.innerHTML = prev), 1600);
    });
  });

  // ---------- Stack: where it shipped ----------
  const where = document.querySelector(".where");
  if (where) {
    const nameEl = where.querySelector(".name"), list = where.querySelector("ul"), empty = where.querySelector(".empty");
    const byId = Object.fromEntries(PROJECTS.map((p) => [p.id, p]));
    let active = null;
    const show = (chip) => {
      document.querySelectorAll(".skill.on").forEach((s) => s.classList.remove("on"));
      active = chip;
      chip.classList.add("on");
      nameEl.textContent = chip.textContent;
      list.innerHTML = "";
      chip.dataset.projects.split(",").forEach((id) => {
        const p = byId[id.trim()]; if (!p) return;
        const li = document.createElement("li");
        const a = document.createElement("a");
        a.href = abs(p.url);
        if (/^https?:/.test(p.url)) { a.target = "_blank"; a.rel = "noopener"; }
        a.innerHTML = `<span></span><span class="mono" style="font-size:11px;color:var(--faint)"></span>`;
        a.firstChild.textContent = (lang === "pt" && p.namePt) || p.name;
        a.lastChild.textContent = p.cat[lang];
        li.appendChild(a); list.appendChild(li);
      });
      empty.hidden = true;
    };
    document.querySelectorAll(".skill[data-projects]").forEach((chip) => {
      chip.tabIndex = 0;
      chip.addEventListener("mouseenter", () => show(chip));
      chip.addEventListener("focus", () => show(chip));
      chip.addEventListener("click", () => show(chip));
    });
    document.addEventListener("langchange", () => active && show(active));
    const first = document.querySelector(".skill[data-projects]");
    if (first) show(first);
  }

  // ---------- Work filters ----------
  const filters = document.querySelectorAll(".filters button");
  if (filters.length) {
    const rows = document.querySelectorAll(".index li");
    const count = document.querySelector("[data-count]");
    const apply = (f) => {
      let n = 0;
      rows.forEach((r) => { const on = f === "all" || r.dataset.cat.split(" ").includes(f); r.hidden = !on; if (on) n++; });
      filters.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.filter === f)));
      if (count) count.textContent = n;
    };
    filters.forEach((b) => b.addEventListener("click", () => apply(b.dataset.filter)));
  }

  // ---------- Contact form (opens the visitor's mail app) ----------
  const form = document.querySelector("#contact-form");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const d = new FormData(form);
      const name = (d.get("name") || "").toString().trim();
      const email = (d.get("email") || "").toString().trim();
      const msg = (d.get("message") || "").toString().trim();
      const reason = form.querySelector("input[name=reason]:checked");
      const err = form.querySelector(".form-error");
      if (!name || !msg) { err.textContent = T("Please add your name and a message.", "Indica o teu nome e uma mensagem."); return; }
      err.textContent = "";
      const reasonText = reason ? reason.nextElementSibling.textContent.trim() : T("Hello", "Olá");
      const subject = `${reasonText} — ${name}`;
      const body = `${msg}\n\n— ${name}${email ? "\n" + email : ""}`;
      location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    });
  }

  // ---------- Search palette ----------
  const ICON_SEARCH = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>';
  const onHome = !!document.getElementById("work");
  const sec = (id) => (onHome ? "#" + id : "index.html#" + id);
  function entries() {
    const list = [];
    PROJECTS.forEach((p) => list.push({
      g: T("Projects", "Projetos"), ic: p.url.startsWith("http") ? "GH" : "→", t: (lang === "pt" && p.namePt) || p.name, d: p.cat[lang], url: p.url, ext: p.url.startsWith("http"), kw: p.kw,
    }));
    [
      ["work", T("Work", "Projetos"), T("Featured projects and the full list", "Projetos em destaque e lista completa"), "projects portfolio projetos"],
      ["stack", T("Stack", "Stack"), T("Languages, frameworks and tools", "Linguagens, frameworks e ferramentas"), "skills languages frameworks competências"],
      ["about", T("About me", "Sobre mim"), T("Bio and education", "Biografia e formação"), "about bio education porto university fcup sobre formação"],
    ].forEach(([id, t, d, kw]) => list.push({ g: T("On this site", "Neste site"), ic: "#", t, d, url: sec(id), kw }));
    list.push({ g: T("On this site", "Neste site"), ic: "@", t: T("Contact", "Contacto"), d: T("Send me a message", "Envia-me uma mensagem"), url: "contact.html", kw: "contact email talk hire message contacto falar" });
    [
      ["CV", T("Résumé (PDF)", "Currículo (PDF)"), T("Download or view", "Ver ou descarregar"), "uploads/resume.pdf", "resume cv pdf currículo"],
      ["GH", "GitHub", "github.com/BenLubetzky", "https://github.com/BenLubetzky", "code source repositories"],
      ["in", "LinkedIn", "linkedin.com/in/ben-lubetzky", "https://linkedin.com/in/ben-lubetzky", "linkedin profile"],
      ["@", T("Email me", "Enviar email"), EMAIL, "mailto:" + EMAIL, "email mail"],
    ].forEach(([ic, t, d, url, kw]) => list.push({ g: T("Links", "Links"), ic, t, d, url, kw, ext: /^https?:/.test(url) || url.endsWith(".pdf") }));
    document.querySelectorAll(".skill[data-projects]").forEach((s) => list.push({ g: T("Skills", "Competências"), ic: "{}", t: s.textContent.trim(), d: T("See where I used it", "Ver onde usei"), url: sec("stack"), kw: "skill", skill: s.textContent.trim() }));
    if (!document.querySelector(".skill")) {
      ["TypeScript", "Python", "Next.js", "FastAPI", "PostgreSQL", "React", "Docker", "OpenAI API", "RAG", "pgvector"].forEach((s) => list.push({ g: T("Skills", "Competências"), ic: "{}", t: s, d: T("See where I used it", "Ver onde usei"), url: sec("stack"), kw: "skill", skill: s }));
    }
    return list;
  }

  const pal = document.createElement("div");
  pal.className = "palette";
  pal.setAttribute("role", "dialog");
  pal.setAttribute("aria-modal", "true");
  pal.innerHTML = `<div class="palette-box"><div class="palette-input">${ICON_SEARCH}<input type="text" autocomplete="off" spellcheck="false" role="combobox" aria-expanded="true" aria-controls="palette-list"></div><div class="palette-list" id="palette-list" role="listbox"></div><div class="palette-foot"><span>↑↓ <span class="pf-nav"></span></span><span>↵ <span class="pf-open"></span></span><span>esc <span class="pf-close"></span></span></div></div>`;
  document.body.appendChild(pal);
  const pin = pal.querySelector("input"), plist = pal.querySelector(".palette-list");
  let items = [], sel = 0, lastFocus = null;

  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const hl = (s, q) => {
    if (!q) return esc(s);
    const i = s.toLowerCase().indexOf(q.toLowerCase());
    return i < 0 ? esc(s) : esc(s.slice(0, i)) + "<mark>" + esc(s.slice(i, i + q.length)) + "</mark>" + esc(s.slice(i + q.length));
  };
  function render() {
    const q = pin.value.trim().toLowerCase();
    const terms = q.split(/\s+/).filter(Boolean);
    items = entries().filter((e) => {
      const hay = (e.t + " " + e.d + " " + (e.kw || "") + " " + e.g).toLowerCase();
      return terms.every((t) => hay.includes(t));
    });
    if (!q) items = items.filter((e) => e.g !== T("Skills", "Competências"));
    sel = Math.min(sel, Math.max(0, items.length - 1));
    if (!items.length) { plist.innerHTML = `<div class="palette-empty">${esc(T("Nothing found for", "Nada encontrado para"))} “${esc(pin.value)}”</div>`; return; }
    let html = "", g = null;
    items.forEach((e, i) => {
      if (e.g !== g) { g = e.g; html += `<div class="palette-group">${esc(g)}</div>`; }
      html += `<div class="palette-item" role="option" id="pi-${i}" data-i="${i}" aria-selected="${i === sel}"><span class="ic">${esc(e.ic)}</span><span class="tx"><div class="tt">${hl(e.t, terms[0])}</div><div class="ds">${esc(e.d)}</div></span><span class="go">${e.ext ? "↗" : "↵"}</span></div>`;
    });
    plist.innerHTML = html;
    pin.setAttribute("aria-activedescendant", "pi-" + sel);
  }
  function move(d) {
    if (!items.length) return;
    sel = (sel + d + items.length) % items.length;
    plist.querySelectorAll(".palette-item").forEach((el) => el.setAttribute("aria-selected", String(+el.dataset.i === sel)));
    const el = plist.querySelector(`[data-i="${sel}"]`);
    if (el) el.scrollIntoView({ block: "nearest" });
    pin.setAttribute("aria-activedescendant", "pi-" + sel);
  }
  function go(i) {
    const e = items[i]; if (!e) return;
    closePalette();
    const url = abs(e.url);
    if (e.ext) { window.open(url, "_blank", "noopener"); return; }
    if (url.startsWith("mailto:")) { location.href = url; return; }
    location.href = url;
    if (e.skill) {
      setTimeout(() => {
        const chip = [...document.querySelectorAll(".skill")].find((s) => s.textContent.trim() === e.skill);
        if (chip) chip.focus({ preventScroll: true });
      }, 500);
    }
  }
  function openPalette() {
    lastFocus = document.activeElement;
    pin.placeholder = T("Search projects, skills, links…", "Pesquisar projetos, competências, links…");
    pin.setAttribute("aria-label", pin.placeholder);
    pal.querySelector(".pf-nav").textContent = T("navigate", "navegar");
    pal.querySelector(".pf-open").textContent = T("open", "abrir");
    pal.querySelector(".pf-close").textContent = T("close", "fechar");
    pal.classList.add("open");
    pin.value = ""; sel = 0; render();
    document.body.style.overflow = "hidden";
    setTimeout(() => pin.focus(), 10);
  }
  function closePalette() {
    pal.classList.remove("open");
    document.body.style.overflow = "";
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }
  pin.addEventListener("input", () => { sel = 0; render(); });
  pin.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); move(1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); move(-1); }
    else if (e.key === "Enter") { e.preventDefault(); go(sel); }
    else if (e.key === "Escape") { e.preventDefault(); closePalette(); }
    else if (e.key === "Tab") e.preventDefault();
  });
  plist.addEventListener("mousemove", (e) => {
    const it = e.target.closest(".palette-item"); if (!it || +it.dataset.i === sel) return;
    sel = +it.dataset.i; plist.querySelectorAll(".palette-item").forEach((el) => el.setAttribute("aria-selected", String(+el.dataset.i === sel)));
  });
  plist.addEventListener("click", (e) => { const it = e.target.closest(".palette-item"); if (it) go(+it.dataset.i); });
  pal.addEventListener("click", (e) => { if (e.target === pal) closePalette(); });
  document.querySelectorAll("[data-search]").forEach((b) => b.addEventListener("click", openPalette));
  addEventListener("keydown", (e) => {
    const typing = /input|textarea/i.test((e.target.tagName || "")) || e.target.isContentEditable;
    if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) { e.preventDefault(); pal.classList.contains("open") ? closePalette() : openPalette(); }
    else if (e.key === "/" && !typing && !pal.classList.contains("open")) { e.preventDefault(); openPalette(); }
    else if (e.key === "Escape" && drawer && drawer.classList.contains("open")) openDrawer(false);
  });
  const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  document.querySelectorAll(".kbd[data-mod]").forEach((k) => (k.textContent = isMac ? "⌘K" : "Ctrl K"));

  document.addEventListener("langchange", typeRole);
  applyLang(lang);
})();
