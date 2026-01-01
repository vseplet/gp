import { Command } from "@cliffy/command";
import { Select } from "@cliffy/prompt";
import { getProfile, listProfiles } from "@/config.ts";
import { basename } from "@std/path";

export const cloneCommand = new Command()
  .description("Clone a repository with a specific git profile")
  .arguments("<url:string> [directory:string]")
  .option("-p, --profile <name:string>", "Git profile to use")
  .action(async (options, url: string, directory?: string) => {
    let profileName = options.profile;

    // If no profile specified, show interactive selection
    if (!profileName) {
      const profiles = await listProfiles();
      const profileNames = Object.keys(profiles);

      if (profileNames.length === 0) {
        console.error("No profiles configured.");
        console.error('Use "gp profile add <name>" to create one.');
        Deno.exit(1);
      }

      profileName = await Select.prompt({
        message: "Select git profile",
        options: profileNames.map((name) => ({
          name,
          value: name,
          hint: `${profiles[name].name} <${profiles[name].email}>`,
        })),
      });
    }

    const profile = await getProfile(profileName);

    if (!profile) {
      console.error(`Profile "${profileName}" not found.`);
      console.error('Use "gp profile list" to see available profiles.');
      Deno.exit(1);
    }

    // Determine target directory
    const targetDir = directory ?? extractRepoName(url);

    console.log(`Cloning with profile: ${profileName}`);
    console.log(`  User: ${profile.name} <${profile.email}>`);
    console.log(`  SSH Key: ${profile.sshKey}\n`);

    // Clone using custom SSH command
    const sshCommand = `ssh -i ${profile.sshKey} -o IdentitiesOnly=yes`;

    const cloneProcess = new Deno.Command("git", {
      args: ["clone", url, targetDir],
      env: {
        ...Deno.env.toObject(),
        GIT_SSH_COMMAND: sshCommand,
      },
      stdout: "inherit",
      stderr: "inherit",
    });

    const { code } = await cloneProcess.output();

    if (code !== 0) {
      console.error("\nClone failed.");
      Deno.exit(code);
    }

    // Configure the cloned repository with the profile
    console.log("\nConfiguring repository with profile...");

    await runGitConfig(targetDir, "user.name", profile.name);
    await runGitConfig(targetDir, "user.email", profile.email);
    await runGitConfig(targetDir, "core.sshCommand", sshCommand);

    console.log(
      `\nRepository cloned and configured with profile "${profileName}".`,
    );
  });

function extractRepoName(url: string): string {
  // Handle various URL formats:
  // git@github.com:user/repo.git
  // https://github.com/user/repo.git
  // https://github.com/user/repo

  let name = url;

  // Remove .git suffix
  if (name.endsWith(".git")) {
    name = name.slice(0, -4);
  }

  // Get last path component
  name = basename(name);

  // Handle SSH format (git@github.com:user/repo)
  if (name.includes(":")) {
    name = name.split(":").pop() ?? name;
    name = basename(name);
  }

  return name || "repo";
}

async function runGitConfig(
  dir: string,
  key: string,
  value: string,
): Promise<void> {
  const process = new Deno.Command("git", {
    args: ["-C", dir, "config", key, value],
    stdout: "piped",
    stderr: "piped",
  });

  const { code, stderr } = await process.output();

  if (code !== 0) {
    const errorText = new TextDecoder().decode(stderr);
    throw new Error(`Failed to set ${key}: ${errorText}`);
  }
}
