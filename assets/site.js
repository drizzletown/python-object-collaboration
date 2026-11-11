const storageKey = "python-textbook-progress-v1";
const resumeKey = "python-textbook-resume-v1";

function saved(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

function remember(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Progress remains available during this visit if storage is disabled.
  }
}

const chapterIds = Array.from({ length: 10 }, (_, i) => String(i + 1).padStart(2, "0"));
const previousProgress = saved(storageKey, []);
const complete = new Set(chapterIds.filter(id => Array.isArray(previousProgress) && previousProgress.includes(id)));
const mark = document.querySelector("[data-mark]");
const resume = document.querySelector("[data-resume]");

function updateProgress() {
  for (const badge of document.querySelectorAll("[data-done]")) {
    const done = complete.has(badge.dataset.done);
    badge.classList.toggle("done", done);
    badge.textContent = done ? "✓" : (badge.classList.contains("card-arrow") ? "↗" : "");
    badge.title = done ? "已完成" : "";
  }
  if (mark) {
    const done = complete.has(mark.dataset.mark);
    mark.setAttribute("aria-pressed", String(done));
    mark.textContent = done ? "✓ 已完成 · 取消标记" : "标记本章完成";
  }
  const progress = document.querySelector(".progress");
  if (progress) {
    progress.hidden = false;
    progress.querySelector("[data-count]").textContent = complete.size;
    progress.querySelector("progress").value = complete.size;
  }
}

if (mark) {
  mark.hidden = false;
  remember(resumeKey, mark.dataset.mark);
  mark.addEventListener("click", () => {
    const id = mark.dataset.mark;
    if (complete.has(id)) complete.delete(id);
    else complete.add(id);
    remember(storageKey, [...complete]);
    updateProgress();
  });
}
if (resume) {
  const last = saved(resumeKey, null);
  if (chapterIds.includes(last)) {
    resume.href = "chapter-" + last + ".html";
    resume.firstChild.textContent = "继续第 " + Number(last) + " 章 ";
  }
}
updateProgress();

const mobile = document.querySelector(".mobile-nav");
if (mobile && matchMedia("(max-width: 760px)").matches) mobile.open = false;

const search = document.querySelector(".search");
if (search) {
  search.hidden = false;
  const input = search.querySelector("input");
  const groups = [...document.querySelectorAll(".catalog-group")];
  const status = document.querySelector("[data-search-status]");
  input.addEventListener("input", () => {
    const query = input.value.trim().toLocaleLowerCase();
    const terms = query.split(/\s+/).filter(Boolean);
    let count = 0;
    for (const group of groups) {
      let visible = 0;
      for (const card of group.querySelectorAll("[data-search]")) {
        const text = card.dataset.search.toLocaleLowerCase();
        card.hidden = !terms.every(term => text.includes(term));
        if (!card.hidden) visible += 1;
      }
      group.hidden = visible === 0;
      count += visible;
    }
    status.hidden = !query;
    status.textContent = count ? "找到 " + count + " 个章节" : "未找到匹配章节。试试“字典”“异常”或“报名”。";
  });
}

for (const quiz of document.querySelectorAll(".quiz")) {
  const submit = quiz.querySelector("button");
  const feedback = quiz.querySelector(".feedback");
  const explanation = quiz.querySelector("details");
  submit.disabled = false;
  quiz.addEventListener("change", () => {
    feedback.textContent = "";
    explanation.open = false;
  });
  quiz.addEventListener("submit", event => {
    event.preventDefault();
    const choice = new FormData(quiz).get("choice");
    const correct = choice === quiz.dataset.correct;
    feedback.textContent = correct ? "回答正确。" : "再想一想，也可以查看解析。";
    feedback.dataset.result = correct ? "correct" : "retry";
    explanation.open = correct;
  });
}

const sim = document.querySelector(".simulator");
if (sim) {
  sim.hidden = false;
  const form = sim.querySelector("form");
  const tbody = sim.querySelector("tbody");
  const next = form.querySelector('button[type="submit"]');
  const feedback = sim.querySelector(".sim-status");
  let cursor = 0;
  const students = new Set();

  function restart() {
    cursor = 0;
    students.clear();
    tbody.replaceChildren();
    feedback.textContent = "";
    next.disabled = false;
  }

  form.addEventListener("reset", restart);
  form.addEventListener("input", restart);
  form.addEventListener("submit", event => {
    event.preventDefault();
    const data = new FormData(form);
    const capacity = Number(data.get("capacity"));
    const requests = data.get("requests").split("\n");
    const id = requests[cursor].trim();
    let result;
    if (!id) result = "空学号";
    else if (students.has(id)) result = "重复";
    else if (students.size >= capacity) result = "满员";
    else {
      students.add(id);
      result = "通过";
    }
    const row = tbody.insertRow();
    for (const value of [id || "（空白）", result, capacity - students.size, [...students].join("、") || "—"]) {
      row.insertCell().textContent = value;
    }
    cursor += 1;
    feedback.textContent = "已处理 " + cursor + " / " + requests.length + " 条 · " + result;
    next.disabled = cursor === requests.length;
  });
}

let stopActiveRun;
for (const playground of document.querySelectorAll(".playground")) {
  const editor = playground.querySelector("textarea");
  const original = editor.value;
  const run = playground.querySelector("[data-run]");
  const stop = playground.querySelector("[data-stop]");
  const output = playground.querySelector(".output");
  const copy = playground.querySelector("[data-copy]");
  const reset = playground.querySelector("[data-reset]");
  copy.hidden = false;
  reset.hidden = false;
  playground.querySelector(".runner-bar").hidden = false;

  reset.addEventListener("click", () => {
    editor.value = original;
    editor.focus();
  });
  copy.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(editor.value);
      copy.textContent = "已复制";
      setTimeout(() => { copy.textContent = "复制"; }, 1800);
    } catch {
      editor.focus();
      editor.select();
    }
  });

  function execute() {
    if (stopActiveRun) stopActiveRun("已停止。");
    output.hidden = false;
    output.textContent = "正在加载浏览器中的 Python…";
    let worker;
    try {
      worker = new Worker("assets/python-worker.js", { type: "module" });
    } catch {
      output.textContent = "请通过 GitHub Pages 或本地 HTTP 服务打开教材，以运行 Python 示例。";
      return;
    }
    let timer;

    function finish(message) {
      clearTimeout(timer);
      worker.terminate();
      stopActiveRun = undefined;
      stop.hidden = true;
      run.disabled = false;
      if (message) output.textContent += "\n" + message;
    }

    run.disabled = true;
    stop.hidden = false;
    stopActiveRun = finish;
    stop.onclick = () => finish("已停止。");
    timer = setTimeout(() => finish("加载超时。请重试，或复制代码到本机运行。"), 90000);
    worker.addEventListener("error", () => finish("运行器无法启动。可复制代码到本机运行。"));
    worker.addEventListener("message", ({ data }) => {
      if (data.kind === "ready") {
        clearTimeout(timer);
        output.textContent = "";
        timer = setTimeout(() => finish("运行超时。请检查循环的终止条件。"), 8000);
      } else if (data.kind === "done") {
        output.textContent = data.output || "运行结束（没有输出）。";
        finish();
      } else if (data.kind === "unavailable") {
        output.textContent = "Python 加载失败。请检查网络连接，或复制代码到本机运行。";
        finish();
      }
    });
    worker.postMessage(editor.value);
  }

  run.addEventListener("click", execute);
  editor.addEventListener("keydown", event => {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      event.preventDefault();
      if (!run.disabled) execute();
    }
  });
}
