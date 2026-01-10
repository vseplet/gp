import { assertEquals, assertRejects, assertStringIncludes } from "@std/assert";
import { join } from "@std/path";
import {
  deleteSshKey,
  generateSshKey,
  getSshKeyPath,
  readPublicKey,
} from "@/ssh.ts";

async function withTempHome(fn: (tempDir: string) => Promise<void>) {
  const tempDir = await Deno.makeTempDir();
  const originalHome = Deno.env.get("HOME");

  try {
    Deno.env.set("HOME", tempDir);
    await fn(tempDir);
  } finally {
    if (originalHome) {
      Deno.env.set("HOME", originalHome);
    }
    await Deno.remove(tempDir, { recursive: true });
  }
}

Deno.test("getSshKeyPath - returns correct path", () => {
  const originalHome = Deno.env.get("HOME");
  try {
    Deno.env.set("HOME", "/home/testuser");
    const path = getSshKeyPath("work");
    assertEquals(path, "/home/testuser/.ssh/gitprofile_work");
  } finally {
    if (originalHome) {
      Deno.env.set("HOME", originalHome);
    }
  }
});

Deno.test("generateSshKey - creates key pair", async () => {
  await withTempHome(async (tempDir) => {
    const { privateKey, publicKey } = await generateSshKey(
      "test",
      "test@example.com",
    );

    assertEquals(privateKey, join(tempDir, ".ssh", "gitprofile_test"));
    assertEquals(publicKey, join(tempDir, ".ssh", "gitprofile_test.pub"));

    const privateKeyInfo = await Deno.stat(privateKey);
    assertEquals(privateKeyInfo.isFile, true);

    const publicKeyInfo = await Deno.stat(publicKey);
    assertEquals(publicKeyInfo.isFile, true);
  });
});

Deno.test("generateSshKey - throws when key already exists", async () => {
  await withTempHome(async (tempDir) => {
    const sshDir = join(tempDir, ".ssh");
    await Deno.mkdir(sshDir, { mode: 0o700 });

    const keyPath = join(sshDir, "gitprofile_existing");
    await Deno.writeTextFile(keyPath, "fake key");

    await assertRejects(
      () => generateSshKey("existing", "test@example.com"),
      Error,
      "SSH key already exists",
    );
  });
});

Deno.test("readPublicKey - reads public key content", async () => {
  await withTempHome(async () => {
    await generateSshKey("reader", "reader@example.com");
    const publicKey = await readPublicKey("reader");

    assertStringIncludes(publicKey, "ssh-ed25519");
    assertStringIncludes(publicKey, "reader@example.com");
  });
});

Deno.test("deleteSshKey - removes key pair", async () => {
  await withTempHome(async (tempDir) => {
    await generateSshKey("todelete", "delete@example.com");

    const privateKeyPath = join(tempDir, ".ssh", "gitprofile_todelete");
    const publicKeyPath = `${privateKeyPath}.pub`;

    const beforePrivate = await Deno.stat(privateKeyPath).catch(() => null);
    const beforePublic = await Deno.stat(publicKeyPath).catch(() => null);
    assertEquals(beforePrivate?.isFile, true);
    assertEquals(beforePublic?.isFile, true);

    await deleteSshKey("todelete");

    const afterPrivate = await Deno.stat(privateKeyPath).catch(() => null);
    const afterPublic = await Deno.stat(publicKeyPath).catch(() => null);
    assertEquals(afterPrivate, null);
    assertEquals(afterPublic, null);
  });
});

Deno.test("deleteSshKey - succeeds when keys do not exist", async () => {
  await withTempHome(async () => {
    await deleteSshKey("nonexistent");
  });
});
