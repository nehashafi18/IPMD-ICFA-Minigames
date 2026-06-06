import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Activity,
  BadgeDollarSign,
  Ban,
  Clock,
  LogIn,
  RefreshCw,
  Save,
  TicketCheck,
  Users
} from "lucide-react";

import {
  type Dashboard,
  type DonationRow,
  type VisitorLog,
  getDashboard,
  getDonations,
  getLogs,
  getSettings,
  revokeToken,
  saveSettings,
  simulateDonation
} from "./api";
import "./styles.css";

function StatCard(props: { label: string; value: string | number; icon: React.ReactNode }) {
  return (
    <section className="stat">
      <div className="statIcon">{props.icon}</div>
      <span>{props.label}</span>
      <strong>{props.value}</strong>
    </section>
  );
}

function App() {
  const [apiKey, setApiKey] = useState("");
  const [loginKey, setLoginKey] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [donations, setDonations] = useState<DonationRow[]>([]);
  const [logs, setLogs] = useState<VisitorLog[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [entryUrl, setEntryUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [donationForm, setDonationForm] = useState({
    name: "Test Visitor",
    email: "",
    amount: 0,
    galleryId: "image-cards",
    message: ""
  });

  const loadAll = async (key = apiKey) => {
    setBusy(true);
    setError("");

    try {
      const [dashboardData, donationData, logData, settingsData] =
        await Promise.all([
          getDashboard(key),
          getDonations(key),
          getLogs(key),
          getSettings(key)
        ]);

      setDashboard(dashboardData);
      setDonations(donationData);
      setLogs(logData);
      setSettings(settingsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load VMS data");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (authenticated) {
      void loadAll();
    }
  }, [authenticated]);

  const amountLabel = useMemo(
    () => `$${((dashboard?.amount || 0) / 100).toFixed(2)}`,
    [dashboard]
  );

  const createDonation = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    try {
      const result = await simulateDonation(donationForm);
      setEntryUrl(result.entryUrl);
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to generate token");
    }
  };

  const login = async (event: React.FormEvent) => {
    event.preventDefault();
    const candidateKey = loginKey.trim();

    if (!candidateKey) {
      setError("Enter the admin key.");
      return;
    }

    setBusy(true);
    setError("");

    try {
      await getDashboard(candidateKey);
      setApiKey(candidateKey);
      setAuthenticated(true);
      setLoginKey("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Admin key is not valid");
    } finally {
      setBusy(false);
    }
  };

  const toggleToken = async (token: string, revoked: boolean) => {
    await revokeToken(apiKey, token, revoked);
    await loadAll();
  };

  const persistSettings = async (event: React.FormEvent) => {
    event.preventDefault();
    await saveSettings(apiKey, settings);
    await loadAll();
  };

  if (!authenticated) {
    return (
      <main className="loginShell">
        <form className="loginPanel" onSubmit={login}>
          <p className="eyebrow">Internal MVP</p>
          <h1>VMS Admin</h1>
          <label>
            Admin key
            <input
              type="password"
              autoComplete="current-password"
              value={loginKey}
              onChange={(event) => setLoginKey(event.target.value)}
              autoFocus
            />
          </label>
          {error && <div className="alert">{error}</div>}
          <button className="primaryButton" type="submit" disabled={busy}>
            <LogIn size={16} /> Sign in
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Visitor management</p>
          <h1>Image Cards Entry Manager</h1>
        </div>
        <button
          className="iconButton"
          onClick={() => loadAll()}
          title="Refresh VMS data"
          disabled={busy}
        >
          <RefreshCw size={18} />
        </button>
      </header>

      {error && <div className="alert">{error}</div>}

      <section className="statsGrid">
        <StatCard label="Donation total" value={amountLabel} icon={<BadgeDollarSign size={20} />} />
        <StatCard label="Gallery entries" value={dashboard?.entries || 0} icon={<TicketCheck size={20} />} />
        <StatCard label="Unique visitors" value={dashboard?.unique_visitors || 0} icon={<Users size={20} />} />
        <StatCard label="Repeat visitors" value={dashboard?.repeat_visitors || 0} icon={<Activity size={20} />} />
      </section>

      <section className="contentGrid">
        <form className="panel" onSubmit={createDonation}>
          <h2>Generate entry token</h2>
          <div className="formGrid">
            <label>
              Visitor name
              <input
                value={donationForm.name}
                onChange={(event) =>
                  setDonationForm({ ...donationForm, name: event.target.value })
                }
              />
            </label>
            <label>
              Email
              <input
                value={donationForm.email}
                onChange={(event) =>
                  setDonationForm({ ...donationForm, email: event.target.value })
                }
              />
            </label>
            <label>
              Amount cents
              <input
                type="number"
                min="0"
                value={donationForm.amount}
                onChange={(event) =>
                  setDonationForm({
                    ...donationForm,
                    amount: Number(event.target.value)
                  })
                }
              />
            </label>
            <label>
              Gallery ID
              <input
                value={donationForm.galleryId}
                onChange={(event) =>
                  setDonationForm({
                    ...donationForm,
                    galleryId: event.target.value
                  })
                }
              />
            </label>
            <label className="wide">
              Message
              <input
                value={donationForm.message}
                onChange={(event) =>
                  setDonationForm({
                    ...donationForm,
                    message: event.target.value
                  })
                }
              />
            </label>
          </div>
          <button className="primaryButton" type="submit">
            Generate token
          </button>
          {entryUrl && <input className="entryUrl" readOnly value={entryUrl} />}
        </form>

        <form className="panel" onSubmit={persistSettings}>
          <h2>Entry settings</h2>
          <div className="formGrid">
            <label>
              Token TTL hours
              <input
                value={settings.token_ttl_hours || ""}
                onChange={(event) =>
                  setSettings({ ...settings, token_ttl_hours: event.target.value })
                }
              />
            </label>
            <label>
              Session TTL hours
              <input
                value={settings.session_ttl_hours || ""}
                onChange={(event) =>
                  setSettings({
                    ...settings,
                    session_ttl_hours: event.target.value
                  })
                }
              />
            </label>
            <label>
              Default gallery
              <input
                value={settings.default_gallery_id || ""}
                onChange={(event) =>
                  setSettings({
                    ...settings,
                    default_gallery_id: event.target.value
                  })
                }
              />
            </label>
            <label>
              Donation mode
              <select
                value={settings.donation_mode || "simulated"}
                onChange={(event) =>
                  setSettings({ ...settings, donation_mode: event.target.value })
                }
              >
                <option value="simulated">Simulated</option>
                <option value="stripe">Stripe</option>
              </select>
            </label>
          </div>
          <button className="primaryButton" type="submit">
            <Save size={16} /> Save settings
          </button>
        </form>
      </section>

      <section className="panel">
        <h2>Recent donations and tokens</h2>
        <div className="tableWrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Amount</th>
                <th>Gallery</th>
                <th>Token</th>
                <th>Created</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {donations.map((donation) => (
                <tr key={donation.id}>
                  <td>{donation.name}</td>
                  <td>${(donation.amount / 100).toFixed(2)}</td>
                  <td>{donation.gallery_id}</td>
                  <td className="mono">{donation.token}</td>
                  <td>{new Date(donation.created_at).toLocaleString()}</td>
                  <td>
                    {donation.revoked_at
                      ? "Revoked"
                      : donation.used_at
                        ? "Redeemed"
                        : "Available"}
                  </td>
                  <td>
                    <button
                      className="iconButton"
                      onClick={() =>
                        toggleToken(donation.token, !donation.revoked_at)
                      }
                      title="Toggle token access"
                    >
                      <Ban size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="contentGrid">
        <div className="panel">
          <h2>Peak hours</h2>
          <ul className="metricList">
            {(dashboard?.peak_hours || []).map((item) => (
              <li key={item.hour}>
                <Clock size={16} /> {item.hour}
                <strong>{item.entries}</strong>
              </li>
            ))}
          </ul>
        </div>
        <div className="panel">
          <h2>Exhibition traffic</h2>
          <ul className="metricList">
            {(dashboard?.exhibition_traffic || []).map((item) => (
              <li key={item.gallery_id}>
                {item.gallery_id}
                <strong>{item.entries} entries</strong>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="panel">
        <h2>Recent entry logs</h2>
        <div className="tableWrap">
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>Visitor</th>
                <th>Gallery</th>
                <th>Status</th>
                <th>IP</th>
                <th>Device</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td>{new Date(log.timestamp).toLocaleString()}</td>
                  <td className="mono">{log.visitor_id}</td>
                  <td>{log.gallery_id}</td>
                  <td>{log.entry_status}{log.denial_reason ? `: ${log.denial_reason}` : ""}</td>
                  <td>{log.ip_address || "n/a"}</td>
                  <td>{log.device_info || "n/a"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
