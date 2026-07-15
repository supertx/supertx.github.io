(() => {
  "use strict";

  const PRIZES = [88, 188, 288, 388, 588, 688, 888, 1288];
  const MAX_DRAWS = 3;
  const MIN_TOTAL = 2000;
  const MAX_TOTAL = 2500;
  const STORAGE_KEY = "jinfu-github-pages-v3";
  const DRAW_BLESSINGS = [
    "金喜入怀，好运常在",
    "福气盈门，喜乐绵长",
    "祥光满堂，万事胜意",
  ];
  const PARTICLES = [
    ["coin", "-142px", "-126px", "-18deg", "0ms"],
    ["spark", "-94px", "-164px", "22deg", "80ms"],
    ["ingot", "-46px", "-146px", "-12deg", "130ms"],
    ["coin", "8px", "-178px", "38deg", "10ms"],
    ["spark", "64px", "-150px", "0deg", "170ms"],
    ["coin", "116px", "-132px", "28deg", "60ms"],
    ["ingot", "148px", "-88px", "18deg", "120ms"],
    ["spark", "158px", "-30px", "0deg", "210ms"],
    ["coin", "132px", "34px", "-28deg", "30ms"],
    ["spark", "96px", "92px", "0deg", "150ms"],
    ["ingot", "52px", "122px", "15deg", "90ms"],
    ["coin", "2px", "148px", "-8deg", "190ms"],
    ["spark", "-52px", "128px", "0deg", "40ms"],
    ["coin", "-102px", "102px", "34deg", "110ms"],
    ["ingot", "-146px", "58px", "-20deg", "20ms"],
    ["spark", "-164px", "4px", "0deg", "180ms"],
  ];

  const byId = (id) => document.getElementById(id);
  const elements = {
    experience: byId("experience"),
    chancePill: byId("chance-pill"),
    remaining: byId("remaining-count"),
    wheel: byId("wheel"),
    wheelFace: byId("wheel-face"),
    bulbRing: byId("bulb-ring"),
    drawButton: byId("draw-button"),
    drawButtonTitle: byId("draw-button-title"),
    drawButtonSubtitle: byId("draw-button-subtitle"),
    particleLayer: byId("particle-layer"),
    progress: byId("draw-progress"),
    total: byId("total-amount"),
    claimCard: byId("claim-card"),
    claimButton: byId("claim-button"),
    claimButtonText: byId("claim-button-text"),
    claimLocked: byId("claim-locked"),
    claimLockedText: byId("claim-locked-text"),
    liveStatus: byId("live-status"),
    resultModal: byId("result-modal"),
    resultDialog: byId("result-dialog"),
    resultAmount: byId("result-amount"),
    resultBlessing: byId("result-blessing"),
    resultSubcopy: byId("result-subcopy"),
    resultAction: byId("result-action"),
    packetModal: byId("packet-modal"),
    packetDialog: byId("packet-dialog"),
    packetDialogHeading: byId("packet-dialog-heading"),
    packetClose: byId("packet-close"),
    redPacket: byId("red-packet"),
    openSeal: byId("open-seal"),
    openSealTitle: byId("open-seal-title"),
    openSealSubtitle: byId("open-seal-subtitle"),
    packetBurst: byId("packet-burst"),
    moneyCard: byId("money-card"),
    moneyHeading: byId("money-heading"),
    packetTotal: byId("packet-total"),
    packetAccept: byId("packet-accept"),
  };

  const state = {
    history: [],
    plan: [],
    rotation: 0,
    spinning: false,
    claimed: false,
    packetStage: "closed",
    resultIsFinal: false,
  };
  const prizeLabels = [];
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let spinTimer = null;
  let particleTimer = null;
  let packetTimer = null;
  let activeModal = null;
  let previousOverflow = "";

  const validPlans = [];
  for (const first of PRIZES) {
    for (const second of PRIZES) {
      for (const third of PRIZES) {
        const total = first + second + third;
        if (total >= MIN_TOTAL && total <= MAX_TOTAL) {
          validPlans.push([first, second, third]);
        }
      }
    }
  }

  function formatAmount(amount) {
    return amount.toLocaleString("zh-CN");
  }

  function sanitizeSaved(raw) {
    try {
      const parsed = raw ? JSON.parse(raw) : null;
      const parsedHistory = Array.isArray(parsed?.history)
        ? parsed.history
            .filter((amount) => Number.isFinite(amount) && PRIZES.includes(amount))
            .slice(0, MAX_DRAWS)
        : [];
      const plan = Array.isArray(parsed?.plan) && parsed.plan.length === MAX_DRAWS
        ? parsed.plan.filter((amount) => Number.isFinite(amount) && PRIZES.includes(amount))
        : [];
      const planTotal = plan.reduce((sum, amount) => sum + amount, 0);
      const planIsValid =
        plan.length === MAX_DRAWS &&
        planTotal >= MIN_TOTAL &&
        planTotal <= MAX_TOTAL &&
        parsedHistory.every((amount, index) => amount === plan[index]);
      const history = planIsValid ? parsedHistory : [];
      return {
        history,
        plan: planIsValid ? plan : [],
        claimed: history.length === MAX_DRAWS && parsed?.claimed === true,
      };
    } catch {
      return { history: [], plan: [], claimed: false };
    }
  }

  function readSaved() {
    try {
      return sanitizeSaved(window.localStorage.getItem(STORAGE_KEY));
    } catch {
      return null;
    }
  }

  function writeSaved(history, claimed) {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ history, plan: state.plan, claimed }),
      );
    } catch {
      // The experience remains usable when browser storage is unavailable.
    }
  }

  function applySaved(saved) {
    if (!saved) return;
    state.history = [...saved.history];
    state.plan = [...saved.plan];
    state.claimed = saved.claimed;
    updateUI();
  }

  function totalAmount() {
    return state.history.reduce((sum, amount) => sum + amount, 0);
  }

  function remainingDraws() {
    return MAX_DRAWS - state.history.length;
  }

  function announce(message) {
    elements.liveStatus.textContent = message;
  }

  function secureRandomIndex(length) {
    const range = 2 ** 32;
    const limit = Math.floor(range / length) * length;
    const random = new Uint32Array(1);
    do {
      window.crypto.getRandomValues(random);
    } while (random[0] >= limit);
    return random[0] % length;
  }

  function createDrawPlan() {
    return [...validPlans[secureRandomIndex(validPlans.length)]];
  }

  function buildDecorations() {
    for (let index = 0; index < 16; index += 1) {
      const bulb = document.createElement("i");
      bulb.style.transform = `rotate(${index * 22.5}deg)`;
      elements.bulbRing.appendChild(bulb);
    }

    PRIZES.forEach((prize, index) => {
      const spoke = document.createElement("div");
      spoke.className = "label-spoke";
      spoke.style.transform = `rotate(${index * 45}deg)`;
      const label = document.createElement("span");
      label.className = "prize-label";
      const currency = document.createElement("small");
      currency.textContent = "¥";
      label.append(currency, document.createTextNode(formatAmount(prize)));
      spoke.appendChild(label);
      elements.wheelFace.appendChild(spoke);
      prizeLabels.push(label);
    });
    const medallion = document.createElement("div");
    medallion.className = "wheel-medallion";
    medallion.setAttribute("aria-hidden", "true");
    elements.wheelFace.appendChild(medallion);

    PARTICLES.forEach(([type, x, y, rotation, delay]) => {
      const particle = document.createElement("span");
      particle.className = `particle particle-${type}`;
      particle.style.setProperty("--x", x);
      particle.style.setProperty("--y", y);
      particle.style.setProperty("--r", rotation);
      particle.style.setProperty("--delay", delay);
      elements.particleLayer.appendChild(particle);
    });

    for (let index = 0; index < 12; index += 1) {
      const ray = document.createElement("i");
      ray.style.transform = `rotate(${index * 30}deg)`;
      elements.packetBurst.appendChild(ray);
    }
    updateWheel();
  }

  function updateWheel() {
    elements.wheel.style.transform = `rotate(${state.rotation}deg)`;
    prizeLabels.forEach((label, index) => {
      label.style.transform = `translateX(-50%) rotate(${-index * 45 - state.rotation}deg)`;
    });
  }

  function updateUI() {
    const remaining = remainingDraws();
    const completed = remaining === 0;
    elements.remaining.textContent = String(remaining);
    elements.chancePill.setAttribute("aria-label", `剩余 ${remaining} 次抽奖机会`);
    elements.total.textContent = formatAmount(totalAmount());

    [...elements.progress.children].forEach((slot, index) => {
      const amount = state.history[index];
      slot.classList.toggle("filled", Boolean(amount));
      slot.querySelector("strong").textContent = amount
        ? `¥${formatAmount(amount)}`
        : "待纳福";
    });

    elements.drawButton.disabled = state.spinning || completed;
    elements.drawButtonTitle.textContent = state.spinning
      ? "纳福中"
      : completed
        ? "圆满"
        : "抽奖";
    elements.drawButtonSubtitle.textContent = state.spinning
      ? "请稍候"
      : completed
        ? "三喜已齐"
        : "转一次";
    elements.drawButton.setAttribute(
      "aria-label",
      completed
        ? "三次抽奖已完成"
        : state.spinning
          ? "抽奖进行中"
          : `开始抽奖，还剩 ${remaining} 次`,
    );

    elements.claimCard.hidden = !completed;
    elements.claimLocked.hidden = completed;
    elements.claimLockedText.textContent = `再抽 ${remaining} 次，立即领奖红包将解锁`;
    elements.claimButtonText.textContent = state.claimed ? "查看红包" : "立即领奖";
  }

  function showModal(modal, dialog, focusTarget) {
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    elements.experience.setAttribute("inert", "");
    modal.hidden = false;
    activeModal = { modal, dialog };
    window.requestAnimationFrame(() => (focusTarget || dialog).focus());
  }

  function hideModal(modal, returnFocus) {
    modal.hidden = true;
    activeModal = null;
    elements.experience.removeAttribute("inert");
    document.body.style.overflow = previousOverflow;
    if (returnFocus) window.requestAnimationFrame(() => returnFocus.focus());
  }

  function closeResult(returnFocus = true) {
    const target = state.resultIsFinal ? elements.claimButton : elements.drawButton;
    hideModal(elements.resultModal, returnFocus ? target : null);
  }

  function showResult(amount, drawNumber) {
    const remaining = remainingDraws();
    state.resultIsFinal = drawNumber === MAX_DRAWS;
    elements.resultAmount.textContent = formatAmount(amount);
    elements.resultBlessing.textContent = DRAW_BLESSINGS[(drawNumber - 1) % DRAW_BLESSINGS.length];
    elements.resultSubcopy.textContent = state.resultIsFinal
      ? "三份喜气已经集齐，红包领奖已解锁"
      : `还可转动 ${remaining} 次金运盘`;
    elements.resultAction.textContent = state.resultIsFinal ? "去领取红包" : "收下喜气";
    showModal(elements.resultModal, elements.resultDialog, elements.resultAction);
  }

  function celebrate() {
    elements.particleLayer.classList.remove("is-active");
    void elements.particleLayer.offsetWidth;
    elements.particleLayer.classList.add("is-active");
    if (particleTimer) window.clearTimeout(particleTimer);
    particleTimer = window.setTimeout(
      () => elements.particleLayer.classList.remove("is-active"),
      reducedMotion.matches ? 40 : 2400,
    );
  }

  function finishDraw(prizeIndex, drawNumber, reservedHistory) {
    const amount = PRIZES[prizeIndex];
    state.history = reservedHistory;
    state.spinning = false;
    spinTimer = null;
    writeSaved(state.history, false);
    updateUI();
    celebrate();
    showResult(amount, drawNumber);
    announce(
      drawNumber === MAX_DRAWS
        ? `第三次抽中 ${amount} 元，三次抽奖已经完成`
        : `第 ${drawNumber} 次抽中 ${amount} 元`,
    );
    window.navigator.vibrate?.([45, 35, 80]);
  }

  function startDraw() {
    if (state.spinning || remainingDraws() <= 0) return;

    const saved = readSaved();
    const storageMatches =
      !saved ||
      (saved.history.length === state.history.length &&
        saved.history.every((amount, index) => amount === state.history[index]) &&
        saved.plan.length === state.plan.length &&
        saved.plan.every((amount, index) => amount === state.plan[index]));
    if (!storageMatches && saved) {
      applySaved(saved);
      announce("抽奖记录刚刚更新，请再点击一次抽奖");
      return;
    }

    if (state.plan.length !== MAX_DRAWS) {
      state.plan = createDrawPlan();
      writeSaved(state.history, false);
    }

    const plannedAmount = state.plan[state.history.length];
    const prizeIndex = PRIZES.indexOf(plannedAmount);
    const segmentAngle = 360 / PRIZES.length;
    const currentModulo = ((state.rotation % 360) + 360) % 360;
    const targetModulo = ((-prizeIndex * segmentAngle) % 360 + 360) % 360;
    const alignment = (targetModulo - currentModulo + 360) % 360;
    const drawNumber = state.history.length + 1;
    const reservedHistory = [...state.history, plannedAmount];

    writeSaved(reservedHistory, false);
    state.spinning = true;
    state.rotation += 6 * 360 + alignment;
    updateWheel();
    updateUI();
    announce(`第 ${drawNumber} 次抽奖，转盘正在转动`);
    spinTimer = window.setTimeout(
      () => finishDraw(prizeIndex, drawNumber, reservedHistory),
      reducedMotion.matches ? 80 : 4200,
    );
  }

  function renderPacket() {
    elements.redPacket.className = `red-packet packet-${state.packetStage}`;
    const revealed = state.packetStage === "revealed";
    const opening = state.packetStage === "opening";
    elements.packetDialogHeading.textContent = revealed ? "红包领取结果" : "领取添丁纳福红包";
    elements.openSeal.hidden = revealed;
    elements.openSeal.disabled = opening;
    elements.openSeal.setAttribute("aria-busy", String(opening));
    elements.openSeal.setAttribute("aria-label", opening ? "红包正在开启" : "点击打开红包");
    elements.openSealTitle.textContent = opening ? "喜" : "開";
    elements.openSealSubtitle.textContent = opening ? "正在开启" : "点击开启";
    elements.moneyCard.hidden = !revealed;
    elements.packetTotal.textContent = formatAmount(totalAmount());
  }

  function showPacket() {
    state.packetStage = state.claimed ? "revealed" : "closed";
    renderPacket();
    showModal(
      elements.packetModal,
      elements.packetDialog,
      state.packetStage === "revealed" ? elements.moneyHeading : elements.openSeal,
    );
  }

  function openPacket() {
    if (state.packetStage !== "closed" || packetTimer) return;
    state.packetStage = "opening";
    renderPacket();
    announce("红包正在开启");
    window.navigator.vibrate?.([35, 30, 35]);
    packetTimer = window.setTimeout(() => {
      packetTimer = null;
      state.packetStage = "revealed";
      state.claimed = true;
      writeSaved(state.history, true);
      renderPacket();
      announce(`红包已开启，累计金额 ${totalAmount()} 元`);
      window.requestAnimationFrame(() => elements.moneyHeading.focus());
      window.navigator.vibrate?.([60, 30, 100]);
    }, reducedMotion.matches ? 80 : 850);
  }

  function closePacket() {
    if (packetTimer) {
      window.clearTimeout(packetTimer);
      packetTimer = null;
    }
    if (state.packetStage === "opening") {
      state.packetStage = "closed";
      announce("红包已关闭，可以再次打开");
      renderPacket();
    }
    hideModal(elements.packetModal, elements.claimButton);
  }

  function trapFocus(event) {
    if (!activeModal || event.key !== "Tab") return;
    const focusable = [...activeModal.dialog.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
    )].filter((element) => !element.hidden);
    if (!focusable.length) {
      event.preventDefault();
      activeModal.dialog.focus();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  elements.drawButton.addEventListener("click", startDraw);
  elements.claimButton.addEventListener("click", showPacket);
  elements.openSeal.addEventListener("click", openPacket);
  elements.packetClose.addEventListener("click", closePacket);
  elements.packetAccept.addEventListener("click", closePacket);
  elements.resultAction.addEventListener("click", () => {
    if (state.resultIsFinal) {
      closeResult(false);
      showPacket();
    } else {
      closeResult(true);
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && activeModal) {
      event.preventDefault();
      if (activeModal.modal === elements.packetModal) closePacket();
      else closeResult(true);
      return;
    }
    trapFocus(event);
  });
  window.addEventListener("storage", (event) => {
    if (event.key === STORAGE_KEY && !state.spinning) applySaved(sanitizeSaved(event.newValue));
  });
  window.addEventListener("beforeunload", () => {
    if (spinTimer) window.clearTimeout(spinTimer);
    if (particleTimer) window.clearTimeout(particleTimer);
    if (packetTimer) window.clearTimeout(packetTimer);
  });

  buildDecorations();
  applySaved(readSaved());
  updateUI();
  announce(
    remainingDraws() === 0
      ? "三次抽奖已经完成，可以领取红包"
      : `剩余 ${remainingDraws()} 次抽奖机会`,
  );
})();
