/* =====================================================================
   login.js — ورود مدیر به اتاق فرمان (Supabase Auth)
   ===================================================================== */
(() => {
  "use strict";

  const $ = (sel) => document.querySelector(sel);
  const Store = window.MiimStore;
  const form = $("#form");
  const email = $("#email");
  const pass = $("#pass");
  const err = $("#err");
  const btn = $("#btn");
  const eye = $("#eye");

  const showError = (message) => {
    if (!err) return;
    err.textContent = message || "";
    err.classList.toggle("is-visible", !!message);
  };

  const setLoading = (loading) => {
    if (btn) {
      btn.disabled = loading;
      btn.classList.toggle("is-loading", loading);
      const label = btn.querySelector("span");
      if (label) label.textContent = loading ? "در حال ورود…" : "ورود";
    }
  };

  // اگر از قبل وارد شده است، مستقیم به پنل برود
  (async () => {
    try {
      const session = await Store.getSession();
      if (session) {
        window.location.replace("./");
        return;
      }
    } catch { /* ادامه به فرم */ }
    document.body.classList.remove("is-checking");
    if (email) email.focus();
  })();

  if (eye && pass) {
    eye.addEventListener("click", () => {
      const showing = pass.type === "text";
      pass.type = showing ? "password" : "text";
      eye.setAttribute("aria-pressed", String(!showing));
      eye.setAttribute("aria-label", showing ? "نمایش رمز" : "پنهان کردن رمز");
      pass.focus();
    });
  }

  if (form) {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      showError("");
      const emailValue = String(email.value || "").trim();
      const passValue = String(pass.value || "");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emailValue)) {
        showError("ایمیل معتبر نیست.");
        email.focus();
        return;
      }
      if (passValue.length < 6) {
        showError("رمز عبور باید حداقل ۶ کاراکتر باشد.");
        pass.focus();
        return;
      }
      setLoading(true);
      try {
        await Store.signIn(emailValue, passValue);
        window.location.replace("./");
      } catch (e) {
        showError(e && e.message ? e.message : "ورود ناموفق بود.");
        setLoading(false);
        pass.select();
      }
    });
  }
})();
