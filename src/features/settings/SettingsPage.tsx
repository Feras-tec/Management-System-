export default function SettingsPage() {
  return (
    <section className="space-y-6">
      <h1 className="text-4xl font-bold">Settings</h1>

      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <h2 className="card-title">Application Settings</h2>

          <p>Manage your business system preferences.</p>

          <div className="form-control">
            <label className="label cursor-pointer">
              <span className="label-text">Enable notifications</span>

              <input type="checkbox" className="toggle" defaultChecked />
            </label>
          </div>
        </div>
      </div>
    </section>
  );
}
