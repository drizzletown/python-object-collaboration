"""Build the GitHub Pages /docs folder using the Python standard library."""
from dataclasses import dataclass
from hashlib import sha256
from html import escape
from pathlib import Path
import re
from shutil import copy2

ROOT = Path(__file__).resolve().parent
DOCS = ROOT / "docs"
ASSETS = ROOT / "assets"
STYLE_VERSION = sha256((ASSETS / "style.css").read_bytes()).hexdigest()[:12]
PROJECT = ROOT / "projects" / "campus.py"
CHAPTER_IDS = ["00", *(f"{n:02}" for n in range(1, 11)), "A", "B", "C"]


@dataclass
class Chapter:
    key: str
    title: str
    summary: str
    lines: list[str]

    @property
    def label(self):
        if self.key == "00":
            return "导论"
        return f"第 {int(self.key)} 章" if self.key.isdigit() else f"附录 {self.key}"

    @property
    def href(self):
        return f"chapter-{self.key}.html"


def read_chapter(key):
    lines = (ROOT / "chapters" / f"{key}.md").read_text(encoding="utf-8").splitlines()
    if not lines[0].startswith("# ") or not lines[1].startswith("> "):
        raise ValueError(f"Missing title or summary in {key}")
    return Chapter(key, lines[0][2:], lines[1][2:], lines[2:])


def inline(text):
    target = r"https://[^)]+|(?:0[0-9]|10|[A-C])\.md"
    fragments = re.split(rf"(\x60[^\x60]+\x60|\[[^\]]+\]\((?:{target})\))", text)
    result = []
    for fragment in fragments:
        match = re.fullmatch(rf"\[([^\]]+)\]\(({target})\)", fragment)
        if match:
            label, href = match.groups()
            if not href.startswith("https://"):
                href = f"chapter-{href.removesuffix('.md')}.html"
            result.append(f'<a href="{escape(href, quote=True)}">{escape(label)}</a>')
        elif fragment.startswith("\x60") and fragment.endswith("\x60"):
            result.append(f"<code>{escape(fragment[1:-1])}</code>")
        else:
            result.append(escape(fragment))
    return "".join(result)


def playground(source, number, *, project=False):
    source = source.rstrip()
    rows = min(18 if project else 14, max(5, len(source.splitlines())))
    download = '<a href="campus.py" download>下载 campus.py</a>' if project else ""
    return f"""
<section class="playground" aria-label="Python 示例 {number}">
  <div class="editor-bar">
    <span><i></i> Python 示例 {number}</span>
    <div>{download}<button class="quiet" data-reset hidden>重置</button>
    <button class="quiet" data-copy hidden>复制</button></div>
  </div>
  <textarea aria-label="Python 示例 {number} 代码" rows="{rows}"
    spellcheck="false" autocapitalize="off" autocomplete="off">{escape(source)}</textarea>
  <div class="runner-bar" hidden>
    <button class="primary small" data-run>▶ 运行代码</button>
    <button class="quiet" data-stop hidden>停止</button>
    <span>Ctrl + Enter</span>
  </div>
  <pre class="output" aria-live="polite" aria-label="运行输出" hidden></pre>
</section>
"""


def quiz_html(lines):
    question, *choices, correct, feedback = lines
    if len(choices) < 2 or not 1 <= int(correct) <= len(choices):
        raise ValueError(f"Invalid quiz: {question}")
    radios = "".join(
        f'<label><input type="radio" name="choice" value="{i}" required> {inline(choice)}</label>'
        for i, choice in enumerate(choices, 1)
    )
    return f"""
<form class="quiz" data-correct="{int(correct)}">
 <fieldset><legend>{inline(question)}</legend>{radios}</fieldset>
 <button class="primary small" type="submit" disabled>检查答案</button>
 <p class="feedback" aria-live="polite"></p>
 <details><summary>查看解析</summary><p>{inline(feedback)}</p></details>
</form>
"""


def table_html(lines):
    cells = [
        [cell.strip().replace(r"\|", "|") for cell in re.split(r"(?<!\\)\|", line[1:-1])]
        for line in lines
    ]
    if len(cells) < 3 or any(len(row) != len(cells[0]) for row in cells):
        raise ValueError("A table needs a header, separator, and equally sized rows")
    headers, separator, *rows = cells
    if not all(re.fullmatch(r"-{3,}", cell) for cell in separator):
        raise ValueError("Invalid table separator")

    head = "".join(f'<th scope="col">{inline(cell)}</th>' for cell in headers)
    body = "".join(
        "<tr>" + "".join(f"<td>{inline(cell)}</td>" for cell in row) + "</tr>"
        for row in rows
    )
    return (
        '<div class="lesson-table"><table>'
        f"<thead><tr>{head}</tr></thead><tbody>{body}</tbody>"
        "</table></div>"
    )


