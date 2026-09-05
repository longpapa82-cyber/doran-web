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
    var typing = document.getElementById("chat-typing");
    if (!steps.length) return;

    // reduced-motion: 전부 노출 + 마지막 표정
    if (reduce || !("IntersectionObserver" in window)) {
      bubbles.forEach(function (b) { b.classList.add("show"); });
      if (avatar) setExp(avatar, "smile");
      return;
    }

    // 모바일(sticky 해제): 폰 말풍선은 전부 노출(정적 완결), 스텝 카드 진입 시 표정만 반응.
    // 폰이 스크롤로 사라지므로 누적 연출 대신 완결된 대화를 상단에 보여주는 게 안정적.
    var isMobile = window.matchMedia("(max-width: 860px)").matches;
    if (isMobile) {
      bubbles.forEach(function (b) { b.classList.add("show"); });
      if (avatar) setExp(avatar, "smile");
      var moIo = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          steps.forEach(function (st) { st.classList.toggle("active", st === e.target); });
        });
      }, { threshold: 0.5, rootMargin: "-15% 0px -25% 0px" });
      steps.forEach(function (st) { moIo.observe(st); });
      return;
    }

    var lastIdx = -1;
    var typeTimer = null;
    function showUpTo(idx) {
      bubbles.forEach(function (b, i) { b.classList.toggle("show", i <= idx); });
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var idx = parseInt(e.target.getAttribute("data-step"), 10);
        var exp = e.target.getAttribute("data-exp") || "listen";
        steps.forEach(function (st) { st.classList.toggle("active", st === e.target); });

        var forward = idx > lastIdx;
        var isAiBubble = bubbles[idx] && bubbles[idx].classList.contains("ai");
        if (typeTimer) { clearTimeout(typeTimer); typeTimer = null; }
        if (typing) typing.classList.remove("show");

        if (forward && isAiBubble && typing) {
          // 도란이 답 직전: 이전 말풍선까지 노출 + 타이핑 인디케이터 → 잠깐 후 말풍선 pop
          showUpTo(idx - 1);
          typing.classList.add("show");
          if (avatar) setExp(avatar, "think");
          typeTimer = setTimeout(function () {
            typing.classList.remove("show");
            showUpTo(idx);
            if (avatar) setExp(avatar, exp);
            typeTimer = null;
          }, 640);
        } else {
          showUpTo(idx);
          if (avatar) setExp(avatar, exp);
        }
        lastIdx = idx;
      });
    }, { threshold: 0.55, rootMargin: "-20% 0px -20% 0px" });
    steps.forEach(function (st) { io.observe(st); });
  }

  function setExp(host, exp) {
    if (window.setDoraniExpression) window.setDoraniExpression(host, exp, { age: "peer" });
  }

  /* ── 친구 만들기 ── */
  function initFriendMaker() {
    var stage = document.getElementById("maker-dorani");
    if (!stage || !window.mountDorani) return;
    var state = { gender: "neutral", age: "peer", tone: "casual", exp: "smile" };
    var nameEl = document.querySelector(".friend-name");
    var greetEl = document.querySelector(".friend-greet");

    // 인사말: 연령 × 말투(반말/존댓말) 조합
    var GREET = {
      casual: {
        peer: "안녕! 나랑 편하게 얘기하자 :)",
        elder: "왔어? 오늘 하루 어땠는지 얘기해줘.",
        younger: "안뇽! 나한테 다 말해도 돼!",
      },
      polite: {
        peer: "안녕하세요! 편하게 이야기 나눠요.",
        elder: "오셨어요? 오늘 하루 어떠셨는지 들려주세요.",
        younger: "안녕하세요! 무슨 얘기든 다 들어드릴게요.",
      },
    };

    function greetText() {
      return (GREET[state.tone] || GREET.casual)[state.age] || GREET.casual.peer;
    }
    function mount() {
      window.mountDorani(stage, { age: state.age, gender: state.gender, expression: state.exp });
    }
    function updateText() {
      if (nameEl && window.doraniDefaultName) nameEl.textContent = window.doraniDefaultName(state.age, state.gender);
      if (greetEl) {
        if (window.effects && window.effects.typeText) window.effects.typeText(greetEl, greetText(), 36);
        else greetEl.textContent = greetText();
      }
    }

    document.querySelectorAll("[data-maker]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var key = btn.getAttribute("data-maker"); // gender | age | tone
        state[key] = btn.getAttribute("data-val");
        var group = btn.parentElement;
        group.querySelectorAll(".chip").forEach(function (c) { c.classList.remove("on"); });
        btn.classList.add("on");

        if (key === "tone") {
          // 말투만 바꾸면 캐릭터는 그대로, 인사말만 타이핑 갱신
          updateText();
          return;
        }
        // gender/age 변경 → 재마운트 + 튀는 pulse + cheer→smile
        state.exp = "smile";
        mount();
        updateText();
        if (!reduce && window.doraniPulse) {
          window.doraniPulse(stage);
          if (window.setDoraniExpression) {
            window.setDoraniExpression(stage, "cheer", { age: state.age });
            setTimeout(function () { window.setDoraniExpression(stage, "smile", { age: state.age }); }, 560);
          }
        }
      });
    });

    mount();
    if (nameEl && window.doraniDefaultName) nameEl.textContent = window.doraniDefaultName(state.age, state.gender);
    if (greetEl) greetEl.textContent = greetText(); // 초기엔 타이핑 없이 즉시
  }

  /* ── 늦은 밤 별 + 유성 ── */
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

    // 유성: 섹션이 보일 때만 주기적으로 스윽. Math.random 회피 → 카운터 기반 위치 변주.
    var meteor = document.createElement("span");
    meteor.className = "meteor";
    box.appendChild(meteor);
    var visible = false, count = 0, timer = null;
    function shoot() {
      if (!visible) return;
      count++;
      meteor.style.left = (30 + (count * 23) % 55) + "%";
      meteor.style.top = (5 + (count * 17) % 30) + "%";
      meteor.classList.remove("shoot");
      void meteor.offsetWidth;
      meteor.classList.add("shoot");
    }
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          visible = e.isIntersecting;
          if (visible && !timer) { timer = setInterval(shoot, 4200); setTimeout(shoot, 800); }
          else if (!visible && timer) { clearInterval(timer); timer = null; }
        });
      }, { threshold: 0.2 });
      io.observe(document.querySelector(".night"));
    }
  }
})();
