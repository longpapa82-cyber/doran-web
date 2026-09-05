/**
 * 도란도란 홍보 — 스크롤리텔링 엔진 (바닐라 JS).
 * 1) reveal: 섹션/요소가 뷰포트 진입 시 .in 부여
 * 2) scrolly chat: 각 스텝 진입 시 해당 말풍선 노출 + 도란이 표정 전환
 * 3) nav: 스크롤 시 배경 강화
 * 4) 친구 만들기: 토글 → 도란이 변형 + 인사말
 *
 * prefers-reduced-motion 시: 관찰 없이 전부 즉시 노출(정적 완결).
 * dorani.js(doraniSVG/setDoraniExpression/doraniDefaultName)가 먼저 로드되어야 함.
 */
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.addEventListener("DOMContentLoaded", function () {
    initNav();
    initReveal();
    initHeroDorani();
    initScrollyChat();
    initFriendMaker();
    initStars();
  });

  /* ── NAV ── */
  function initNav() {
    var nav = document.querySelector(".nav");
    if (!nav) return;
    var onScroll = function () {
      nav.classList.toggle("scrolled", window.scrollY > 20);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ── reveal ── */
  function initReveal() {
    var els = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
    if (reduce || !("IntersectionObserver" in window)) {
      els.forEach(function (el) { el.classList.add("in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.16, rootMargin: "0px 0px -8% 0px" });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ── HERO 도란이 ── */
  function initHeroDorani() {
    var host = document.getElementById("hero-dorani");
    if (host && window.mountDorani) {
      window.mountDorani(host, { age: "peer", gender: "neutral", expression: "smile" });
    }
  }

  /* ── SCROLLY CHAT ──
     data-step 스텝들이 스크롤로 지나갈 때마다 phone 안의 말풍선을 누적 노출하고
     도란이 표정을 스텝의 data-exp 로 전환한다. */
  function initScrollyChat() {
    var avatar = document.getElementById("chat-dorani");
    if (avatar && window.mountDorani) {
      window.mountDorani(avatar, { age: "peer", gender: "neutral", expression: "listen" });
    }
    var steps = Array.prototype.slice.call(document.querySelectorAll(".scrolly-step"));
    var bubbles = Array.prototype.slice.call(document.querySelectorAll(".phone-body .bubble"));
    if (!steps.length) return;

    // reduced-motion: 전부 노출 + 마지막 표정
    if (reduce || !("IntersectionObserver" in window)) {
      bubbles.forEach(function (b) { b.classList.add("show"); });
      if (avatar) setExp(avatar, "smile");
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var idx = parseInt(e.target.getAttribute("data-step"), 10);
        var exp = e.target.getAttribute("data-exp") || "listen";
        // 누적 노출: 이 스텝까지의 말풍선 show
        bubbles.forEach(function (b, i) {
          b.classList.toggle("show", i <= idx);
        });
        if (avatar) setExp(avatar, exp);
      });
    }, { threshold: 0.6 });
    steps.forEach(function (st) { io.observe(st); });
  }

  function setExp(host, exp) {
    if (window.setDoraniExpression) window.setDoraniExpression(host, exp, { age: "peer" });
  }

  /* ── 친구 만들기 ── */
  function initFriendMaker() {
    var stage = document.getElementById("maker-dorani");
    if (!stage || !window.mountDorani) return;
    var state = { gender: "neutral", age: "peer", exp: "smile" };
    var nameEl = document.querySelector(".friend-name");
    var greetEl = document.querySelector(".friend-greet");

    var GREET = {
      peer: "안녕! 나랑 편하게 얘기하자 :)",
      elder: "왔어? 오늘 하루 어땠는지 얘기해줘.",
      younger: "안뇽! 나한테 다 말해도 돼!",
    };

    function render() {
      window.mountDorani(stage, { age: state.age, gender: state.gender, expression: state.exp });
      if (nameEl && window.doraniDefaultName) nameEl.textContent = window.doraniDefaultName(state.age, state.gender);
      if (greetEl) greetEl.textContent = GREET[state.age] || GREET.peer;
    }

    document.querySelectorAll("[data-maker]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var key = btn.getAttribute("data-maker"); // gender | age
        var val = btn.getAttribute("data-val");
        state[key] = val;
        // 같은 그룹 chip on 갱신
        var group = btn.parentElement;
        group.querySelectorAll(".chip").forEach(function (c) { c.classList.remove("on"); });
        btn.classList.add("on");
        // 변신 시 잠깐 cheer 로 반응 후 smile 복귀(모션 허용 시)
        if (!reduce) {
          state.exp = "cheer"; render();
          setTimeout(function () { state.exp = "smile"; render(); }, 520);
        } else { state.exp = "smile"; render(); }
      });
    });
    render();
  }

  /* ── 늦은 밤 별 ── */
  function initStars() {
    var box = document.querySelector(".night .stars");
    if (!box || reduce) return;
    var n = 26;
    var frag = document.createDocumentFragment();
    // 결정적 배치(랜덤 대신 해시 유사 분포) — Math.random 회피
    for (var i = 0; i < n; i++) {
      var s = document.createElement("span");
      s.className = "star";
      var x = (i * 37) % 100;
      var y = (i * 53) % 100;
      s.style.left = x + "%";
      s.style.top = y + "%";
      s.style.animationDelay = (i % 6) * 0.5 + "s";
      frag.appendChild(s);
    }
    box.appendChild(frag);
  }
})();
