const cdn = "https://cdn.jsdelivr.net/pyodide/v0.27.7/full/";
const outputLimit = 16000;

self.addEventListener("message", async ({ data: source }) => {
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
    python.runPython("import os, tempfile\nos.chdir(tempfile.mkdtemp())\n__name__ = '__main__'");
    const result = await python.runPythonAsync(source);
    if (result && typeof result.destroy === "function") result.destroy();
    if (python.globals.has("__lesson_task__")) {
      await python.runPythonAsync("await __lesson_task__");
    }
  } catch (error) {
    append(error.message || String(error));
  }
  if (truncated) output += "\n… 输出已截断";
  self.postMessage({ kind: "done", output });
});
