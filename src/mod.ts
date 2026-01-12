import { Command } from "@cliffy/command";
import { backupCommand } from "@/commands/backup.ts";
import { cloneCommand } from "@/commands/clone.ts";
import { doctorCommand } from "@/commands/doctor.ts";
import { initCommand } from "@/commands/init.ts";
import { profileCommand } from "@/commands/profile.ts";
import { statusCommand } from "@/commands/status.ts";
import { uiCommand } from "@/commands/ui.ts";
import { useCommand } from "@/commands/use.ts";

const cmd = new Command()
  .name("gp")
  .version("0.3.1")
  .description("Git profile manager - manage multiple git identities with ease")
  .action(function () {
    cmd.showHelp();
  })
  .command("profile", profileCommand)
  .command("clone", cloneCommand)
  .command("use", useCommand)
  .command("status", statusCommand)
  .command("init", initCommand)
  .command("doctor", doctorCommand)
  .command("backup", backupCommand)
  .command("ui", uiCommand);

await cmd.parse(Deno.args);
