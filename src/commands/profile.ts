import { Command } from "@cliffy/command";
import { Confirm, Input } from "@cliffy/prompt";
import { addProfile, listProfiles, removeProfile } from "@/config.ts";
import {
  deleteSshKey,
  generateSshKey,
  getSshKeyPath,
  readPublicKey,
} from "@/ssh.ts";

const addCommand = new Command()
  .description("Add a new git profile")
  .arguments("<name:string>")
  .action(async (_options, name: string) => {
    console.log(`Creating profile: ${name}\n`);

    const userName = await Input.prompt({
      message: "Git user name",
    });

    const email = await Input.prompt({
      message: "Git email",
    });

    console.log("\nGenerating SSH key...");
    await generateSshKey(name, email);

    const sshKeyPath = getSshKeyPath(name);

    await addProfile(name, {
      name: userName,
      email,
      sshKey: sshKeyPath,
    });

    const publicKey = await readPublicKey(name);

    console.log(`\nProfile "${name}" created successfully!`);
    console.log(`\nSSH key saved to: ${sshKeyPath}`);
    console.log(`\nPublic key (add to GitHub/GitLab):\n`);
    console.log(publicKey);
  });

const listCommand = new Command()
  .description("List all git profiles")
  .alias("ls")
  .action(async () => {
    const profiles = await listProfiles();
    const entries = Object.entries(profiles);

    if (entries.length === 0) {
      console.log("No profiles configured.");
      console.log('Use "gp profile add <name>" to create one.');
      return;
    }

    console.log("Git profiles:\n");
    for (const [name, profile] of entries) {
      console.log(`  ${name}`);
      console.log(`    Name:    ${profile.name}`);
      console.log(`    Email:   ${profile.email}`);
      console.log(`    SSH Key: ${profile.sshKey}`);
      console.log();
    }
  });

const removeCommand = new Command()
  .description("Remove a git profile")
  .alias("rm")
  .arguments("<name:string>")
  .option("--keep-key", "Keep the SSH key file")
  .action(async (options, name: string) => {
    const confirmed = await Confirm.prompt({
      message: `Are you sure you want to remove profile "${name}"?`,
      default: false,
    });

    if (!confirmed) {
      console.log("Cancelled.");
      return;
    }

    const profile = await removeProfile(name);

    if (!options.keepKey) {
      try {
        await deleteSshKey(name);
        console.log(`SSH key deleted: ${profile.sshKey}`);
      } catch (error) {
        console.warn(
          `Warning: Could not delete SSH key: ${(error as Error).message}`,
        );
      }
    }

    console.log(`Profile "${name}" removed.`);
  });

const showCommand = new Command()
  .description("Show profile details")
  .arguments("<name:string>")
  .action(async (_options, name: string) => {
    const profiles = await listProfiles();
    const profile = profiles[name];

    if (!profile) {
      console.error(`Profile "${name}" not found.`);
      Deno.exit(1);
    }

    console.log(`Profile: ${name}\n`);
    console.log(`  Name:    ${profile.name}`);
    console.log(`  Email:   ${profile.email}`);
    console.log(`  SSH Key: ${profile.sshKey}`);

    try {
      const publicKey = await readPublicKey(name);
      console.log(`\nPublic key:\n`);
      console.log(publicKey);
    } catch {
      console.log(`\nPublic key: (not found)`);
    }
  });

export const profileCommand = new Command()
  .description("Manage git profiles")
  .action(function () {
    this.showHelp();
  })
  .command("add", addCommand)
  .command("list", listCommand)
  .command("remove", removeCommand)
  .command("show", showCommand);
