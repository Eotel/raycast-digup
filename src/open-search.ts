import {
  getApplications,
  getPreferenceValues,
  showToast,
  Toast,
} from "@raycast/api";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const bundleId = "com.abdurrahim.DigUp";

interface Preferences {
  appPath?: string;
}

export default async function command() {
  const configuredPath = getPreferenceValues<Preferences>().appPath?.trim();
  const appPath =
    configuredPath ||
    (await getApplications()).find((app) => app.bundleId === bundleId)?.path;

  if (!appPath) {
    await showToast({
      style: Toast.Style.Failure,
      title: "DigUp app not found",
    });
    return;
  }

  try {
    await execFileAsync("/usr/bin/open", ["-a", appPath]);
  } catch {
    await showToast({
      style: Toast.Style.Failure,
      title: "Couldn't open DigUp",
    });
  }
}