SIMULATOR = """
<section class="simulator" aria-labelledby="sim-title" hidden>
 <h3 id="sim-title">报名规则模拟器</h3>
 <p>逐条提交学号，观察回执、剩余名额和名单变化。</p>
 <form>
  <label>活动容量 <input name="capacity" type="number" value="2" min="0" max="99" required></label>
  <label>报名顺序（每行一个学号，空行视作空学号）
   <textarea name="requests" rows="4">S01
S02
S01
S03</textarea>
  </label>
  <div class="sim-actions">
   <button class="primary small" type="submit">执行下一条</button>
   <button class="quiet" type="reset">重置</button>
   <span class="sim-status" aria-live="polite"></span>
  </div>
 </form>
 <div class="sim-table"><table><thead><tr><th>学号</th><th>回执</th><th>剩余</th><th>已登记</th></tr></thead>
 <tbody></tbody></table></div>
</section>
"""


def render_body(lines):
    parts = []
    sections = []
    cursor = 0
    example = 0

    def section(title):
        anchor = f"section-{len(sections) + 1}"
        sections.append((anchor, title))
        parts.append(f'<h2 id="{anchor}">{inline(title)}</h2>')

    while cursor < len(lines):
        line = lines[cursor].strip()
        cursor += 1
        if not line:
            continue
        if line.startswith("## "):
            section(line[3:])
        elif line.startswith("### "):
            parts.append(f"<h3>{inline(line[4:])}</h3>")
        elif line.startswith("|") and line.endswith("|"):
            rows = [line]
            while cursor < len(lines):
                row = lines[cursor].strip()
                if not (row.startswith("|") and row.endswith("|")):
                    break
                rows.append(row)
                cursor += 1
            parts.append(table_html(rows))
        elif line in {"```python", "```text"}:
            end = lines.index("```", cursor)
            code = "\n".join(lines[cursor:end])
            if line == "```python":
                example += 1
                parts.append(playground(code, example))
            else:
                parts.append(f'<pre class="listing">{escape(code)}</pre>')
            cursor = end + 1
        elif line == ":::project":
            example += 1
            parts.append(playground(PROJECT.read_text(encoding="utf-8"), example, project=True))
        elif line == ":::sim":
            parts.append(SIMULATOR)
        elif line in {":::answer", ":::quiz"}:
            end = lines.index(":::", cursor)
            content = lines[cursor:end]
            if line == ":::quiz":
                section("本章自测")
                parts.append(quiz_html(content))
            else:
                paragraphs = "".join(f"<p>{inline(text)}</p>" for text in content if text)
                parts.append(f"<details class='answer'><summary>参考解答</summary>{paragraphs}</details>")
            cursor = end + 1
        elif line.startswith("- "):
            items = [line[2:]]
            while cursor < len(lines) and lines[cursor].startswith("- "):
                items.append(lines[cursor][2:])
                cursor += 1
            parts.append("<ul>" + "".join(f"<li>{inline(item)}</li>" for item in items) + "</ul>")
        elif line.startswith((":::", "```", "#")):
            raise ValueError(f"Unsupported block: {line}")
        else:
            parts.append(f"<p>{inline(line)}</p>")
    return "\n".join(parts), sections


def frame(title, content, *, page_class=""):
    intro_link = '<a href="chapter-00.html">导论</a>' if page_class == "home" else ""
    return f"""<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="description" content="以对象协作和假设三部曲为主线的 Python 编程教材。">
<title>{escape(title)}</title>
<link rel="stylesheet" href="assets/style.css?v={STYLE_VERSION}">
<script src="assets/site.js" defer></script>
</head>
<body class="{page_class}">
<a class="skip" href="#main">跳到正文</a>
<header class="topbar"><div class="top-inner">
<a class="brand" href="index.html"><span aria-hidden="true">Py</span> Python 编程</a>
<nav aria-label="主导航">{intro_link}<a href="index.html#catalog">章节目录</a><a href="chapter-09.html">综合项目</a></nav>
</div></header>
{content}
<footer class="site-footer"><a href="index.html">Python 编程教材</a><a href="chapter-A.html">运行环境</a><a href="chapter-C.html">语言速查</a></footer>
</body></html>
"""


