const storageKey = "python-textbook-progress-v1";
const resumeKey = "python-textbook-resume-v1";
const draftPrefix = "python-textbook-draft-v1:";
const scriptVersion = new URL(document.currentScript.src).search;

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
    return true;
  } catch {
    return false;
  }
}

function forget(key) {
  try {
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

const chapterIds = Array.from({ length: 10 }, (_, i) => String(i + 1).padStart(2, "0"));
const pageId = location.pathname.split("/").pop();
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
  mark.addEventListener("click", () => {
    const id = mark.dataset.mark;
    if (complete.has(id)) complete.delete(id);
    else complete.add(id);
    remember(storageKey, [...complete]);
    updateProgress();
  });
  trackReading(mark.dataset.mark);
}
if (resume) {
  showResume();
  window.addEventListener("pageshow", showResume);
}
updateProgress();

function trackReading(chapter) {
  const headings = [...document.querySelectorAll(".lesson article > h2[id]")];
  const topbar = document.querySelector(".topbar");
  const contents = document.querySelector(".lesson-contents");
  let lastRecord;
  let framePending = false;

  function record() {
    framePending = false;
    if (document.visibilityState === "hidden") return;
    const cutoff = Math.max(
      topbar.getBoundingClientRect().bottom + contents.offsetHeight + 24,
      innerHeight * 0.2
    );
    const destination = location.hash.slice(1);
    let heading;
    for (const item of headings) {
      const top = item.getBoundingClientRect().top;
      if (top <= cutoff) heading = item;
      if (top > cutoff && top < innerHeight && item.id === destination && item.id === lastRecord) {
        // Focusing the sticky navigation can shift a recently selected heading down.
        heading = item;
      }
      if (top >= innerHeight) break;
    }
    const section = heading?.id ?? "";
    const previous = saved(resumeKey, null);
    if (section === lastRecord && previous?.chapter === chapter && previous.section === section) return;
    lastRecord = section;
    remember(resumeKey, { chapter, section });
  }

  function schedule() {
    if (framePending) return;
    framePending = true;
    requestAnimationFrame(record);
  }

  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("hashchange", schedule);
  window.addEventListener("pageshow", schedule);
  document.addEventListener("visibilitychange", schedule);
  schedule();
}

function showResume() {
  const last = saved(resumeKey, null);
  const chapter = typeof last === "string" ? last : last?.chapter;
  if (!chapterIds.includes(chapter)) return;
  const section = typeof last?.section === "string" && /^section-\d+$/.test(last.section) ? last.section : "";
  resume.href = "chapter-" + chapter + ".html" + (section ? "#" + section : "");
  resume.firstChild.textContent = "继续第 " + Number(chapter) + " 章 ";
}

const mobile = document.querySelector(".mobile-nav");
if (mobile && matchMedia("(max-width: 760px)").matches) mobile.open = false;

const lessonContents = document.querySelector(".lesson-contents");
if (lessonContents) {
  const summary = lessonContents.querySelector("summary");
  lessonContents.addEventListener("click", event => {
    if (!event.target.closest("nav a")) return;
    lessonContents.open = false;
  });
  lessonContents.addEventListener("keydown", event => {
    if (event.key === "Escape" && lessonContents.open) {
      lessonContents.open = false;
      summary.focus();
    }
  });
}

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
  const editors = [...playground.querySelectorAll("[data-code-file]")];
  const picker = playground.querySelector("[data-file]");
  const module = playground.dataset.module;
  const firstFile = editors[0];
  let editor = firstFile;
  const run = playground.querySelector("[data-run]");
  const stop = playground.querySelector("[data-stop]");
  const output = playground.querySelector(".output");
  const copy = playground.querySelector("[data-copy]");
  const reset = playground.querySelector("[data-reset]");
  const wrap = playground.querySelector("[data-wrap]");
  const status = playground.querySelector("[data-draft-status]");
  let wrapped = matchMedia("(max-width: 760px)").matches;
  copy.hidden = false;
  reset.hidden = false;
  wrap.hidden = false;
  playground.querySelector(".runner-bar").hidden = false;

  function draftKey(file) {
    return draftPrefix + pageId + ":" + playground.dataset.draft + ":" + file.dataset.codeFile;
  }

  function showDraftStatus() {
    const draft = saved(draftKey(editor), null);
    status.textContent = typeof draft === "string" && draft !== editor.defaultValue ? "草稿已保存在此浏览器" : "";
  }

  function applyWrap() {
    for (const file of editors) file.wrap = wrapped ? "soft" : "off";
    wrap.setAttribute("aria-pressed", String(wrapped));
  }

  for (const file of editors) {
    const draft = saved(draftKey(file), null);
    if (typeof draft === "string") file.value = draft;
    file.addEventListener("input", () => {
      const key = draftKey(file);
      const stored = file.value === file.defaultValue ? forget(key) : remember(key, file.value);
      if (stored) showDraftStatus();
      else status.textContent = "无法保存草稿，可先复制代码";
    });
    file.addEventListener("keydown", event => {
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        event.preventDefault();
        if (!run.disabled) execute();
      }
    });
  }

  if (picker) {
    picker.closest("label").hidden = false;
    function selectFile() {
      editor = editors.find(file => file.dataset.codeFile === picker.value) ?? firstFile;
      for (const file of editors) file.hidden = file !== editor;
      showDraftStatus();
    }
    picker.addEventListener("change", selectFile);
    selectFile();
  } else {
    showDraftStatus();
  }
  applyWrap();
  wrap.addEventListener("click", () => {
    wrapped = !wrapped;
    applyWrap();
  });

  reset.addEventListener("click", () => {
    const original = editor.defaultValue;
    if (editor.value !== original && !window.confirm("清除当前草稿并恢复示例代码？")) return;
    editor.value = original;
    const removed = forget(draftKey(editor));
    status.textContent = removed ? "" : "无法清除已保存的草稿";
    output.hidden = true;
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
      worker = new Worker("assets/python-worker.js" + scriptVersion, { type: "module" });
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
    worker.postMessage({
      source: module ? "" : editor.value,
      filename: editor.dataset.codeFile,
      files: module ? editors.map(file => [file.dataset.codeFile, file.value]) : [],
      module,
      campus: playground.hasAttribute("data-campus"),
    });
  }

  run.addEventListener("click", execute);
}
