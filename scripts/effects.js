/**
 * 도란도란 홍보 — 인터랙션 효과 모듈 (effects.js)
 * 마우스 parallax, 마그네틱 버튼, 3D 틸트, 타이핑, 도란이 눈 추적, 스크롤 프로그레스, 스크롤스파이.
 *
 * 원칙(계획서 05):
 * - compositor 속성(transform/opacity)만. 부드러운 lerp. Cozy 무드 유지(작은 진폭·느린 속도).
 * - prefers-reduced-motion → 모든 모션 비활성.
 * - parallax/틸트/마그네틱은 pointer:fine(데스크톱)에서만.
 */
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia("(pointer: fine)").matches;
  var lerp = function (a, b, t) { return a + (b - a) * t; };

  document.addEventListener("DOMContentLoaded", function () {
    initScrollProgress();
    initScrollSpy();
    if (reduce) return;              // 아래는 모션 효과
    initHeroOrchestration();
    if (fine) {
      initHeroParallax();
      initMagnetic();
      initTilt();
    }
  });

  /* ── 스크롤 진행 바(상단 얇은 민트) ── */
  function initScrollProgress() {
    var bar = document.createElement("div");
    bar.className = "scroll-progress";
    document.body.appendChild(bar);
    var update = function () {
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      var p = max > 0 ? h.scrollTop / max : 0;
      bar.style.transform = "scaleX(" + p + ")";
    };
    window.addEventListener("scroll", update, { passive: true });
    update();
  }

  /* ── nav 스크롤 스파이(현재 섹션 하이라이트) ── */
  function initScrollSpy() {
    var links = Array.prototype.slice.call(document.querySelectorAll('.nav nav a[href^="#"]'));
    if (!links.length || !("IntersectionObserver" in window)) return;
    var map = {};
    links.forEach(function (a) {
      var id = a.getAttribute("href").slice(1);
      var sec = document.getElementById(id);
      if (sec) map[id] = a;
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          links.forEach(function (a) { a.classList.remove("active"); });
          var a = map[e.target.id];
          if (a) a.classList.add("active");
        }
      });
    }, { threshold: 0, rootMargin: "-45% 0px -45% 0px" });
    Object.keys(map).forEach(function (id) { io.observe(document.getElementById(id)); });
  }

  /* ── 히어로 진입 오케스트레이션(요소 순차 등장) ── */
  function initHeroOrchestration() {
    var items = document.querySelectorAll("[data-orch]");
    items.forEach(function (el, i) {
      el.style.opacity = "0";
      el.style.transform = "translateY(16px)";
      el.style.transition = "opacity .6s cubic-bezier(.16,1,.3,1), transform .6s cubic-bezier(.16,1,.3,1)";
      el.style.transitionDelay = (i * 0.12) + "s";
    });
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        items.forEach(function (el) { el.style.opacity = "1"; el.style.transform = "none"; });
      });
    });
  }

  /* ── 히어로 마우스 시차 + 도란이 눈 추적 ── */
  function initHeroParallax() {
    var hero = document.querySelector(".hero");
    if (!hero) return;
    var layers = [
      { el: document.querySelector(".hero-figure"), depth: 14 },
      { el: document.querySelector(".hero-blob"), depth: 26 },
    ].filter(function (l) { return l.el; });
    var sparks = Array.prototype.slice.call(hero.querySelectorAll(".spark"));
    var doraniHost = document.getElementById("hero-dorani");

    var tx = 0, ty = 0, cx = 0, cy = 0, raf = null;
    hero.addEventListener("mousemove", function (e) {
      var r = hero.getBoundingClientRect();
      tx = (e.clientX - r.left) / r.width - 0.5;   // -0.5..0.5
      ty = (e.clientY - r.top) / r.height - 0.5;
      if (!raf) raf = requestAnimationFrame(tick);
    });
    hero.addEventListener("mouseleave", function () {
      tx = 0; ty = 0; if (!raf) raf = requestAnimationFrame(tick);
    });
    function tick() {
      cx = lerp(cx, tx, 0.08); cy = lerp(cy, ty, 0.08);
      layers.forEach(function (l) {
        l.el.style.transform = "translate(" + (cx * l.depth) + "px," + (cy * l.depth) + "px)";
      });
      sparks.forEach(function (s, i) {
        var d = 8 + (i % 3) * 6;
        s.style.transform = "translate(" + (cx * d) + "px," + (cy * d) + "px)";
      });
      if (doraniHost && window.doraniLookAt) window.doraniLookAt(doraniHost, cx * 2, cy * 2, 3);
      if (Math.abs(cx - tx) > 0.001 || Math.abs(cy - ty) > 0.001) raf = requestAnimationFrame(tick);
      else raf = null;
    }
  }

  /* ── 마그네틱 버튼(커서가 가까우면 살짝 끌림) ── */
  function initMagnetic() {
    var btns = document.querySelectorAll("[data-magnetic]");
    btns.forEach(function (btn) {
      btn.addEventListener("mousemove", function (e) {
        var r = btn.getBoundingClientRect();
        var mx = e.clientX - (r.left + r.width / 2);
        var my = e.clientY - (r.top + r.height / 2);
        btn.style.transform = "translate(" + (mx * 0.18) + "px," + (my * 0.28) + "px)";
      });
      btn.addEventListener("mouseleave", function () {
        btn.style.transform = "translate(0,0)";
      });
    });
  }

  /* ── 3D 틸트 호버(카드) ── */
  function initTilt() {
    var cards = document.querySelectorAll("[data-tilt]");
    cards.forEach(function (card) {
      card.addEventListener("mousemove", function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = "perspective(700px) rotateY(" + (px * 8) + "deg) rotateX(" + (-py * 8) + "deg) translateY(-6px)";
      });
      card.addEventListener("mouseleave", function () {
        card.style.transform = "";
      });
    });
  }

  /* ── 타이핑 효과(문자 단위 노출) ── */
  // effects.typeText(el, text, speed) — 공개 유틸(친구 만들기 인사말 등에서 사용)
  var typeTimers = new WeakMap();
  function typeText(el, text, speed) {
    if (reduce) { el.textContent = text; return; }
    var prev = typeTimers.get(el);
    if (prev) clearInterval(prev);
    el.textContent = "";
    var i = 0;
    var timer = setInterval(function () {
      el.textContent = text.slice(0, ++i);
      if (i >= text.length) { clearInterval(timer); typeTimers.delete(el); }
    }, speed || 38);
    typeTimers.set(el, timer);
  }

  window.effects = { typeText: typeText };
})();
