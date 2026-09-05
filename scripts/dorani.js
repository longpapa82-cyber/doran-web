/**
 * 도란이 캐릭터 — 웹 SVG 포팅.
 * 앱 소스(app/src/components/character/{doraniParts,doraniFace}.ts, Dorani.tsx)의
 * 좌표를 1:1로 옮겨, 브라우저에서 앱과 픽셀 단위로 동일한 도란이를 그린다.
 *
 * 축 3개 독립: 연령(peer/elder/younger) × 성별(neutral/male/female) × 표정(smile/listen/worry/cheer/think)
 * 사용:  el.innerHTML = doraniSVG({ age:'peer', gender:'neutral', expression:'smile' })
 *        setDoraniExpression(el, 'worry')   // 표정만 교체(스크롤리용)
 */

const INK = "#282E38";

/** 연령 축: 실루엣 + 컬러 + 이목구비 비율 (app doraniParts.ts AGES 1:1) */
const AGES = {
  peer: {
    body: "M100 22 C148 22 176 58 176 104 C176 152 146 178 100 178 C54 178 24 152 24 104 C24 58 52 22 100 22 Z",
    ant: "M64 30 Q58 12 70 8 M136 30 Q142 12 130 8",
    fill: "#8FE3D8", line: "#3FA6AE",
    eyeY: 96, eyeXs: [74, 126], eyeR: 7, hiR: 2.4,
    mouthY: 118, mouthDip: 12,
    blush: [[58, 112, 11, 7], [142, 112, 11, 7]],
    accDy: 0,
  },
  elder: {
    body: "M100 12 C142 12 168 50 168 102 C168 156 140 186 100 186 C60 186 32 156 32 102 C32 50 58 12 100 12 Z",
    ant: "M68 20 Q62 2 74 -2 M132 20 Q138 2 126 -2",
    fill: "#8FD3E8", line: "#3F8FAE",
    eyeY: 92, eyeXs: [74, 126], eyeR: 6, hiR: 2,
    mouthY: 114, mouthDip: 9,
    blush: [[60, 108, 9, 6], [140, 108, 9, 6]],
    accDy: -10,
  },
  younger: {
    body: "M100 40 C140 40 166 68 166 108 C166 146 138 170 100 170 C62 170 34 146 34 108 C34 68 60 40 100 40 Z",
    ant: "M70 47 Q64 30 76 26 M130 47 Q136 30 124 26",
    fill: "#F5C9A8", line: "#D68F6A",
    eyeY: 104, eyeXs: [76, 124], eyeR: 8.5, hiR: 3,
    mouthY: 124, mouthDip: 13,
    blush: [[56, 122, 13, 8], [144, 122, 13, 8]],
    accDy: 18,
  },
};

/** 기본 제안 이름 (연령 × 성별) — app DEFAULT_NAMES 1:1 */
const DEFAULT_NAMES = {
  peer: { neutral: "도란", male: "도준", female: "도리" },
  elder: { neutral: "하람", male: "서준", female: "하린" },
  younger: { neutral: "콩이", male: "도토", female: "두리" },
};

/**
 * 표정별 눈·입·눈썹 SVG 마크업 (app doraniFace.ts faceParts() 1:1).
 * 반환: <path>/<circle> 문자열 (표정 그룹 내부).
 */
