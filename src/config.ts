import { join } from "@std/path";

export interface Profile {
  name: string;
  email: string;
  sshKey: string;
}

export interface Config {
  profiles: Record<string, Profile>;
}

const CONFIG_FILE = ".gitprofiles.json";

function getConfigPath(): string {
  const home = Deno.env.get("HOME");
  if (!home) {
    throw new Error("HOME environment variable is not set");
  }
  return join(home, CONFIG_FILE);
}

export async function loadConfig(): Promise<Config> {
  const configPath = getConfigPath();
  try {
    const content = await Deno.readTextFile(configPath);
    return JSON.parse(content) as Config;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      return { profiles: {} };
    }
    throw error;
  }
}

export async function saveConfig(config: Config): Promise<void> {
  const configPath = getConfigPath();
  await Deno.writeTextFile(configPath, JSON.stringify(config, null, 2) + "\n");
}

export async function getProfile(name: string): Promise<Profile | undefined> {
  const config = await loadConfig();
  return config.profiles[name];
}

export async function addProfile(
  name: string,
  profile: Profile,
): Promise<void> {
  const config = await loadConfig();
  if (config.profiles[name]) {
    throw new Error(`Profile "${name}" already exists`);
  }
  config.profiles[name] = profile;
  await saveConfig(config);
}

export async function removeProfile(name: string): Promise<Profile> {
  const config = await loadConfig();
  const profile = config.profiles[name];
  if (!profile) {
    throw new Error(`Profile "${name}" not found`);
  }
  delete config.profiles[name];
  await saveConfig(config);
  return profile;
}

export async function listProfiles(): Promise<Record<string, Profile>> {
  const config = await loadConfig();
  return config.profiles;
}