def chapter_links(chapters, current):
    items = []
    for chapter in chapters:
        active = ' aria-current="page"' if chapter == current else ""
        number = chapter.key if chapter.key != "00" else "序"
        title = chapter.title
        if not chapter.key.isdigit():
            title = title.removeprefix(f"附录 {chapter.key} ")
        items.append(
            f'<a href="{chapter.href}"{active}><span class="nav-num">{number}</span>'
            f'<span>{escape(title)}</span><span class="nav-done" data-done="{chapter.key}"></span></a>'
        )
    return "".join(items)


def chapter_page(chapters, index):
    chapter = chapters[index]
    body, sections = render_body(chapter.lines)
    page_toc = "".join(f'<li><a href="#{anchor}">{inline(title)}</a></li>' for anchor, title in sections)
    prev_chapter = chapters[index - 1] if index else None
    next_chapter = chapters[index + 1] if index + 1 < len(chapters) else None

    def adjacent(other, direction):
        if other is None:
            return "<span></span>"
        return f'<a href="{other.href}"><small>{direction}</small>{escape(other.title)}</a>'

    mark = ""
    if chapter.key.isdigit() and chapter.key != "00":
        mark = f'<button type="button" class="complete" data-mark="{chapter.key}" aria-pressed="false" hidden>标记本章完成</button>'
    return frame(f"{chapter.title} · Python 编程", f"""
<div class="lesson-layout">
 <aside class="side"><details class="mobile-nav" open><summary>章节目录</summary>
  <nav aria-label="章节目录">{chapter_links(chapters, chapter)}</nav>
 </details></aside>
 <main id="main" class="lesson">
  <header class="lesson-head"><div class="crumb"><a href="index.html#catalog">教材目录</a> <span>›</span> {chapter.label}</div>
  <h1>{escape(chapter.title)}</h1><p>{inline(chapter.summary)}</p></header>
  <details class="lesson-contents"><summary>本页目录</summary>
   <nav aria-label="本页目录"><ol>{page_toc}</ol></nav>
  </details>
  <article>{body}</article>
  {mark}
  <nav class="adjacent" aria-label="前后章节">{adjacent(prev_chapter, "← 上一节")}{adjacent(next_chapter, "下一节 →")}</nav>
 </main>
 <aside class="outline"><p>本页目录</p><nav aria-label="本页目录"><ol>{page_toc}</ol></nav></aside>
</div>""")


GROUPS = [
    ("从数据到对象", "01–05", slice(1, 6)),
    ("从协作到完整项目", "06–10", slice(6, 11)),
    ("附录与速查", "A–C", slice(11, 14)),
]


def catalog_card(chapter):
    label = chapter.label
    title = chapter.title.removeprefix(f"{label} ")
    number = "序" if chapter.key == "00" else chapter.key
    search_text = " ".join([label, chapter.title, chapter.summary, *chapter.lines])
    return f"""
<a class="chapter-card" href="{chapter.href}" data-search="{escape(search_text, quote=True)}">
 <span class="chapter-num">{number}</span>
 <span class="chapter-info"><strong>{escape(title)}</strong><span>{inline(chapter.summary)}</span></span>
 <span class="card-arrow" data-done="{chapter.key}" aria-hidden="true">↗</span>
</a>"""


def catalog(chapters):
    intro = chapters[0]
    groups = [f'<section class="catalog-group"><h3>{intro.label}</h3>{catalog_card(intro)}</section>']
    for heading, span, selection in GROUPS:
        cards = "".join(catalog_card(chapter) for chapter in chapters[selection])
        groups.append(f'<section class="catalog-group"><h3>{heading} <small>{span}</small></h3><div>{cards}</div></section>')
    return "\n".join(groups)


