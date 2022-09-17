import { mapValues } from "lodash";
import process from "process";
import fs from "fs";
import { homedir } from "os";
import { asyncExec } from "./asyncExec";
import { AccountDetails } from "./gopass";

type AutotypeCommand = () => Promise<void>;

interface AutotypeHandlers {
  [key: string]: AutotypeCommand
}

const strokes = {
  tab: 48,
  space: 49,
  enter: 36,
  delete: 51
} as const;

const specialAutotypeHandlers: AutotypeHandlers = {
  ":tab": async () => doStroke(strokes.tab),
  ":space": async () => doStroke(strokes.space),
  ":enter": async () => doStroke(strokes.enter),
  ":delete": async () => doStroke(strokes.delete),
  ":delay": async () => sleep(1000),
  ":clearField": async () => clearFieldContent()
}

function additionalAutotypeCommandToHandler(command: string): AutotypeCommand {
  return async () => {
    const result = await asyncExec(command);
    await doType(result);
  }
}

async function loadAdditionalAutotypeHandlers(): Promise<AutotypeHandlers> {
  const basePath = process.env.XDG_CONFIG ?? homedir()
  const filename = `${ basePath }/.gopass_autotype_handlers.json`;
  if (!fs.existsSync(filename)) {
    return {};
  }

  try {
    const buffer = await fs.promises.readFile(filename);
    const json = JSON.parse(buffer.toString("utf-8"));
    return mapValues(json, (command) => additionalAutotypeCommandToHandler(command));
  } catch (e) {
    console.log(`Something went wrong parsing ${ filename }`, e)
    return {};
  }
}

async function allAutotypeHandlers(): Promise<AutotypeHandlers> {
  return {
    ...await loadAdditionalAutotypeHandlers(),
    ...specialAutotypeHandlers
  }
}


async function doStroke(stroke: number) {
  await asyncExec(`echo 'tell application "System Events" to key code "${ stroke }"' | osascript`)
}

async function doType(toType: string) {
  await asyncExec(`echo 'tell application "System Events" to keystroke "${ toType }"' | osascript`)
}

async function clearFieldContent() {
  await asyncExec(`echo 'tell application "System Events" to keystroke "a" using command down' | osascript`)
  await doStroke(strokes.delete);
}

async function sleep(ms: number) {
  await new Promise(resolve => setTimeout(resolve, ms));
}

export async function autotype(details: AccountDetails, key: string) {
  const handlers = await allAutotypeHandlers();
  const toType = details.values[key];
  const parts = toType.split(" ");

  for (const part of parts) {
    if (part in handlers) {
      await handlers[part]();
    } else if (part in details.values) {
      await autotype(details, part);
    } else {
      await doType(part);
    }
  }
}

