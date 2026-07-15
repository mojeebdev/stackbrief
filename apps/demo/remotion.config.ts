import { existsSync } from "node:fs";
import { Config } from "@remotion/cli/config";

const configuredBrowser = process.env.REMOTION_BROWSER_EXECUTABLE;
const defaultWindowsChrome = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const browserExecutable = configuredBrowser ?? (process.platform === "win32" && existsSync(defaultWindowsChrome) ? defaultWindowsChrome : undefined);

if (browserExecutable) Config.setBrowserExecutable(browserExecutable);
