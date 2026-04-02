const settingsSections = [
  "Environment setup for Supabase URLs and keys",
  "Default currency and locale preferences",
  "Future local-first encryption and sync options"
];

export default function SettingsPage() {
  return (
    <section className="content-card">
      <header className="page-header">
        <div>
          <span className="eyebrow">Settings</span>
          <h1>Platform configuration shell</h1>
          <p className="page-subtitle">
            This page is where account preferences, local-first options, provider configuration, and
            future notification settings will grow.
          </p>
        </div>
      </header>

      <div className="two-column">
        <article className="list-card">
          <h2>Planned settings surface</h2>
          <ul>
            {settingsSections.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>

        <article className="list-card">
          <span className="eyebrow">Current status</span>
          <h2>Waiting on env + auth wiring</h2>
          <p>
            Once Supabase is configured, this page can become the source of truth for profile
            defaults, locale, and base currency preferences.
          </p>
        </article>
      </div>
    </section>
  );
}
