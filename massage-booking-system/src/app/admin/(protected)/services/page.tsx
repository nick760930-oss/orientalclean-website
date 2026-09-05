"use client";

import { useEffect, useState } from "react";

interface Service {
  id: string;
  name: string;
  description?: string | null;
  durationMin: number;
  priceTwd: number;
  depositTwd: number;
  active: boolean;
}

function ServiceRow({ service, onSaved }: { service: Service; onSaved: () => void }) {
  const [form, setForm] = useState(service);
  const [saving, setSaving] = useState(false);

  async function save(patch: Partial<Service> = {}) {
    setSaving(true);
    const next = { ...form, ...patch };
    setForm(next);
    await fetch(`/api/services/${service.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    });
    setSaving(false);
    onSaved();
  }

  return (
    <div
      className={`rounded-lg border p-4 ${
        form.active ? "border-brand-200 bg-white" : "border-brand-100 bg-brand-50 opacity-60"
      }`}
    >
      <div className="grid gap-2 sm:grid-cols-2">
        <input
          className="rounded border border-brand-300 px-2 py-1"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="服務名稱"
        />
        <input
          type="number"
          className="rounded border border-brand-300 px-2 py-1"
          value={form.durationMin}
          onChange={(e) => setForm({ ...form, durationMin: Number(e.target.value) })}
          placeholder="時長（分鐘）"
        />
        <input
          type="number"
          className="rounded border border-brand-300 px-2 py-1"
          value={form.priceTwd}
          onChange={(e) => setForm({ ...form, priceTwd: Number(e.target.value) })}
          placeholder="價格 NT$"
        />
        <input
          type="number"
          className="rounded border border-brand-300 px-2 py-1"
          value={form.depositTwd}
          onChange={(e) => setForm({ ...form, depositTwd: Number(e.target.value) })}
          placeholder="訂金 NT$（0＝不需訂金）"
        />
      </div>
      <textarea
        className="mt-2 w-full rounded border border-brand-300 px-2 py-1 text-sm"
        rows={2}
        value={form.description ?? ""}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        placeholder="服務說明"
      />
      <div className="mt-2 flex gap-2">
        <button
          onClick={() => save()}
          disabled={saving}
          className="rounded-full bg-brand-600 px-4 py-1 text-xs text-white disabled:opacity-50"
        >
          {saving ? "儲存中…" : "儲存"}
        </button>
        <button
          onClick={() => save({ active: !form.active })}
          className="rounded-full border border-brand-300 px-4 py-1 text-xs text-brand-700"
        >
          {form.active ? "停用" : "啟用"}
        </button>
      </div>
    </div>
  );
}

export default function AdminServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [newService, setNewService] = useState({
    name: "",
    durationMin: 60,
    priceTwd: 0,
    depositTwd: 0,
    description: "",
  });
  const [creating, setCreating] = useState(false);

  async function load() {
    const res = await fetch("/api/services");
    const data = await res.json();
    setServices(data.services ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function createService() {
    if (!newService.name.trim()) return;
    setCreating(true);
    await fetch("/api/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newService),
    });
    setCreating(false);
    setNewService({ name: "", durationMin: 60, priceTwd: 0, depositTwd: 0, description: "" });
    load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-4 text-xl font-semibold text-brand-800">服務項目</h1>
        <div className="rounded-lg border border-dashed border-brand-300 p-4">
          <p className="mb-2 text-sm font-medium text-brand-700">新增服務項目</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <input
              className="rounded border border-brand-300 px-2 py-1"
              placeholder="服務名稱"
              value={newService.name}
              onChange={(e) => setNewService({ ...newService, name: e.target.value })}
            />
            <input
              type="number"
              className="rounded border border-brand-300 px-2 py-1"
              placeholder="時長（分鐘）"
              value={newService.durationMin}
              onChange={(e) => setNewService({ ...newService, durationMin: Number(e.target.value) })}
            />
            <input
              type="number"
              className="rounded border border-brand-300 px-2 py-1"
              placeholder="價格 NT$"
              value={newService.priceTwd}
              onChange={(e) => setNewService({ ...newService, priceTwd: Number(e.target.value) })}
            />
            <input
              type="number"
              className="rounded border border-brand-300 px-2 py-1"
              placeholder="訂金 NT$"
              value={newService.depositTwd}
              onChange={(e) => setNewService({ ...newService, depositTwd: Number(e.target.value) })}
            />
          </div>
          <textarea
            className="mt-2 w-full rounded border border-brand-300 px-2 py-1 text-sm"
            rows={2}
            placeholder="服務說明"
            value={newService.description}
            onChange={(e) => setNewService({ ...newService, description: e.target.value })}
          />
          <button
            onClick={createService}
            disabled={creating}
            className="mt-2 rounded-full bg-brand-600 px-4 py-1.5 text-sm text-white disabled:opacity-50"
          >
            {creating ? "新增中…" : "新增"}
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {services.map((s) => (
          <ServiceRow key={s.id} service={s} onSaved={load} />
        ))}
        {services.length === 0 && <p className="text-brand-400">尚未建立任何服務項目。</p>}
      </div>
    </div>
  );
}
