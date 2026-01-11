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
  listProfiles,
  type Profile,
  removeProfile,
} from "@/config.ts";
import { deleteSshKey, generateSshKey, readPublicKey } from "@/ssh.ts";

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

const detailsStyles = styled`
  & summary {
    cursor: pointer;
    list-style: none;
  }
  & summary::-webkit-details-marker {
    display: none;
  }
`;

// Helper functions for rendering (to avoid circular dependencies)
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

// RPC handlers for profile operations
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

// Profiles list component (for initial render)
const profilesList = component(async (): Promise<MorphTemplate> => {
  const deleteAttr =
    `hx-ext='json-enc' hx-post='/rpc/${profileApi.name}/delete'`;
  return await renderProfilesList(deleteAttr);
});

// Add profile form component
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

// Main page component
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
    </div>
  `;
});

function createApp() {
  const morphApp = new Morph({
    layout: basic({ htmx: true, jsonEnc: true }),
  })
    .rpc(profileApi)
    .page("/", homePage);

  return morphApp.build();
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
