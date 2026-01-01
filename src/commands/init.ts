import { Command } from "@cliffy/command";
import { Confirm, Input, Select } from "@cliffy/prompt";
import { addProfile, listProfiles } from "@/config.ts";
import { generateSshKey, getSshKeyPath, readPublicKey } from "@/ssh.ts";

export const initCommand = new Command()
  .description("Create a new profile and apply it to current repository")
  .option("-p, --profile <name:string>", "Use existing profile instead")
  .action(async (options) => {
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

    const profiles = await listProfiles();
    const profileNames = Object.keys(profiles);
    let profileName: string;
    let profile: { name: string; email: string; sshKey: string };

    if (options.profile) {
      // Use specified existing profile
      profileName = options.profile;
      const existing = profiles[profileName];
      if (!existing) {
        console.error(`Profile "${profileName}" not found.`);
        Deno.exit(1);
      }
      profile = existing;
    } else if (profileNames.length > 0) {
      // Ask: use existing or create new?
      const choice = await Select.prompt({
        message: "What would you like to do?",
        options: [
          { name: "Create new profile", value: "new" },
          { name: "Use existing profile", value: "existing" },
        ],
      });

      if (choice === "existing") {
        profileName = await Select.prompt({
          message: "Select profile",
          options: profileNames.map((name) => ({
            name,
            value: name,
            hint: `${profiles[name].name} <${profiles[name].email}>`,
          })),
        });
        profile = profiles[profileName];
      } else {
        const result = await createNewProfile();
        profileName = result.name;
        profile = result.profile;
      }
    } else {
      // No existing profiles, create new
      console.log("No profiles found. Let's create one.\n");
      const result = await createNewProfile();
      profileName = result.name;
      profile = result.profile;
    }

    // Apply profile to current repository
    const sshCommand = `ssh -i "${profile.sshKey}" -o IdentitiesOnly=yes`;

    await runGitConfig("user.name", profile.name);
    await runGitConfig("user.email", profile.email);
    await runGitConfig("core.sshCommand", sshCommand);

    console.log(`\nApplied profile "${profileName}" to current repository:`);
    console.log(`  user.name:       ${profile.name}`);
    console.log(`  user.email:      ${profile.email}`);
    console.log(`  core.sshCommand: ${sshCommand}`);
  });

async function createNewProfile(): Promise<{
  name: string;
  profile: { name: string; email: string; sshKey: string };
}> {
  const profileName = await Input.prompt({
    message: "Profile name",
    validate: (value) => {
      if (!value.trim()) return "Profile name is required";
      if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
        return "Only letters, numbers, underscores and hyphens allowed";
      }
      return true;
    },
  });

  const userName = await Input.prompt({
    message: "Git user name",
    validate: (value) => value.trim() ? true : "Name is required",
  });

  const email = await Input.prompt({
    message: "Git email",
    validate: (value) => value.trim() ? true : "Email is required",
  });

  console.log("\nGenerating SSH key...");
  await generateSshKey(profileName, email);

  const sshKeyPath = getSshKeyPath(profileName);

  await addProfile(profileName, {
    name: userName,
    email,
    sshKey: sshKeyPath,
  });

  const publicKey = await readPublicKey(profileName);

  console.log(`\nProfile "${profileName}" created!`);
  console.log(`SSH key saved to: ${sshKeyPath}`);
  console.log(`\nPublic key (add to GitHub/GitLab):\n`);
  console.log(publicKey);

  const shouldCopy = await Confirm.prompt({
    message: "Copy public key to clipboard?",
    default: false,
  });

  if (shouldCopy) {
    try {
      const clip = new Deno.Command("xclip", {
        args: ["-selection", "clipboard"],
        stdin: "piped",
      });
      const child = clip.spawn();
      const writer = child.stdin.getWriter();
      await writer.write(new TextEncoder().encode(publicKey));
      await writer.close();
      await child.status;
      console.log("Copied to clipboard!");
    } catch {
      try {
        // Try pbcopy on macOS
        const clip = new Deno.Command("pbcopy", { stdin: "piped" });
        const child = clip.spawn();
        const writer = child.stdin.getWriter();
        await writer.write(new TextEncoder().encode(publicKey));
        await writer.close();
        await child.status;
        console.log("Copied to clipboard!");
      } catch {
        console.log("Could not copy to clipboard (xclip/pbcopy not available)");
      }
    }
  }

  return {
    name: profileName,
    profile: { name: userName, email, sshKey: sshKeyPath },
  };
}

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
