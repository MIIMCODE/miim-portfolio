/* =====================================================================
   admin.js — اتاق فرمان
   مدیریت آثار، تماس، مهارت‌ها و متن‌های سایت با Supabase
   ===================================================================== */
(() => {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const Store = window.MiimStore;
  const CFG = window.MIIM_CONFIG;

  const PLATFORM_LABELS = {
    instagram: "اینستاگرام",
    telegram: "تلگرام",
    whatsapp: "واتساپ",
    linkedin: "لینکدین",
    behance: "بهانس",
    youtube: "یوتیوب",
    link: "لینک دلخواه",
  };

  const state = {
    session: null,
    data: { works: [], skills: [], content: {}, contact: {} },
    dirty: { contact: false, skills: false, content: false },
    filter: "all",
    saving: false,
    uploading: false,
    confirmCallback: null,
    lastFocused: null,
  };

  /* ---------- ابزارهای کوچک ---------- */
  const esc = (value) => String(value ?? "").replace(/[<>]/g, "");

  function makeInput(className, value, placeholder, type = "text", extra = {}) {
    const input = document.createElement("input");
    input.className = `input ${className}`.trim();
    input.value = value ?? "";
    input.placeholder = placeholder || "";
    input.type = type;
    Object.entries(extra).forEach(([k, v]) => input.setAttribute(k, v));
    return input;
  }

  function makeButton(className, label, title) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = className;
    if (title) btn.title = title;
    btn.innerHTML = label; // فقط SVG ثابت
    return btn;
  }

  const ICONS = {
    grip: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/></svg>',
    edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/><path d="m14 6 4 4"/></svg>',
    up: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5m0 0-6 6m6-6 6 6"/></svg>',
    down: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5v14m0 0 6-6m-6 6-6-6"/></svg>',
    eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" aria-hidden="true"><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="3"/></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13M10 11v6M14 11v6"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  };

  /* ---------- توست ---------- */
  function toast(message, type = "success") {
    const wrap = $("#toasts");
    if (!wrap) return;
    const el = document.createElement("div");
    el.className = `toast${type === "error" ? " is-error" : ""}`;
    el.setAttribute("role", "status");
    el.textContent = message;
    wrap.append(el);
    window.setTimeout(() => {
      el.classList.add("is-leaving");
      window.setTimeout(() => el.remove(), 320);
    }, 3600);
  }

  /* ---------- مودال تأیید ---------- */
  function openConfirm({ title, text, confirmLabel = "تأیید", danger = false, onConfirm }) {
    const modal = $("#modal");
    if (!modal) return;
    state.confirmCallback = onConfirm;
    state.lastFocused = document.activeElement;
    $("#modal-title").textContent = title;
    $("#modal-text").textContent = text;
    const yes = $("#modal-yes");
    yes.textContent = confirmLabel;
    yes.className = `pill ${danger ? "pill--danger" : "pill--accent"}`;
    modal.hidden = false;
    document.body.classList.add("is-locked");
    window.setTimeout(() => yes.focus(), 30);
  }

  function closeConfirm() {
    const modal = $("#modal");
    if (!modal || modal.hidden) return;
    modal.hidden = true;
    document.body.classList.remove("is-locked");
    state.confirmCallback = null;
    if (state.lastFocused && state.lastFocused.focus) state.lastFocused.focus();
  }

  function initModal() {
    const modal = $("#modal");
    if (!modal) return;
    $("#modal-no").addEventListener("click", closeConfirm);
    $$("[data-close]", modal).forEach((el) => el.addEventListener("click", closeConfirm));
    $("#modal-yes").addEventListener("click", async () => {
      const cb = state.confirmCallback;
      closeConfirm();
      if (cb) await cb();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !modal.hidden) closeConfirm();
    });
  }

  /* ---------- نوار ذخیره ---------- */
  function hasDirty() {
    return Object.values(state.dirty).some(Boolean);
  }

  function updateSavebar() {
    const bar = $("#savebar");
    if (!bar) return;
    bar.hidden = !hasDirty();
    const msg = $("#save-msg");
    if (msg) msg.textContent = state.saving ? "در حال ذخیره و انتشار…" : "تغییرات ذخیره‌نشده دارید";
    const save = $("#save");
    const discard = $("#discard");
    if (save) save.disabled = state.saving;
    if (discard) discard.disabled = state.saving;
  }

  function markDirty(section) {
    if (section in state.dirty) state.dirty[section] = true;
    updateSavebar();
  }

  /* ---------- تب‌ها ---------- */
  function activateTab(name, updateHash = true) {
    const valid = ["works", "contact", "skills", "content"];
    if (!valid.includes(name)) name = "works";
    $$("[data-tab]").forEach((btn) => {
      const active = btn.dataset.tab === name;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-selected", String(active));
    });
    $$("[data-panel]").forEach((panel) => panel.classList.toggle("is-active", panel.dataset.panel === name));
    movePill(name);
    if (updateHash) {
      try { history.replaceState(null, "", `#${name}`); } catch { /* خالی */ }
    }
  }

  function movePill(name) {
    const pill = $(".nav__pill");
    const btn = $(`[data-tab="${name}"]`);
    if (!pill || !btn) return;
    pill.style.left = `${btn.offsetLeft}px`;
    pill.style.width = `${btn.offsetWidth}px`;
  }

  /* ---------- بارگذاری داده ---------- */
  async function guard() {
    try {
      const session = await Store.getSession();
      if (!session) {
        window.location.replace("login.html");
        return false;
      }
      const email = session.user && session.user.email ? session.user.email.toLowerCase() : "";
      if (email !== CFG.ADMIN_EMAIL.toLowerCase()) {
        await Store.signOut();
        window.location.replace("login.html");
        return false;
      }
      state.session = session;
      return true;
    } catch {
      window.location.replace("login.html");
      return false;
    }
  }

  async function loadAll(silent = false) {
    try {
      const data = await Store.adminLoadAll();
      state.data = data;
      renderKPIs();
      renderTagList();
      renderWorksAdmin();
      renderContactForm();
      renderSkillsAdmin();
      renderContentForm();
      if (!silent) updateSavebar();
    } catch (e) {
      console.warn("[admin] load error", e);
      toast(e && e.message ? e.message : "بارگذاری داده ناموفق بود.", "error");
    }
  }

  function formatDate(iso) {
    if (!iso) return "—";
    try {
      return new Intl.DateTimeFormat("fa-IR", { year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(iso));
    } catch {
      return "—";
    }
  }

  function renderKPIs() {
    const wrap = $("#kpis");
    if (!wrap) return;
    const works = state.data.works || [];
    const published = works.filter((w) => w.isPublished).length;
    const categories = new Set(works.map((w) => w.category).filter(Boolean));
    const skills = state.data.skills || [];
    const updatedAt = state.data.updatedAt;
    wrap.textContent = "";

    const items = [
      { label: "آثار", value: Store.toFa(published), small: `/ ${Store.toFa(works.length)}`, hint: "منتشرشده از کل" },
      { label: "دسته‌ها", value: Store.toFa(categories.size), small: "", hint: "دسته‌ی فعال" },
      { label: "مهارت‌ها", value: Store.toFa(skills.length), small: "", hint: "مورد ثبت‌شده" },
      { label: "آخرین تغییر", value: formatDate(updatedAt), small: "", hint: "به‌روزرسانی محتوا", date: true },
    ];

    items.forEach((item) => {
      const card = document.createElement("div");
      card.className = "kpi";
      const label = document.createElement("div");
      label.className = "kpi__label";
      label.textContent = item.label;
      const value = document.createElement("div");
      value.className = `kpi__value${item.date ? " kpi__value--date" : ""}`;
      value.textContent = item.value;
      if (item.small) {
        const small = document.createElement("small");
        small.textContent = item.small;
        value.append(small);
      }
      const hint = document.createElement("div");
      hint.className = "kpi__hint";
      hint.textContent = item.hint;
      card.append(label, value, hint);
      wrap.append(card);
    });
  }

  function renderTagList() {
    const list = $("#tag-list");
    if (!list) return;
    list.textContent = "";
    const categories = Array.from(new Set((state.data.works || []).map((w) => w.category).filter(Boolean)));
    categories.forEach((cat) => {
      const opt = document.createElement("option");
      opt.value = cat;
      list.append(opt);
    });
  }

  /* ---------- آثار ---------- */
  function renderWorksAdmin() {
    const grid = $("#works-grid");
    const chips = $("#chips");
    if (!grid || !chips) return;
    const works = state.data.works || [];
    const categories = Array.from(new Set(works.map((w) => w.category).filter(Boolean)));

    chips.textContent = "";
    const allChip = document.createElement("button");
    allChip.type = "button";
    allChip.className = `chip${state.filter === "all" ? " is-active" : ""}`;
    allChip.dataset.filter = "all";
    allChip.textContent = `همه (${Store.toFa(works.length)})`;
    chips.append(allChip);
    categories.forEach((cat) => {
      const count = works.filter((w) => w.category === cat).length;
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = `chip${state.filter === cat ? " is-active" : ""}`;
      chip.dataset.filter = cat;
      chip.textContent = `${cat} (${Store.toFa(count)})`;
      chips.append(chip);
    });

    const filtered = state.filter === "all" ? works : works.filter((w) => w.category === state.filter);
    grid.textContent = "";
    if (!filtered.length) {
      const empty = document.createElement("div");
      empty.className = "empty-state";
      empty.textContent = "اثری در این دسته نیست. از بخش آپلود، اولین اثر را اضافه کنید.";
      grid.append(empty);
      return;
    }

    filtered.forEach((work) => {
      const card = document.createElement("article");
      card.className = "work-card";
      card.dataset.id = work.id;

      const thumb = document.createElement("div");
      thumb.className = "work-card__thumb";
      const img = document.createElement("img");
      img.src = Store.resolveAsset(work.imageUrl);
      img.alt = work.title;
      img.loading = "lazy";
      const badge = document.createElement("span");
      badge.className = `work-card__badge${work.isPublished ? "" : " is-draft"}`;
      badge.textContent = work.isPublished ? "منتشرشده" : "پیشنویس";
      thumb.append(img, badge);

      const body = document.createElement("div");
      body.className = "work-card__body";
      const title = document.createElement("h3");
      title.className = "work-card__title";
      title.textContent = work.title;
      const cat = document.createElement("span");
      cat.className = "work-card__cat";
      cat.textContent = work.category;
      body.append(title, cat);

      const edit = document.createElement("div");
      edit.className = "work-card__edit";
      const titleInput = makeInput("", work.title, "عنوان اثر", "text", { "data-field": "title", maxlength: "120" });
      const catInput = makeInput("", work.category, "دسته", "text", { "data-field": "category", maxlength: "40", list: "tag-list" });
      const descInput = document.createElement("textarea");
      descInput.className = "input textarea";
      descInput.value = work.description || "";
      descInput.placeholder = "توضیح کوتاه اثر";
      descInput.dataset.field = "description";
      descInput.maxLength = 600;
      const editActions = document.createElement("div");
      editActions.className = "work-card__edit-actions";
      const saveBtn = document.createElement("button");
      saveBtn.type = "button";
      saveBtn.className = "mini-btn mini-btn--accent";
      saveBtn.dataset.action = "save-edit";
      saveBtn.textContent = "ذخیره";
      const cancelBtn = document.createElement("button");
      cancelBtn.type = "button";
      cancelBtn.className = "mini-btn";
      cancelBtn.dataset.action = "cancel-edit";
      cancelBtn.textContent = "انصراف";
      editActions.append(saveBtn, cancelBtn);
      edit.append(titleInput, catInput, descInput, editActions);

      const actions = document.createElement("div");
      actions.className = "work-card__actions";
      actions.append(
        makeButton("icon-btn drag-handle", ICONS.grip, "کشیدن برای جابه‌جایی"),
        makeButton("icon-btn", ICONS.edit, "ویرایش"),
        makeButton("icon-btn", ICONS.up, "انتقال به بالا"),
        makeButton("icon-btn", ICONS.down, "انتقال به پایین"),
        makeButton(`icon-btn${work.isPublished ? " is-gold" : ""}`, ICONS.eye, work.isPublished ? "لغو انتشار" : "انتشار"),
        makeButton("icon-btn is-danger", ICONS.trash, "حذف")
      );
      actions.children[1].dataset.action = "edit";
      actions.children[2].dataset.action = "up";
      actions.children[3].dataset.action = "down";
      actions.children[4].dataset.action = "toggle";
      actions.children[5].dataset.action = "delete";

      card.append(thumb, body, edit, actions);
      grid.append(card);
    });
  }

  async function handleFiles(fileList) {
    const files = Array.from(fileList || []);
    if (!files.length || state.uploading) return;
    const category = ($("#up-tag") && $("#up-tag").value.trim()) || "بدون دسته";
    const first = !!($("#up-first") && $("#up-first").checked);
    const auto = !!($("#up-auto") && $("#up-auto").checked);
    state.uploading = true;
    setUploadBusy(true);
    let ok = 0;
    let fail = 0;
    for (const file of files) {
      setUploadStatus(`در حال بارگذاری «${file.name}»…`);
      try {
        Store.validateImage(file);
        await Store.adminCreateWork({
          file,
          title: file.name.replace(/\.[^.]+$/, ""),
          category,
          description: "",
          publishFirst: first,
          autoPublish: auto,
        });
        ok += 1;
      } catch (e) {
        fail += 1;
        console.warn("[admin] upload error", file.name, e);
      }
    }
    state.uploading = false;
    setUploadBusy(false);
    if (ok) {
      setUploadStatus(`${Store.toFa(ok)} فایل با موفقیت افزوده شد${fail ? ` · ${Store.toFa(fail)} فایل ناموفق` : ""}.`, false, true);
      toast(`${Store.toFa(ok)} اثر جدید ثبت شد.`);
      await loadAll(true);
    } else {
      setUploadStatus("هیچ فایلی افزوده نشد. نوع و حجم فایل‌ها را بررسی کنید.", true);
    }
    const input = $("#file");
    if (input) input.value = "";
  }

  function setUploadBusy(busy) {
    const drop = $("#drop");
    const input = $("#file");
    if (drop) drop.classList.toggle("is-busy", busy);
    if (input) input.disabled = busy;
  }

  function setUploadStatus(message, isError = false, isOk = false) {
    const el = $("#upload-status");
    if (!el) return;
    el.textContent = message;
    el.classList.toggle("is-error", isError);
    el.classList.toggle("is-ok", isOk);
  }

  async function moveWork(id, direction) {
    const ids = (state.data.works || []).map((w) => w.id);
    const index = ids.indexOf(id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= ids.length) return;
    const tmp = ids[index];
    ids[index] = ids[target];
    ids[target] = tmp;
    try {
      await Store.adminReorderWorks(ids);
      await loadAll(true);
      toast("ترتیب آثار به‌روزرسانی شد.");
    } catch (e) {
      toast(e.message || "تغییر ترتیب ناموفق بود.", "error");
    }
  }

  async function saveWorkEdit(card) {
    const id = card.dataset.id;
    const title = card.querySelector('[data-field="title"]').value.trim();
    const category = card.querySelector('[data-field="category"]').value.trim();
    const description = card.querySelector('[data-field="description"]').value.trim();
    if (!title) { toast("عنوان اثر نمی‌تواند خالی باشد.", "error"); return; }
    try {
      await Store.adminUpdateWork(id, { title, category, description });
      await loadAll(true);
      toast("اثر ویرایش شد.");
    } catch (e) {
      toast(e.message || "ویرایش ناموفق بود.", "error");
    }
  }

  function initWorksEvents() {
    const grid = $("#works-grid");
    const chips = $("#chips");
    if (chips) {
      chips.addEventListener("click", (event) => {
        const chip = event.target.closest("[data-filter]");
        if (!chip) return;
        state.filter = chip.dataset.filter;
        renderWorksAdmin();
      });
    }
    if (!grid) return;

    grid.addEventListener("click", async (event) => {
      const actionEl = event.target.closest("[data-action]");
      const card = event.target.closest(".work-card");
      if (!card) return;
      const id = card.dataset.id;
      const work = (state.data.works || []).find((w) => w.id === id);
      if (!work) return;

      if (actionEl) {
        const action = actionEl.dataset.action;
        if (action === "edit") {
          card.classList.add("is-editing");
          const firstInput = card.querySelector('[data-field="title"]');
          if (firstInput) firstInput.focus();
        } else if (action === "cancel-edit") {
          card.classList.remove("is-editing");
        } else if (action === "save-edit") {
          await saveWorkEdit(card);
        } else if (action === "up") {
          await moveWork(id, -1);
        } else if (action === "down") {
          await moveWork(id, 1);
        } else if (action === "toggle") {
          try {
            await Store.adminUpdateWork(id, { isPublished: !work.isPublished });
            await loadAll(true);
            toast(work.isPublished ? "اثر به پیش‌نویس تبدیل شد." : "اثر منتشر شد.");
          } catch (e) {
            toast(e.message || "تغییر وضعیت ناموفق بود.", "error");
          }
        } else if (action === "delete") {
          openConfirm({
            title: "حذف اثر",
            text: `آیا از حذف «${work.title}» مطمئن هستید؟ این کار قابل بازگشت نیست.`,
            confirmLabel: "حذف",
            danger: true,
            onConfirm: async () => {
              try {
                await Store.adminDeleteWork(id);
                await loadAll(true);
                toast("اثر حذف شد.");
              } catch (e) {
                toast(e.message || "حذف ناموفق بود.", "error");
              }
            },
          });
        }
        return;
      }

      // کلیک روی خود کارت (نه دکمه): اگر در حالت ویرایش است، ذخیره کن
      if (card.classList.contains("is-editing")) return;
    });

    // کشیدن با دستگیره
    grid.addEventListener("mousedown", (event) => {
      const card = event.target.closest(".work-card");
      if (card && event.target.closest("[data-drag]")) card.draggable = true;
    });
    grid.addEventListener("dragend", (event) => {
      const card = event.target.closest(".work-card");
      if (card) card.draggable = false;
      $$(".work-card", grid).forEach((c) => c.classList.remove("is-dragging", "is-drop-target"));
    });
    grid.addEventListener("dragstart", (event) => {
      const card = event.target.closest(".work-card");
      if (!card) return;
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", card.dataset.id);
      card.classList.add("is-dragging");
    });
    grid.addEventListener("dragover", (event) => {
      event.preventDefault();
      const card = event.target.closest(".work-card");
      $$(".work-card", grid).forEach((c) => c.classList.toggle("is-drop-target", c === card && !c.classList.contains("is-dragging")));
    });
    grid.addEventListener("dragleave", (event) => {
      const card = event.target.closest(".work-card");
      if (card) card.classList.remove("is-drop-target");
    });
    grid.addEventListener("drop", async (event) => {
      event.preventDefault();
      const target = event.target.closest(".work-card");
      const draggedId = event.dataTransfer.getData("text/plain");
      if (!target || !draggedId || target.dataset.id === draggedId) return;
      const ids = (state.data.works || []).map((w) => w.id);
      const from = ids.indexOf(draggedId);
      const to = ids.indexOf(target.dataset.id);
      if (from < 0 || to < 0) return;
      ids.splice(to, 0, ids.splice(from, 1)[0]);
      try {
        await Store.adminReorderWorks(ids);
        await loadAll(true);
        toast("ترتیب آثار به‌روزرسانی شد.");
      } catch (e) {
        toast(e.message || "تغییر ترتیب ناموفق بود.", "error");
      }
    });
  }

  /* ---------- تماس ---------- */
  function renderContactForm() {
    const contact = state.data.contact || {};
    const phone = $("#c-phone");
    const id = $("#c-id");
    const email = $("#c-email");
    if (phone && document.activeElement !== phone) phone.value = contact.phone || "";
    if (id && document.activeElement !== id) id.value = contact.socialId || "";
    if (email && document.activeElement !== email) email.value = contact.email || "";
    renderPlatforms();
  }

  function renderPlatforms() {
    const wrap = $("#plat-list");
    if (!wrap) return;
    const platforms = (state.data.contact && state.data.contact.platforms) || [];
    wrap.textContent = "";
    platforms.forEach((platform, index) => {
      const row = document.createElement("div");
      row.className = "plat-row";
      row.dataset.index = String(index);

      const select = document.createElement("select");
      select.className = "input";
      select.dataset.field = "key";
      Object.entries(PLATFORM_LABELS).forEach(([value, label]) => {
        const opt = document.createElement("option");
        opt.value = value;
        opt.textContent = label;
        select.append(opt);
      });
      select.value = platform.key;

      const label = makeInput("", platform.label, "برچسب", "text", { "data-field": "label", maxlength: "30" });
      const url = makeInput("input--ltr plat-url", platform.url, "https://…", "url", { "data-field": "url", maxlength: "500", inputmode: "url" });
      const remove = makeButton("icon-btn is-danger", ICONS.close, "حذف شبکه");
      remove.dataset.action = "remove-plat";

      row.append(select, label, url, remove);
      wrap.append(row);
    });
  }

  function initContactEvents() {
    const contactInputs = [
      ["#c-phone", "phone"],
      ["#c-id", "socialId"],
      ["#c-email", "email"],
    ];
    contactInputs.forEach(([selector, key]) => {
      const el = $(selector);
      if (!el) return;
      el.addEventListener("input", () => {
        state.data.contact[key] = el.value;
        markDirty("contact");
      });
    });

    const add = $("#add-plat");
    if (add) {
      add.addEventListener("click", () => {
        const platforms = state.data.contact.platforms || [];
        if (platforms.length >= 12) { toast("حداکثر ۱۲ شبکه مجاز است.", "error"); return; }
        platforms.push({ key: "instagram", label: "اینستاگرام", url: "" });
        renderPlatforms();
        markDirty("contact");
      });
    }

    const list = $("#plat-list");
    if (list) {
      list.addEventListener("input", (event) => {
        const row = event.target.closest(".plat-row");
        if (!row) return;
        const index = Number(row.dataset.index);
        const field = event.target.dataset.field;
        if (!field || !state.data.contact.platforms[index]) return;
        state.data.contact.platforms[index][field] = event.target.value;
        markDirty("contact");
      });
      list.addEventListener("change", (event) => {
        const row = event.target.closest(".plat-row");
        if (!row || event.target.dataset.field !== "key") return;
        const index = Number(row.dataset.index);
        const platform = state.data.contact.platforms[index];
        if (!platform) return;
        platform.key = event.target.value;
        const labelInput = row.querySelector('[data-field="label"]');
        if (labelInput && (!labelInput.value.trim() || Object.values(PLATFORM_LABELS).includes(labelInput.value.trim()))) {
          platform.label = PLATFORM_LABELS[platform.key] || platform.key;
          labelInput.value = platform.label;
        }
        markDirty("contact");
      });
      list.addEventListener("click", (event) => {
        const btn = event.target.closest('[data-action="remove-plat"]');
        if (!btn) return;
        const row = btn.closest(".plat-row");
        const index = Number(row.dataset.index);
        state.data.contact.platforms.splice(index, 1);
        renderPlatforms();
        markDirty("contact");
      });
    }
  }

  /* ---------- مهارت‌ها ---------- */
  function renderSkillsAdmin() {
    const wrap = $("#skill-list");
    if (!wrap) return;
    const skills = state.data.skills || [];
    wrap.textContent = "";
    skills.forEach((skill, index) => {
      const row = document.createElement("div");
      row.className = "skill-row";
      row.dataset.index = String(index);

      const name = makeInput("", skill.name, "نام مهارت", "text", { "data-field": "name", maxlength: "40" });
      const range = document.createElement("input");
      range.type = "range";
      range.min = "0";
      range.max = "100";
      range.step = "1";
      range.value = String(skill.percent);
      range.dataset.field = "percent";
      range.setAttribute("aria-label", `درصد ${skill.name || "مهارت"}`);
      const number = makeInput("skill-pct", skill.percent, "۰", "number", { "data-field": "percent", min: "0", max: "100", step: "1" });
      const remove = makeButton("icon-btn is-danger", ICONS.close, "حذف مهارت");
      remove.dataset.action = "remove-skill";

      row.append(name, range, number, remove);
      wrap.append(row);
    });
  }

  function initSkillsEvents() {
    const add = $("#add-skill");
    if (add) {
      add.addEventListener("click", () => {
        state.data.skills.push({ id: null, name: "", percent: 50, sortOrder: state.data.skills.length + 1 });
        renderSkillsAdmin();
        markDirty("skills");
        const rows = $$("#skill-list .skill-row");
        const last = rows[rows.length - 1];
        if (last) last.querySelector('[data-field="name"]').focus();
      });
    }
    const list = $("#skill-list");
    if (list) {
      list.addEventListener("input", (event) => {
        const row = event.target.closest(".skill-row");
        if (!row) return;
        const index = Number(row.dataset.index);
        const skill = state.data.skills[index];
        if (!skill) return;
        const field = event.target.dataset.field;
        if (field === "name") skill.name = event.target.value;
        if (field === "percent") {
          const value = Math.max(0, Math.min(100, Math.round(Number(event.target.value) || 0)));
          skill.percent = value;
          const range = row.querySelector('input[type="range"]');
          const number = row.querySelector(".skill-pct");
          if (range && range !== event.target) range.value = String(value);
          if (number && number !== event.target) number.value = String(value);
        }
        markDirty("skills");
      });
      list.addEventListener("click", (event) => {
        const btn = event.target.closest('[data-action="remove-skill"]');
        if (!btn) return;
        if (state.data.skills.length <= 1) { toast("حداقل یک مهارت لازم است.", "error"); return; }
        const row = btn.closest(".skill-row");
        state.data.skills.splice(Number(row.dataset.index), 1);
        renderSkillsAdmin();
        markDirty("skills");
      });
    }
  }

  /* ---------- متن‌ها ---------- */
  const CONTENT_FIELDS = {
    "x-name": "name",
    "x-brand": "brand",
    "x-roleFa": "roleFa",
    "x-roleEn": "roleEn",
    "x-heroGreet": "heroGreet",
    "x-aboutHeading": "aboutHeading",
    "x-aboutEyebrow": "aboutEyebrow",
    "x-expHeading": "expHeading",
    "x-skillsEyebrow": "skillsEyebrow",
    "x-skillsHeading": "skillsHeading",
    "x-worksEyebrow": "worksEyebrow",
    "x-worksHeading": "worksHeading",
    "x-ctaText": "ctaText",
    "x-ctaButton": "ctaButton",
    "x-contactEyebrow": "contactEyebrow",
    "x-contactHeading": "contactHeading",
    "x-contactLead": "contactLead",
    "x-footerLegal": "footerLegal",
    "x-navHero": "navHero",
    "x-navAbout": "navAbout",
    "x-navWorks": "navWorks",
    "x-navContact": "navContact",
    "x-aboutText": "aboutText",
  };

  function renderContentForm() {
    const content = state.data.content || {};
    Object.entries(CONTENT_FIELDS).forEach(([id, key]) => {
      const el = document.getElementById(id);
      if (el && document.activeElement !== el) el.value = content[key] ?? "";
    });
    const preview = $("#portrait-preview");
    if (preview) {
      const src = Store.resolveAsset(content.heroPhoto || "assets/portrait.svg");
      if (preview.getAttribute("src") !== src) preview.src = src;
    }
    renderExpEditor();
    renderStatsEditor();
  }

  function renderExpEditor() {
    const wrap = $("#exp-editor");
    if (!wrap) return;
    const items = state.data.content.experiences || [];
    wrap.textContent = "";
    items.forEach((exp, index) => {
      const row = document.createElement("div");
      row.className = "exp-row";
      row.dataset.index = String(index);
      const role = makeInput("", exp.role, "نقش / عنوان", "text", { "data-field": "role", maxlength: "80" });
      const place = makeInput("", exp.place, "مکان / برند", "text", { "data-field": "place", maxlength: "80" });
      const period = makeInput("exp-period", exp.period, "۱۴۰۲ — اکنون", "text", { "data-field": "period", maxlength: "40" });
      const remove = makeButton("icon-btn is-danger", ICONS.close, "حذف تجربه");
      remove.dataset.action = "remove-exp";
      row.append(role, place, period, remove);
      wrap.append(row);
    });
  }

  function renderStatsEditor() {
    const wrap = $("#stats-editor");
    if (!wrap) return;
    const items = state.data.content.stats || [];
    wrap.textContent = "";
    items.forEach((stat, index) => {
      const row = document.createElement("div");
      row.className = "stat-row";
      row.dataset.index = String(index);
      const label = makeInput("", stat.label, "برچسب (مثلاً اثر منتخب)", "text", { "data-field": "label", maxlength: "40" });
      const value = makeInput("stat-value", stat.value, "عدد", "number", { "data-field": "value", min: "0", max: "99999", step: "1" });
      const suffix = makeInput("stat-suffix", stat.suffix, "پسوند", "text", { "data-field": "suffix", maxlength: "4" });
      const remove = makeButton("icon-btn is-danger", ICONS.close, "حذف آمار");
      remove.dataset.action = "remove-stat";
      row.append(label, value, suffix, remove);
      wrap.append(row);
    });
  }

  function initContentEvents() {
    const panel = $("#panel-content");
    if (panel) {
      panel.addEventListener("input", (event) => {
        const id = event.target.id;
        if (id && CONTENT_FIELDS[id]) {
          state.data.content[CONTENT_FIELDS[id]] = event.target.value;
          markDirty("content");
        }
      });
    }

    const addExp = $("#add-exp");
    if (addExp) {
      addExp.addEventListener("click", () => {
        state.data.content.experiences.push({ role: "", place: "", period: "" });
        renderExpEditor();
        markDirty("content");
        const rows = $$("#exp-editor .exp-row");
        const last = rows[rows.length - 1];
        if (last) last.querySelector('[data-field="role"]').focus();
      });
    }
    const addStat = $("#add-stat");
    if (addStat) {
      addStat.addEventListener("click", () => {
        state.data.content.stats.push({ label: "", value: 0, suffix: "" });
        renderStatsEditor();
        markDirty("content");
        const rows = $$("#stats-editor .stat-row");
        const last = rows[rows.length - 1];
        if (last) last.querySelector('[data-field="label"]').focus();
      });
    }

    const expEditor = $("#exp-editor");
    if (expEditor) {
      expEditor.addEventListener("input", (event) => {
        const row = event.target.closest(".exp-row");
        if (!row) return;
        const index = Number(row.dataset.index);
        const field = event.target.dataset.field;
        if (state.data.content.experiences[index] && field) {
          state.data.content.experiences[index][field] = event.target.value;
          markDirty("content");
        }
      });
      expEditor.addEventListener("click", (event) => {
        const btn = event.target.closest('[data-action="remove-exp"]');
        if (!btn) return;
        const row = btn.closest(".exp-row");
        state.data.content.experiences.splice(Number(row.dataset.index), 1);
        renderExpEditor();
        markDirty("content");
      });
    }

    const statsEditor = $("#stats-editor");
    if (statsEditor) {
      statsEditor.addEventListener("input", (event) => {
        const row = event.target.closest(".stat-row");
        if (!row) return;
        const index = Number(row.dataset.index);
        const field = event.target.dataset.field;
        const stat = state.data.content.stats[index];
        if (!stat || !field) return;
        stat[field] = field === "value" ? Math.max(0, Math.min(99999, Math.round(Number(event.target.value) || 0))) : event.target.value;
        markDirty("content");
      });
      statsEditor.addEventListener("click", (event) => {
        const btn = event.target.closest('[data-action="remove-stat"]');
        if (!btn) return;
        const row = btn.closest(".stat-row");
        state.data.content.stats.splice(Number(row.dataset.index), 1);
        renderStatsEditor();
        markDirty("content");
      });
    }

    const portrait = $("#portrait-file");
    if (portrait) {
      portrait.addEventListener("change", async () => {
        const file = portrait.files && portrait.files[0];
        if (!file) return;
        try {
          Store.validateImage(file);
          const uploaded = await Store.uploadMedia(file, "portrait");
          state.data.content.heroPhoto = uploaded.url;
          const preview = $("#portrait-preview");
          if (preview) preview.src = uploaded.url;
          markDirty("content");
          toast("عکس پرتره بارگذاری شد؛ برای اعمال، «ذخیره و انتشار» را بزنید.");
        } catch (e) {
          toast(e.message || "بارگذاری عکس ناموفق بود.", "error");
        } finally {
          portrait.value = "";
        }
      });
    }
  }

  /* ---------- ذخیره ---------- */
  function validateContact() {
    const contact = state.data.contact;
    if (contact.phone && !Store.safePhone(contact.phone)) return "شماره‌ی تماس معتبر نیست (۱۰ تا ۱۵ رقم).";
    if (contact.email && !Store.safeEmail(contact.email)) return "ایمیل معتبر نیست.";
    for (const p of contact.platforms || []) {
      if (p.url && !/^https?:\/\/[^\s"'<>]{3,500}$/i.test(p.url.trim())) return `لینک «${p.label || p.key}» باید با http:// یا https:// شروع شود.`;
    }
    return "";
  }

  function prepareContact() {
    const contact = state.data.contact;
    const socialId = String(contact.socialId || "").trim().replace(/^@/, "");
    const phone = Store.safePhone(contact.phone);
    contact.phone = phone;
    contact.socialId = socialId;
    contact.email = String(contact.email || "").trim();
    contact.platforms = (contact.platforms || []).slice(0, 12).map((p) => {
      let url = String(p.url || "").trim();
      if (!url) {
        if (p.key === "instagram" && socialId) url = `https://instagram.com/${socialId}`;
        else if (p.key === "telegram" && socialId) url = `https://t.me/${socialId}`;
        else if (p.key === "whatsapp" && phone) url = `https://wa.me/${phone.replace(/\D/g, "")}`;
      }
      return { key: p.key, label: p.label || PLATFORM_LABELS[p.key] || p.key, url };
    });
  }

  async function saveAll() {
    if (state.saving) return;
    const contactError = validateContact();
    if (contactError) { toast(contactError, "error"); return; }
    if (state.dirty.content) {
      if (!String(state.data.content.name || "").trim()) { toast("نام نمی‌تواند خالی باشد.", "error"); return; }
      if (!String(state.data.content.roleFa || "").trim()) { toast("نقش فارسی نمی‌تواند خالی باشد.", "error"); return; }
    }
    state.saving = true;
    updateSavebar();
    try {
      prepareContact();
      if (state.dirty.contact) await Store.saveContact(state.data.contact);
      if (state.dirty.skills) {
        const cleaned = state.data.skills
          .map((s) => ({ ...s, name: String(s.name || "").trim() }))
          .filter((s) => s.name);
        if (!cleaned.length) throw new Error("حداقل یک مهارت با نام لازم است.");
        state.data.skills = cleaned;
        await Store.replaceSkills(cleaned);
      }
      if (state.dirty.content) {
        // متن‌ها در سند JSON، و تجربه‌ها/شمارنده‌ها در جدول‌های اختصاصی ذخیره می‌شوند
        await Store.saveContent(state.data.content);
        const experiences = (state.data.content.experiences || []).filter((x) => String(x.role || "").trim());
        if (experiences.length) await Store.replaceExperiences(experiences);
        const stats = (state.data.content.stats || []).filter((x) => String(x.label || "").trim());
        if (stats.length) await Store.replaceStats(stats);
      }
      state.dirty = { contact: false, skills: false, content: false };
      updateSavebar();
      await loadAll(true);
      toast("تغییرات ذخیره و روی سایت منتشر شد.");
    } catch (e) {
      console.warn("[admin] save error", e);
      toast(e && e.message ? e.message : "ذخیره ناموفق بود.", "error");
    } finally {
      state.saving = false;
      updateSavebar();
    }
  }

  function discardAll() {
    state.dirty = { contact: false, skills: false, content: false };
    updateSavebar();
    loadAll(true);
    toast("تغییرات ذخیرهنشده لغو شد.");
  }

  /* ---------- رویدادهای ثابت ---------- */
  function initStaticEvents() {
    $$("[data-tab]").forEach((btn) => {
      btn.addEventListener("click", () => activateTab(btn.dataset.tab));
    });
    window.addEventListener("resize", () => movePill($("[data-tab].is-active")?.dataset.tab || "works"));

    const logout = $("#logout");
    if (logout) {
      logout.addEventListener("click", async () => {
        try { await Store.signOut(); } catch { /* خالی */ }
        window.location.replace("login.html");
      });
    }

    const refresh = $("#refresh");
    if (refresh) {
      refresh.addEventListener("click", () => {
        if (hasDirty()) {
          openConfirm({
            title: "به‌روزرسانی",
            text: "تغییرات ذخیرهنشده از دست می‌روند. ادامه می‌دهید؟",
            confirmLabel: "به‌روزرسانی",
            onConfirm: () => loadAll(),
          });
        } else {
          loadAll();
          toast("داده‌ها به‌روزرسانی شد.");
        }
      });
    }

    const save = $("#save");
    if (save) save.addEventListener("click", saveAll);
    const discard = $("#discard");
    if (discard) discard.addEventListener("click", discardAll);

    const input = $("#file");
    if (input) input.addEventListener("change", () => handleFiles(input.files));

    const drop = $("#drop");
    if (drop) {
      let depth = 0;
      ["dragenter", "dragover"].forEach((type) => {
        drop.addEventListener(type, (event) => {
          event.preventDefault();
          if (type === "dragenter") depth += 1;
          drop.classList.add("is-over");
        });
      });
      drop.addEventListener("dragleave", (event) => {
        event.preventDefault();
        depth = Math.max(0, depth - 1);
        if (depth === 0) drop.classList.remove("is-over");
      });
      drop.addEventListener("drop", (event) => {
        event.preventDefault();
        depth = 0;
        drop.classList.remove("is-over");
        if (event.dataTransfer && event.dataTransfer.files) handleFiles(event.dataTransfer.files);
      });
    }

    initModal();
    initWorksEvents();
    initContactEvents();
    initSkillsEvents();
    initContentEvents();
  }

  /* ---------- شروع ---------- */
  async function init() {
    initStaticEvents();
    const ok = await guard();
    if (!ok) return;
    document.body.classList.remove("is-checking");
    const app = $("#app");
    if (app) app.hidden = false;
    await loadAll();
    const initial = (location.hash || "").replace("#", "");
    activateTab(initial || "works", false);

    Store.onAuthChange((session) => {
      if (!session) window.location.replace("login.html");
    });

    if (Store.subscribeLive) {
      Store.subscribeLive(() => {
        const editing = document.querySelector(".work-card.is-editing");
        if (!hasDirty() && !state.uploading && !editing) loadAll(true);
      });
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
