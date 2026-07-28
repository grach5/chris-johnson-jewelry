/* =========================================================================
   Chris Johnson — ювелирная мастерская
   script.js — минимальный vanilla JS, без зависимостей и сборки
   ========================================================================= */
(function () {
  "use strict";

  /* Помечаем документ как "с JS" — до этого .reveal-блоки видимы по умолчанию,
     чтобы отключённый/не выполнившийся скрипт не прятал контент навсегда. */
  document.documentElement.classList.add("js");

  /* ---------------------------------------------------------------------
     1. Мобильная навигация
     --------------------------------------------------------------------- */
  var navToggle = document.getElementById("navToggle");
  var navMobile = document.getElementById("navMobile");

  function closeNav() {
    navMobile.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  }

  function openNav() {
    navMobile.classList.add("is-open");
    navToggle.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
  }

  if (navToggle && navMobile) {
    navToggle.addEventListener("click", function () {
      var isOpen = navMobile.classList.contains("is-open");
      if (isOpen) { closeNav(); } else { openNav(); }
    });

    navMobile.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", closeNav);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { closeNav(); }
    });
  }

  /* ---------------------------------------------------------------------
     2. Плавное появление секций при скролле
     --------------------------------------------------------------------- */
  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var revealEls = document.querySelectorAll(".reveal");

  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  } else {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
    );
    revealEls.forEach(function (el) { observer.observe(el); });
  }

  /* ---------------------------------------------------------------------
     3. Форма заявки → открытие WhatsApp с готовым сообщением
     --------------------------------------------------------------------- */
  var WHATSAPP_NUMBER = "79817178948"; // +7 981 717-89-48, без плюса и пробелов
  var form = document.getElementById("consultForm");
  var statusEl = document.getElementById("formStatus");

  function setStatus(text) {
    if (statusEl) { statusEl.textContent = text; }
  }

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var name = form.querySelector("#f-name").value.trim();
      var phone = form.querySelector("#f-phone").value.trim();
      var type = form.querySelector("#f-type").value;
      var message = form.querySelector("#f-message").value.trim();

      if (!name || !phone) {
        setStatus("Пожалуйста, укажите имя и телефон — это поможет мастеру связаться с вами.");
        if (!name) { form.querySelector("#f-name").focus(); }
        else { form.querySelector("#f-phone").focus(); }
        return;
      }

      var lines = [
        "Здравствуйте! Заявка с сайта Chris Johnson.",
        "Имя: " + name,
        "Телефон: " + phone,
        "Тип обращения: " + type
      ];
      if (message) { lines.push("Сообщение: " + message); }

      var text = encodeURIComponent(lines.join("\n"));
      var url = "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + text;

      window.open(url, "_blank", "noopener");
      setStatus("Заявка сформирована — продолжите отправку в открывшейся вкладке WhatsApp.");
    });
  }

  /* ---------------------------------------------------------------------
     4. 3D-наклон карточек прайса + блик грани камня
     Полностью отключено при prefers-reduced-motion: reduce — эффект
     не навешивается вовсе, а не просто ускоряется.
     --------------------------------------------------------------------- */
  if (!prefersReducedMotion) {
    var MAX_TILT = 7; // градусы, ±7° — в пределах требуемых ±6-8°
    var tiltRows = document.querySelectorAll(".price-row");

    tiltRows.forEach(function (row) {
      row.addEventListener("mouseenter", function () {
        row.classList.add("is-tilting");
      });

      row.addEventListener("mousemove", function (e) {
        var rect = row.getBoundingClientRect();
        if (!rect.width || !rect.height) { return; }
        var px = (e.clientX - rect.left) / rect.width;   // 0..1 слева направо
        var py = (e.clientY - rect.top) / rect.height;   // 0..1 сверху вниз

        var rotateX = (0.5 - py) * (MAX_TILT * 2);
        var rotateY = (px - 0.5) * (MAX_TILT * 2);

        row.style.transform = "rotateX(" + rotateX.toFixed(2) + "deg) rotateY(" + rotateY.toFixed(2) + "deg)";
        row.style.setProperty("--glare-x", (px * 100).toFixed(1) + "%");
        row.style.setProperty("--glare-y", (py * 100).toFixed(1) + "%");
      });

      row.addEventListener("mouseleave", function () {
        row.classList.remove("is-tilting");
        row.style.transform = "";
      });
    });
  }

  /* ---------------------------------------------------------------------
     5. Параллакс гранёного узора при скролле (scroll + requestAnimationFrame,
     без background-attachment: fixed — сдвиг через CSS-переменные и transform)
     Полностью отключено при prefers-reduced-motion: reduce.
     --------------------------------------------------------------------- */
  if (!prefersReducedMotion) {
    var rootEl = document.documentElement;
    var parallaxTicking = false;

    function updateParallax() {
      var y = window.scrollY || window.pageYOffset || 0;
      // фоновая текстура (position: fixed) — медленный, ограниченный сдвиг,
      // буфер -160px в CSS гарантирует, что край не обнажится
      var bgOffset = Math.max(-140, Math.min(140, y * 0.08));
      // узор в hero — быстрее, но обрезан overflow:hidden секции .hero
      var heroOffset = y * 0.22;

      rootEl.style.setProperty("--parallax-bg", bgOffset.toFixed(1) + "px");
      rootEl.style.setProperty("--parallax-hero", heroOffset.toFixed(1) + "px");
      parallaxTicking = false;
    }

    window.addEventListener("scroll", function () {
      if (!parallaxTicking) {
        window.requestAnimationFrame(updateParallax);
        parallaxTicking = true;
      }
    }, { passive: true });

    updateParallax();
  }
})();
