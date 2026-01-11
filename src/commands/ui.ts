import { Command } from "@cliffy/command";
import {
  basic,
  component,
  html,
  meta,
  Morph,
  type MorphTemplate,
  rpc,
  styled,
} from "@vseplet/morph";
import {
  addProfile,
  getProfile,
  listProfiles,
  loadConfig,
  type Profile,
  removeProfile,
  saveConfig,
} from "@/config.ts";
import {
  deleteSshKey,
  generateSshKey,
  getSshKeyPath,
  readPublicKey,
} from "@/ssh.ts";
import { join } from "@std/path";

// Styles
const containerStyles = styled`
  background: #0d1117;
  color: #c9d1d9;
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
  padding: 24px;
  margin: 0;
`;

const headerStyles = styled`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #30363d;
`;

const titleStyles = styled`
  color: #58a6ff;
  font-size: 24px;
  font-weight: 600;
  margin: 0;
`;

const badgeStyles = styled`
  background: #238636;
  color: #fff;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 12px;
`;

const cardStyles = styled`
  background: #161b22;
  border: 1px solid #30363d;
  border-radius: 6px;
  padding: 16px;
  margin-bottom: 16px;
`;

const profileNameStyles = styled`
  color: #58a6ff;
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 12px 0;
`;

const labelStyles = styled`
  color: #8b949e;
  font-size: 12px;
  text-transform: uppercase;
  margin-bottom: 4px;
`;

const valueStyles = styled`
  color: #c9d1d9;
  font-size: 14px;
  margin-bottom: 12px;
  font-family: monospace;
`;

const btnStyles = styled`
  background: #21262d;
  color: #c9d1d9;
  border: 1px solid #30363d;
  border-radius: 6px;
  padding: 8px 16px;
  cursor: pointer;
  font-size: 14px;
  &:hover { background: #30363d; }
`;

const btnDangerStyles = styled`
  background: #21262d;
  color: #f85149;
  border: 1px solid #f85149;
  border-radius: 6px;
  padding: 8px 16px;
  cursor: pointer;
  font-size: 14px;
  &:hover { background: #f8514922; }
`;

const btnSuccessStyles = styled`
  background: #238636;
  color: #fff;
  border: 1px solid #238636;
  border-radius: 6px;
  padding: 8px 16px;
  cursor: pointer;
  font-size: 14px;
  &:hover { background: #2ea043; }
`;

const btnPrimaryStyles = styled`
  background: #238636;
  color: #fff;
  border: 1px solid #238636;
  border-radius: 6px;
  padding: 8px 16px;
  cursor: pointer;
  font-size: 14px;
  text-decoration: none;
  display: inline-block;
  &:hover { background: #2ea043; }
`;

const inputStyles = styled`
  background: #0d1117;
  color: #c9d1d9;
  border: 1px solid #30363d;
  border-radius: 6px;
  padding: 8px 12px;
  font-size: 14px;
  width: 100%;
  box-sizing: border-box;
  margin-bottom: 12px;
  &:focus {
    outline: none;
    border-color: #58a6ff;
  }
`;

const formGroupStyles = styled`
  margin-bottom: 16px;
`;

const emptyStateStyles = styled`
  text-align: center;
  padding: 48px;
  color: #8b949e;
`;

const sshKeyStyles = styled`
  background: #0d1117;
  border: 1px solid #30363d;
  border-radius: 6px;
  padding: 12px;
  font-family: monospace;
  font-size: 12px;
  word-break: break-all;
  color: #7ee787;
  margin-top: 8px;
`;

const actionsStyles = styled`
  display: flex;
  gap: 8px;
  margin-top: 12px;
`;

const profilesGridStyles = styled`
  display: grid;
  gap: 16px;
`;

const sectionTitleStyles = styled`
  color: #c9d1d9;
  margin: 24px 0 16px 0;
`;

const errorStyles = styled`
  background: #f8514922;
  border: 1px solid #f85149;
  color: #f85149;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 16px;
`;

const successStyles = styled`
  background: #23863622;
  border: 1px solid #238636;
  color: #7ee787;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 16px;
`;

const detailsStyles = styled`
  & summary {
    cursor: pointer;
    list-style: none;
  }
  & summary::-webkit-details-marker {
    display: none;
  }
`;

