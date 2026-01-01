import { Command } from "@cliffy/command";
import { listProfiles } from "@/config.ts";

export const statusCommand = new Command()
  .description("Show current git profile in this repository")
  .action(async () => {
    // Check if we're in a git repository
    const checkGit = new Deno.Command("git", {
      args: ["rev-parse", "--git-dir"],
      stdout: "piped",
      stderr: "piped",
    });

    const { code: gitCheckCode } = await checkGit.output();

    if (gitCheckCode !== 0) {
      console.error("Not in a git repository.");
      Deno.exit(1);
    }

    // Get current git config
    const userName = await getGitConfig("user.name");
    const userEmail = await getGitConfig("user.email");
    const sshCommand = await getGitConfig("core.sshCommand");

    if (!userName && !userEmail) {
      console.log("No git identity configured in this repository.");
      console.log('Use "gp use <profile>" to apply a profile.');
      return;
    }

    console.log("Current repository config:\n");
    console.log(`  user.name:       ${userName || "(not set)"}`);
    console.log(`  user.email:      ${userEmail || "(not set)"}`);
    console.log(`  core.sshCommand: ${sshCommand || "(not set)"}`);

    // Try to match with a profile
    const profiles = await listProfiles();
    let matchedProfile: string | null = null;

    for (const [name, profile] of Object.entries(profiles)) {
      if (profile.name === userName && profile.email === userEmail) {
        matchedProfile = name;
        break;
      }
    }

    console.log();
    if (matchedProfile) {
      console.log(`Matched profile: ${matchedProfile}`);
    } else if (Object.keys(profiles).length > 0) {
      console.log("No matching profile found.");
    }
  });

async function getGitConfig(key: string): Promise<string | null> {
  const process = new Deno.Command("git", {
    args: ["config", "--local", key],
    stdout: "piped",
    stderr: "piped",
  });

  const { code, stdout } = await process.output();

  if (code !== 0) {
    return null;
  }

  return new TextDecoder().decode(stdout).trim();
}