def home(chapters):
    return frame("Python 编程 · 从解决问题到程序设计", f"""
<main id="main">
<section class="hero">
 <div class="home-width hero-grid">
  <div>
   <p class="eyebrow">从解决问题到程序设计</p>
   <h1>Python 编程<span>校园活动报名</span></h1>
   <p class="hero-summary">从一次博物馆参观出发，用<a href="#object-collaboration">对象协作编程</a>组织报名，用<a href="#assumption-trilogy">假设三部曲</a>把方案逐步做成可运行的程序。</p>
   <div class="hero-links"><a class="primary" href="chapter-00.html" data-resume>阅读导论 <span>→</span></a>
   <a class="secondary" href="#catalog">浏览章节</a></div>
  </div>
  <div class="terminal" aria-label="计算剩余名额的 Python 示例">
   <div class="terminal-bar"><span class="lights" aria-hidden="true"><i></i><i></i><i></i></span><span>enrollment.py</span><span>PYTHON</span></div>
   <div class="terminal-code"><pre><code><span class="code-comment"># 检查博物馆活动的剩余名额</span>
capacity = <b>30</b>
registered = <b>29</b>
remaining = capacity - registered

<strong>print</strong>(<em>f"剩余名额：{{remaining}}"</em>)</code></pre>
   <div class="terminal-output"><span>›</span> 剩余名额：1</div></div>
   <a href="chapter-01.html#section-10">到第 1 章试一试 <span>↗</span></a>
  </div>
 </div>
</section>
<section class="home-methods" aria-labelledby="methods-title">
 <div class="home-width">
  <h2 id="methods-title">本书的两条求解主线</h2>
  <div class="methods-grid">
   <article class="method-card" id="object-collaboration">
    <h3>对象协作编程</h3>
    <p class="method-formula">程序 = 对象 + 对象协作过程</p>
    <p>从要交出的结果往回找对象，明确谁提供信息、谁维护状态，再安排它们交换信息并完成任务。</p>
    <dl class="method-views">
     <div><dt>第一视角</dt><dd>活动对象收到学号，按自己的名单和名额决定是否登记。</dd></div>
     <div><dt>第三视角</dt><dd>报名流程从存储读出活动，请它处理请求。报名通过时先保存，再交回回执。</dd></div>
    </dl>
    <a class="method-link" href="chapter-00.html#section-2">读导论中的两种视角 <span aria-hidden="true">→</span></a>
   </article>
   <article class="method-card method-card-assumptions" id="assumption-trilogy">
    <h3>假设三部曲</h3>
    <p>暂时缺少一项能力时，先约定它会交出什么，再用这个结果继续设计主流程。</p>
    <ol class="method-steps">
     <li><strong>建立假设</strong><p>约定存储对象能交出活动容量和当前名单。</p></li>
     <li><strong>使用假设</strong><p>用名单查重复，结合活动容量算余量，再决定是否登记。</p></li>
     <li><strong>兑现假设</strong><p>先用内存验证报名流程，需要保留真实记录时，再接上 JSON 文件并核对结果。</p></li>
    </ol>
    <p>兑现时遇到新的难点，可以把它当作子任务，再用一次三部曲。</p>
    <a class="method-link" href="chapter-00.html#section-3">读导论中的假设三部曲 <span aria-hidden="true">→</span></a>
   </article>
  </div>
  <p class="methods-practice">在<a href="chapter-09.html#section-5">第 9 章用模拟器试一次报名</a>，再到<a href="chapter-10.html#section-7">第 10 章更换通知方式</a>，检验原有的报名规则。</p>
 </div>
</section>
<section class="home-width catalog" id="catalog">
 <header class="catalog-head"><div><h2>课程目录</h2><p>导论、10 章正文与 3 个附录</p></div>
 <div class="progress" hidden><label for="course-progress">已完成 <b data-count>0</b> / 10 章</label>
 <progress id="course-progress" value="0" max="10"></progress></div></header>
 <label class="search" hidden><span aria-hidden="true">⌕</span><input type="search" placeholder="搜索章节、概念或代码" aria-label="搜索章节、概念或代码"></label>
 <p data-search-status role="status" hidden></p>
 {catalog(chapters)}
</section>
</main>""", page_class="home")


def main():
    chapters = [read_chapter(key) for key in CHAPTER_IDS]
    (DOCS / "assets").mkdir(parents=True, exist_ok=True)
    for asset in ASSETS.iterdir():
        if asset.is_file():
            copy2(asset, DOCS / "assets" / asset.name)
    copy2(PROJECT, DOCS / "campus.py")
    (DOCS / ".nojekyll").touch()
    (DOCS / "index.html").write_text(home(chapters), encoding="utf-8")
    for index, chapter in enumerate(chapters):
        (DOCS / chapter.href).write_text(chapter_page(chapters, index), encoding="utf-8")
    print(f"Built homepage and {len(chapters)} lessons in {DOCS}")


if __name__ == "__main__":
    main()
