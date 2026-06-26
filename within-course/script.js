(() => {
  const slides = [...document.querySelectorAll(".slide")];
  const prevButton = document.getElementById("prevButton");
  const nextButton = document.getElementById("nextButton");
  const currentNumber = document.getElementById("currentNumber");
  const totalNumber = document.getElementById("totalNumber");
  const progressFill = document.getElementById("progressFill");
  const tocPanel = document.getElementById("tocPanel");
  const tocList = document.getElementById("tocList");
  const overlay = document.getElementById("overlay");
  const notesPanel = document.getElementById("notesPanel");
  const notesText = document.getElementById("notesText");
  let current = 0;
  let timerSeconds = 0;
  let timerHandle = null;
  let touchStartX = 0;

  totalNumber.textContent = String(slides.length).padStart(2, "0");

  slides.forEach((slide, index) => {
    const button = document.createElement("button");
    button.className = "toc-item";
    button.innerHTML = `<span>${String(index + 1).padStart(2, "0")}</span>${slide.dataset.title}`;
    button.addEventListener("click", () => {
      goTo(index);
      closeToc();
    });
    tocList.appendChild(button);
  });

  function goTo(index) {
    const next = Math.max(0, Math.min(index, slides.length - 1));
    if (next === current) return;
    slides[current].classList.remove("active");
    slides[current].classList.toggle("exit-left", next > current);
    current = next;
    slides.forEach((slide, idx) => {
      if (idx !== current) slide.classList.remove("exit-left");
    });
    slides[current].classList.add("active");
    updateChrome();
  }

  function updateChrome() {
    currentNumber.textContent = String(current + 1).padStart(2, "0");
    progressFill.style.width = `${((current + 1) / slides.length) * 100}%`;
    prevButton.disabled = current === 0;
    nextButton.disabled = current === slides.length - 1;
    [...tocList.children].forEach((item, index) => item.classList.toggle("active", index === current));
    notesText.textContent = slides[current].dataset.notes || "本页暂无备注。";
  }

  function next() { goTo(current + 1); }
  function prev() { goTo(current - 1); }

  prevButton.addEventListener("click", prev);
  nextButton.addEventListener("click", next);
  document.querySelectorAll("[data-next]").forEach(button => button.addEventListener("click", next));
  document.querySelectorAll("[data-goto]").forEach(button => {
    button.addEventListener("click", () => goTo(Number(button.dataset.goto)));
  });

  function openToc() {
    tocPanel.classList.add("open");
    tocPanel.setAttribute("aria-hidden", "false");
    overlay.classList.add("visible");
  }
  function closeToc() {
    tocPanel.classList.remove("open");
    tocPanel.setAttribute("aria-hidden", "true");
    overlay.classList.remove("visible");
  }
  function toggleNotes() {
    notesPanel.classList.toggle("open");
    document.getElementById("notesButton").classList.toggle("active", notesPanel.classList.contains("open"));
  }

  document.getElementById("menuButton").addEventListener("click", openToc);
  document.getElementById("tocClose").addEventListener("click", closeToc);
  overlay.addEventListener("click", closeToc);
  document.getElementById("notesButton").addEventListener("click", toggleNotes);
  document.getElementById("notesClose").addEventListener("click", toggleNotes);

  async function toggleFullscreen() {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen?.();
    } else {
      await document.exitFullscreen?.();
    }
  }
  document.getElementById("fullscreenButton").addEventListener("click", toggleFullscreen);

  function formatTime(total) {
    const min = Math.floor(total / 60);
    const sec = total % 60;
    return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  }
  function toggleTimer() {
    const timer = document.getElementById("timer");
    const timerButton = document.getElementById("timerButton");
    if (timerHandle) {
      clearInterval(timerHandle);
      timerHandle = null;
      timerButton.textContent = "继续";
      return;
    }
    timer.classList.add("visible");
    timerButton.textContent = "暂停";
    timerHandle = setInterval(() => {
      timerSeconds += 1;
      timer.textContent = formatTime(timerSeconds);
      timer.style.color = timerSeconds >= 900 ? "#ff7777" : "";
    }, 1000);
  }
  document.getElementById("timerButton").addEventListener("click", toggleTimer);

  document.addEventListener("keydown", event => {
    const tag = document.activeElement?.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA") return;
    if (event.key === "ArrowRight" || event.key === "PageDown" || event.key === " ") {
      event.preventDefault(); next();
    } else if (event.key === "ArrowLeft" || event.key === "PageUp") {
      event.preventDefault(); prev();
    } else if (event.key === "Home") {
      goTo(0);
    } else if (event.key === "End") {
      goTo(slides.length - 1);
    } else if (event.key.toLowerCase() === "f") {
      toggleFullscreen();
    } else if (event.key.toLowerCase() === "m") {
      tocPanel.classList.contains("open") ? closeToc() : openToc();
    } else if (event.key.toLowerCase() === "n") {
      toggleNotes();
    } else if (event.key.toLowerCase() === "t") {
      toggleTimer();
    } else if (event.key === "Escape") {
      closeToc();
    }
  });

  document.getElementById("stage").addEventListener("touchstart", event => {
    touchStartX = event.changedTouches[0].clientX;
  }, { passive: true });
  document.getElementById("stage").addEventListener("touchend", event => {
    const delta = event.changedTouches[0].clientX - touchStartX;
    if (Math.abs(delta) > 60) delta < 0 ? next() : prev();
  }, { passive: true });

  // Opening question
  const openingFeedback = document.getElementById("openingFeedback");
  document.querySelectorAll("[data-opening-answer]").forEach(button => {
    button.addEventListener("click", () => {
      document.querySelectorAll("[data-opening-answer]").forEach(item => {
        item.classList.toggle("correct", item.dataset.openingAnswer === "different");
        item.classList.toggle("wrong", item.dataset.openingAnswer !== "different");
      });
      const correct = button.dataset.openingAnswer === "different";
      openingFeedback.classList.add("revealed");
      openingFeedback.innerHTML = correct
        ? "<b>答对了：结构存在真实差异。</b><span>不同部位、不同个体，甚至同一人的左右侧，都可能不同。维韧打法因此从 B 超影像开始。</span>"
        : "<b>这正是标准化治疗最容易踩的坑。</b><span>标准化不是“所有人用同一套参数”，而是用同一套决策逻辑处理不同结构。</span>";
    });
  });

  // WITH / IN
  const concepts = {
    with: {
      icon: "↔",
      title: "与医生同行，做长期伙伴",
      text: "用产品、标准、培训、学术与临床支持，把一次设备交付变成长期陪伴。"
    },
    in: {
      icon: "◎",
      title: "面向深层，由内而外年轻",
      text: "关注皮肤、脂肪、肌膜与韧带等深层结构，让改善更协调、更自然。"
    }
  };
  document.querySelectorAll(".concept-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".concept-tab").forEach(item => {
        const active = item === tab;
        item.classList.toggle("active", active);
        item.setAttribute("aria-selected", String(active));
      });
      const concept = concepts[tab.dataset.concept];
      document.getElementById("conceptContent").innerHTML =
        `<div class="concept-icon">${concept.icon}</div><div><h3>${concept.title}</h3><p>${concept.text}</p></div>`;
    });
  });

  // Six-step map
  const stepData = {
    W: ["W", "先回答：<b>“实际结构是什么？”</b>", "Watch｜影像先行", "用 B 超观察治疗区域各层组织厚度与特点，并辅助识别、规避风险区域。", "先看清路况"],
    I1: ["I", "再回答：<b>“目标层次在哪里？”</b>", "Identify｜识别靶层", "识别真皮、脂肪、SMAS 等层次，将影像转化为深度与按压力度参考。", "识别道路层级"],
    T: ["T", "明确：<b>“在哪里做、哪里避开？”</b>", "Target｜精准锁定", "标记神经浅出孔、治疗区、加强线与加强区，把评估结果转成治疗地图。", "锁定目的地"],
    H: ["H", "执行：<b>“如何分层到达？”</b>", "Hierarchy｜分层治疗", "由深至浅、深浅兼治，按区域、层次与耐受选择治疗头、能量和发数。", "按路线平稳驾驶"],
    I2: ["I", "综合：<b>“哪套方案适合这个人？”</b>", "Integrate｜整合决策", "结合客观情况、B超、既往史、诉求与医生审美判断，制定个体化方案。", "综合路况决策"],
    N: ["N", "抵达：<b>“什么才是好结果？”</b>", "Natural｜自然年轻", "在安全边界内，追求自然、协调、保留个人特征的年轻化改善。", "安全自然抵达"]
  };
  document.querySelectorAll(".step-node").forEach(node => {
    node.addEventListener("click", () => {
      document.querySelectorAll(".step-node").forEach(item => item.classList.toggle("active", item === node));
      const [letter, question, title, text, analogy] = stepData[node.dataset.step];
      document.getElementById("stepDetail").innerHTML =
        `<div class="step-big-letter">${letter}</div>
         <div><p class="step-question">${question}</p><h3>${title}</h3><p>${text}</p></div>
         <div class="analogy"><span>导航类比</span><b>${analogy}</b></div>`;
    });
  });

  // Target tabs
  const targetData = {
    base: {
      image: "assets/sop/image16.png",
      alt: "面部三孔四线标记示意",
      label: "安全边界 + 基础分区",
      title: "先标出“三孔”，再完成“四线”",
      text: "标记眶上孔、眶下孔、颏孔；完成刀头评估 A 区与平铺 B 区画线，为治疗头组合与深度选择建立坐标。",
      key: "目的：治疗不“跑偏”"
    },
    lines: {
      image: "assets/sop/image18.png",
      alt: "刀头加强线示意",
      label: "重点路径",
      title: "沿韧带方向设计三条加强线",
      text: "从颊上颌韧带区、口角囊袋区、颏韧带外侧区，分别向外上方韧带支撑区加强。",
      key: "目的：沿结构有章法地加强"
    },
    zones: {
      image: "assets/sop/image19.png",
      alt: "炮头加强区域示意",
      label: "区域分配",
      title: "区分推荐、需评估与不推荐区域",
      text: "加强区域不是越多越好。结合面部结构与 B 超评估，明确推荐加强区、需评估区及不推荐区。",
      key: "目的：有选择地均匀收紧"
    }
  };
  document.querySelectorAll(".target-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".target-tab").forEach(item => item.classList.toggle("active", item === tab));
      const data = targetData[tab.dataset.targetView];
      const image = document.getElementById("targetImage");
      image.src = data.image;
      image.alt = data.alt;
      document.getElementById("targetCopy").innerHTML =
        `<span class="mini-label">${data.label}</span><h3>${data.title}</h3><p>${data.text}</p><div class="target-keyword">${data.key}</div>`;
    });
  });

  // Depth scenario
  document.querySelectorAll("[data-depth-answer]").forEach(button => {
    button.addEventListener("click", () => {
      document.querySelectorAll("[data-depth-answer]").forEach(item => {
        item.classList.toggle("correct", item.dataset.depthAnswer === "b");
        item.classList.toggle("wrong", item.dataset.depthAnswer !== "b");
      });
      const correct = button.dataset.depthAnswer === "b";
      document.getElementById("depthFeedback").innerHTML = correct
        ? "<strong>选择正确。</strong> 深度 ≥ 4.5 mm，SOP 示例建议 MFUS4.5 + MFUS3.0，体现由深至浅、深浅兼治。"
        : "<strong>再看一眼深度。</strong> 4.8 mm 已达到 ≥ 4.5 mm 的区间；示例组合应同时覆盖 4.5 与 3.0 层次。";
    });
  });

  // Integrate evidence
  const evidenceChips = [...document.querySelectorAll(".evidence-chip")];
  const generateButton = document.getElementById("generatePlan");
  evidenceChips.forEach(chip => {
    chip.addEventListener("click", () => {
      chip.classList.toggle("selected");
      const count = evidenceChips.filter(item => item.classList.contains("selected")).length;
      document.getElementById("evidenceCount").textContent = count;
      generateButton.disabled = count !== evidenceChips.length;
    });
  });
  generateButton.addEventListener("click", () => {
    document.getElementById("planPlaceholder").style.display = "none";
    document.getElementById("planResult").classList.add("visible");
    generateButton.textContent = "方案框架已生成 ✓";
  });

  // Natural choice
  document.querySelectorAll("[data-natural-answer]").forEach(button => {
    button.addEventListener("click", () => {
      const natural = button.dataset.naturalAnswer === "natural";
      document.querySelector(".route-fast").classList.toggle("selected", !natural);
      document.querySelector(".route-natural").classList.toggle("selected", natural);
      document.getElementById("naturalFeedback").innerHTML = natural
        ? "<strong>这就是维韧的终点。</strong><br>不是越紧越好，而是自然、协调、像自己。"
        : "变化幅度不是唯一标准。<br><strong>请把安全、整体与个人特征也放进结果判断。</strong>";
    });
  });

  // Final quiz
  document.getElementById("finalQuiz").addEventListener("submit", event => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const answers = { q1: "b", q2: "a", q3: "b" };
    let score = 0;
    Object.entries(answers).forEach(([key, value]) => {
      if (data.get(key) === value) score += 1;
    });
    const result = document.getElementById("quizResult");
    result.querySelector(".result-score b").textContent = score;
    const title = result.querySelector("h3");
    const text = result.querySelector("p");
    if (score === 3) {
      title.textContent = "全部掌握，顺利抵达！";
      text.textContent = "看、识、锁、分、整、自然——你已经抓住维韧打法的基本点。";
    } else if (score === 2) {
      title.textContent = "差一步就满分";
      text.textContent = "核心路径已经清楚，再回看六步地图即可补齐。";
    } else {
      title.textContent = "建议再走一遍路线";
      text.textContent = "先记住：影像是起点，整合是原则，自然年轻是目标。";
    }
  });

  const requestedSlide = Number(new URLSearchParams(window.location.search).get("slide"));
  if (Number.isInteger(requestedSlide) && requestedSlide >= 1 && requestedSlide <= slides.length) {
    slides.forEach(slide => {
      slide.style.transition = "none";
      slide.classList.remove("active", "exit-left");
    });
    current = requestedSlide - 1;
    slides[current].classList.add("active");
    updateChrome();
  } else {
    updateChrome();
  }
})();
