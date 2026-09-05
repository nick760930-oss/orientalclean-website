"use client";

import { useEffect, useState } from "react";
import { minutesToHHMM, hhmmToMinutes } from "@/lib/date";
import { DAY_LABELS } from "@/lib/constants";

interface Service {
  id: string;
  name: string;
}

interface WeeklyHour {
  dayOfWeek: number;
  startMin: number;
  endMin: number;
}

interface TherapistFull {
  id: string;
  name: string;
  bio?: string | null;
  active: boolean;
  services: { serviceId: string }[];
  weeklyHours: WeeklyHour[];
}

const FULL_DAY_LABELS = DAY_LABELS.map((d) => `週${d}`);

function TherapistRow({
  therapist,
  allServices,
  onSaved,
}: {
  therapist: TherapistFull;
  allServices: Service[];
  onSaved: () => void;
}) {
  const [name, setName] = useState(therapist.name);
  const [bio, setBio] = useState(therapist.bio ?? "");
  const [active, setActive] = useState(therapist.active);
  const [serviceIds, setServiceIds] = useState<string[]>(therapist.services.map((s) => s.serviceId));
  const [days, setDays] = useState(() =>
    Array.from({ length: 7 }, (_, dayOfWeek) => {
      const existing = therapist.weeklyHours.find((w) => w.dayOfWeek === dayOfWeek);
      return {
        dayOfWeek,
        enabled: Boolean(existing),
        startMin: existing?.startMin ?? 10 * 60,
        endMin: existing?.endMin ?? 19 * 60,
      };
    })
  );
  const [saving, setSaving] = useState(false);

  function toggleService(id: string) {
    setServiceIds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  }

  async function save(extra: Partial<{ active: boolean }> = {}) {
    setSaving(true);
    const nextActive = extra.active ?? active;
    await fetch(`/api/therapists/${therapist.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        bio,
        active: nextActive,
        serviceIds,
        weeklyHours: days
          .filter((d) => d.enabled)
          .map((d) => ({ dayOfWeek: d.dayOfWeek, startMin: d.startMin, endMin: d.endMin })),
      }),
    });
    setActive(nextActive);
    setSaving(false);
    onSaved();
  }

  return (
    <div
      className={`space-y-3 rounded-lg border p-4 ${
        active ? "border-brand-200 bg-white" : "border-brand-100 bg-brand-50 opacity-60"
      }`}
    >
      <div className="grid gap-2 sm:grid-cols-2">
        <input
          className="rounded border border-brand-300 px-2 py-1"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="姓名 / 包廂名稱"
        />
        <input
          className="rounded border border-brand-300 px-2 py-1"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="簡介"
        />
      </div>

      <div>
        <p className="mb-1 text-xs font-medium text-brand-500">可執行服務</p>
        <div className="flex flex-wrap gap-2">
          {allServices.map((s) => (
            <label
              key={s.id}
              className="flex items-center gap-1 rounded-full border border-brand-200 px-2 py-1 text-xs"
            >
              <input type="checkbox" checked={serviceIds.includes(s.id)} onChange={() => toggleService(s.id)} />
              {s.name}
            </label>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-1 text-xs font-medium text-brand-500">每週營業時間</p>
        <div className="space-y-1">
          {days.map((d, i) => (
            <div key={d.dayOfWeek} className="flex items-center gap-2 text-sm">
              <label className="flex w-16 items-center gap-1">
                <input
                  type="checkbox"
                  checked={d.enabled}
                  onChange={(e) => {
                    const next = [...days];
                    next[i] = { ...d, enabled: e.target.checked };
                    setDays(next);
                  }}
                />
                {FULL_DAY_LABELS[d.dayOfWeek]}
              </label>
              <input
                type="time"
                disabled={!d.enabled}
                value={minutesToHHMM(d.startMin)}
                onChange={(e) => {
                  const next = [...days];
                  next[i] = { ...d, startMin: hhmmToMinutes(e.target.value) };
                  setDays(next);
                }}
                className="rounded border border-brand-300 px-2 py-1 disabled:opacity-40"
              />
              <span>–</span>
              <input
                type="time"
                disabled={!d.enabled}
                value={minutesToHHMM(d.endMin)}
                onChange={(e) => {
                  const next = [...days];
                  next[i] = { ...d, endMin: hhmmToMinutes(e.target.value) };
                  setDays(next);
                }}
                className="rounded border border-brand-300 px-2 py-1 disabled:opacity-40"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => save()}
          disabled={saving}
          className="rounded-full bg-brand-600 px-4 py-1 text-xs text-white disabled:opacity-50"
        >
          {saving ? "儲存中…" : "儲存"}
        </button>
        <button
          onClick={() => save({ active: !active })}
          className="rounded-full border border-brand-300 px-4 py-1 text-xs text-brand-700"
        >
          {active ? "停用" : "啟用"}
        </button>
      </div>
    </div>
  );
}

export default function AdminTherapistsPage() {
  const [therapists, setTherapists] = useState<TherapistFull[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  async function load() {
    const [tRes, sRes] = await Promise.all([fetch("/api/therapists"), fetch("/api/services")]);
    setTherapists((await tRes.json()).therapists ?? []);
    setServices((await sRes.json()).services ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function createTherapist() {
    if (!newName.trim()) return;
    setCreating(true);
    await fetch("/api/therapists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });
    setCreating(false);
    setNewName("");
    load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-4 text-xl font-semibold text-brand-800">按摩師 / 包廂</h1>
        <div className="flex gap-2 rounded-lg border border-dashed border-brand-300 p-4">
          <input
            className="flex-1 rounded border border-brand-300 px-2 py-1"
            placeholder="新增按摩師姓名或包廂名稱"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <button
            onClick={createTherapist}
            disabled={creating}
            className="rounded-full bg-brand-600 px-4 py-1.5 text-sm text-white disabled:opacity-50"
          >
            {creating ? "新增中…" : "新增"}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {therapists.map((t) => (
          <TherapistRow key={t.id} therapist={t} allServices={services} onSaved={load} />
        ))}
        {therapists.length === 0 && <p className="text-brand-400">尚未建立任何按摩師或包廂。</p>}
      </div>
    </div>
  );
}
