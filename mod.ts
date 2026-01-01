import { Command } from "@cliffy/command";
import { profileCommand } from "@/commands/profile.ts";
import { cloneCommand } from "@/commands/clone.ts";
import { useCommand } from "@/commands/use.ts";

const cmd = new Command()
  .name("gp")
  .version("0.1.0")
  .description("Git profile manager - manage multiple git identities with ease")
  .action(function () {
    this.showHelp();
  })
  .command("profile", profileCommand)
  .command("clone", cloneCommand)
  .command("use", useCommand);

await cmd.parse(Deno.args);
