import { exec } from "child_process";
import { homedir } from "os";

export function asyncExec(command: string): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(
      command,
      {
        encoding: "utf-8",
        env: {
          HOME: homedir(),
          PATH: [
            "/bin", // osascript
            "/usr/bin", // osascript
            "/usr/local/bin", // gpg
            "/usr/local/MacGPG2/bin", // gpg
            "/opt/homebrew/bin", // homebrew on macOS Apple Silicon
          ].join(":"),
        },
      },
      (error, stdout) => {
        if (error) {
          reject(error);
        } else {
          resolve(stdout);
        }
      }
    );
  });
}
