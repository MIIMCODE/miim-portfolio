/* =====================================================================
   script.js — رفتار سایت (هیرو، کاروسل سه‌بعدی، لایت‌باکس، تماس، ...)
   داده‌ها از MiimStore می‌آیند؛ هیچ داده‌ی کاربر با innerHTML تزریق نمی‌شود.
   ===================================================================== */
(() => {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const Store = window.MiimStore;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const state = {
    works: [],
    active: 0,
    lightbox: -1,
    loaded: false,
    dragMoved: false,
  };

  /* ---------- آیکون‌های نرم‌افزار (ثابت و امن) ---------- */
  const SOFTWARE = [
    {
      name: "Photoshop",
      svg: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2.5" y="2.5" width="19" height="19" rx="5" fill="#001e36" stroke="#31a8ff" stroke-width="1.2"/><text x="12" y="16.4" text-anchor="middle" font-family="Tahoma, sans-serif" font-size="9" font-weight="700" fill="#31a8ff">Ps</text></svg>',
    },
    {
      name: "Illustrator",
      svg: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2.5" y="2.5" width="19" height="19" rx="5" fill="#330000" stroke="#ff9a00" stroke-width="1.2"/><text x="12" y="16.4" text-anchor="middle" font-family="Tahoma, sans-serif" font-size="9" font-weight="700" fill="#ff9a00">Ai</text></svg>',
    },
    {
      name: "Premiere Pro",
      svg: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2.5" y="2.5" width="19" height="19" rx="5" fill="#1a0033" stroke="#c77dff" stroke-width="1.2"/><text x="12" y="16.4" text-anchor="middle" font-family="Tahoma, sans-serif" font-size="9" font-weight="700" fill="#c77dff">Pr</text></svg>',
    },
    {
      name: "Figma",
      svg: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5H8.2a3.1 3.1 0 0 0 0 6.2H12z" fill="#f24e1e"/><path d="M12 2.5h3.8a3.1 3.1 0 0 1 0 6.2H12z" fill="#ff7262"/><path d="M12 8.7H8.2a3.1 3.1 0 0 0 0 6.2H12z" fill="#a259ff"/><circle cx="15.8" cy="11.8" r="3.1" fill="#1abcfe"/><path d="M12 15H8.2a3.1 3.1 0 1 0 3.8 3z" fill="#0acf83"/></svg>',
    },
  ];

  /* ---------- آیکون شبکه‌های اجتماعی ---------- */
  const SOCIAL_ICONS = {
    instagram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none"/></svg>',
    telegram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><path d="m21 4-3 16-6-4-3 3-1-5 10-8-12 6-4-2z"/></svg>',
    whatsapp: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><path d="M20 11.5a8 8 0 0 1-11.8 7L4 20l1.5-4.2A8 8 0 1 1 20 11.5Z"/><path d="M9 8.5c0 3 2.5 5.5 5.5 5.5l1-1.5-2-1-1 1c-1-.5-2-1.5-2.5-2.5l1-1-1-2z"/></svg>',
    linkedin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M7 10v7M7 7v.01M11 17v-4a2 2 0 0 1 4 0v4"/></svg>',
    behance: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2.5" y="5" width="19" height="14" rx="3"/><text x="12" y="15.6" text-anchor="middle" font-family="Tahoma, sans-serif" font-size="7.5" font-weight="700" fill="currentColor" stroke="none">Bē</text></svg>',
    youtube: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="4"/><path d="m10 9 5 3-5 3z" fill="currentColor" stroke="none"/></svg>',
    link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg>',
  };

  /* ---------- لودر ---------- */
  function initLoader() {
    const loader = $("#loader");
    const fill = $("#loader-fill");
    const pct = $("#loader-pct");
    let progress = 0;
    const setProgress = (p) => {
      progress = Math.max(progress, Math.min(100, p));
      if (loader) loader.style.setProperty("--p", progress);
      if (fill) fill.style.width = progress + "%";
      if (pct) pct.textContent = Store.toFa(Math.round(progress)) + "٪";
    };
    setProgress(4);
    const timer = window.setInterval(() => {
      if (progress < 88) setProgress(progress + Math.random() * 9 + 2);
    }, 130);

    const finish = () => {
      window.clearInterval(timer);
      setProgress(100);
      window.setTimeout(() => {
        if (loader) loader.classList.add("is-done");
        document.body.classList.remove("is-loading");
      }, reduced ? 0 : 420);
    };
    return { finish };
  }

  /* ---------- رندر متن‌ها ---------- */
  function applyContent(content) {
    $$("[data-bind]").forEach((el) => {
      const key = el.dataset.bind;
      const value = content[key];
      if (typeof value === "string") el.textContent = value;
    });
    document.title = `${content.name} | ${content.brand} — ${content.roleFa}`;
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute("content", `${content.name} (${content.brand})؛ ${content.roleFa}. نمونه‌کارها، مهارت‌ها و راه‌های ارتباطی.`);
  }

  function renderHeroPhoto(url) {
    const img = $("#hero-photo");
    if (!img) return;
    const resolved = Store.resolveAsset(url || "assets/portrait.svg");
    if (resolved && img.getAttribute("src") !== resolved) {
      img.setAttribute("src", resolved);
      img.setAttribute("alt", `پرتره‌ی ${Store.getState().content.name || "مجتبی میدانی"}`);
    }
  }

  function renderSoftwareIcons() {
    const wrap = $("#hero-icons");
    if (!wrap || wrap.childElementCount) return;
    SOFTWARE.forEach((app, i) => {
      const span = document.createElement("span");
      span.className = `app-icon app-icon--${i + 1}`;
      span.setAttribute("title", app.name);
      span.setAttribute("aria-label", app.name);
      span.innerHTML = app.svg; // SVG ثابت و امن
      wrap.append(span);
    });
  }

  function renderStats(stats) {
    const wrap = $("#hero-stats");
    if (!wrap) return;
    wrap.textContent = "";
    (Array.isArray(stats) ? stats : []).forEach((s) => {
      const card = document.createElement("div");
      card.className = "stat";
      const value = document.createElement("div");
      value.className = "stat__value";
      value.dataset.target = String(s.value);
      value.dataset.suffix = s.suffix || "";
      value.textContent = Store.toFa(0) + (s.suffix || "");
      const label = document.createElement("div");
      label.className = "stat__label";
      label.textContent = s.label;
      card.append(value, label);
      wrap.append(card);
    });
    observeCounters();
  }

  function observeCounters() {
    const items = $$(".stat__value");
    if (!items.length) return;
    if (reduced || !("IntersectionObserver" in window)) {
      items.forEach((el) => {
        el.textContent = Store.toFa(el.dataset.target) + (el.dataset.suffix || "");
      });
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        io.unobserve(el);
        animateCount(el, Number(el.dataset.target) || 0, el.dataset.suffix || "");
      });
    }, { threshold: 0.4 });
    items.forEach((el) => io.observe(el));
  }

  function animateCount(el, target, suffix) {
    const duration = 1300;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Store.toFa(Math.round(target * eased)) + suffix;
      if (t < 1) requestAnimationFrame(tick);
      else el.textContent = Store.toFa(target) + suffix;
    };
    requestAnimationFrame(tick);
  }

  function renderExperiences(items) {
    const list = $("#exp-list");
    if (!list) return;
    list.textContent = "";
    (Array.isArray(items) ? items : []).forEach((exp) => {
      const li = document.createElement("li");
      li.className = "exp__item";
      const role = document.createElement("span");
      role.className = "exp__role";
      role.textContent = exp.role;
      const place = document.createElement("span");
      place.className = "exp__place";
      place.textContent = exp.place;
      const period = document.createElement("span");
      period.className = "exp__period";
      period.textContent = exp.period;
      li.append(role, period, place);
      list.append(li);
    });
  }

  function renderSkills(skills) {
    const list = $("#skills-list");
    if (!list) return;
    list.textContent = "";
    list.classList.remove("is-animated");
    (Array.isArray(skills) ? skills : []).forEach((s) => {
      const li = document.createElement("li");
      li.className = "skill";
      const row = document.createElement("div");
      row.className = "skill__row";
      const name = document.createElement("span");
      name.className = "skill__name";
      name.textContent = s.name;
      const pct = document.createElement("span");
      pct.className = "skill__pct";
      pct.textContent = Store.toFa(s.percent) + "٪";
      row.append(name, pct);
      const bar = document.createElement("div");
      bar.className = "skill__bar";
      bar.setAttribute("role", "progressbar");
      bar.setAttribute("aria-valuenow", String(s.percent));
      bar.setAttribute("aria-valuemin", "0");
      bar.setAttribute("aria-valuemax", "100");
      bar.setAttribute("aria-label", s.name);
      const fill = document.createElement("span");
      fill.className = "skill__fill";
      fill.style.setProperty("--p", s.percent + "%");
      bar.append(fill);
      li.append(row, bar);
      list.append(li);
    });
    observeSkills();
  }

  function observeSkills() {
    const list = $("#skills-list");
    if (!list) return;
    if (reduced || !("IntersectionObserver" in window)) {
      list.classList.add("is-animated");
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          list.classList.add("is-animated");
          io.disconnect();
        }
      });
    }, { threshold: 0.25 });
    io.observe(list);
  }

  /* ---------- کاروسل ---------- */
  function renderWorks(works) {
    const stage = $("#stage");
    if (!stage) return;
    state.works = Array.isArray(works) ? works : [];
    state.active = 0;
    stage.textContent = "";
    const meta = $(".carousel__meta");
    const rail = $("#rail");
    const hint = $("#carousel-hint");

    if (!state.works.length) {
      const empty = document.createElement("div");
      empty.className = "carousel__empty";
      empty.textContent = "هنوز اثری منتشر نشده است. به‌زودی نمونه‌کارها را اینجا می‌بینید.";
      stage.append(empty);
      if (meta) meta.style.display = "none";
      if (rail) rail.style.display = "none";
      if (hint) hint.style.display = "none";
      return;
    }
    if (meta) meta.style.display = "";
    if (rail) rail.style.display = "";
    if (hint) hint.style.display = "";

    state.works.forEach((work, index) => {
      const card = document.createElement("article");
      card.className = "work";
      card.dataset.index = String(index);
      card.innerHTML =
        '<div class="work__media"><span class="work__skeleton"></span><img class="work__img" alt="" loading="lazy" decoding="async"></div>' +
        '<div class="work__overlay"><span class="work__cat"></span><h3 class="work__title"></h3><p class="work__desc"></p></div>';
      const img = $(".work__img", card);
      img.src = Store.resolveAsset(work.imageUrl);
      img.alt = work.title;
      const markLoaded = () => card.classList.add("is-loaded");
      if (img.complete && img.naturalWidth) markLoaded();
      img.addEventListener("load", markLoaded, { once: true });
      img.addEventListener("error", () => {
        card.classList.add("is-loaded");
        img.style.opacity = "0";
      }, { once: true });
      $(".work__cat", card).textContent = work.category;
      $(".work__title", card).textContent = work.title;
      $(".work__desc", card).textContent = work.description || "";
      stage.append(card);
    });
    updateCarousel();
  }

  function updateCarousel() {
    const stage = $("#stage");
    if (!stage) return;
    const cards = $$(".work", stage);
    const n = cards.length;
    if (!n) return;
    if (state.active >= n) state.active = 0;
    if (state.active < 0) state.active = n - 1;

    cards.forEach((card, i) => {
      let offset = i - state.active;
      if (n > 1) {
        if (offset > n / 2) offset -= n;
        if (offset < -n / 2) offset += n;
      }
      const abs = Math.abs(offset);
      card.style.setProperty("--offset", String(offset));
      card.style.setProperty("--abs", String(Math.min(abs, 3)));
      card.classList.toggle("is-active", offset === 0);
      card.classList.toggle("is-hidden", abs > 2);
      card.setAttribute("aria-hidden", offset === 0 ? "false" : "true");
      card.tabIndex = offset === 0 ? 0 : -1;
    });

    const current = state.works[state.active];
    const tag = $("#carousel-tag");
    const count = $("#carousel-count");
    const thumb = $("#rail-thumb");
    if (tag) tag.textContent = current ? current.category : "";
    if (count) count.textContent = `${Store.toFa(state.active + 1)} / ${Store.toFa(n)}`;
    if (thumb) {
      thumb.style.width = `${100 / n}%`;
      thumb.style.left = `${(state.active * 100) / n}%`;
    }
  }

  function setActive(index) {
    const n = state.works.length;
    if (!n) return;
    state.active = ((index % n) + n) % n;
    updateCarousel();
    fadeHint();
  }

  function fadeHint() {
    const hint = $("#carousel-hint");
    if (hint) hint.classList.add("is-faded");
  }

  function initCarousel() {
    const stage = $("#stage");
    if (!stage) return;
    let drag = null;

    stage.addEventListener("pointerdown", (event) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      drag = { x: event.clientX, y: event.clientY, moved: false, id: event.pointerId };
      stage.classList.add("is-dragging");
    });

    stage.addEventListener("pointermove", (event) => {
      if (!drag) return;
      const dx = event.clientX - drag.x;
      const dy = event.clientY - drag.y;
      if (Math.abs(dx) > 6 || Math.abs(dy) > 6) drag.moved = true;
      if (Math.abs(dx) > Math.abs(dy)) {
        stage.style.setProperty("--drag", `${dx * 0.55}px`);
      }
    });

    const endDrag = (event) => {
      if (!drag) return;
      const dx = event.clientX - drag.x;
      const wasMoved = drag.moved;
      drag = null;
      stage.classList.remove("is-dragging");
      stage.style.setProperty("--drag", "0px");
      if (wasMoved && Math.abs(dx) > 48) {
        state.dragMoved = true;
        window.setTimeout(() => { state.dragMoved = false; }, 60);
        setActive(state.active + (dx < 0 ? 1 : -1));
      }
    };
    stage.addEventListener("pointerup", endDrag);
    stage.addEventListener("pointercancel", endDrag);
    stage.addEventListener("pointerleave", (event) => {
      if (drag && event.pointerType === "mouse" && event.buttons === 0) endDrag(event);
    });

    stage.addEventListener("click", (event) => {
      if (state.dragMoved) return;
      const card = event.target.closest(".work");
      if (!card) return;
      const index = Number(card.dataset.index);
      if (card.classList.contains("is-active")) openLightbox(index);
      else setActive(index);
    });

    stage.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") { event.preventDefault(); setActive(state.active + 1); }
      else if (event.key === "ArrowRight") { event.preventDefault(); setActive(state.active - 1); }
      else if (event.key === "Home") { event.preventDefault(); setActive(0); }
      else if (event.key === "End") { event.preventDefault(); setActive(state.works.length - 1); }
      else if (event.key === "Enter" || event.key === " ") {
        if (event.target.closest(".work.is-active")) { event.preventDefault(); openLightbox(state.active); }
      }
    });
  }

  /* ---------- لایت‌باکس ---------- */
  function initLightbox() {
    const box = $("#lightbox");
    if (!box) return;
    $$("[data-lb-close]", box).forEach((btn) => btn.addEventListener("click", closeLightbox));
    $$("[data-lb-prev]", box).forEach((btn) => btn.addEventListener("click", () => showLightbox(state.lightbox - 1)));
    $$("[data-lb-next]", box).forEach((btn) => btn.addEventListener("click", () => showLightbox(state.lightbox + 1)));
    document.addEventListener("keydown", (event) => {
      if (box.hidden) return;
      if (event.key === "Escape") { event.preventDefault(); closeLightbox(); }
      else if (event.key === "ArrowLeft") { event.preventDefault(); showLightbox(state.lightbox + 1); }
      else if (event.key === "ArrowRight") { event.preventDefault(); showLightbox(state.lightbox - 1); }
      else if (event.key === "Tab") {
        const focusables = $$("button, [href], img[tabindex]", box).filter((el) => !el.disabled && el.offsetParent !== null);
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    });
  }

  function openLightbox(index) {
    if (!state.works.length) return;
    state.lightbox = ((index % state.works.length) + state.works.length) % state.works.length;
    const box = $("#lightbox");
    if (!box) return;
    box.hidden = false;
    document.body.classList.add("is-locked");
    showLightbox(state.lightbox, true);
    requestAnimationFrame(() => {
      box.classList.add("is-open");
      const closeBtn = $(".lightbox__btn--close", box);
      if (closeBtn) closeBtn.focus();
    });
  }

  function showLightbox(index, instant = false) {
    const n = state.works.length;
    if (!n) return;
    state.lightbox = ((index % n) + n) % n;
    const work = state.works[state.lightbox];
    if (!work) return;
    const img = $("#lightbox-img");
    const tag = $("#lightbox-tag");
    const desc = $("#lightbox-desc");
    const count = $("#lightbox-count");
    const apply = () => {
      if (img) {
        img.src = Store.resolveAsset(work.imageUrl);
        img.alt = work.title;
        img.classList.remove("is-switching");
      }
      if (tag) tag.textContent = work.category;
      if (desc) desc.textContent = work.description || "";
      if (count) count.textContent = `${Store.toFa(state.lightbox + 1)} / ${Store.toFa(n)}`;
    };
    if (instant) { apply(); return; }
    if (img) img.classList.add("is-switching");
    window.setTimeout(apply, reduced ? 0 : 170);
  }

  function closeLightbox() {
    const box = $("#lightbox");
    if (!box || box.hidden) return;
    box.classList.remove("is-open");
    document.body.classList.remove("is-locked");
    window.setTimeout(() => { box.hidden = true; }, reduced ? 0 : 380);
    const stage = $("#stage");
    if (stage) stage.focus({ preventScroll: true });
  }

  /* ---------- تماس ---------- */
  function renderContact(contact) {
    const phoneCard = $("#contact-phone");
    const phoneText = $("#contact-phone-text");
    if (phoneCard && phoneText) {
      if (contact.phone) {
        phoneText.textContent = Store.toFa(contact.phone);
        phoneCard.setAttribute("href", `tel:${contact.phone}`);
        phoneCard.classList.remove("is-pending");
        phoneCard.setAttribute("aria-label", `تماس مستقیم با ${Store.toFa(contact.phone)}`);
      } else {
        phoneText.textContent = "به‌زودی";
        phoneCard.removeAttribute("href");
        phoneCard.classList.add("is-pending");
        phoneCard.setAttribute("aria-label", "شماره‌ی تماس به‌زودی اعلام می‌شود");
      }
    }

    const idEl = $("#contact-id");
    if (idEl) {
      if (contact.socialId) {
        idEl.textContent = "@" + contact.socialId;
        idEl.classList.remove("is-pending");
      } else {
        idEl.textContent = "به‌زودی";
        idEl.classList.add("is-pending");
      }
    }

    const socials = $("#socials");
    if (socials) {
      socials.textContent = "";
      (contact.platforms || []).forEach((p) => {
        const li = document.createElement("li");
        if (!p.url) li.classList.add("is-disabled");
        const icon = SOCIAL_ICONS[p.key] || SOCIAL_ICONS.link;
        if (p.url) {
          const a = document.createElement("a");
          a.href = p.url;
          a.target = "_blank";
          a.rel = "noopener noreferrer";
          a.setAttribute("aria-label", p.label);
          a.setAttribute("title", p.label);
          a.innerHTML = icon; // SVG ثابت
          li.append(a);
        } else {
          li.innerHTML = icon; // SVG ثابت
          li.setAttribute("title", `${p.label} — به‌زودی`);
          li.setAttribute("aria-label", `${p.label} — به‌زودی`);
        }
        socials.append(li);
      });
    }

    const mailCard = $("#contact-mail");
    const mailText = $("#contact-email-text");
    if (mailCard && mailText) {
      if (contact.email) {
        mailText.textContent = contact.email;
        mailCard.setAttribute("href", `mailto:${contact.email}`);
        mailCard.classList.remove("is-pending");
        mailCard.setAttribute("aria-label", `ارسال ایمیل به ${contact.email}`);
      } else {
        mailText.textContent = "به‌زودی";
        mailCard.removeAttribute("href");
        mailCard.classList.add("is-pending");
        mailCard.setAttribute("aria-label", "ایمیل به‌زودی اعلام می‌شود");
      }
    }
  }

  function renderFooter(content) {
    const legal = $("#footer-legal");
    if (legal) legal.textContent = content.footerLegal;
    const year = $("#footer-year");
    if (year) {
      try {
        year.textContent = new Intl.DateTimeFormat("fa-IR", { year: "numeric" }).format(new Date());
      } catch {
        year.textContent = Store.toFa(new Date().getFullYear());
      }
    }
  }

  /* ---------- ناوبری و اسکرول‌اسپای ---------- */
  function initNav() {
    const nav = $("#nav");
    const menu = $(".nav__menu");
    const pill = $(".nav__pill");
    if (!nav || !menu || !pill) return;
    const links = $$(".nav__link", menu);
    const sections = ["hero", "about", "works", "contact"]
      .map((id) => document.getElementById(id))
      .filter(Boolean);

    const movePill = (id) => {
      const link = links.find((l) => l.dataset.nav === id);
      if (!link) return;
      pill.style.left = `${link.offsetLeft}px`;
      pill.style.width = `${link.offsetWidth}px`;
    };

    const setActive = (id) => {
      links.forEach((l) => {
        const active = l.dataset.nav === id;
        l.classList.toggle("is-active", active);
        if (active) l.setAttribute("aria-current", "true");
        else l.removeAttribute("aria-current");
      });
      movePill(id);
    };

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const marker = window.scrollY + window.innerHeight * 0.35;
        let current = "hero";
        sections.forEach((section) => {
          if (section.offsetTop <= marker) current = section.id;
        });
        if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 8) current = "contact";
        setActive(current);
        if (!reduced) {
          const figure = $(".hero__figure");
          if (figure) figure.style.setProperty("--py", `${Math.min(window.scrollY * 0.05, 36)}px`);
        }
        ticking = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", () => {
      const current = links.find((l) => l.classList.contains("is-active"));
      if (current) movePill(current.dataset.nav);
    });
    setActive("hero");
    onScroll();
  }

  /* ---------- ظهور تدریجی ---------- */
  function initReveal() {
    const items = $$("[data-reveal]");
    if (!items.length) return;
    if (reduced || !("IntersectionObserver" in window)) {
      items.forEach((el) => el.classList.add("is-in"));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    items.forEach((el, i) => {
      el.style.setProperty("--d", `${Math.min(i % 4, 3) * 60}ms`);
      io.observe(el);
    });
  }

  /* ---------- دکمه‌ی مغناطیسی ---------- */
  function initMagnetic() {
    if (reduced || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    $$("[data-magnetic]").forEach((el) => {
      el.addEventListener("mousemove", (event) => {
        const rect = el.getBoundingClientRect();
        const x = event.clientX - rect.left - rect.width / 2;
        const y = event.clientY - rect.top - rect.height / 2;
        el.style.transform = `translate(${x * 0.12}px, ${y * 0.12}px)`;
      });
      el.addEventListener("mouseleave", () => {
        el.style.transform = "";
      });
    });
  }

  /* ---------- رندر کل ---------- */
  function renderAll() {
    const snapshot = Store.getState();
    applyContent(snapshot.content);
    renderHeroPhoto(snapshot.content.heroPhoto);
    renderSoftwareIcons();
    renderStats(snapshot.content.stats);
    renderExperiences(snapshot.content.experiences);
    renderSkills(snapshot.skills);
    renderWorks(snapshot.works);
    renderContact(snapshot.contact);
    renderFooter(snapshot.content);
    state.loaded = true;
  }

  /* ---------- شروع ---------- */
  function waitWindowLoad() {
    return new Promise((resolve) => {
      if (document.readyState === "complete") resolve();
      else window.addEventListener("load", () => resolve(), { once: true });
      window.setTimeout(resolve, 2600);
    });
  }

  async function init() {
    const loader = initLoader();
    initNav();
    initReveal();
    initMagnetic();
    initCarousel();
    initLightbox();

    try {
      await Store.loadSite();
    } catch (e) {
      console.warn("[site] load error", e);
    }
    renderAll();
    await waitWindowLoad();
    if (loader) loader.finish();

    // تغییرات زنده: هر تغییری در پنل، همین‌جا اعمال می‌شود
    if (Store.subscribeLive) {
      let timer = null;
      Store.subscribeLive(() => {
        window.clearTimeout(timer);
        timer = window.setTimeout(async () => {
          try {
            await Store.loadSite();
            renderAll();
          } catch (e) {
            console.warn("[site] live refresh error", e);
          }
        }, 250);
      });
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
