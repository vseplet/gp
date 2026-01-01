import { Command } from "@cliffy/command";
import { profileCommand } from "./src/commands/profile.ts";
import { cloneCommand } from "./src/commands/clone.ts";
import { useCommand } from "./src/commands/use.ts";

await new Command()
  .name("gp")
  .version("0.1.0")
  .description("Git profile manager - manage multiple git identities with ease")
  .command("profile", profileCommand)
  .command("clone", cloneCommand)
  .command("use", useCommand)
  .parse(Deno.args);
