import { Command } from "@cliffy/command";
import { listProfiles } from "@/config.ts";
import { join } from "@std/path";

export const doctorCommand = new Command()
  .description("Check health of profiles and SSH keys")
  .action(async () => {
    console.log("Checking gp health...\n");

    const home = Deno.env.get("HOME");
    if (!home) {
      console.error("✗ HOME environment variable is not set");
      Deno.exit(1);
    }

    let hasErrors = false;
    let hasWarnings = false;

    // Check config file
    const configPath = join(home, ".gitprofiles.json");
    try {
      await Deno.stat(configPath);
      console.log(`✓ Config file exists: ${configPath}`);
    } catch {
      console.log(`○ Config file not found: ${configPath}`);
      console.log("  (This is fine if you haven't created any profiles yet)");
    }

    // Check profiles and their SSH keys
    const profiles = await listProfiles();
    const profileNames = Object.keys(profiles);

    if (profileNames.length === 0) {
      console.log("\n○ No profiles configured");
      console.log('  Use "gp profile add <name>" to create one.');
      return;
    }

    console.log(`\nFound ${profileNames.length} profile(s):\n`);

    for (const [name, profile] of Object.entries(profiles)) {
      console.log(`Profile: ${name}`);
      console.log(`  Name:  ${profile.name}`);
      console.log(`  Email: ${profile.email}`);

      // Check private key
      try {
        const keyInfo = await Deno.stat(profile.sshKey);
        if (keyInfo.isFile) {
          // Check permissions (should be 600)
          const mode = keyInfo.mode;
          if (mode !== null && (mode & 0o077) !== 0) {
            console.log(`  ⚠ SSH key: ${profile.sshKey}`);
            console.log(`    Warning: Key has too open permissions`);
            hasWarnings = true;
          } else {
            console.log(`  ✓ SSH key: ${profile.sshKey}`);
          }
        }
      } catch {
        console.log(`  ✗ SSH key missing: ${profile.sshKey}`);
        hasErrors = true;
      }

      // Check public key
      const publicKeyPath = `${profile.sshKey}.pub`;
      try {
        await Deno.stat(publicKeyPath);
        console.log(`  ✓ Public key: ${publicKeyPath}`);
      } catch {
        console.log(`  ✗ Public key missing: ${publicKeyPath}`);
        hasErrors = true;
      }

      console.log();
    }

    // Check SSH directory
    const sshDir = join(home, ".ssh");
    try {
      const sshDirInfo = await Deno.stat(sshDir);
      if (sshDirInfo.isDirectory) {
        const mode = sshDirInfo.mode;
        if (mode !== null && (mode & 0o077) !== 0) {
          console.log(`⚠ ~/.ssh directory has too open permissions`);
          hasWarnings = true;
        } else {
          console.log(`✓ ~/.ssh directory permissions OK`);
        }
      }
    } catch {
      console.log(`⚠ ~/.ssh directory not found`);
      hasWarnings = true;
    }

    // Check git is available
    try {
      const git = new Deno.Command("git", {
        args: ["--version"],
        stdout: "piped",
        stderr: "piped",
      });
      const { code, stdout } = await git.output();
      if (code === 0) {
        const version = new TextDecoder().decode(stdout).trim();
        console.log(`✓ ${version}`);
      }
    } catch {
      console.log(`✗ git not found in PATH`);
      hasErrors = true;
    }

    // Check ssh-keygen is available
    try {
      const keygen = new Deno.Command("ssh-keygen", {
        args: ["-V"],
        stdout: "piped",
        stderr: "piped",
      });
      await keygen.output();
      console.log(`✓ ssh-keygen available`);
    } catch {
      console.log(`✗ ssh-keygen not found in PATH`);
      hasErrors = true;
    }

    // Summary
    console.log();
    if (hasErrors) {
      console.log("Some issues found. Please fix the errors above.");
      Deno.exit(1);
    } else if (hasWarnings) {
      console.log("Health check passed with warnings.");
    } else {
      console.log("All checks passed!");
    }
  });
