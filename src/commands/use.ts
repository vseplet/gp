import { Command } from "@cliffy/command";
import { getProfile } from "@/config.ts";

export const useCommand = new Command()
  .description("Apply a git profile to the current repository")
  .arguments("<name:string>")
  .action(async (_options, name: string) => {
    const profile = await getProfile(name);

    if (!profile) {
      console.error(`Profile "${name}" not found.`);
      console.error('Use "gp profile list" to see available profiles.');
      Deno.exit(1);
    }

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

    // Apply profile settings
    const sshCommand = `ssh -i ${profile.sshKey} -o IdentitiesOnly=yes`;

    await runGitConfig("user.name", profile.name);
    await runGitConfig("user.email", profile.email);
    await runGitConfig("core.sshCommand", sshCommand);

    console.log(`Applied profile "${name}" to current repository:`);
    console.log(`  user.name:       ${profile.name}`);
    console.log(`  user.email:      ${profile.email}`);
    console.log(`  core.sshCommand: ${sshCommand}`);
  });

async function runGitConfig(key: string, value: string): Promise<void> {
  const process = new Deno.Command("git", {
    args: ["config", key, value],
    stdout: "piped",
    stderr: "piped",
  });

  const { code, stderr } = await process.output();

  if (code !== 0) {
    const errorText = new TextDecoder().decode(stderr);
    throw new Error(`Failed to set ${key}: ${errorText}`);
  }
}
