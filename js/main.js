/* ==========================================================================
   FSO Advogados — interações do site
   ========================================================================== */
(function () {
  'use strict';

  document.documentElement.classList.add('js');

  var CONFIG = {
    whatsappNumber: '5511943374508',

    // TODO (backend do formulário): quando houver um endpoint de envio
    // (ex.: '/api/contato' ou URL de um serviço como Formspree), defina-o
    // aqui. Enquanto for null, o formulário envia a mensagem pelo WhatsApp.
    formEndpoint: null
  };

  /* ---------- Header: sombra ao rolar ---------- */
  var header = document.getElementById('header');

  function onScroll() {
    header.classList.toggle('is-scrolled', window.scrollY > 8);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Menu mobile ---------- */
  var navToggle = document.getElementById('nav-toggle');
  var nav = document.getElementById('main-nav');

  function closeNav() {
    nav.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.setAttribute('aria-label', 'Abrir menu');
  }

  navToggle.addEventListener('click', function () {
    var isOpen = nav.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
    navToggle.setAttribute('aria-label', isOpen ? 'Fechar menu' : 'Abrir menu');
  });

  // Fecha o menu ao clicar em qualquer link dele
  nav.addEventListener('click', function (event) {
    if (event.target.closest('a')) closeNav();
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') closeNav();
  });

  /* ---------- Accordion das áreas (múltiplos podem ficar abertos) ---------- */
  document.querySelectorAll('.area-card__toggle').forEach(function (toggle) {
    toggle.addEventListener('click', function () {
      var card = toggle.closest('.area-card');
      var isOpen = card.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(isOpen));
    });
  });

  /* ---------- Animações de entrada ---------- */
  var revealEls = document.querySelectorAll('.reveal');
  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if ('IntersectionObserver' in window && !prefersReducedMotion) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    revealEls.forEach(function (el) {
      observer.observe(el);
    });
  } else {
    revealEls.forEach(function (el) {
      el.classList.add('is-visible');
    });
  }

  /* ---------- Formulário de contato ---------- */
  var form = document.getElementById('contact-form');
  var feedback = form.querySelector('.contact-form__feedback');

  function showFeedback(message, type) {
    feedback.textContent = message;
    feedback.classList.remove('is-success', 'is-error');
    feedback.classList.add(type === 'success' ? 'is-success' : 'is-error');
    feedback.hidden = false;
  }

  function getFormData() {
    var areaSelect = form.elements.area;
    return {
      nome: form.elements.nome.value.trim(),
      email: form.elements.email.value.trim(),
      whatsapp: form.elements.whatsapp.value.trim(),
      area: areaSelect.value ? areaSelect.options[areaSelect.selectedIndex].text : '',
      mensagem: form.elements.mensagem.value.trim()
    };
  }

  function buildWhatsAppMessage(data) {
    var lines = [
      'Olá! Acessei o site da FSO Advogados e quero falar sobre meu caso.',
      '',
      '*Nome:* ' + data.nome
    ];
    if (data.email) lines.push('*E-mail:* ' + data.email);
    if (data.whatsapp) lines.push('*WhatsApp:* ' + data.whatsapp);
    if (data.area) lines.push('*Área de interesse:* ' + data.area);
    lines.push('*Mensagem:* ' + data.mensagem);
    return lines.join('\n');
  }

  function sendViaWhatsApp(data) {
    var url =
      'https://wa.me/' +
      CONFIG.whatsappNumber +
      '?text=' +
      encodeURIComponent(buildWhatsAppMessage(data));
    window.open(url, '_blank', 'noopener');
    showFeedback('Abrimos o WhatsApp com sua mensagem pronta — é só confirmar o envio por lá.', 'success');
  }

  function sendViaEndpoint(data) {
    return fetch(CONFIG.formEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(function (response) {
      if (!response.ok) throw new Error('HTTP ' + response.status);
      form.reset();
      showFeedback('Mensagem enviada com sucesso! Nossa equipe retornará em breve.', 'success');
    });
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();

    var data = getFormData();
    trackConversion('formulario');

    if (CONFIG.formEndpoint) {
      sendViaEndpoint(data).catch(function () {
        // Backend indisponível: não perde o lead, cai para o WhatsApp
        sendViaWhatsApp(data);
      });
    } else {
      sendViaWhatsApp(data);
    }
  });

  /* ---------- Rastreio de conversões (Google Ads / Analytics) ----------
     Todo link de WhatsApp tem a classe .js-whatsapp-cta e um data-area
     identificando a origem do clique. Quando o gtag estiver ativo no
     <head>, cada clique dispara um evento "whatsapp_click" — basta criar
     a conversão correspondente no Google Ads / GA4. */
  function trackConversion(origin) {
    if (typeof gtag !== 'undefined') {
      gtag('event', 'whatsapp_click', {
        event_category: 'conversao',
        event_label: origin
      });
    }
  }

  document.addEventListener('click', function (event) {
    var cta = event.target.closest('.js-whatsapp-cta');
    if (cta) trackConversion(cta.dataset.area || 'geral');
  });

  /* ---------- Ano do rodapé ---------- */
  var yearEl = document.getElementById('footer-year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
})();