const checkItemStyles = styled`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  border-bottom: 1px solid #30363d;
  &:last-child { border-bottom: none; }
`;

const checkIconOk = styled`
  color: #7ee787;
  font-weight: bold;
`;

const checkIconError = styled`
  color: #f85149;
  font-weight: bold;
`;

const checkIconWarning = styled`
  color: #d29922;
  font-weight: bold;
`;

const checkTextStyles = styled`
  color: #c9d1d9;
  font-size: 14px;
`;

const checkSubtextStyles = styled`
  color: #8b949e;
  font-size: 12px;
  margin-left: 24px;
`;

const twoColumnStyles = styled`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const fileInputStyles = styled`
  background: #0d1117;
  color: #c9d1d9;
  border: 1px solid #30363d;
  border-radius: 6px;
  padding: 8px 12px;
  font-size: 14px;
  width: 100%;
  box-sizing: border-box;
  cursor: pointer;
  &::file-selector-button {
    background: #21262d;
    color: #c9d1d9;
    border: 1px solid #30363d;
    border-radius: 4px;
    padding: 4px 12px;
    margin-right: 12px;
    cursor: pointer;
  }
`;

// Doctor check types
interface CheckResult {
  status: "ok" | "error" | "warning" | "info";
  message: string;
  detail?: string;
}

// Run doctor checks
async function runDoctorChecks(): Promise<CheckResult[]> {
  const results: CheckResult[] = [];
  const home = Deno.env.get("HOME");

  if (!home) {
    results.push({
      status: "error",
      message: "HOME environment variable is not set",
    });
    return results;
  }

  // Check config file
  const configPath = join(home, ".gitprofiles.json");
  try {
    await Deno.stat(configPath);
    results.push({
      status: "ok",
      message: "Config file exists",
      detail: configPath,
    });
  } catch {
    results.push({
      status: "info",
      message: "Config file not found",
      detail: "This is fine if you haven't created any profiles yet",
    });
  }

  // Check profiles and their SSH keys
  const profiles = await listProfiles();
  const profileNames = Object.keys(profiles);

  if (profileNames.length === 0) {
    results.push({
      status: "info",
      message: "No profiles configured",
    });
  } else {
    results.push({
      status: "ok",
      message: `Found ${profileNames.length} profile(s)`,
    });

    for (const [name, profile] of Object.entries(profiles)) {
      // Check private key
      try {
        const keyInfo = await Deno.stat(profile.sshKey);
        if (keyInfo.isFile) {
          const mode = keyInfo.mode;
          if (mode !== null && (mode & 0o077) !== 0) {
            results.push({
              status: "warning",
              message: `Profile "${name}": SSH key has too open permissions`,
              detail: profile.sshKey,
            });
          } else {
            results.push({
              status: "ok",
              message: `Profile "${name}": SSH key OK`,
              detail: profile.sshKey,
            });
          }
        }
      } catch {
        results.push({
          status: "error",
          message: `Profile "${name}": SSH key missing`,
          detail: profile.sshKey,
        });
      }

      // Check public key
      const publicKeyPath = `${profile.sshKey}.pub`;
      try {
        await Deno.stat(publicKeyPath);
      } catch {
        results.push({
          status: "error",
          message: `Profile "${name}": Public key missing`,
          detail: publicKeyPath,
        });
      }
    }
  }

  // Check SSH directory
  const sshDir = join(home, ".ssh");
  try {
    const sshDirInfo = await Deno.stat(sshDir);
    if (sshDirInfo.isDirectory) {
      const mode = sshDirInfo.mode;
      if (mode !== null && (mode & 0o077) !== 0) {
        results.push({
          status: "warning",
          message: "~/.ssh directory has too open permissions",
        });
      } else {
        results.push({
          status: "ok",
          message: "~/.ssh directory permissions OK",
        });
      }
    }
  } catch {
    results.push({
      status: "warning",
      message: "~/.ssh directory not found",
    });
  }

  // Check git
  try {
    const git = new Deno.Command("git", {
      args: ["--version"],
      stdout: "piped",
      stderr: "piped",
    });
    const { code, stdout } = await git.output();
    if (code === 0) {
      const version = new TextDecoder().decode(stdout).trim();
      results.push({
        status: "ok",
        message: version,
      });
    }
  } catch {
    results.push({
      status: "error",
      message: "git not found in PATH",
    });
  }

  // Check ssh-keygen
  try {
    const keygen = new Deno.Command("ssh-keygen", {
      args: ["-V"],
      stdout: "piped",
      stderr: "piped",
    });
    await keygen.output();
    results.push({
      status: "ok",
      message: "ssh-keygen available",
    });
  } catch {
    results.push({
      status: "error",
      message: "ssh-keygen not found in PATH",
    });
  }

  return results;
}

// Helper functions for rendering
async function renderProfileCard(
  profileKey: string,
  profile: Profile,
  deleteRpcAttr: string,
): Promise<MorphTemplate> {
  let publicKey = "";
  try {
    publicKey = await readPublicKey(profileKey);
  } catch {
    publicKey = "SSH key not found";
  }

  return html`
    <div class="${cardStyles}">
      <h3 class="${profileNameStyles}">${profileKey}</h3>
      <div>
        <div class="${labelStyles}">Name</div>
        <div class="${valueStyles}">${profile.name}</div>
      </div>
      <div>
        <div class="${labelStyles}">Email</div>
        <div class="${valueStyles}">${profile.email}</div>
      </div>
      <div>
        <div class="${labelStyles}">SSH Key</div>
        <div class="${valueStyles}">${profile.sshKey}</div>
      </div>
      <details class="${detailsStyles}">
        <summary class="${btnStyles}">Show Public Key</summary>
        <div class="${sshKeyStyles}">${publicKey}</div>
      </details>
      <div class="${actionsStyles}">
        <button
          class="${btnDangerStyles}"
          ${deleteRpcAttr}
          hx-vals='{"key": "${profileKey}"}'
          hx-target="#profiles-container"
          hx-swap="innerHTML"
          hx-confirm="Are you sure you want to delete profile '${profileKey}'?"
        >
          Delete
        </button>
      </div>
    </div>
  `;
}

async function renderProfilesList(
  deleteRpcAttr: string,
): Promise<MorphTemplate> {
  const profiles = await listProfiles();
  const profileEntries = Object.entries(profiles);

  if (profileEntries.length === 0) {
    return html`
      <div class="${emptyStateStyles}">
        <p>No profiles yet</p>
        <p>Create your first profile using the form above</p>
      </div>
    `;
  }

  const cards = await Promise.all(
    profileEntries.map(([key, profile]) =>
      renderProfileCard(key, profile, deleteRpcAttr)
    ),
  );

  return html`
    <div class="${profilesGridStyles}">
      ${cards}
    </div>
  `;
}

function renderCheckResult(check: CheckResult): MorphTemplate {
  const icon = check.status === "ok"
    ? html`
      <span class="${checkIconOk}">✓</span>
    `
    : check.status === "error"
    ? html`
      <span class="${checkIconError}">✗</span>
    `
    : check.status === "warning"
    ? html`
      <span class="${checkIconWarning}">⚠</span>
    `
    : html`
      <span class="${checkIconWarning}">○</span>
    `;

  return html`
    <div class="${checkItemStyles}">
      ${icon}
      <span class="${checkTextStyles}">${check.message}</span>
    </div>
    ${check.detail
      ? html`
        <div class="${checkSubtextStyles}">${check.detail}</div>
      `
      : ""}
  `;
}

// RPC handlers
const profileApi = rpc({
  create: async (
    _req,
    args: { key: string; name: string; email: string },
  ): Promise<MorphTemplate> => {
    const deleteAttr =
      `hx-ext='json-enc' hx-post='/rpc/${profileApi.name}/delete'`;
    try {
      const { privateKey } = await generateSshKey(args.key, args.email);
      await addProfile(args.key, {
        name: args.name,
        email: args.email,
        sshKey: privateKey,
      });
      return await renderProfilesList(deleteAttr);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      const list = await renderProfilesList(deleteAttr);
      return html`
        <div class="${errorStyles}">Error: ${message}</div>
        ${list}
      `;
    }
  },
  delete: async (_req, args: { key: string }): Promise<MorphTemplate> => {
    const deleteAttr =
      `hx-ext='json-enc' hx-post='/rpc/${profileApi.name}/delete'`;
    try {
      await removeProfile(args.key);
      await deleteSshKey(args.key);
      return await renderProfilesList(deleteAttr);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      const list = await renderProfilesList(deleteAttr);
      return html`
        <div class="${errorStyles}">Error: ${message}</div>
        ${list}
      `;
    }
  },
});

// Git operations helpers
async function runGitConfig(
  dir: string,
  key: string,
  value: string,
): Promise<void> {
  const process = new Deno.Command("git", {
    args: ["-C", dir, "config", key, value],
    stdout: "piped",
    stderr: "piped",
  });

  const { code, stderr } = await process.output();

  if (code !== 0) {
    const errorText = new TextDecoder().decode(stderr);
    throw new Error(`Failed to set ${key}: ${errorText}`);
  }
}

function extractRepoName(url: string): string {
  let name = url;
  if (name.endsWith(".git")) {
    name = name.slice(0, -4);
  }
  const parts = name.split("/");
  name = parts[parts.length - 1] || "repo";
  if (name.includes(":")) {
    name = name.split(":").pop() || name;
  }
  return name;
}

const gitApi = rpc({
  clone: async (
    _req,
    args: { url: string; directory?: string; profile: string },
  ): Promise<MorphTemplate> => {
    const profile = await getProfile(args.profile);
    if (!profile) {
      return html`
        <div class="${errorStyles}">Profile "${args.profile}" not found</div>
      `;
    }

    const targetDir = args.directory || extractRepoName(args.url);
    const sshCommand = `ssh -i ${profile.sshKey} -o IdentitiesOnly=yes`;

    try {
      // Clone
      const cloneProcess = new Deno.Command("git", {
        args: ["clone", args.url, targetDir],
        env: {
          ...Deno.env.toObject(),
          GIT_SSH_COMMAND: sshCommand,
        },
        stdout: "piped",
        stderr: "piped",
      });

      const { code, stderr } = await cloneProcess.output();

      if (code !== 0) {
        const errorText = new TextDecoder().decode(stderr);
        return html`
          <div class="${errorStyles}">Clone failed: ${errorText}</div>
        `;
      }

      // Configure repository
      await runGitConfig(targetDir, "user.name", profile.name);
      await runGitConfig(targetDir, "user.email", profile.email);
      await runGitConfig(targetDir, "core.sshCommand", sshCommand);

      return html`
        <div class="${successStyles}">
          Repository cloned to <strong>${targetDir}</strong> with profile "${args
            .profile}"
        </div>
      `;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return html`
        <div class="${errorStyles}">Clone failed: ${message}</div>
      `;
    }
  },
  use: async (
    _req,
    args: { path: string; profile: string },
  ): Promise<MorphTemplate> => {
    const profile = await getProfile(args.profile);
    if (!profile) {
      return html`
        <div class="${errorStyles}">Profile "${args.profile}" not found</div>
      `;
    }

    // Check if it's a git repository
    try {
      const checkGit = new Deno.Command("git", {
        args: ["-C", args.path, "rev-parse", "--git-dir"],
        stdout: "piped",
        stderr: "piped",
      });

      const { code } = await checkGit.output();
      if (code !== 0) {
        return html`
          <div class="${errorStyles}">Not a git repository: ${args.path}</div>
        `;
      }
    } catch {
      return html`
        <div class="${errorStyles}">Path not found: ${args.path}</div>
      `;
    }

    const sshCommand = `ssh -i ${profile.sshKey} -o IdentitiesOnly=yes`;

    try {
      await runGitConfig(args.path, "user.name", profile.name);
      await runGitConfig(args.path, "user.email", profile.email);
      await runGitConfig(args.path, "core.sshCommand", sshCommand);

      return html`
        <div class="${successStyles}">
          Applied profile "${args.profile}" to <strong>${args.path}</strong>
        </div>
      `;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return html`
        <div class="${errorStyles}">Failed: ${message}</div>
      `;
    }
  },
});

const doctorApi = rpc({
  check: async (): Promise<MorphTemplate> => {
    const results = await runDoctorChecks();
    const hasErrors = results.some((r) => r.status === "error");
    const hasWarnings = results.some((r) => r.status === "warning");

    const summary = hasErrors
      ? html`
        <div class="${errorStyles}">Some issues found. Please fix the errors above.</div>
      `
      : hasWarnings
      ? html`
        <div class="${successStyles}" style="border-color: #d29922; color: #d29922;">
          Health check passed with warnings.
        </div>
      `
      : html`
        <div class="${successStyles}">All checks passed!</div>
      `;

    return html`
      ${results.map(renderCheckResult)} ${summary}
    `;
  },
});

// Components
const profilesList = component(async (): Promise<MorphTemplate> => {
  const deleteAttr =
    `hx-ext='json-enc' hx-post='/rpc/${profileApi.name}/delete'`;
  return await renderProfilesList(deleteAttr);
});

const addProfileForm = component((): MorphTemplate => {
  return html`
    <div class="${cardStyles}">
      <h3 class="${profileNameStyles}">Add New Profile</h3>
      <form id="add-profile-form">
        <div class="${formGroupStyles}">
          <div class="${labelStyles}">Profile Key</div>
          <input
            type="text"
            name="key"
            id="profile-key"
            placeholder="e.g., work, personal, github"
            class="${inputStyles}"
            required
          />
        </div>
        <div class="${formGroupStyles}">
          <div class="${labelStyles}">Git User Name</div>
          <input
            type="text"
            name="name"
            id="profile-name"
            placeholder="John Doe"
            class="${inputStyles}"
            required
          />
        </div>
        <div class="${formGroupStyles}">
          <div class="${labelStyles}">Git Email</div>
          <input
            type="email"
            name="email"
            id="profile-email"
            placeholder="john@example.com"
            class="${inputStyles}"
            required
          />
        </div>
        <button
          type="submit"
          class="${btnSuccessStyles}"
          ${profileApi.rpc.create()}
          hx-target="#profiles-container"
          hx-swap="innerHTML"
          hx-include="#add-profile-form"
          hx-on::after-request="if(event.detail.successful) document.getElementById('add-profile-form').reset()"
        >
          Create Profile
        </button>
      </form>
    </div>
  `;
});

const doctorSection = component((): MorphTemplate => {
  return html`
    <div class="${cardStyles}">
      <h3 class="${profileNameStyles}">System Health</h3>
      <div id="doctor-results">
        <p style="color: #8b949e;">Click the button to run diagnostics</p>
      </div>
      <div class="${actionsStyles}">
        <button
          class="${btnStyles}"
          ${doctorApi.rpc.check()}
          hx-target="#doctor-results"
          hx-swap="innerHTML"
        >
          Run Diagnostics
        </button>
      </div>
    </div>
  `;
});

const gitOperationsSection = component(async (): Promise<MorphTemplate> => {
  const profiles = await listProfiles();
  const profileOptions = Object.keys(profiles);

  if (profileOptions.length === 0) {
    return html`
      <div class="${cardStyles}">
        <p style="color: #8b949e;">
          Create a profile first to use Clone and Apply features.
        </p>
      </div>
    `;
  }

  const profileSelect = profileOptions
    .map((p) =>
      html`
        <option value="${p}">${p}</option>
      `
    );

  return html`
    <div class="${twoColumnStyles}">
      <div class="${cardStyles}">
        <h3 class="${profileNameStyles}">Clone Repository</h3>
        <form id="clone-form">
          <div class="${formGroupStyles}">
            <div class="${labelStyles}">Repository URL</div>
            <input
              type="text"
              name="url"
              placeholder="git@github.com:user/repo.git"
              class="${inputStyles}"
              required
            />
          </div>
          <div class="${formGroupStyles}">
            <div class="${labelStyles}">Directory (optional)</div>
            <input
              type="text"
              name="directory"
              placeholder="Leave empty for auto-detect"
              class="${inputStyles}"
            />
          </div>
          <div class="${formGroupStyles}">
            <div class="${labelStyles}">Profile</div>
            <select name="profile" class="${inputStyles}" required>
              ${profileSelect}
            </select>
          </div>
          <div id="clone-result"></div>
          <button
            type="submit"
            class="${btnSuccessStyles}"
            ${gitApi.rpc.clone()}
            hx-target="#clone-result"
            hx-swap="innerHTML"
            hx-include="#clone-form"
          >
            Clone
          </button>
        </form>
      </div>
      <div class="${cardStyles}">
        <h3 class="${profileNameStyles}">Apply Profile to Repository</h3>
        <form id="use-form">
          <div class="${formGroupStyles}">
            <div class="${labelStyles}">Repository Path</div>
            <input
              type="text"
              name="path"
              placeholder="/path/to/repository"
              class="${inputStyles}"
              required
            />
          </div>
          <div class="${formGroupStyles}">
            <div class="${labelStyles}">Profile</div>
            <select name="profile" class="${inputStyles}" required>
              ${profileSelect}
            </select>
          </div>
          <div id="use-result"></div>
          <button
            type="submit"
            class="${btnSuccessStyles}"
            ${gitApi.rpc.use()}
            hx-target="#use-result"
            hx-swap="innerHTML"
            hx-include="#use-form"
          >
            Apply Profile
          </button>
        </form>
      </div>
    </div>
  `;
});

const backupSection = component((): MorphTemplate => {
  return html`
    <div class="${twoColumnStyles}">
      <div class="${cardStyles}">
        <h3 class="${profileNameStyles}">Export Backup</h3>
        <p style="color: #8b949e; margin-bottom: 16px;">
          Download all profiles and SSH keys as a tar.gz archive
        </p>
        <a
          href="/api/backup/export"
          class="${btnPrimaryStyles}"
          download="gp-backup.tar.gz"
        >
          Download Backup
        </a>
      </div>
      <div class="${cardStyles}">
        <h3 class="${profileNameStyles}">Import Backup</h3>
        <form id="import-form" enctype="multipart/form-data">
          <div class="${formGroupStyles}">
            <div class="${labelStyles}">Backup File (.tar.gz)</div>
            <input
              type="file"
              name="backup"
              accept=".tar.gz,.tgz"
              class="${fileInputStyles}"
              required
            />
          </div>
          <div id="import-result"></div>
          <button
            type="submit"
            class="${btnSuccessStyles}"
            hx-post="/api/backup/import"
            hx-target="#import-result"
            hx-swap="innerHTML"
            hx-encoding="multipart/form-data"
            hx-include="#import-form"
          >
            Import Backup
          </button>
        </form>
      </div>
    </div>
  `;
});

// Main page
const homePage = component((): MorphTemplate => {
  return html`
    ${meta({ title: "Git Profile Manager" })}
    <div class="${containerStyles}">
      <header class="${headerStyles}">
        <h1 class="${titleStyles}">Git Profile Manager</h1>
        <span class="${badgeStyles}">UI</span>
      </header>

      ${addProfileForm({})}

      <h2 class="${sectionTitleStyles}">Profiles</h2>
      <div id="profiles-container">
        ${profilesList({})}
      </div>

      <h2 class="${sectionTitleStyles}">Git Operations</h2>
      ${gitOperationsSection({})}

      <h2 class="${sectionTitleStyles}">Diagnostics</h2>
      ${doctorSection({})}

      <h2 class="${sectionTitleStyles}">Backup</h2>
      ${backupSection({})}
    </div>
  `;
});

function createApp() {
  const morphApp = new Morph({
    layout: basic({ htmx: true, jsonEnc: true }),
  })
    .rpc(profileApi)
    .rpc(doctorApi)
    .rpc(gitApi)
    .page("/", homePage);

  const router = morphApp.build();

  // Add custom routes for backup
  router.get("/api/backup/export", async (c) => {
    const profiles = await listProfiles();
    const profileNames = Object.keys(profiles);

    if (profileNames.length === 0) {
      return c.text("No profiles to export", 400);
    }

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
      for (const [name, profile] of Object.entries(profiles)) {
        const privateKey = profile.sshKey;
        const publicKey = `${privateKey}.pub`;

        try {
          await Deno.copyFile(privateKey, join(keysDir, `${name}`));
          await Deno.copyFile(publicKey, join(keysDir, `${name}.pub`));
        } catch {
          // Skip if keys not found
        }
      }

      // Create tar.gz archive
      const outputPath = join(tempDir, "backup.tar.gz");
      const tar = new Deno.Command("tar", {
        args: ["-czf", outputPath, "-C", tempDir, "profiles.json", "keys"],
        stdout: "piped",
        stderr: "piped",
      });

      const { code } = await tar.output();
      if (code !== 0) {
        return c.text("Failed to create archive", 500);
      }

      const fileContent = await Deno.readFile(outputPath);

      // Cleanup
      await Deno.remove(tempDir, { recursive: true });

      return new Response(fileContent, {
        headers: {
          "Content-Type": "application/gzip",
          "Content-Disposition": "attachment; filename=gp-backup.tar.gz",
        },
      });
    } catch (error) {
      await Deno.remove(tempDir, { recursive: true }).catch(() => {});
      const message = error instanceof Error ? error.message : "Unknown error";
      return c.text(`Export failed: ${message}`, 500);
    }
  });

  router.post("/api/backup/import", async (c) => {
    try {
      const formData = await c.req.formData();
      const file = formData.get("backup") as File | null;

      if (!file) {
        return c.html(
          `<div class="${errorStyles}">No file uploaded</div>`,
          400,
        );
      }

      const tempDir = await Deno.makeTempDir({ prefix: "gp-import-" });

      try {
        // Save uploaded file
        const filePath = join(tempDir, "backup.tar.gz");
        const fileContent = await file.arrayBuffer();
        await Deno.writeFile(filePath, new Uint8Array(fileContent));

        // Extract archive
        const tar = new Deno.Command("tar", {
          args: ["-xzf", filePath, "-C", tempDir],
          stdout: "piped",
          stderr: "piped",
        });

        const { code } = await tar.output();
        if (code !== 0) {
          return c.html(
            `<div class="${errorStyles}">Failed to extract archive</div>`,
            400,
          );
        }

        // Read profiles from backup
        const profilesPath = join(tempDir, "profiles.json");
        let backupConfig: { profiles: Record<string, Profile> };

        try {
          const content = await Deno.readTextFile(profilesPath);
          backupConfig = JSON.parse(content);
        } catch {
          return c.html(
            `<div class="${errorStyles}">Invalid backup file</div>`,
            400,
          );
        }

        const keysDir = join(tempDir, "keys");
        let imported = 0;
        let skipped = 0;
        const existingProfiles = await listProfiles();

        for (const [name, profile] of Object.entries(backupConfig.profiles)) {
          if (existingProfiles[name]) {
            skipped++;
            continue;
          }

          // Copy SSH keys
          const newKeyPath = getSshKeyPath(name);
          const sourcePrivate = join(keysDir, name);
          const sourcePublic = join(keysDir, `${name}.pub`);

          try {
            await Deno.copyFile(sourcePrivate, newKeyPath);
            await Deno.chmod(newKeyPath, 0o600);
            await Deno.copyFile(sourcePublic, `${newKeyPath}.pub`);
          } catch {
            continue;
          }

          // Add profile
          const newProfile: Profile = {
            name: profile.name,
            email: profile.email,
            sshKey: newKeyPath,
          };

          const config = await loadConfig();
          config.profiles[name] = newProfile;
          await saveConfig(config);
          imported++;
        }

        await Deno.remove(tempDir, { recursive: true });

        return c.html(
          `<div class="${successStyles}">Imported ${imported} profile(s), skipped ${skipped} (already exist)</div>`,
        );
      } catch (error) {
        await Deno.remove(tempDir, { recursive: true }).catch(() => {});
        const message = error instanceof Error
          ? error.message
          : "Unknown error";
        return c.html(
          `<div class="${errorStyles}">Import failed: ${message}</div>`,
          500,
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return c.html(
        `<div class="${errorStyles}">Import failed: ${message}</div>`,
        500,
      );
    }
  });

  return router;
}

export const uiCommand = new Command()
  .description("Start web UI for managing git profiles")
  .option("-p, --port <port:number>", "Port to run the server on", {
    default: 3000,
  })
  .action((options) => {
    const port = options.port;
    const app = createApp();

    console.log(`Starting Git Profile Manager UI...`);
    console.log(`Open http://localhost:${port} in your browser`);
    console.log(`Press Ctrl+C to stop`);

    Deno.serve({ port }, app.fetch);
  });
