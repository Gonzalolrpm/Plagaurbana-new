// js/script.js

// Usamos el modo estricto de JavaScript para un código más limpio y seguro.
"use strict";

document.addEventListener("DOMContentLoaded", function() {

    // --- MANEJO DEL FORMULARIO DE CONTACTO CON reCAPTCHA v3 ---
    const contactForm = document.getElementById("contact-form");
    const formMessage = document.getElementById("form-message");

    if (contactForm) {
        contactForm.addEventListener("submit", function(e) {
            e.preventDefault(); // Prevenimos que el formulario se envíe de la forma tradicional.

            // IMPORTANTE: Reemplaza con tu "Site Key" de reCAPTCHA v3.
            const recaptchaSiteKey = 'TU_RECAPTCHA_SITE_KEY'; 
            
            formMessage.textContent = 'Enviando...';
            formMessage.style.color = '#333';

            grecaptcha.ready(function() {
                grecaptcha.execute(recaptchaSiteKey, {action: 'submit'}).then(function(token) {
                    
                    const recaptchaInput = document.getElementById('g-recaptcha-response');
                    if (recaptchaInput) {
                        recaptchaInput.value = token;
                    }

                    const formData = new FormData(contactForm);

                    fetch('contact.php', {
                        method: 'POST',
                        body: formData
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            formMessage.textContent = '¡Gracias! Tu mensaje ha sido enviado.';
                            formMessage.style.color = 'green';
                            contactForm.reset();
                        } else {
                            formMessage.textContent = 'Error: ' + (data.message || 'No se pudo enviar.');
                            formMessage.style.color = 'red';
                        }
                    })
                    .catch(error => {
                        console.error('Error:', error);
                        formMessage.textContent = 'Hubo un error de conexión. Inténtalo de nuevo.';
                        formMessage.style.color = 'red';
                    });
                });
            });
        });
    }


    // --- CIERRE AUTOMÁTICO DEL MENÚ MÓVIL (Bootstrap 4/5) ---
    document.addEventListener('click', function (event) {
        const isClickInsideNavbar = event.target.closest('.navbar');
        const isNavbarToggler = event.target.closest('.navbar-toggler');
        const navbarCollapse = document.querySelector('.navbar-collapse');

        if (navbarCollapse && navbarCollapse.classList.contains('show') && !isClickInsideNavbar && !isNavbarToggler) {
            const bsCollapse = new bootstrap.Collapse(navbarCollapse, {
                toggle: false
            });
            bsCollapse.hide();
        }
    });


    // --- SMOOTH SCROLL PARA ENLACES INTERNOS (anclas) ---
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);

            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    
    // --- ANIMACIÓN DE HORMIGAS CAMINANDO (VERSIÓN VERTICAL) ---
    function initAntAnimation() {
        // No ejecutar en pantallas pequeñas para no molestar
        if (window.innerWidth < 768) {
            return;
        }

        const ANT_COUNT = 5; // Número de hormigas iniciales

        function createAnt() {
            const ant = document.createElement('div');
            ant.classList.add('ant');
            document.body.appendChild(ant);

            const startX = Math.random() * window.innerWidth;
            const startY = window.innerHeight + 100;
            const endY = -100;
            const angle = -90; // Siempre apuntan hacia arriba
            const duration = Math.random() * 8 + 12; // Duración del viaje
            const delay = Math.random() * 5; // Retraso antes de empezar

            ant.style.left = `${startX}px`;
            ant.style.top = `${startY}px`;
            ant.style.transform = `rotate(${angle}deg)`;
            ant.style.transition = `top ${duration}s linear`;
            ant.style.transitionDelay = `${delay}s`;
            
            ant.getBoundingClientRect(); 

            ant.style.top = `${endY}px`;
            
            // Eliminar la hormiga del DOM cuando termina su animación
            setTimeout(() => {
                ant.remove();
            }, (duration + delay + 1) * 1000);
        }

        // Crear el lote inicial de hormigas
        for (let i = 0; i < ANT_COUNT; i++) {
            setTimeout(createAnt, i * 3000);
        }
        
        // Crear una nueva hormiga cada cierto tiempo para mantener el efecto
        setInterval(createAnt, 6000);
    }

    // --- Iniciar la animación de hormigas ---
    initAntAnimation(); 


    // ==================================
    // LÓGICA PARA EL WIDGET DE WHATSAPP AVANZADO
    // ==================================
    const whatsappWidget = document.getElementById('whatsapp-widget');
    const whatsappButton = document.getElementById('whatsapp-button');
    const whatsappModal = document.getElementById('whatsapp-modal');
    const closeModalButton = document.getElementById('close-modal-button');
    const openWhatsappButton = document.getElementById('open-whatsapp-button');
    const whatsappModalBackdrop = document.querySelector('.whatsapp-modal-backdrop');

    // 1. Hacer visible el botón después de 3 segundos
    setTimeout(() => {
        if (whatsappWidget) {
            whatsappWidget.classList.add('visible');
        }
    }, 3000);

    // 2. Abrir el modal
    if (whatsappButton) {
        whatsappButton.addEventListener('click', () => {
            if (whatsappModal) {
                whatsappModal.classList.add('open');
            }
        });
    }

    // 3. Función para cerrar el modal
    const closeModal = () => {
        if (whatsappModal) {
            whatsappModal.classList.remove('open');
        }
    };

    // 4. Asignar eventos de cierre
    if (closeModalButton) {
        closeModalButton.addEventListener('click', closeModal);
    }
    if (whatsappModalBackdrop) {
        whatsappModalBackdrop.addEventListener('click', closeModal);
    }

    // 5. Lógica para abrir la ventana de WhatsApp
    if (openWhatsappButton) {
        openWhatsappButton.addEventListener('click', () => {
            // Personaliza estos valores
            const whatsappNumber = "5491163086386";
            const whatsappMessage = "¡Hola! Estoy interesado en un servicio de control de plagas. ¿Podrían darme más información?";
            
            const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;
            window.open(url, '_blank');
        });
    }
    
});

