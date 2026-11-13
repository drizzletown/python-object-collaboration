const cdn = "https://cdn.jsdelivr.net/pyodide/v0.27.7/full/";
const outputLimit = 16000;

self.addEventListener("message", async ({ data }) => {
  const { source, filename, files = [], module, campus } =
    typeof data === "string" ? { source: data } : data;
  let python;
  try {
    const { loadPyodide } = await import(cdn + "pyodide.mjs");
    python = await loadPyodide({ indexURL: cdn });
  } catch {
    self.postMessage({ kind: "unavailable" });
    return;
  }

  let output = "";
  let truncated = false;
  function append(line) {
    const available = outputLimit - output.length;
    output += (line + "\n").slice(0, available);
    if (line.length + 1 > available) truncated = true;
  }

  python.setStdout({ batched: append });
  python.setStderr({ batched: append });
  python.setStdin({ stdin: () => null });
  self.postMessage({ kind: "ready" });
  try {
    python.runPython(
      "import os, sys, tempfile\nos.chdir(tempfile.mkdtemp())\nsys.path.insert(0, os.getcwd())\n__name__ = '__main__'"
    );
    const directory = python.FS.cwd();
    if (campus) {
      const response = await fetch(new URL("../campus.py", self.location.href));
      if (!response.ok) throw new Error("无法加载报名项目，请重试。");
      python.FS.writeFile(directory + "/campus.py", new Uint8Array(await response.arrayBuffer()));
    }
    for (const [name, content] of files) {
      const separator = name.lastIndexOf("/");
      if (separator !== -1) python.FS.mkdirTree(directory + "/" + name.slice(0, separator));
      python.FS.writeFile(directory + "/" + name, content, { encoding: "utf8" });
    }
    const path = directory + "/" + (filename || "example.py");
    if (!module) python.FS.writeFile(path, source, { encoding: "utf8" });
    const result = module
      ? await python.runPythonAsync(
        "import runpy\nrunpy.run_module(" + JSON.stringify(module) + ", run_name='__main__', alter_sys=True)"
      )
      : await python.runPythonAsync(source, { filename: path });
    if (result && typeof result.destroy === "function") result.destroy();
    if (python.globals.has("__lesson_task__")) {
      await python.runPythonAsync("await __lesson_task__");
    }
  } catch (error) {
    append(error.message || error.code || String(error));
  }
  if (truncated) output += "\n… 输出已截断";
  self.postMessage({ kind: "done", output });
});