function faceMarkup(exp, a) {
  const [lx, rx] = a.eyeXs;
  const y = a.eyeY;
  const r = a.eyeR;
  const eyeDy = exp === "think" ? -4 : 0;
  let s = "";

  // 눈
  if (exp === "cheer") {
    s += `<path d="M${lx - r - 2} ${y + 2} Q${lx} ${y - r - 3} ${lx + r + 2} ${y + 2} M${rx - r - 2} ${y + 2} Q${rx} ${y - r - 3} ${rx + r + 2} ${y + 2}" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>`;
  } else {
    // 눈 그룹을 .dorani-eye 로 감싸 lookAt(눈동자 커서 추적) 시 transform 적용.
    for (const x of [lx, rx]) {
      s += `<g class="dorani-eye">`;
      s += `<circle cx="${x}" cy="${y + eyeDy}" r="${r}" fill="${INK}"/>`;
      s += `<circle cx="${x + 2.5}" cy="${y + eyeDy - 2.5}" r="${a.hiR}" fill="#ffffff"/>`;
      s += `</g>`;
    }
  }

  // 눈썹(걱정)
  if (exp === "worry") {
    s += `<path d="M${lx - 10} ${y - 16} L${lx + 10} ${y - 10} M${rx + 10} ${y - 16} L${rx - 10} ${y - 10}" fill="none" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/>`;
  }

  // 입
  const my = a.mouthY;
  const dip = a.mouthDip;
  if (exp === "smile")
    s += `<path d="M${100 - dip} ${my} Q100 ${my + dip} ${100 + dip} ${my}" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>`;
  if (exp === "listen")
    s += `<path d="M${100 - dip + 3} ${my + 4} L${100 + dip - 3} ${my + 4}" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>`;
  if (exp === "worry")
    s += `<path d="M${100 - dip} ${my + 8} Q100 ${my - 1} ${100 + dip} ${my + 8}" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>`;
  if (exp === "cheer")
    s += `<path d="M${100 - dip - 2} ${my - 2} Q100 ${my + dip + 8} ${100 + dip + 2} ${my - 2} Z" fill="#B5504B" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`;
  if (exp === "think")
    s += `<circle cx="100" cy="${my + 4}" r="7" fill="none" stroke="${INK}" stroke-width="4"/>`;

  return s;
}

/** 성별 소품 마크업 (app Dorani.tsx 1:1) */
function genderMarkup(gender, a) {
  if (gender === "female") {
    return `<g>
      <path d="M128 ${6 + a.accDy} l12 -8 v16 z M132 ${6 + a.accDy} l-12 -8 v16 z" fill="#EFAC8D"/>
      <circle cx="130" cy="${6 + a.accDy}" r="4" fill="#D97E62"/>
    </g>`;
  }
  if (gender === "male") {
    return `<g>
      <path d="M62 ${24 + a.accDy} Q100 ${-4 + a.accDy} 138 ${24 + a.accDy} L138 ${32 + a.accDy} Q100 ${16 + a.accDy} 62 ${32 + a.accDy} Z" fill="#3F8FAE"/>
      <rect x="88" y="${2 + a.accDy}" width="24" height="8" rx="4" fill="#2F7490"/>
    </g>`;
  }
  return "";
}

/**
 * 도란이 전체 SVG 문자열.
 * @param {{age?:string, gender?:string, expression?:string, breath?:boolean}} opts
 */