// Hover abre dropdown en desktop; click en mobile
(function () {
  var mq = window.matchMedia('(min-width: 992px)'); // lg+
  var dropdown = document.querySelectorAll('.navbar .dropdown');

  function bindHover() {
    dropdown.forEach(function (dd) {
      dd.addEventListener('mouseenter', open);
      dd.addEventListener('mouseleave', close);
    });
  }
  function unbindHover() {
    dropdown.forEach(function (dd) {
      dd.removeEventListener('mouseenter', open);
      dd.removeEventListener('mouseleave', close);
    });
  }
  function open(e){ this.classList.add('show'); this.querySelector('.dropdown-menu').classList.add('show'); this.querySelector('[data-toggle="dropdown"]').setAttribute('aria-expanded','true'); }
  function close(e){ this.classList.remove('show'); this.querySelector('.dropdown-menu').classList.remove('show'); this.querySelector('[data-toggle="dropdown"]').setAttribute('aria-expanded','false'); }

  function handle(mq){ mq.matches ? bindHover() : unbindHover(); }
  handle(mq); mq.addListener(handle);
})();

//Apertura de modal + anterior y siguiente
(function(){
  var $modal   = $('#serviceModal');
  var cards    = [].slice.call(document.querySelectorAll('.service-card'));
  var $title   = document.getElementById('serviceTitle');
  var $text    = document.getElementById('serviceText');
  var $img     = document.getElementById('serviceImg');
  var $slide   = document.querySelector('.service-modal-slide');
  var current  = 0;
  var DURATION = 350; // ms – debe coincidir con .35s del CSS

  function fillFromCard(i){
    var c = cards[i];
    $title.textContent = c.dataset.title || '';
    $text.textContent  = c.dataset.text  || '';
    $img.src           = c.dataset.img   || '';
    $img.alt           = c.dataset.title || '';
  }

  function animateSwap(dir){ // dir: 'next' | 'prev'
    // etapa 1: salir
    $slide.classList.remove('slide-in-from-left','slide-in-from-right','slide-in-active');
    $slide.classList.add(dir === 'next' ? 'slide-out-left' : 'slide-out-right');
    setTimeout(function(){
      // actualizar contenido
      fillFromCard(current);
      // etapa 2: entrar
      $slide.classList.remove('slide-out-left','slide-out-right');
      $slide.classList.add(dir === 'next' ? 'slide-in-from-right' : 'slide-in-from-left');
      // forzar reflow para arrancar transición
      void $slide.offsetWidth;
      $slide.classList.add('slide-in-active');
    }, DURATION);
  }

  function show(i){
    if (i < 0) i = cards.length - 1;
    if (i >= cards.length) i = 0;
    current = i;
    fillFromCard(current);
    $slide.classList.remove('slide-out-left','slide-out-right','slide-in-from-left','slide-in-from-right');
    $slide.classList.add('slide-in-active');
    $modal.modal({ backdrop: true, keyboard: true }).modal('show');
  }

  // click en cards
  cards.forEach(function(c, idx){ c.addEventListener('click', function(){ show(idx); }); });

  // navegación
  document.querySelector('#serviceModal .prev').addEventListener('click', function(){
    current = (current - 1 + cards.length) % cards.length;
    animateSwap('prev');
  });
  document.querySelector('#serviceModal .next').addEventListener('click', function(){
    current = (current + 1) % cards.length;
    animateSwap('next');
  });

  // cierre con la X (backup si data-dismiss no actuara)
  document.querySelector('#serviceModal .service-close')
    .addEventListener('click', function(){ $modal.modal('hide'); });

  // teclado
  document.addEventListener('keydown', function(e){
    if (!$modal.hasClass('show')) return;
    if (e.key === 'Escape')     $modal.modal('hide');
    if (e.key === 'ArrowLeft')  { current = (current - 1 + cards.length) % cards.length; animateSwap('prev'); }
    if (e.key === 'ArrowRight') { current = (current + 1) % cards.length; animateSwap('next'); }
  });
})();
