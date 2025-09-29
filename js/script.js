// js/script.js

// Usamos el modo estricto de JavaScript para un código más limpio y seguro.
"use strict";

document.addEventListener("DOMContentLoaded", function () {
  // --- MANEJO DEL FORMULARIO DE CONTACTO CON reCAPTCHA v3 ---
  const contactForm = document.getElementById("contact-form");
  const formMessage = document.getElementById("form-message");

  if (contactForm) {
    contactForm.addEventListener("submit", function (e) {
      e.preventDefault(); // Prevenimos que el formulario se envíe de la forma tradicional.

      // IMPORTANTE: Reemplaza con tu "Site Key" de reCAPTCHA v3.
      const recaptchaSiteKey = "TU_RECAPTCHA_SITE_KEY";

      formMessage.textContent = "Enviando...";
      formMessage.style.color = "#333";

      grecaptcha.ready(function () {
        grecaptcha
          .execute(recaptchaSiteKey, { action: "submit" })
          .then(function (token) {
            const recaptchaInput = document.getElementById(
              "g-recaptcha-response"
            );
            if (recaptchaInput) {
              recaptchaInput.value = token;
            }

            const formData = new FormData(contactForm);

            fetch("contact.php", {
              method: "POST",
              body: formData,
            })
              .then((response) => response.json())
              .then((data) => {
                if (data.success) {
                  formMessage.textContent =
                    "¡Gracias! Tu mensaje ha sido enviado.";
                  formMessage.style.color = "green";
                  contactForm.reset();
                } else {
                  formMessage.textContent =
                    "Error: " + (data.message || "No se pudo enviar.");
                  formMessage.style.color = "red";
                }
              })
              .catch((error) => {
                console.error("Error:", error);
                formMessage.textContent =
                  "Hubo un error de conexión. Inténtalo de nuevo.";
                formMessage.style.color = "red";
              });
          });
      });
    });
  }

  // --- CIERRE AUTOMÁTICO DEL MENÚ MÓVIL (Bootstrap 4/5) ---
  document.addEventListener("click", function (event) {
    const isClickInsideNavbar = event.target.closest(".navbar");
    const isNavbarToggler = event.target.closest(".navbar-toggler");
    const navbarCollapse = document.querySelector(".navbar-collapse");

    if (
      navbarCollapse &&
      navbarCollapse.classList.contains("show") &&
      !isClickInsideNavbar &&
      !isNavbarToggler
    ) {
      const bsCollapse = new bootstrap.Collapse(navbarCollapse, {
        toggle: false,
      });
      bsCollapse.hide();
    }
  });

  // --- SMOOTH SCROLL PARA ENLACES INTERNOS (anclas) ---
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();
      const targetId = this.getAttribute("href");
      const targetElement = document.querySelector(targetId);

      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: "smooth",
        });
      }
    });
  });

  // ANIMACIÓN DE HORMIGAS (documento completo + feromonas + entrar/salir bordes)
  (function () {
    const layer = document.getElementById("ant-layer");
    if (!layer) return;

    // =============== Parámetros ===============
    let ANT_COUNT = 12;
    const ANT_W = 20; // ← coincide con tu SCSS
    const ANT_H = 12; // ← coincide con tu SCSS
    const SPEED_BASE = [22, 40]; // px/s
    const TURN_SMOOTH = 0.18; // inercia de giro 0..1
    const WANDER = 0.03; // ruido suave
    const PAUSE_PROB = 0.0015;
    const PAUSE_MS = [250, 900];
    const EDGE_PAD = 24;
    const HEADING_OFFSET_DEG = 180;

    // Entrar/salir por bordes (del documento)
    const OFF_MARGIN = 60;
    const RESPAWN_COOLDOWN = [600, 1800];
    const EXIT_BIAS = 0.003;

    // Feromonas en TODA la página
    const CELL = 36;
    const DEPOSIT = 0.65;
    const DECAY = 0.992;
    const DIFFUSE = 0.06;
    const SNIFF_AHEAD = 42;
    const SNIFF_ANGLE = 18;
    const SNIFF_SAMPLES = 3;

    // =============== Utils ===============
    const rand = (a, b) => a + Math.random() * (b - a);
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const toRad = (d) => (d * Math.PI) / 180;
    const wrapDeg = (d) => {
      while (d > 180) d -= 360;
      while (d < -180) d += 360;
      return d;
    };

    // =============== Dimensiones de DOCUMENTO ===============
    function pageWidth() {
      const d = document.documentElement,
        b = document.body;
      return Math.max(
        b.scrollWidth,
        d.scrollWidth,
        b.offsetWidth,
        d.offsetWidth,
        b.clientWidth,
        d.clientWidth
      );
    }
    function pageHeight() {
      const d = document.documentElement,
        b = document.body;
      return Math.max(
        b.scrollHeight,
        d.scrollHeight,
        b.offsetHeight,
        d.offsetHeight,
        b.clientHeight,
        d.clientHeight
      );
    }
    function sizeLayer() {
      layer.style.width = pageWidth() + "px";
      layer.style.height = pageHeight() + "px";
    }
    sizeLayer();
    addEventListener("resize", sizeLayer);
    addEventListener("load", sizeLayer);
    const ro = new ResizeObserver(sizeLayer);
    ro.observe(document.documentElement);

    // =============== Grid de feromonas (documento) ===============
    let gw = 0,
      gh = 0,
      grid,
      temp;
    function resizeGrid() {
      const W = layer.clientWidth;
      const H = layer.clientHeight;
      gw = Math.max(1, Math.ceil(W / CELL));
      gh = Math.max(1, Math.ceil(H / CELL));
      grid = new Float32Array(gw * gh);
      temp = new Float32Array(gw * gh);
    }
    resizeGrid();
    addEventListener("resize", resizeGrid);

    const gi = (cx, cy) => cy * gw + cx;
    const sampleGrid = (x, y) => {
      const cx = clamp(Math.floor(x / CELL), 0, gw - 1);
      const cy = clamp(Math.floor(y / CELL), 0, gh - 1);
      return grid[gi(cx, cy)];
    };
    const depositAt = (x, y, q) => {
      const cx = clamp(Math.floor(x / CELL), 0, gw - 1);
      const cy = clamp(Math.floor(y / CELL), 0, gh - 1);
      grid[gi(cx, cy)] += q;
    };

    function updatePheromones() {
      for (let y = 0; y < gh; y++) {
        for (let x = 0; x < gw; x++) {
          const i = gi(x, y);
          let v = grid[i] * DECAY;
          let c = v,
            n = 0;
          if (x > 0) {
            c += grid[gi(x - 1, y)];
            n++;
          }
          if (x < gw - 1) {
            c += grid[gi(x + 1, y)];
            n++;
          }
          if (y > 0) {
            c += grid[gi(x, y - 1)];
            n++;
          }
          if (y < gh - 1) {
            c += grid[gi(x, y + 1)];
            n++;
          }
          const s = c / (n + 1);
          temp[i] = v * (1 - DIFFUSE) + s * DIFFUSE;
        }
      }
      const t = grid;
      grid = temp;
      temp = t;
    }

    // =============== Entrar/Salir por bordes del documento ===============
    function spawnAtDocEdge(W, H) {
      const side = Math.floor(Math.random() * 4);
      let x, y, dir;
      switch (side) {
        case 0:
          x = -OFF_MARGIN;
          y = rand(0, H);
          dir = rand(-60, 60);
          break; // izquierda → derecha
        case 1:
          x = W + OFF_MARGIN;
          y = rand(0, H);
          dir = rand(120, 240);
          break; // derecha → izquierda
        case 2:
          x = rand(0, W);
          y = -OFF_MARGIN;
          dir = rand(30, 150);
          break; // arriba → abajo
        default:
          x = rand(0, W);
          y = H + OFF_MARGIN;
          dir = rand(-150, -30);
          break; // abajo → arriba
      }
      return { x, y, dir };
    }

    // =============== Hormigas ===============
    const ants = [];
    function spawnAnt(edge = false) {
      const el = document.createElement("div");
      el.className = "ant";
      layer.appendChild(el);

      const W = layer.clientWidth;
      const H = layer.clientHeight;
      let x, y, dir;
      if (edge) {
        const e = spawnAtDocEdge(W, H);
        x = e.x;
        y = e.y;
        dir = e.dir;
      } else {
        x = rand(EDGE_PAD, W - EDGE_PAD);
        y = rand(EDGE_PAD, H - EDGE_PAD);
        dir = rand(-180, 180);
      }

      ants.push({
        el,
        x,
        y,
        dir,
        v: rand(SPEED_BASE[0], SPEED_BASE[1]),
        wander: rand(0, Math.PI * 2),
        pauseUntil: 0,
        respawning: false,
        reenterAt: 0,
      });
    }
    for (let i = 0; i < ANT_COUNT; i++) spawnAnt(false);

    // =============== Loop ===============
    let last = performance.now();
    function tick(now) {
      const dt = Math.min(100, now - last) / 1000;
      last = now;

      const W = layer.clientWidth;
      const H = layer.clientHeight;

      updatePheromones();

      for (const a of ants) {
        // Reaparición programada
        if (a.respawning) {
          if (now >= a.reenterAt) {
            const e = spawnAtDocEdge(W, H);
            a.x = e.x;
            a.y = e.y;
            a.dir = e.dir;
            a.v = rand(SPEED_BASE[0], SPEED_BASE[1]);
            a.wander = rand(0, Math.PI * 2);
            a.respawning = false;
          }
          render(a);
          continue;
        }

        // Pausas
        if (performance.now() < a.pauseUntil) {
          render(a);
          continue;
        } else if (Math.random() < PAUSE_PROB) {
          a.pauseUntil = performance.now() + rand(PAUSE_MS[0], PAUSE_MS[1]);
          render(a);
          continue;
        }

        // Tendencia ocasional a buscar salida
        if (Math.random() < EXIT_BIAS) {
          const toLeft = a.x,
            toRight = W - a.x,
            toTop = a.y,
            toBottom = H - a.y;
          const minD = Math.min(toLeft, toRight, toTop, toBottom);
          if (minD === toLeft) a.dir = a.dir * 0.7 + -180 * 0.3;
          if (minD === toRight) a.dir = a.dir * 0.7 + 0 * 0.3;
          if (minD === toTop) a.dir = a.dir * 0.7 + -90 * 0.3;
          if (minD === toBottom) a.dir = a.dir * 0.7 + 90 * 0.3;
        }

        // Evitar bordes del documento
        let steer = 0;
        if (a.x < EDGE_PAD) steer += wrapDeg(0 - a.dir);
        if (a.x > W - EDGE_PAD) steer += wrapDeg(180 - a.dir);
        if (a.y < EDGE_PAD) steer += wrapDeg(90 - a.dir);
        if (a.y > H - EDGE_PAD) steer += wrapDeg(-90 - a.dir);
        if (steer) a.dir += clamp(steer, -3, 3) * 0.08;

        // Oler feromonas (izq/centro/der)
        const choices = [];
        for (let i = 0; i < SNIFF_SAMPLES; i++) {
          const offset = (i - 1) * SNIFF_ANGLE;
          const ang = a.dir + offset;
          const sx = a.x + Math.cos(toRad(ang)) * SNIFF_AHEAD;
          const sy = a.y + Math.sin(toRad(ang)) * SNIFF_AHEAD;
          const val = sampleGrid(sx, sy);
          choices.push({ ang, val });
        }
        choices.sort((p, q) => q.val - p.val);
        const best = choices[0];

        // Rumbo objetivo (olfato + deambular)
        a.wander += WANDER;
        const wanderJitter = Math.sin(a.wander) * 8;
        let targetDir = a.dir + wanderJitter;
        if (best.val > 0.02) {
          const bias = 0.65;
          targetDir = a.dir * (1 - bias) + best.ang * bias;
        }
        const diff = wrapDeg(targetDir - a.dir);
        a.dir = a.dir + diff * TURN_SMOOTH;

        // Velocidad
        a.v = clamp(a.v + rand(-4, 4) * dt, SPEED_BASE[0], SPEED_BASE[1]);

        // Avance
        const rad = toRad(a.dir);
        a.x += Math.cos(rad) * a.v * dt;
        a.y += Math.sin(rad) * a.v * dt;

        // Dejar rastro
        depositAt(a.x, a.y, DEPOSIT);

        // ¿Salió del documento con margen? → desaparecer y reingresar luego
        if (
          a.x < -OFF_MARGIN ||
          a.x > W + OFF_MARGIN ||
          a.y < -OFF_MARGIN ||
          a.y > H + OFF_MARGIN
        ) {
          a.respawning = true;
          a.reenterAt =
            performance.now() + rand(RESPAWN_COOLDOWN[0], RESPAWN_COOLDOWN[1]);
          a.el.style.left = `-9999px`;
          a.el.style.top = `-9999px`;
          continue;
        }

        render(a);
      }

      requestAnimationFrame(tick);
    }

    function render(a) {
      a.el.style.left = `${a.x}px`;
      a.el.style.top = `${a.y}px`;
      a.el.style.transform = `translate3d(0,0,0) rotate(${
        a.dir + HEADING_OFFSET_DEG
      }deg)`;
    }

    // Si la página crece (nuevo contenido), rearmá la grilla
    let lastW = layer.clientWidth,
      lastH = layer.clientHeight;
    setInterval(() => {
      const W = layer.clientWidth,
        H = layer.clientHeight;
      if (Math.abs(W - lastW) > CELL || Math.abs(H - lastH) > CELL) {
        lastW = W;
        lastH = H;
        resizeGrid();
        sizeLayer();
      }
    }, 900);

    requestAnimationFrame(tick);
  })();

  // ==================================
  // LÓGICA PARA EL WIDGET DE WHATSAPP AVANZADO
  // ==================================
  const whatsappWidget = document.getElementById("whatsapp-widget");
  const whatsappButton = document.getElementById("whatsapp-button");
  const whatsappModal = document.getElementById("whatsapp-modal");
  const closeModalButton = document.getElementById("close-modal-button");
  const openWhatsappButton = document.getElementById("open-whatsapp-button");
  const whatsappModalBackdrop = document.querySelector(
    ".whatsapp-modal-backdrop"
  );

  // 1. Hacer visible el botón después de 3 segundos
  setTimeout(() => {
    if (whatsappWidget) {
      whatsappWidget.classList.add("visible");
    }
  }, 3000);

  // 2. Abrir el modal
  if (whatsappButton) {
    whatsappButton.addEventListener("click", () => {
      if (whatsappModal) {
        whatsappModal.classList.add("open");
      }
    });
  }

  // 3. Función para cerrar el modal
  const closeModal = () => {
    if (whatsappModal) {
      whatsappModal.classList.remove("open");
    }
  };

  // 4. Asignar eventos de cierre
  if (closeModalButton) {
    closeModalButton.addEventListener("click", closeModal);
  }
  if (whatsappModalBackdrop) {
    whatsappModalBackdrop.addEventListener("click", closeModal);
  }

  // 5. Lógica para abrir la ventana de WhatsApp
  if (openWhatsappButton) {
    openWhatsappButton.addEventListener("click", () => {
      // Personaliza estos valores
      const whatsappNumber = "5491163086386";
      const whatsappMessage =
        "¡Hola! Estoy interesado en un servicio de control de plagas. ¿Podrían darme más información?";

      const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
        whatsappMessage
      )}`;
      window.open(url, "_blank");
    });
  }
});

// Hover abre dropdown en desktop; click en mobile
(function () {
  var mq = window.matchMedia("(min-width: 992px)"); // lg+
  var dropdown = document.querySelectorAll(".navbar .dropdown");

  function bindHover() {
    dropdown.forEach(function (dd) {
      dd.addEventListener("mouseenter", open);
      dd.addEventListener("mouseleave", close);
    });
  }
  function unbindHover() {
    dropdown.forEach(function (dd) {
      dd.removeEventListener("mouseenter", open);
      dd.removeEventListener("mouseleave", close);
    });
  }
  function open(e) {
    this.classList.add("show");
    this.querySelector(".dropdown-menu").classList.add("show");
    this.querySelector('[data-toggle="dropdown"]').setAttribute(
      "aria-expanded",
      "true"
    );
  }
  function close(e) {
    this.classList.remove("show");
    this.querySelector(".dropdown-menu").classList.remove("show");
    this.querySelector('[data-toggle="dropdown"]').setAttribute(
      "aria-expanded",
      "false"
    );
  }

  function handle(mq) {
    mq.matches ? bindHover() : unbindHover();
  }
  handle(mq);
  mq.addListener(handle);
})();

//Apertura de modal + anterior y siguiente
(function () {
  var $modal = $("#serviceModal");
  var cards = [].slice.call(document.querySelectorAll(".service-card"));
  var $title = document.getElementById("serviceTitle");
  var $text = document.getElementById("serviceText");
  var $img = document.getElementById("serviceImg");
  var $slide = document.querySelector(".service-modal-slide");
  var current = 0;
  var DURATION = 350; // ms – debe coincidir con .35s del CSS

  function fillFromCard(i) {
    var c = cards[i];
    $title.textContent = c.dataset.title || "";
    $text.textContent = c.dataset.text || "";
    $img.src = c.dataset.img || "";
    $img.alt = c.dataset.title || "";
  }

  function animateSwap(dir) {
    // dir: 'next' | 'prev'
    // etapa 1: salir
    $slide.classList.remove(
      "slide-in-from-left",
      "slide-in-from-right",
      "slide-in-active"
    );
    $slide.classList.add(dir === "next" ? "slide-out-left" : "slide-out-right");
    setTimeout(function () {
      // actualizar contenido
      fillFromCard(current);
      // etapa 2: entrar
      $slide.classList.remove("slide-out-left", "slide-out-right");
      $slide.classList.add(
        dir === "next" ? "slide-in-from-right" : "slide-in-from-left"
      );
      // forzar reflow para arrancar transición
      void $slide.offsetWidth;
      $slide.classList.add("slide-in-active");
    }, DURATION);
  }

  function show(i) {
    if (i < 0) i = cards.length - 1;
    if (i >= cards.length) i = 0;
    current = i;
    fillFromCard(current);
    $slide.classList.remove(
      "slide-out-left",
      "slide-out-right",
      "slide-in-from-left",
      "slide-in-from-right"
    );
    $slide.classList.add("slide-in-active");
    $modal.modal({ backdrop: true, keyboard: true }).modal("show");
  }

  // click en cards
  cards.forEach(function (c, idx) {
    c.addEventListener("click", function () {
      show(idx);
    });
  });

  // navegación
  document
    .querySelector("#serviceModal .prev")
    .addEventListener("click", function () {
      current = (current - 1 + cards.length) % cards.length;
      animateSwap("prev");
    });
  document
    .querySelector("#serviceModal .next")
    .addEventListener("click", function () {
      current = (current + 1) % cards.length;
      animateSwap("next");
    });

  // cierre con la X (backup si data-dismiss no actuara)
  document
    .querySelector("#serviceModal .service-close")
    .addEventListener("click", function () {
      $modal.modal("hide");
    });

  // teclado
  document.addEventListener("keydown", function (e) {
    if (!$modal.hasClass("show")) return;
    if (e.key === "Escape") $modal.modal("hide");
    if (e.key === "ArrowLeft") {
      current = (current - 1 + cards.length) % cards.length;
      animateSwap("prev");
    }
    if (e.key === "ArrowRight") {
      current = (current + 1) % cards.length;
      animateSwap("next");
    }
  });
})();
