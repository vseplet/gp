import { join } from "jsr:@std/path@1";

function getSshDir(): string {
  const home = Deno.env.get("HOME");
  if (!home) {
    throw new Error("HOME environment variable is not set");
  }
  return join(home, ".ssh");
}

export function getSshKeyPath(profileName: string): string {
  return join(getSshDir(), `gitprofile_${profileName}`);
}

export async function generateSshKey(
  profileName: string,
  email: string
): Promise<{ privateKey: string; publicKey: string }> {
  const keyPath = getSshKeyPath(profileName);
  const publicKeyPath = `${keyPath}.pub`;

  // Check if key already exists
  try {
    await Deno.stat(keyPath);
    throw new Error(`SSH key already exists at ${keyPath}`);
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) {
      throw error;
    }
  }

  // Ensure .ssh directory exists with correct permissions
  const sshDir = getSshDir();
  try {
    await Deno.mkdir(sshDir, { mode: 0o700 });
  } catch (error) {
    if (!(error instanceof Deno.errors.AlreadyExists)) {
      throw error;
    }
  }

  // Generate SSH key using ssh-keygen
  const command = new Deno.Command("ssh-keygen", {
    args: [
      "-t", "ed25519",
      "-C", email,
      "-f", keyPath,
      "-N", "", // empty passphrase
    ],
    stdout: "piped",
    stderr: "piped",
  });

  const { code, stderr } = await command.output();

  if (code !== 0) {
    const errorText = new TextDecoder().decode(stderr);
    throw new Error(`Failed to generate SSH key: ${errorText}`);
  }

  // Set correct permissions on private key
  await Deno.chmod(keyPath, 0o600);

  return {
    privateKey: keyPath,
    publicKey: publicKeyPath,
  };
}

export async function readPublicKey(profileName: string): Promise<string> {
  const publicKeyPath = `${getSshKeyPath(profileName)}.pub`;
  return await Deno.readTextFile(publicKeyPath);
}

export async function deleteSshKey(profileName: string): Promise<void> {
  const keyPath = getSshKeyPath(profileName);
  const publicKeyPath = `${keyPath}.pub`;

  const errors: Error[] = [];

  try {
    await Deno.remove(keyPath);
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) {
      errors.push(error as Error);
    }
  }

  try {
    await Deno.remove(publicKeyPath);
  } catch (error) {
    if (!(error instanceof Deno.errors.NotFound)) {
      errors.push(error as Error);
    }
  }

  if (errors.length > 0) {
    throw new Error(`Failed to delete SSH keys: ${errors.map(e => e.message).join(", ")}`);
  }
}