function doraniSVG(opts = {}) {
  const age = opts.age || "peer";
  const gender = opts.gender || "neutral";
  const expression = opts.expression || "smile";
  const a = AGES[age] || AGES.peer;

  const body = `<path d="${a.body}" fill="${a.fill}" stroke="${a.line}" stroke-width="3.5" stroke-linecap="round"/>`;
  const ant = `<path d="${a.ant}" fill="none" stroke="${a.line}" stroke-width="3.5" stroke-linecap="round"/>`;
  const gm = genderMarkup(gender, a);
  const eyeCenter = a.eyeY; // blink 기준
  const face = `<g class="dorani-face" data-eye="${eyeCenter}">${faceMarkup(expression, a)}</g>`;
  const blush = a.blush
    .map(([cx, cy, rx, ry]) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#F0A98C" opacity="0.7"/>`)
    .join("");

  const breathClass = opts.breath === false ? "" : " dorani-breath";
  // 안테나(ant)를 몸통(body)보다 먼저 그려, 몸통이 안테나 밑동을 덮게 → 뜬 틈 방지(자연스러운 연결).
  return `<svg class="dorani${breathClass}" viewBox="0 -18 200 208" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="도란이 캐릭터">
    <g class="dorani-body">
      ${ant}${body}${gm}${face}${blush}
    </g>
  </svg>`;
}

/**
 * SVG 조각 문자열을 SVG 네임스페이스 노드로 파싱해 그룹 자식으로 교체.
 * innerHTML 우회(보안). 입력은 내부 상수 기반이지만 DOM 파싱으로 안전하게 처리.
 */
function replaceFaceParts(groupEl, svgFragment) {
  const doc = new DOMParser().parseFromString(
    `<svg xmlns="http://www.w3.org/2000/svg">${svgFragment}</svg>`,
    "image/svg+xml",
  );
  while (groupEl.firstChild) groupEl.removeChild(groupEl.firstChild);
  const parsed = doc.documentElement;
  while (parsed.firstChild) groupEl.appendChild(parsed.firstChild);
}

/**
 * 이미 렌더된 도란이 요소의 표정만 교체(스크롤리 전환용).
 * @param {HTMLElement} host  도란이 svg 를 담은 컨테이너
 * @param {string} expression
 * @param {{age?:string}} opts
 */
function setDoraniExpression(host, expression, opts = {}) {
  const svg = host.querySelector("svg.dorani");
  if (!svg) return;
  const age = opts.age || svg.getAttribute("data-age") || "peer";
  const a = AGES[age] || AGES.peer;
  const faceG = svg.querySelector(".dorani-face");
  if (faceG) {
    // 크로스페이드: 잠깐 투명 → 새 표정 → 복귀 (CSS transition 이 opacity 를 다룸)
    faceG.style.opacity = "0";
    window.requestAnimationFrame(() => {
      // innerHTML 대신 SVG 노드로 파싱해 안전하게 교체(앱 보안 규율: innerHTML 지양).
      // faceMarkup 은 내부 상수(좌표·고정색)만 생성하지만, DOM 노드 방식이 원칙적으로 안전.
      replaceFaceParts(faceG, faceMarkup(expression, a));
      faceG.style.opacity = "1";
    });
  }
}

/** 기본 이름 헬퍼(친구 만들기 인터랙션용) */
function doraniDefaultName(age, gender) {
  return (DEFAULT_NAMES[age] || DEFAULT_NAMES.peer)[gender] || "도란";
}

/**
 * 도란이 SVG 를 호스트에 안전하게 마운트(innerHTML 우회).
 * doraniSVG 출력은 내부 상수 기반이지만, DOMParser 로 노드 파싱해 삽입한다.
 * @param {HTMLElement} host
 * @param {object} opts  doraniSVG 옵션(+ age 를 data-age 로 기록)
 */
function mountDorani(host, opts) {
  opts = opts || {};
  var markup = doraniSVG(opts);
  var doc = new DOMParser().parseFromString(markup, "image/svg+xml");
  var svg = doc.documentElement;
  svg.setAttribute("data-age", opts.age || "peer");
  while (host.firstChild) host.removeChild(host.firstChild);
  host.appendChild(document.importNode(svg, true));
}

/**
 * 눈동자가 커서(또는 임의 좌표)를 향하게 한다(웹 전용 매력).
 * host 내부 .dorani-eye 그룹에 최대 ±maxPx 범위로 translate 를 건다.
 * @param {HTMLElement} host  도란이 컨테이너
 * @param {number} nx  정규화 x(-1..1) — host 중심 기준
 * @param {number} ny  정규화 y(-1..1)
 * @param {number} [maxPx=3]  최대 이동(SVG 좌표계)
 */
function doraniLookAt(host, nx, ny, maxPx) {
  var max = maxPx == null ? 3 : maxPx;
  var eyes = host.querySelectorAll(".dorani-eye");
  var dx = Math.max(-1, Math.min(1, nx)) * max;
  var dy = Math.max(-1, Math.min(1, ny)) * max;
  for (var i = 0; i < eyes.length; i++) {
    eyes[i].style.transform = "translate(" + dx + "px," + dy + "px)";
    eyes[i].style.transition = "transform .18s cubic-bezier(.16,1,.3,1)";
  }
}

/**
 * 변신·클릭 시 살짝 튀는 pulse(scale). 도란이 body 그룹에 CSS 클래스로 트리거.
 * @param {HTMLElement} host
 */
function doraniPulse(host) {
  var body = host.querySelector(".dorani-body");
  if (!body) return;
  body.classList.remove("pulse");
  // reflow 로 애니메이션 재시작
  void body.offsetWidth;
  body.classList.add("pulse");
}

// 전역 노출(모듈 번들 없이 정적 스크립트로 사용)
window.doraniSVG = doraniSVG;
window.setDoraniExpression = setDoraniExpression;
window.doraniDefaultName = doraniDefaultName;
window.mountDorani = mountDorani;
window.doraniLookAt = doraniLookAt;
window.doraniPulse = doraniPulse;
