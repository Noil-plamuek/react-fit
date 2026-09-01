import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Dumbbell, Cookie, ChevronLeft, ChevronRight, CalendarDays, LayoutGrid } from "lucide-react";
import { supabase } from "./supabaseClient";

/* ---------------------------------------------------------------
   Design tokens
------------------------------------------------------------------*/
const INK = "#37312B";
const INK_SOFT = "#7A7168";
const BG = "#FBF7F2";
const LINE = "#EAE2D6";
const CARD = "#FFFFFF";

const EXERCISE = { key: "exercise", label: "Exercise", color: "#7C9885", tint: "#E7EFE8", Icon: Dumbbell };
const DESSERT = { key: "dessert", label: "Dessert", color: "#D66B84", tint: "#F7E6E9", Icon: Cookie };

const MEMBERS = [
  { id: "KIM", color: "#9B8AC4", tint: "#EFEAF6" },
  { id: "PLE", color: "#E0A65C", tint: "#FBF0DF" },
  { id: "OIL", color: "#5FA0BF", tint: "#E6F1F5" },
];

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/* ---------------------------------------------------------------
   Date helpers
------------------------------------------------------------------*/
function toKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function startOfWeek(d) {
  const date = new Date(d);
  const dow = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - dow);
  date.setHours(0, 0, 0, 0);
  return date;
}
function getWeekDates(refDate) {
  const start = startOfWeek(refDate);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}
