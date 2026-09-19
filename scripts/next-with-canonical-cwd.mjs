import { realpathSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

export function resolveCanonicalProjectRoot(
  scriptDirectory = dirname(fileURLToPath(import.meta.url)),
  realpath = realpathSync,
) {
  return realpath(resolve(scriptDirectory, ".."));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const projectRoot = resolveCanonicalProjectRoot();
  process.chdir(projectRoot);

  const nextCli = resolve(projectRoot, "node_modules", "next", "dist", "bin", "next");
  const next = spawn(process.execPath, [nextCli, ...process.argv.slice(2)], {
    cwd: projectRoot,
    stdio: "inherit",
    windowsHide: false,
  });

  const forwardSignal = (signal) => {
    if (!next.killed) {
      next.kill(signal);
    }
  };

  process.once("SIGINT", () => forwardSignal("SIGINT"));
  process.once("SIGTERM", () => forwardSignal("SIGTERM"));

  next.once("error", (error) => {
    console.error(error);
    process.exitCode = 1;
  });

  next.once("exit", (code, signal) => {
    process.removeAllListeners("SIGINT");
    process.removeAllListeners("SIGTERM");

    if (signal) {
      process.kill(process.pid, signal);
      return;
    }

    process.exit(code ?? 1);
  });
}
