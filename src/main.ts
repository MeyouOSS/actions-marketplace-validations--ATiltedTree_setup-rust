import * as cache from "@actions/cache";
import * as core from "@actions/core";
import { exec } from "@actions/exec";
import * as io from "@actions/io";
import * as tc from "@actions/tool-cache";
import { promises as fs } from "fs";
import { homedir } from "os";
import * as path from "path";

const CACHE_PATH = [path.join(homedir(), ".rustup", "toolchains")];
const INSTALL_ARGS = ["--profile", "minimal", "-y"];

async function run(): Promise<void> {
  try {
    const rustupPath = await io.which("rustup", true);
    if (rustupPath === null || rustupPath.trim().length === 0) {
      const rustupSh = await tc.downloadTool("https://sh.rustup.rs");
      await fs.chmod(rustupSh, 0o755);
      core.debug("Starting rustup install!");
      await exec(rustupSh, INSTALL_ARGS);
      core.addPath(path.join(homedir(), ".cargo", "bin"));
    }
    const version = core.getInput("rust-version", { required: true });
    const components = core.getInput("components");
    const targets = core.getInput("targets");

    const cacheKey = `rustup-${process.platform
      }-${version}-${components.replace(" ", "-")}-${targets}`;

    await cache.restoreCache(CACHE_PATH, cacheKey);

    let args = [
      "toolchain",
      "install",
      version,
      "--profile",
      "minimal",
      "--allow-downgrade",
      "--force",
      "--force-non-host",
      "--no-self-update"
    ];
    if (components) {
      components.split(" ").forEach(val => {
        args.push("--component");
        args.push(val);
      });
    }
    if (targets) {
      targets.split(" ").forEach(val => {
        args.push("--target");
        args.push(val);
      });
    }

    core.info(
      `Installing toolchain with components and targets: ${version} -- ${process.platform} -- ${components} -- ${targets}`
    );

    const code = await exec("rustup", args);
    if (code != 0) {
      throw `Failed installing toolchain exited with code: ${code}`;
    }

    core.info(`Setting the default toolchain: ${version}`);
    let defaultSettingResultCode = await exec("rustup", ["default", version]);
    if (defaultSettingResultCode != 0) {
      throw `Failed setting the default toolchain exited with code: ${defaultSettingResultCode}`;
    }

    core.info(`##[add-matcher]${path.join(__dirname, "..", "rustc.json")}`);
    core.debug(`Saving cache: ${cacheKey}`);
    try {
      await cache.saveCache(CACHE_PATH, cacheKey);
    } catch (error) {
      core.info(`Cache hit occurred on key ${cacheKey}, not saving cache.`);
    }
  } catch (error) {
    core.setFailed(`Rust toolchain installation failed: ${error}`);
  }
}

run();