function fmtShort(d) {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
function weekRangeLabel(dates) {
  const a = dates[0], b = dates[6];
  if (a.getMonth() === b.getMonth()) {
    return `${a.toLocaleDateString("en-US", { month: "short" })} ${a.getDate()}–${b.getDate()}, ${b.getFullYear()}`;
  }
  return `${fmtShort(a)} – ${fmtShort(b)}, ${b.getFullYear()}`;
}
function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}
function monthLabel(year, month) {
  return new Date(year, month, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

/* ---------------------------------------------------------------
   Small building blocks
------------------------------------------------------------------*/
function DayToggle({ active, color, onClick, label, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      aria-label={label}
      className="flex items-center justify-center rounded-full transition-transform duration-150 focus:outline-none"
      style={{
        width: 34,
        height: 34,
        background: active ? color : "#F3EFE7",
        border: active ? "none" : `1.5px solid ${LINE}`,
        transform: active ? "scale(1)" : "scale(0.94)",
        opacity: disabled ? 0.35 : 1,
        cursor: disabled ? "default" : "pointer",
      }}
    />
  );
}

function MemberDot({ color, size = 10 }) {
  return <span style={{ width: size, height: size, borderRadius: "50%", background: color, display: "inline-block" }} />;
}

/* ---------------------------------------------------------------
   Week view
------------------------------------------------------------------*/
function MemberWeekCard({ member, weekDates, records, onToggle, todayKey }) {
  const totals = { exercise: 0, dessert: 0 };
  weekDates.forEach((d) => {
    const r = records[toKey(d)]?.[member.id];
    if (r?.exercise) totals.exercise++;
    if (r?.dessert) totals.dessert++;
  });

  return (
    <div className="rounded-2xl p-5" style={{ background: CARD, border: `1px solid ${LINE}` }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <span
            className="flex items-center justify-center rounded-full font-semibold"
            style={{ width: 30, height: 30, background: member.tint, color: member.color, fontSize: 13 }}
          >
            {member.id[0]}
          </span>
          <span style={{ fontWeight: 700, fontSize: 16, color: INK }}>
            {member.id}
          </span>
        </div>
        <div className="flex items-center gap-3" style={{ fontSize: 13, color: INK_SOFT }}>
          <span className="flex items-center gap-1">
            <EXERCISE.Icon size={13} color={EXERCISE.color} strokeWidth={2.4} />
            <span style={{ color: INK, fontWeight: 600 }}>{totals.exercise}</span>
          </span>
          <span className="flex items-center gap-1">
            <DESSERT.Icon size={13} color={DESSERT.color} strokeWidth={2.4} />
            <span style={{ color: INK, fontWeight: 600 }}>{totals.dessert}</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-8 items-center mb-2">
        <div />
        {weekDates.map((d) => {
          const isToday = toKey(d) === todayKey;
          return (
            <div key={d.toISOString()} className="text-center">
              <div style={{ fontSize: 11, color: isToday ? INK : INK_SOFT, fontWeight: isToday ? 700 : 500 }}>
                {DAY_LABELS[(d.getDay() + 6) % 7]}
              </div>
              {isToday && <div style={{ width: 4, height: 4, borderRadius: "50%", background: member.color, margin: "3px auto 0" }} />}
            </div>
          );
        })}
      </div>

      {[EXERCISE, DESSERT].map((cat) => (
        <div key={cat.key} className="grid grid-cols-8 items-center" style={{ marginTop: 6 }}>
          <cat.Icon size={15} color={cat.color} strokeWidth={2.3} />
          {weekDates.map((d) => {
            const key = toKey(d);
            const active = !!records[key]?.[member.id]?.[cat.key];
            const future = d > new Date();
            return (
              <div key={key} className="flex justify-center">
                <DayToggle
                  active={active}
                  color={cat.color}
                  disabled={future}
                  label={`${member.id} ${cat.label} ${fmtShort(d)}`}
                  onClick={() => onToggle(key, member.id, cat.key)}
                />
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function WeekSummary({ weekDates, records }) {
  const rows = MEMBERS.map((m) => {
    let ex = 0, de = 0;
    weekDates.forEach((d) => {
      const r = records[toKey(d)]?.[m.id];
      if (r?.exercise) ex++;
      if (r?.dessert) de++;
    });
    return { ...m, ex, de };
  });

  return (
    <div className="rounded-2xl p-5" style={{ background: CARD, border: `1px solid ${LINE}` }}>
      <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: 18, color: INK, fontWeight: 600, marginBottom: 14 }}>
        This week, side by side
      </h3>
      <div className="flex flex-col gap-4">
        {rows.map((r) => (
          <div key={r.id}>
            <div className="flex items-center gap-2 mb-1.5">
              <MemberDot color={r.color} />
              <span style={{ fontWeight: 700, fontSize: 13, color: INK }}>{r.id}</span>
            </div>
            <div className="flex flex-col gap-1.5">
              <BarRow icon={EXERCISE.Icon} color={EXERCISE.color} value={r.ex} max={7} suffix="workouts" />
              <BarRow icon={DESSERT.Icon} color={DESSERT.color} value={r.de} max={7} suffix="desserts" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BarRow({ icon: Icon, color, value, max = 7, suffix }) {
  const pct = value > 0 ? Math.min(100, Math.max(6, (value / max) * 100)) : 0;
  return (
    <div className="flex items-center gap-2">
      <Icon size={12} color={color} strokeWidth={2.4} style={{ flexShrink: 0 }} />
      <div style={{ flex: 1, height: 7, background: "#F3EFE7", borderRadius: 4, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 4, transition: "width 300ms ease" }} />
      </div>
      <span style={{ fontSize: 12, color: INK_SOFT, width: 80, flexShrink: 0 }}>
        {value}/7 {suffix}
      </span>
    </div>
  );
}

/* ---------------------------------------------------------------
   Month view (CSS Bar Chart)
------------------------------------------------------------------*/
function MonthView({ year, month, records }) {
  const nDays = daysInMonth(year, month);
  const weeksInMonth = Math.max(1, Math.round(nDays / 7));

  const stats = MEMBERS.map((m) => {
    let ex = 0, de = 0;
    for (let day = 1; day <= nDays; day++) {
      const key = toKey(new Date(year, month, day));
      const r = records[key]?.[m.id];
      if (r?.exercise) ex++;
      if (r?.dessert) de++;
    }
    return { ...m, ex, de, exAvg: ex / weeksInMonth, deAvg: de / weeksInMonth };
  });

  const maxVal = Math.max(1, ...stats.map((s) => Math.max(s.ex, s.de)));

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl p-5" style={{ background: CARD, border: `1px solid ${LINE}` }}>
        <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: 18, color: INK, fontWeight: 600, marginBottom: 4 }}>
          Monthly totals
        </h3>
        <p style={{ fontSize: 13, color: INK_SOFT, marginBottom: 20 }}>
          Times logged across {monthLabel(year, month)}
        </p>

        <div className="flex items-end justify-around pt-6 pb-2" style={{ height: 180, borderBottom: `1px solid ${LINE}` }}>
          {stats.map((s) => (
            <div key={s.id} className="flex flex-col items-center gap-2 h-full justify-end">
              <div className="flex items-end gap-2 h-36">
                <div className="flex flex-col items-center gap-1 justify-end h-full">
                  <span style={{ fontSize: 10, color: INK_SOFT, fontWeight: 600 }}>{s.ex}</span>
                  <div
                    style={{
                      width: 22,
                      height: `${Math.max(6, (s.ex / maxVal) * 110)}px`,
                      background: EXERCISE.color,
                      borderRadius: "4px 4px 0 0",
                      transition: "height 300ms ease",
                    }}
                  />
                </div>
                <div className="flex flex-col items-center gap-1 justify-end h-full">
                  <span style={{ fontSize: 10, color: INK_SOFT, fontWeight: 600 }}>{s.de}</span>
                  <div
                    style={{
                      width: 22,
                      height: `${Math.max(6, (s.de / maxVal) * 110)}px`,
                      background: DESSERT.color,
                      borderRadius: "4px 4px 0 0",
                      transition: "height 300ms ease",
                    }}
                  />
                </div>
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: INK }}>
                {s.id}
              </span>
            </div>
          ))}
        </div>

        <div className="flex justify-center gap-6 mt-4" style={{ fontSize: 12 }}>
          <span className="flex items-center gap-1.5">
            <span style={{ width: 10, height: 10, borderRadius: 2, background: EXERCISE.color }} />
            Exercise
          </span>
          <span className="flex items-center gap-1.5">
            <span style={{ width: 10, height: 10, borderRadius: 2, background: DESSERT.color }} />
            Dessert
          </span>
        </div>
      </div>

      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
        {stats.map((s) => (
          <div key={s.id} className="rounded-2xl p-4" style={{ background: s.tint, border: `1px solid ${LINE}` }}>
            <div className="flex items-center gap-2 mb-3">
              <MemberDot color={s.color} />
              <span style={{ fontWeight: 700, fontSize: 14, color: INK }}>{s.id}</span>
            </div>
            <StatLine icon={EXERCISE.Icon} color={EXERCISE.color} label="Exercise" total={s.ex} avg={s.exAvg} />
            <StatLine icon={DESSERT.Icon} color={DESSERT.color} label="Dessert" total={s.de} avg={s.deAvg} />
          </div>
        ))}
      </div>
    </div>
  );
}

function StatLine({ icon: Icon, color, label, total, avg }) {
  return (
    <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
      <span className="flex items-center gap-1.5" style={{ fontSize: 12.5, color: INK_SOFT }}>
        <Icon size={13} color={color} strokeWidth={2.4} />
        {label}
      </span>
      <span style={{ fontSize: 13, color: INK }}>
        <b style={{ fontWeight: 700 }}>{total}×</b>
        <span style={{ color: INK_SOFT }}> · {avg.toFixed(1)}/wk</span>
      </span>
    </div>
  );
}

/* ---------------------------------------------------------------
   App Shell
------------------------------------------------------------------*/
export default function App() {
  const [view, setView] = useState("week");
  const [refDate, setRefDate] = useState(new Date());
  const [records, setRecords] = useState(null);
  const [saveError, setSaveError] = useState(false);

  const todayKey = toKey(new Date());

  const fetchData = useCallback(async () => {
    try {
      const { data, error } = await supabase.from("habit_logs").select("*");
      if (error) throw error;

      const loadedRecords = {};
      if (data && data.length > 0) {
        data.forEach((row) => {
          if (row.days) {
            Object.entries(row.days).forEach(([dateKey, isDone]) => {
              if (!loadedRecords[dateKey]) loadedRecords[dateKey] = {};
              if (!loadedRecords[dateKey][row.member]) loadedRecords[dateKey][row.member] = {};
              loadedRecords[dateKey][row.member][row.type] = isDone;
            });
          }
        });
      }
      setRecords(loadedRecords);
    } catch (err) {
      console.error("Fetch error:", err);
      setRecords({});
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleToggle = useCallback(async (dateKey, memberId, catKey) => {
    setRecords((prev) => {
      const next = { ...prev };
      const dayRec = { ...(next[dateKey] || {}) };
      const memberRec = { ...(dayRec[memberId] || { exercise: false, dessert: false }) };
      const nextVal = !memberRec[catKey];
      memberRec[catKey] = nextVal;
      dayRec[memberId] = memberRec;
      next[dateKey] = dayRec;

      (async () => {
        try {
          const recordId = `${memberId}_${catKey}`;
          const dayMap = {};
          Object.entries(next).forEach(([dKey, val]) => {
            if (val[memberId]?.[catKey]) {
              dayMap[dKey] = true;
            }
          });

          const { error } = await supabase.from("habit_logs").upsert({
            id: recordId,
            member: memberId,
            type: catKey,
            week_key: "shared",
            days: dayMap,
            updated_at: new Date().toISOString(),
          });

          if (error) throw error;
        } catch (err) {
          console.error("Save error:", err);
          setSaveError(true);
        }
      })();

      return next;
    });
  }, []);

  const weekDates = useMemo(() => getWeekDates(refDate), [refDate]);
  const year = refDate.getFullYear();
  const month = refDate.getMonth();

  const shiftWeek = (dir) => {
    const d = new Date(refDate);
    d.setDate(d.getDate() + dir * 7);
    setRefDate(d);
  };
  const shiftMonth = (dir) => {
    const d = new Date(refDate);
    d.setMonth(d.getMonth() + dir, 1);
    setRefDate(d);
  };

  if (!records) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: BG }}>
        <span style={{ color: INK_SOFT, fontSize: 14 }}>Loading…</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full" style={{ background: BG }}>
      <div className="max-w-2xl mx-auto px-4 pt-8 pb-16 sm:px-6">
        <div className="flex items-end justify-between mb-1">
          <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 30, fontWeight: 600, color: INK, letterSpacing: "-0.01em" }}>
            Fit &amp; Food Tracker
          </h1>
        </div>
        <p style={{ fontSize: 13.5, color: INK_SOFT, marginBottom: 22 }}>
          KIM, PLE, and OIL keeping each other honest — one tap a day.
        </p>

        <div className="inline-flex p-1 rounded-full mb-5" style={{ background: "#F1EBDF", border: `1px solid ${LINE}` }}>
          {[
            { id: "week", label: "Week", Icon: CalendarDays },
            { id: "month", label: "Month", Icon: LayoutGrid },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setView(t.id)}
              className="flex items-center gap-1.5 rounded-full transition-colors"
              style={{
                padding: "7px 16px",
                fontSize: 13,
                fontWeight: 600,
                color: view === t.id ? "#FFF" : INK_SOFT,
                background: view === t.id ? INK : "transparent",
              }}
            >
              <t.Icon size={14} />
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between mb-5">
          <button
            aria-label="Previous"
            onClick={() => (view === "week" ? shiftWeek(-1) : shiftMonth(-1))}
            className="flex items-center justify-center rounded-full"
            style={{ width: 34, height: 34, background: CARD, border: `1px solid ${LINE}` }}
          >
            <ChevronLeft size={16} color={INK} />
          </button>
          <span style={{ fontWeight: 700, fontSize: 14.5, color: INK }}>
            {view === "week" ? weekRangeLabel(weekDates) : monthLabel(year, month)}
          </span>
          <button
            aria-label="Next"
            onClick={() => (view === "week" ? shiftWeek(1) : shiftMonth(1))}
            className="flex items-center justify-center rounded-full"
            style={{ width: 34, height: 34, background: CARD, border: `1px solid ${LINE}` }}
          >
            <ChevronRight size={16} color={INK} />
          </button>
        </div>

        {view === "week" ? (
          <div className="flex flex-col gap-3">
            {MEMBERS.map((m) => (
              <MemberWeekCard
                key={m.id}
                member={m}
                weekDates={weekDates}
                records={records}
                onToggle={handleToggle}
                todayKey={todayKey}
              />
            ))}
            <WeekSummary weekDates={weekDates} records={records} />
          </div>
        ) : (
          <MonthView year={year} month={month} records={records} />
        )}

        {saveError && (
          <p style={{ fontSize: 12, color: DESSERT.color, marginTop: 16 }}>
            Couldn't save that change — please check Supabase connection.
          </p>
        )}

        <p style={{ fontSize: 11.5, color: INK_SOFT, marginTop: 24, textAlign: "center" }}>
          Data is shared across everyone who opens this tracker.
        </p>
      </div>
    </div>
  );
}