import { Command } from "@cliffy/command";
import { Confirm } from "@cliffy/prompt";
import {
  listProfiles,
  loadConfig,
  type Profile,
  saveConfig,
} from "@/config.ts";
import { getSshKeyPath } from "@/ssh.ts";
import { dirname, join } from "@std/path";

export const exportCommand = new Command()
  .description("Export profiles and SSH keys to a backup file")
  .arguments("<file:string>")
  .action(async (_options, file: string) => {
    const profiles = await listProfiles();
    const profileNames = Object.keys(profiles);

    if (profileNames.length === 0) {
      console.error("No profiles to export.");
      Deno.exit(1);
    }

    // Create temp directory for backup contents
    const tempDir = await Deno.makeTempDir({ prefix: "gp-export-" });

    try {
      // Copy config
      const config = await loadConfig();
      await Deno.writeTextFile(
        join(tempDir, "profiles.json"),
        JSON.stringify(config, null, 2),
      );

      // Create keys directory
      const keysDir = join(tempDir, "keys");
      await Deno.mkdir(keysDir);

      // Copy SSH keys
      let keyCount = 0;
      for (const [name, profile] of Object.entries(profiles)) {
        const privateKey = profile.sshKey;
        const publicKey = `${privateKey}.pub`;

        try {
          await Deno.copyFile(privateKey, join(keysDir, `${name}`));
          await Deno.copyFile(publicKey, join(keysDir, `${name}.pub`));
          keyCount++;
        } catch (error) {
          console.warn(
            `Warning: Could not copy keys for "${name}": ${
              (error as Error).message
            }`,
          );
        }
      }

      // Ensure output directory exists
      const outputDir = dirname(file);
      if (outputDir && outputDir !== ".") {
        await Deno.mkdir(outputDir, { recursive: true });
      }

      // Create tar.gz archive
      const outputPath = file.endsWith(".tar.gz") ? file : `${file}.tar.gz`;

      const tar = new Deno.Command("tar", {
        args: ["-czf", outputPath, "-C", tempDir, "."],
        stdout: "piped",
        stderr: "piped",
      });

      const { code, stderr } = await tar.output();

      if (code !== 0) {
        const errorText = new TextDecoder().decode(stderr);
        throw new Error(`Failed to create archive: ${errorText}`);
      }

      console.log(
        `Exported ${profileNames.length} profile(s) with ${keyCount} key pair(s)`,
      );
      console.log(`Saved to: ${outputPath}`);
    } finally {
      // Cleanup temp directory
      await Deno.remove(tempDir, { recursive: true });
    }
  });

export const importCommand = new Command()
  .description("Import profiles and SSH keys from a backup file")
  .arguments("<file:string>")
  .option("--force", "Overwrite existing profiles")
  .action(async (options, file: string) => {
    // Check file exists
    try {
      await Deno.stat(file);
    } catch {
      console.error(`File not found: ${file}`);
      Deno.exit(1);
    }

    // Create temp directory for extraction
    const tempDir = await Deno.makeTempDir({ prefix: "gp-import-" });

    try {
      // Extract archive
      const tar = new Deno.Command("tar", {
        args: ["-xzf", file, "-C", tempDir],
        stdout: "piped",
        stderr: "piped",
      });

      const { code, stderr } = await tar.output();

      if (code !== 0) {
        const errorText = new TextDecoder().decode(stderr);
        throw new Error(`Failed to extract archive: ${errorText}`);
      }

      // Read profiles from backup
      const profilesPath = join(tempDir, "profiles.json");
      let backupConfig: { profiles: Record<string, Profile> };

      try {
        const content = await Deno.readTextFile(profilesPath);
        backupConfig = JSON.parse(content);
      } catch {
        console.error(
          "Invalid backup file: profiles.json not found or invalid",
        );
        Deno.exit(1);
      }

      const existingProfiles = await listProfiles();
      const keysDir = join(tempDir, "keys");

      let imported = 0;
      let skipped = 0;

      for (const [name, profile] of Object.entries(backupConfig.profiles)) {
        // Check if profile already exists
        if (existingProfiles[name] && !options.force) {
          console.log(
            `Skipping "${name}" (already exists, use --force to overwrite)`,
          );
          skipped++;
          continue;
        }

        if (existingProfiles[name] && options.force) {
          const confirmed = await Confirm.prompt({
            message: `Overwrite existing profile "${name}"?`,
            default: false,
          });

          if (!confirmed) {
            skipped++;
            continue;
          }
        }

        // Copy SSH keys
        const newKeyPath = getSshKeyPath(name);
        const sourcePrivate = join(keysDir, name);
        const sourcePublic = join(keysDir, `${name}.pub`);

        try {
          await Deno.copyFile(sourcePrivate, newKeyPath);
          await Deno.chmod(newKeyPath, 0o600);
          await Deno.copyFile(sourcePublic, `${newKeyPath}.pub`);
        } catch (error) {
          console.warn(
            `Warning: Could not copy keys for "${name}": ${
              (error as Error).message
            }`,
          );
          continue;
        }

        // Add profile with new key path
        const newProfile: Profile = {
          name: profile.name,
          email: profile.email,
          sshKey: newKeyPath,
        };

        // Direct config manipulation to allow overwrite
        const config = await loadConfig();
        config.profiles[name] = newProfile;
        await saveConfig(config);

        console.log(`Imported: ${name} (${profile.name} <${profile.email}>)`);
        imported++;
      }

      console.log(`\nImported ${imported} profile(s), skipped ${skipped}`);
    } finally {
      // Cleanup temp directory
      await Deno.remove(tempDir, { recursive: true });
    }
  });

export const backupCommand = new Command()
  .description("Backup and restore profiles")
  .action(function () {
    this.showHelp();
  })
  .command("export", exportCommand)
  .command("import", importCommand);
