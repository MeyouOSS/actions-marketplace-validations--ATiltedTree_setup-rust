"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const cache = __importStar(require("@actions/cache"));
const core = __importStar(require("@actions/core"));
const exec_1 = require("@actions/exec");
const io = __importStar(require("@actions/io"));
const tc = __importStar(require("@actions/tool-cache"));
const fs_1 = require("fs");
const os_1 = require("os");
const path = __importStar(require("path"));
const CACHE_PATH = [path.join(os_1.homedir(), ".rustup", "toolchains")];
const INSTALL_ARGS = ["--profile", "minimal", "-y"];
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const rustupPath = yield io.which("rustup", true);
            if (rustupPath === null || rustupPath.trim().length === 0) {
                const rustupSh = yield tc.downloadTool("https://sh.rustup.rs");
                yield fs_1.promises.chmod(rustupSh, 0o755);
                core.debug("Starting rustup install!");
                yield exec_1.exec(rustupSh, INSTALL_ARGS);
                core.addPath(path.join(os_1.homedir(), ".cargo", "bin"));
            }
            const version = core.getInput("rust-version", { required: true });
            const components = core.getInput("components");
            const targets = core.getInput("targets");
            const cacheKey = `rustup-${process.platform}-${version}-${components.replace(" ", "-")}-${targets}`;
            yield cache.restoreCache(CACHE_PATH, cacheKey);
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
            core.info(`Installing toolchain with components and targets: ${version} -- ${process.platform} -- ${components} -- ${targets}`);
            const code = yield exec_1.exec("rustup", args);
            if (code != 0) {
                throw `Failed installing toolchain exited with code: ${code}`;
            }
            core.info(`Setting the default toolchain: ${version}`);
            let defaultSettingResultCode = yield exec_1.exec("rustup", ["default", version]);
            if (defaultSettingResultCode != 0) {
                throw `Failed setting the default toolchain exited with code: ${defaultSettingResultCode}`;
            }
            core.info(`##[add-matcher]${path.join(__dirname, "..", "rustc.json")}`);
            core.debug(`Saving cache: ${cacheKey}`);
            try {
                yield cache.saveCache(CACHE_PATH, cacheKey);
            }
            catch (error) {
                core.info(`Cache hit occurred on key ${cacheKey}, not saving cache.`);
            }
        }
        catch (error) {
            core.setFailed(`Rust toolchain installation failed: ${error}`);
        }
    });
}
run();
