import { assertEquals, assertRejects } from "@std/assert";
import {
  addProfile,
  getProfile,
  listProfiles,
  loadConfig,
  removeProfile,
  saveConfig,
} from "@/config.ts";

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

Deno.test("loadConfig - returns empty profiles when config does not exist", async () => {
  await withTempHome(async () => {
    const config = await loadConfig();
    assertEquals(config, { profiles: {} });
  });
});

Deno.test("saveConfig and loadConfig - round trip", async () => {
  await withTempHome(async () => {
    const config = {
      profiles: {
        work: {
          name: "John Doe",
          email: "john@work.com",
          sshKey: "/home/user/.ssh/work_key",
        },
      },
    };

    await saveConfig(config);
    const loaded = await loadConfig();

    assertEquals(loaded, config);
  });
});

Deno.test("addProfile - adds new profile", async () => {
  await withTempHome(async () => {
    const profile = {
      name: "Jane Doe",
      email: "jane@example.com",
      sshKey: "/home/user/.ssh/jane_key",
    };

    await addProfile("personal", profile);

    const loaded = await getProfile("personal");
    assertEquals(loaded, profile);
  });
});

Deno.test("addProfile - throws when profile already exists", async () => {
  await withTempHome(async () => {
    const profile = {
      name: "Jane Doe",
      email: "jane@example.com",
      sshKey: "/home/user/.ssh/jane_key",
    };

    await addProfile("personal", profile);

    await assertRejects(
      () => addProfile("personal", profile),
      Error,
      'Profile "personal" already exists',
    );
  });
});

Deno.test("getProfile - returns undefined for non-existent profile", async () => {
  await withTempHome(async () => {
    const profile = await getProfile("nonexistent");
    assertEquals(profile, undefined);
  });
});

Deno.test("removeProfile - removes existing profile", async () => {
  await withTempHome(async () => {
    const profile = {
      name: "Test User",
      email: "test@example.com",
      sshKey: "/home/user/.ssh/test_key",
    };

    await addProfile("test", profile);
    const removed = await removeProfile("test");

    assertEquals(removed, profile);

    const loaded = await getProfile("test");
    assertEquals(loaded, undefined);
  });
});

Deno.test("removeProfile - throws when profile not found", async () => {
  await withTempHome(async () => {
    await assertRejects(
      () => removeProfile("nonexistent"),
      Error,
      'Profile "nonexistent" not found',
    );
  });
});

Deno.test("listProfiles - returns all profiles", async () => {
  await withTempHome(async () => {
    const profile1 = {
      name: "User One",
      email: "one@example.com",
      sshKey: "/home/user/.ssh/one_key",
    };
    const profile2 = {
      name: "User Two",
      email: "two@example.com",
      sshKey: "/home/user/.ssh/two_key",
    };

    await addProfile("first", profile1);
    await addProfile("second", profile2);

    const profiles = await listProfiles();

    assertEquals(profiles, {
      first: profile1,
      second: profile2,
    });
  });
});
