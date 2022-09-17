import { asyncExec } from "./asyncExec";

export interface GopassAccount {
  name: string;
  path: string[];
  accountKey: string;
}

export interface AccountDetails {
  accountKey: string;
  values: Record<string, string>;
}

function entryFrom(line: string): GopassAccount | undefined {
  const path = line.split("/");
  const name = path.pop();
  if (name === undefined) {
    return undefined;
  }
  return {
    accountKey: line,
    path,
    name
  }
}

export async function listAccounts(): Promise<GopassAccount[]> {
  const result = await asyncExec('gopass list --flat');
  const lines = result.split("\n");
  return lines
    .map(entryFrom)
    .filter((it): it is GopassAccount => it !== undefined);
}

export async function accountDetails(key: string): Promise<AccountDetails> {
  const result = await asyncExec(`gopass show -n ${ key }`);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [pass, _delimiter, ...rest] = result.split("\n");

  const entries = rest
    .map(line => line.split(/:(.*)/s).map(part => part.trim()))
    .filter(line => line.length >= 2);
  return {
    accountKey: key,
    values: {
      pass,
      ...Object.fromEntries(entries)
    }
  }
}

export async function openEditor(key: string) {
  const command = `
  tell application "iTerm2"
    set newWindow to (create window with default profile)
    tell current session of newWindow
        write text "gopass edit ${key}"
    end tell
  end tell
  `
  await asyncExec(`echo '${command}' | osascript`)
}
