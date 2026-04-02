import Link from "next/link";

import { milestoneChecklist } from "@/lib/navigation";
import { isSupabaseConfigured } from "@/lib/env";

const foundationMetrics = [
  { label: "Phase", value: "M1" },
  { label: "Target", value: "Foundation Shell" },
  { label: "Next Step", value: "Manual Ledger" }
];

export default function LandingPage() {
  const supabaseReady = isSupabaseConfigured();

  return (
    <main className="landing">
      <section className="hero-grid">
        <article className="hero-card">
          <span className="eyebrow">Web Rebuild</span>
          <h1>DCAlytics is moving from prototype mode into product mode.</h1>
          <p className="hero-copy">
            This shell is the first step toward the real web application: authenticated users,
            multiple portfolios, a unified ledger, and a backend-ready foundation that can later
            power iOS and Android clients too.
          </p>

          <div className="hero-actions">
            <Link href="/sign-in" className="button-primary">
              Open Sign In
            </Link>
            <Link href="/dashboard" className="button-secondary">
              Preview App Shell
            </Link>
          </div>

          <div className="metrics-grid">
            {foundationMetrics.map((metric) => (
              <div key={metric.label} className="metric-card">
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
              </div>
            ))}
          </div>
        </article>

        <aside className="hero-card stack">
          <div>
            <span className="eyebrow">Platform State</span>
            <h2>{supabaseReady ? "Supabase env detected" : "Supabase env still needed"}</h2>
            <p>
              {supabaseReady
                ? "Public Supabase variables are present, so the shell is ready for auth wiring."
                : "Add the variables from apps/web/.env.example before connecting real auth and data."}
            </p>
          </div>

          <div className="pill-row">
            <span className="pill">Next.js App Router</span>
            <span className="pill">Supabase-ready</span>
            <span className="pill">Portfolio-first</span>
          </div>
        </aside>
      </section>

      <section className="content-grid">
        <article className="list-card">
          <span className="eyebrow">M1 Scope</span>
          <h2>What this shell is designed to unlock next</h2>
          <ul>
            {milestoneChecklist.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>

        <article className="list-card">
          <span className="eyebrow">Prototype Safety</span>
          <h2>The current root prototype stays untouched</h2>
          <p>
            The original static tracker remains in the repository root as a reference while the new
            app grows inside <code>apps/web</code> and the backend schema grows inside{" "}
            <code>packages/db</code>.
          </p>
          <div className="inline-actions">
            <Link href="/sign-up" className="button-secondary">
              View Sign Up
            </Link>
            <Link href="/portfolios" className="button-secondary">
              View Portfolio Shell
            </Link>
          </div>
        </article>
      </section>
    </main>
  );
}
