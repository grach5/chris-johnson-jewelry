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
    navToggle.setAttribute("aria-label", "Открыть меню");
    document.body.style.overflow = "";
  }

  function openNav() {
    navMobile.classList.add("is-open");
    navToggle.setAttribute("aria-expanded", "true");
    navToggle.setAttribute("aria-label", "Закрыть меню");
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

  /* ---------------------------------------------------------------------
     6. Лупа ювелира — круглая зона увеличения на фото украшений
     Следует за курсором (mousemove) / пальцем (touchmove), показывая
     масштабированную копию того же фото через фоновое изображение линзы.
     Полностью отключено при prefers-reduced-motion: reduce — вместо лупы
     остаётся статичная кнопка-подсказка (см. CSS), обработчики не вешаются.
     --------------------------------------------------------------------- */
  if (!prefersReducedMotion) {
    var LOUPE_ZOOM = 2.4;
    var loupeEls = document.querySelectorAll("[data-loupe]");

    loupeEls.forEach(function (el) {
      var img = el.querySelector("img");
      var lens = el.querySelector(".loupe-lens");
      if (!img || !lens) { return; }

      var rect = null;

      function activate() {
        rect = el.getBoundingClientRect();
        if (!rect.width || !rect.height) { rect = null; return; }
        if (!lens.style.backgroundImage) {
          lens.style.backgroundImage = "url('" + (img.currentSrc || img.src) + "')";
        }
        lens.style.backgroundSize = (rect.width * LOUPE_ZOOM).toFixed(0) + "px " + (rect.height * LOUPE_ZOOM).toFixed(0) + "px";
        el.classList.add("is-loupe-active");
      }

      function track(clientX, clientY) {
        if (!rect) { return; }
        var lensSize = lens.offsetWidth || 130;
        var px = Math.max(0, Math.min(rect.width, clientX - rect.left));
        var py = Math.max(0, Math.min(rect.height, clientY - rect.top));

        lens.style.left = (px - lensSize / 2).toFixed(1) + "px";
        lens.style.top = (py - lensSize / 2).toFixed(1) + "px";
        lens.style.backgroundPosition =
          (-(px * LOUPE_ZOOM - lensSize / 2)).toFixed(1) + "px " +
          (-(py * LOUPE_ZOOM - lensSize / 2)).toFixed(1) + "px";
      }

      function deactivate() {
        el.classList.remove("is-loupe-active");
        rect = null;
      }

      el.addEventListener("mouseenter", function (e) {
        activate();
        track(e.clientX, e.clientY);
      });
      el.addEventListener("mousemove", function (e) {
        if (!rect) { activate(); }
        track(e.clientX, e.clientY);
      });
      el.addEventListener("mouseleave", deactivate);

      el.addEventListener("touchstart", function (e) {
        if (!e.touches || !e.touches.length) { return; }
        activate();
        track(e.touches[0].clientX, e.touches[0].clientY);
      }, { passive: true });
      el.addEventListener("touchmove", function (e) {
        if (!e.touches || !e.touches.length) { return; }
        track(e.touches[0].clientX, e.touches[0].clientY);
      }, { passive: true });
      el.addEventListener("touchend", deactivate);
      el.addEventListener("touchcancel", deactivate);
    });
  }
})();
