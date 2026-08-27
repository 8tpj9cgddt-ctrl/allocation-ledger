import React, { useState, useEffect, useRef, useMemo } from "react";
import { supabase } from "./supabaseClient";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

const DEFAULT_CATEGORIES = [
  { label: "Needs", note: "food, transport, essentials", pct: 50, color: "#8A6D3B", sort_order: 0 },
  { label: "Wants", note: "going out, extras", pct: 30, color: "#5C6F52", sort_order: 1 },
  { label: "Saving", note: "set aside, don't touch", pct: 20, color: "#2F4550", sort_order: 2 },
];

const PALETTE = ["#8A6D3B", "#5C6F52", "#2F4550", "#A2543E", "#6B5B95", "#3D5A6C", "#7A5230", "#4E6E58"];

const ASSET_TYPES = ["Stocks", "ETF", "REIT", "ASNB/unit trust", "Fixed deposit", "Cash/savings", "Other"];

function formatMoney(n) {
  const v = Number(n) || 0;
  return v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/* ---------- Icons (inline SVG, no extra library needed) ---------- */
function IconHome(props) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 9.5 12 3l9 6.5" />
      <path d="M5 10v10a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10" />
    </svg>
  );
}
function IconCheck(props) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="m8.5 12 2.5 2.5 5-5" />
    </svg>
  );
}
function IconTrend(props) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 17 9 11l4 4 8-8" />
      <path d="M15 7h6v6" />
    </svg>
  );
}

/* ---------- Login screen ---------- */
function Login() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) setError(error.message);
    else setSent(true);
  }

  return (
    <div style={{ background: "#F4F0E6", minHeight: "100vh", fontFamily: "Georgia, serif" }} className="flex items-center justify-center px-5">
      <form onSubmit={handleLogin} className="w-full max-w-sm p-6 rounded-sm" style={{ background: "#FFFDF9", border: "1px solid #DCD4C0" }}>
        <h1 className="text-2xl mb-2" style={{ color: "#2A2620" }}>Allocation Ledger</h1>
        {sent ? (
          <p className="text-sm" style={{ color: "#5C6F52" }}>
            Check your email for a sign-in link.
          </p>
        ) : (
          <>
            <p className="text-sm mb-4" style={{ color: "#6B6355" }}>
              Sign in with your email — no password, just a link.
            </p>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full text-base bg-transparent border-b-2 py-2 mb-4"
              style={{ borderColor: "#2A2620" }}
            />
            <button type="submit" className="w-full px-4 py-2 rounded-sm text-sm" style={{ background: "#2F4550", color: "#F4F0E6" }}>
              Send sign-in link
            </button>
            {error && <p className="text-sm mt-3" style={{ color: "#A23E3E" }}>{error}</p>}
          </>
        )}
      </form>
    </div>
  );
}

/* ---------- Bottom nav bar ---------- */
function BottomNav({ page, setPage }) {
  const items = [
    { id: "home", label: "Home", Icon: IconHome },
    { id: "todos", label: "To-do", Icon: IconCheck },
    { id: "networth", label: "Net worth", Icon: IconTrend },
  ];
  return (
    <div
      className="fixed bottom-0 left-0 right-0 flex justify-around items-center"
      style={{ background: "#FFFDF9", borderTop: "1px solid #DCD4C0", height: "64px", zIndex: 50 }}
    >
      {items.map(({ id, label, Icon }) => {
        const active = page === id;
        return (
          <button
            key={id}
            onClick={() => setPage(id)}
            className="flex flex-col items-center justify-center gap-1 flex-1 h-full"
            style={{ color: active ? "#2F4550" : "#8A8272" }}
          >
            <Icon />
            <span className="text-[10px] uppercase tracking-wide">{label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ---------- Main ledger ---------- */
function Ledger({ userId }) {
  const [categories, setCategories] = useState([]);
  const [entries, setEntries] = useState([]);
  const [todos, setTodos] = useState([]);
  const [holdings, setHoldings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState("");
  const [source, setSource] = useState("");
  const [editingPct, setEditingPct] = useState(false);
  const [draftCats, setDraftCats] = useState([]);
  const [flash, setFlash] = useState(null);
  const [error, setError] = useState("");
  const [page, setPage] = useState("home");
  const [goalTarget, setGoalTarget] = useState(null);
  const [goalDraft, setGoalDraft] = useState("");
  const [goalSaved, setGoalSaved] = useState(false);
  const [newTodoText, setNewTodoText] = useState("");
  const [newHolding, setNewHolding] = useState({ type: "Stocks", customType: "", ticker: "", name: "", invested: "", currentValue: "" });
  const [holdingEdits, setHoldingEdits] = useState({});
  const inputRef = useRef(null);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadData() {
    setLoading(true);
    let { data: cats } = await supabase
      .from("categories")
      .select("*")
      .order("sort_order", { ascending: true });

    if (!cats || cats.length === 0) {
      const seed = DEFAULT_CATEGORIES.map((c) => ({ ...c, user_id: userId }));
      const { data: inserted } = await supabase.from("categories").insert(seed).select();
      cats = inserted || [];
    }

    const { data: ents } = await supabase
      .from("entries")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    const { data: td } = await supabase
      .from("todos")
      .select("*")
      .order("created_at", { ascending: false });

    const { data: hd } = await supabase
      .from("net_worth_holdings")
      .select("*")
      .order("created_at", { ascending: true });

    const { data: goalRow } = await supabase
      .from("user_goal")
      .select("*")
      .maybeSingle();

    setCategories(cats || []);
    setEntries(ents || []);
    setTodos(td || []);
    setHoldings(hd || []);
    setGoalTarget(goalRow ? goalRow.target : null);
    setGoalDraft(goalRow && goalRow.target != null ? String(goalRow.target) : "");
    setLoading(false);
  }

  const totals = useMemo(() => {
    const t = {};
    categories.forEach((c) => (t[c.id] = 0));
    entries.forEach((e) => {
      Object.entries(e.split || {}).forEach(([catId, amt]) => {
        t[catId] = (t[catId] || 0) + Number(amt);
      });
    });
    return t;
  }, [categories, entries]);

  const grandTotal = Object.values(totals).reduce((a, b) => a + b, 0);

  function pctSum(cats) {
    return cats.reduce((a, c) => a + (Number(c.pct) || 0), 0);
  }

  async function handleSplit(e) {
    e.preventDefault();
    setError("");
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      setError("Enter an amount above zero.");
      return;
    }
    const split = {};
    categories.forEach((c) => {
      split[c.id] = Math.round(((amt * c.pct) / 100) * 100) / 100;
    });
    const entry = {
      user_id: userId,
      amount: amt,
      source: source.trim() || "Unlabeled",
      split,
    };
    const { data, error: insertError } = await supabase.from("entries").insert(entry).select();
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setEntries([data[0], ...entries]);
    setFlash(data[0]);
    setAmount("");
    setSource("");
    inputRef.current && inputRef.current.focus();
    setTimeout(() => setFlash(null), 2600);
  }

  function openEditor() {
    setDraftCats(categories.map((c) => ({ ...c })));
    setError("");
    setEditingPct(true);
  }

  function updateDraft(id, field, value) {
    setDraftCats(draftCats.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
  }

  function addDraftCategory() {
    const usedColors = draftCats.map((c) => c.color);
    const nextColor = PALETTE.find((p) => !usedColors.includes(p)) || PALETTE[draftCats.length % PALETTE.length];
    setDraftCats([
      ...draftCats,
      { id: `new_${Date.now()}`, label: "New category", note: "", pct: 0, color: nextColor, isNew: true, sort_order: draftCats.length },
    ]);
  }

  function removeDraftCategory(id) {
    setDraftCats(draftCats.filter((c) => c.id !== id));
  }

  async function saveCategories() {
    if (draftCats.length === 0) {
      setError("Add at least one category.");
      return;
    }
    if (draftCats.some((c) => !c.label.trim())) {
      setError("Every category needs a name.");
      return;
    }
    const sum = pctSum(draftCats);
    if (sum !== 100) {
      setError(`Splits must add up to 100%. Currently ${sum}%.`);
      return;
    }
    setError("");

    const toInsert = draftCats
      .filter((c) => c.isNew)
      .map((c) => ({ user_id: userId, label: c.label, note: c.note, pct: Number(c.pct), color: c.color, sort_order: c.sort_order }));
    const toUpdate = draftCats.filter((c) => !c.isNew);
    const removedIds = categories.filter((c) => !draftCats.find((d) => d.id === c.id)).map((c) => c.id);

    if (toInsert.length) await supabase.from("categories").insert(toInsert);
    for (const c of toUpdate) {
      await supabase.from("categories").update({ label: c.label, note: c.note, pct: Number(c.pct), color: c.color }).eq("id", c.id);
    }
    if (removedIds.length) await supabase.from("categories").delete().in("id", removedIds);

    await loadData();
    setEditingPct(false);
  }

  async function handleReset() {
    if (!confirm("Delete all logged entries? This can't be undone.")) return;
    await supabase.from("entries").delete().eq("user_id", userId);
    setEntries([]);
  }

  async function saveGoal() {
    const val = parseFloat(goalDraft);
    const target = isNaN(val) ? null : val;
    const { error: upsertError } = await supabase
      .from("user_goal")
      .upsert({ user_id: userId, target }, { onConflict: "user_id" });
    if (!upsertError) {
      setGoalTarget(target);
      setGoalSaved(true);
      setTimeout(() => setGoalSaved(false), 1500);
    }
  }

  async function addTodo(e) {
    e.preventDefault();
    if (!newTodoText.trim()) return;
    const { data, error: insertError } = await supabase
      .from("todos")
      .insert({ user_id: userId, text: newTodoText.trim(), done: false })
      .select();
    if (!insertError && data) {
      setTodos([data[0], ...todos]);
      setNewTodoText("");
    }
  }

  async function toggleTodo(id, done) {
    await supabase.from("todos").update({ done: !done }).eq("id", id);
    setTodos(todos.map((t) => (t.id === id ? { ...t, done: !done } : t)));
  }

  async function deleteTodo(id) {
    await supabase.from("todos").delete().eq("id", id);
    setTodos(todos.filter((t) => t.id !== id));
  }

  async function addHolding(e) {
    e.preventDefault();
    const finalType = newHolding.type === "Other" ? newHolding.customType.trim() : newHolding.type;
    if (!finalType || !newHolding.name.trim()) return;
    const invested = parseFloat(newHolding.invested) || 0;
    const currentValue = parseFloat(newHolding.currentValue) || 0;
    const { data, error: insertError } = await supabase
      .from("net_worth_holdings")
      .insert({ user_id: userId, asset_type: finalType, ticker: newHolding.ticker.trim() || null, name: newHolding.name.trim(), invested, current_value: currentValue })
      .select();
    if (!insertError && data) {
      setHoldings([...holdings, data[0]]);
      setNewHolding({ type: "Stocks", customType: "", ticker: "", name: "", invested: "", currentValue: "" });
    }
  }

  async function updateHoldingValue(id) {
    const val = parseFloat(holdingEdits[id]);
    if (isNaN(val)) return;
    await supabase.from("net_worth_holdings").update({ current_value: val }).eq("id", id);
    setHoldings(holdings.map((h) => (h.id === id ? { ...h, current_value: val } : h)));
    setHoldingEdits({ ...holdingEdits, [id]: undefined });
  }

  async function deleteHolding(id) {
    await supabase.from("net_worth_holdings").delete().eq("id", id);
    setHoldings(holdings.filter((h) => h.id !== id));
  }

  const draftSum = pctSum(draftCats);

  const holdingsByType = useMemo(() => {
    const groups = {};
    holdings.forEach((h) => {
      if (!groups[h.asset_type]) groups[h.asset_type] = [];
      groups[h.asset_type].push(h);
    });
    return groups;
  }, [holdings]);

  const netWorthTotal = holdings.reduce((a, h) => a + Number(h.current_value || 0), 0);
  const investedTotal = holdings.reduce((a, h) => a + Number(h.invested || 0), 0);
  const overallGain = netWorthTotal - investedTotal;

  if (loading) {
    return (
      <div style={{ background: "#F4F0E6", minHeight: "100vh" }} className="flex items-center justify-center">
        <div style={{ color: "#2F4550", fontFamily: "Georgia, serif" }}>Opening ledger…</div>
      </div>
    );
  }

  return (
    <div style={{ background: "#F4F0E6", minHeight: "100vh", fontFamily: "'Iowan Old Style', 'Georgia', serif", color: "#2A2620" }} className="w-full">
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          .flash-in { animation: flashIn 0.4s ease-out; }
          .bar-fill { transition: width 0.6s cubic-bezier(0.22, 1, 0.36, 1); }
        }
        @keyframes flashIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
        .num { font-family: 'Courier New', Courier, monospace; font-variant-numeric: tabular-nums; }
        input:focus, button:focus, select:focus { outline: 2px solid #2F4550; outline-offset: 2px; }
      `}</style>

      <div className="max-w-2xl mx-auto px-5 py-10" style={{ paddingBottom: "88px" }}>

        {page === "home" && (
          <>
            <div className="flex items-baseline justify-between border-b-2 pb-4 mb-8" style={{ borderColor: "#2A2620" }}>
              <div>
                <h1 className="text-3xl tracking-tight">Allocation Ledger</h1>
                <p className="text-sm mt-1" style={{ color: "#6B6355" }}>Every deposit, split on the spot.</p>
              </div>
              <div className="text-right">
                <div className="text-xs uppercase tracking-widest" style={{ color: "#6B6355" }}>Total handled</div>
                <div className="num text-2xl" style={{ color: "#2F4550" }}>${formatMoney(grandTotal)}</div>
              </div>
            </div>

            <div className="flex gap-4 flex-wrap mb-8 items-stretch">
              <form onSubmit={handleSplit} className="flex-1 min-w-[260px] p-5 rounded-sm" style={{ background: "#FFFDF9", border: "1px solid #DCD4C0" }}>
                <div className="flex gap-3 flex-wrap items-end">
                  <div className="flex-1 min-w-[120px]">
                    <label className="block text-xs uppercase tracking-widest mb-1" style={{ color: "#6B6355" }}>Amount received</label>
                    <div className="flex items-center">
                      <span className="text-xl mr-1">$</span>
                      <input ref={inputRef} type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="500"
                        className="w-full text-xl num bg-transparent border-b-2 py-1" style={{ borderColor: "#2A2620" }} />
                    </div>
                  </div>
                  <div className="flex-1 min-w-[120px]">
                    <label className="block text-xs uppercase tracking-widest mb-1" style={{ color: "#6B6355" }}>Source (optional)</label>
                    <input type="text" value={source} onChange={(e) => setSource(e.target.value)} placeholder="Allowance, part-time..."
                      className="w-full text-base bg-transparent border-b-2 py-1" style={{ borderColor: "#2A2620" }} />
                  </div>
                  <button type="submit" className="px-5 py-2 rounded-sm text-sm tracking-wide" style={{ background: "#2F4550", color: "#F4F0E6" }}>
                    Split it
                  </button>
                </div>
                {!editingPct && error && <div className="mt-3 text-sm" style={{ color: "#A23E3E" }}>{error}</div>}
              </form>

              <div className="flex-1 min-w-[260px] p-4 rounded-sm" style={{ background: "#FFFDF9", border: "1px solid #DCD4C0" }}>
                <h2 className="text-xs uppercase tracking-widest mb-3" style={{ color: "#6B6355" }}>Overall goal</h2>
                {goalTarget ? (
                  <>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="num">${formatMoney(grandTotal)} / ${formatMoney(goalTarget)}</span>
                      <span style={{ color: "#6B6355" }}>{Math.min(Math.round((grandTotal / goalTarget) * 100), 100)}%</span>
                    </div>
                    <div className="h-2 rounded-full w-full mb-3" style={{ background: "#E4DCC8" }}>
                      <div className="bar-fill h-2 rounded-full" style={{ width: `${Math.min((grandTotal / goalTarget) * 100, 100)}%`, background: "#2F4550" }} />
                    </div>
                  </>
                ) : (
                  <p className="text-sm mb-3" style={{ color: "#8A8272" }}>No goal set yet.</p>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-sm">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={goalDraft}
                    onChange={(e) => setGoalDraft(e.target.value)}
                    placeholder="Set a target"
                    className="w-28 num bg-transparent border-b-2 py-1 text-sm"
                    style={{ borderColor: "#2A2620" }}
                  />
                  <button onClick={saveGoal} className="px-3 py-1 rounded-sm text-xs" style={{ background: "#2F4550", color: "#F4F0E6" }}>
                    {goalSaved ? "Saved ✓" : "Save"}
                  </button>
                </div>
              </div>
            </div>

            {flash && (
              <div className="flash-in mb-8 p-4 rounded-sm text-sm" style={{ background: "#EFE9D8", border: "1px dashed #2A2620" }}>
                <span className="num">${formatMoney(flash.amount)}</span> from {flash.source} →{" "}
                {categories.map((c) => `${c.label} $${formatMoney(flash.split[c.id])}`).join("  ·  ")}
              </div>
            )}

            {grandTotal > 0 && (
              <div className="mb-8 p-4 rounded-sm" style={{ background: "#FFFDF9", border: "1px solid #DCD4C0" }}>
                <h2 className="text-xs uppercase tracking-widest mb-3" style={{ color: "#6B6355" }}>Split breakdown</h2>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart margin={{ top: 20, bottom: 20, left: 20, right: 20 }}>
                    <Pie
                      data={categories.map((c) => ({ name: c.label, value: totals[c.id] || 0, color: c.color }))}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      labelLine={false}
                      label={({ cx, cy, midAngle, innerRadius, outerRadius, value }) => {
                        const RAD = Math.PI / 180;
                        const radius = innerRadius + (outerRadius - innerRadius) * 0.6;
                        const x = cx + radius * Math.cos(-midAngle * RAD);
                        const y = cy + radius * Math.sin(-midAngle * RAD);
                        return (
                          <text x={x} y={y} fill="#FFFDF9" textAnchor="middle" dominantBaseline="central" fontSize={13} fontFamily="'Courier New', monospace">
                            ${formatMoney(value)}
                          </text>
                        );
                      }}
                    >
                      {categories.map((c) => (
                        <Cell key={c.id} fill={c.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `$${formatMoney(value)}`} />
                    <Legend layout="vertical" verticalAlign="middle" align="left" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs uppercase tracking-widest" style={{ color: "#6B6355" }}>Where it's gone</h2>
                <button onClick={() => (editingPct ? setEditingPct(false) : openEditor())} className="text-xs underline" style={{ color: "#2F4550" }}>
                  {editingPct ? "Cancel" : "Edit categories"}
                </button>
              </div>

              {editingPct ? (
                <div className="p-4 rounded-sm space-y-3" style={{ background: "#FFFDF9", border: "1px solid #DCD4C0" }}>
                  {draftCats.map((c) => (
                    <div key={c.id} className="flex items-center gap-2 flex-wrap">
                      <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: c.color }} />
                      <input type="text" value={c.label} onChange={(e) => updateDraft(c.id, "label", e.target.value)} placeholder="Category name"
                        className="flex-1 min-w-[100px] text-sm bg-transparent border-b py-1" style={{ borderColor: "#DCD4C0" }} />
                      <input type="text" value={c.note || ""} onChange={(e) => updateDraft(c.id, "note", e.target.value)} placeholder="note (optional)"
                        className="flex-1 min-w-[100px] text-xs bg-transparent border-b py-1" style={{ borderColor: "#DCD4C0", color: "#6B6355" }} />
                      <input type="number" min="0" max="100" value={c.pct} onChange={(e) => updateDraft(c.id, "pct", e.target.value)}
                        className="w-16 num bg-transparent border-b-2 py-1" style={{ borderColor: "#2A2620" }} />
                      <span className="text-sm" style={{ color: "#6B6355" }}>%</span>
                      <button onClick={() => removeDraftCategory(c.id)} className="text-xs px-2" style={{ color: "#A23E3E" }}>✕</button>
                    </div>
                  ))}
                  <button onClick={addDraftCategory} className="text-xs underline" style={{ color: "#2F4550" }}>+ Add category</button>
                  {error && <div className="text-sm" style={{ color: "#A23E3E" }}>{error}</div>}
                  <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: "#DCD4C0" }}>
                    <span className="text-xs" style={{ color: draftSum === 100 ? "#5C6F52" : "#A23E3E" }}>
                      Sum: {draftSum}% {draftSum === 100 ? "✓" : "— needs to be 100%"}
                    </span>
                    <button onClick={saveCategories} className="px-4 py-1.5 rounded-sm text-sm" style={{ background: "#2F4550", color: "#F4F0E6" }}>
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {categories.map((c) => {
                    const pctOfTotal = grandTotal > 0 ? ((totals[c.id] || 0) / grandTotal) * 100 : 0;
                    return (
                      <div key={c.id}>
                        <div className="flex justify-between text-sm mb-1">
                          <span>
                            <span style={{ color: c.color, fontWeight: 600 }}>{c.label}</span>{" "}
                            <span style={{ color: "#6B6355" }}>{c.note ? `· ${c.note} ` : ""}· {c.pct}%</span>
                          </span>
                          <span className="num">${formatMoney(totals[c.id] || 0)}</span>
                        </div>
                        <div className="h-2 rounded-full w-full" style={{ background: "#E4DCC8" }}>
                          <div className="bar-fill h-2 rounded-full" style={{ width: `${Math.min(pctOfTotal, 100)}%`, background: c.color }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs uppercase tracking-widest" style={{ color: "#6B6355" }}>Entries</h2>
                {entries.length > 0 && (
                  <button onClick={handleReset} className="text-xs underline" style={{ color: "#A23E3E" }}>Reset all</button>
                )}
              </div>
              {entries.length === 0 ? (
                <div className="text-sm py-8 text-center rounded-sm" style={{ color: "#8A8272", border: "1px dashed #DCD4C0" }}>
                  Nothing logged yet — split your first deposit above.
                </div>
              ) : (
                <div className="divide-y" style={{ borderColor: "#DCD4C0" }}>
                  {entries.map((h) => (
                    <div key={h.id} className="py-3 flex justify-between items-center text-sm">
                      <div>
                        <div>{h.source}</div>
                        <div className="text-xs" style={{ color: "#8A8272" }}>
                          {new Date(h.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                        </div>
                      </div>
                      <div className="num">${formatMoney(h.amount)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button onClick={() => supabase.auth.signOut()} className="mt-10 text-xs underline" style={{ color: "#6B6355" }}>
              Sign out
            </button>
          </>
        )}

        {page === "todos" && (
          <>
            <div className="mb-8">
              <h1 className="text-2xl tracking-tight">To-do</h1>
              <p className="text-sm mt-1" style={{ color: "#6B6355" }}>Quick checklist — money-related or not.</p>
            </div>

            <form onSubmit={addTodo} className="mb-6 flex gap-2">
              <input
                type="text"
                value={newTodoText}
                onChange={(e) => setNewTodoText(e.target.value)}
                placeholder="Add a task..."
                className="flex-1 text-base bg-transparent border-b-2 py-2"
                style={{ borderColor: "#2A2620" }}
              />
              <button type="submit" className="px-4 py-2 rounded-sm text-sm" style={{ background: "#2F4550", color: "#F4F0E6" }}>
                Add
              </button>
            </form>

            {todos.length === 0 ? (
              <div className="text-sm py-8 text-center rounded-sm" style={{ color: "#8A8272", border: "1px dashed #DCD4C0" }}>
                Nothing on your list yet.
              </div>
            ) : (
              <div className="space-y-2">
                {todos.map((t) => (
                  <div key={t.id} className="flex items-center gap-3 p-3 rounded-sm" style={{ background: "#FFFDF9", border: "1px solid #DCD4C0" }}>
                    <button
                      onClick={() => toggleTodo(t.id, t.done)}
                      className="w-5 h-5 rounded-sm flex-shrink-0 flex items-center justify-center"
                      style={{ border: `2px solid ${t.done ? "#5C6F52" : "#2A2620"}`, background: t.done ? "#5C6F52" : "transparent" }}
                    >
                      {t.done && <span style={{ color: "#FFFDF9", fontSize: "12px" }}>✓</span>}
                    </button>
                    <span className="flex-1 text-sm" style={{ textDecoration: t.done ? "line-through" : "none", color: t.done ? "#8A8272" : "#2A2620" }}>
                      {t.text}
                    </span>
                    <button onClick={() => deleteTodo(t.id)} className="text-xs px-1" style={{ color: "#A23E3E" }}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {page === "networth" && (
          <>
            <div className="mb-6">
              <h1 className="text-2xl tracking-tight">Net worth</h1>
              <p className="text-sm mt-1" style={{ color: "#6B6355" }}>Everything you've invested, tracked by type.</p>
            </div>

            <div className="mb-6 p-4 rounded-sm" style={{ background: "#FFFDF9", border: "1px solid #DCD4C0" }}>
              <div className="flex justify-between text-sm mb-1">
                <span style={{ color: "#6B6355" }}>Total current value</span>
                <span className="num text-lg" style={{ color: "#2F4550" }}>${formatMoney(netWorthTotal)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span style={{ color: "#6B6355" }}>Invested ${formatMoney(investedTotal)}</span>
                <span className="num" style={{ color: overallGain >= 0 ? "#5C6F52" : "#A23E3E" }}>
                  {overallGain >= 0 ? "+" : "-"}${formatMoney(Math.abs(overallGain))} {investedTotal > 0 ? `(${((overallGain / investedTotal) * 100).toFixed(1)}%)` : ""}
                </span>
              </div>
            </div>

            {netWorthTotal > 0 && (
              <div className="mb-6 p-4 rounded-sm" style={{ background: "#FFFDF9", border: "1px solid #DCD4C0" }}>
                <h2 className="text-xs uppercase tracking-widest mb-3" style={{ color: "#6B6355" }}>What we own</h2>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart margin={{ top: 20, bottom: 20, left: 20, right: 20 }}>
                    <Pie
                      data={holdings.map((h, i) => ({
                        name: h.ticker || h.name,
                        value: Number(h.current_value || 0),
                        color: PALETTE[i % PALETTE.length],
                      }))}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      labelLine={false}
                      label={({ cx, cy, midAngle, innerRadius, outerRadius, name, value }) => {
                        const RAD = Math.PI / 180;
                        const radius = innerRadius + (outerRadius - innerRadius) * 0.6;
                        const x = cx + radius * Math.cos(-midAngle * RAD);
                        const y = cy + radius * Math.sin(-midAngle * RAD);
                        const pct = Math.round((value / netWorthTotal) * 100);
                        if (pct < 5) return null;
                        return (
                          <text x={x} y={y} fill="#FFFDF9" textAnchor="middle" dominantBaseline="central" fontSize={12} fontFamily="'Courier New', monospace">
                            {pct}%
                          </text>
                        );
                      }}
                    >
                      {holdings.map((h, i) => (
                        <Cell key={h.id} fill={PALETTE[i % PALETTE.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [`$${formatMoney(value)} (${Math.round((value / netWorthTotal) * 100)}%)`, name]} />
                    <Legend layout="vertical" verticalAlign="middle" align="left" wrapperStyle={{ fontSize: "12px" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            <form onSubmit={addHolding} className="mb-8 p-4 rounded-sm space-y-2" style={{ background: "#FFFDF9", border: "1px solid #DCD4C0" }}>
              <div className="flex gap-2 flex-wrap">
                <select
                  value={newHolding.type}
                  onChange={(e) => setNewHolding({ ...newHolding, type: e.target.value })}
                  className="flex-1 min-w-[120px] text-sm bg-transparent border-b-2 py-2"
                  style={{ borderColor: "#2A2620" }}
                >
                  {ASSET_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                {newHolding.type === "Other" && (
                  <input
                    type="text"
                    value={newHolding.customType}
                    onChange={(e) => setNewHolding({ ...newHolding, customType: e.target.value })}
                    placeholder="Type name"
                    className="flex-1 min-w-[100px] text-sm bg-transparent border-b-2 py-2"
                    style={{ borderColor: "#2A2620" }}
                  />
                )}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newHolding.ticker}
                  onChange={(e) => setNewHolding({ ...newHolding, ticker: e.target.value.toUpperCase() })}
                  placeholder="Ticker (optional, e.g. AAPL)"
                  className="w-32 text-sm bg-transparent border-b-2 py-2"
                  style={{ borderColor: "#2A2620" }}
                />
                <input
                  type="text"
                  value={newHolding.name}
                  onChange={(e) => setNewHolding({ ...newHolding, name: e.target.value })}
                  placeholder="Name (e.g. Apple, S&P 500 ETF, Maybank FD)"
                  className="flex-1 text-sm bg-transparent border-b-2 py-2"
                  style={{ borderColor: "#2A2620" }}
                />
              </div>
              <div className="flex gap-2 flex-wrap items-end">
                <div className="flex-1 min-w-[100px]">
                  <label className="block text-xs uppercase tracking-widest mb-1" style={{ color: "#6B6355" }}>Invested</label>
                  <div className="flex items-center">
                    <span className="mr-1">$</span>
                    <input type="number" min="0" step="0.01" value={newHolding.invested} onChange={(e) => setNewHolding({ ...newHolding, invested: e.target.value })}
                      className="w-full num bg-transparent border-b-2 py-1 text-sm" style={{ borderColor: "#2A2620" }} />
                  </div>
                </div>
                <div className="flex-1 min-w-[100px]">
                  <label className="block text-xs uppercase tracking-widest mb-1" style={{ color: "#6B6355" }}>Current value</label>
                  <div className="flex items-center">
                    <span className="mr-1">$</span>
                    <input type="number" min="0" step="0.01" value={newHolding.currentValue} onChange={(e) => setNewHolding({ ...newHolding, currentValue: e.target.value })}
                      className="w-full num bg-transparent border-b-2 py-1 text-sm" style={{ borderColor: "#2A2620" }} />
                  </div>
                </div>
                <button type="submit" className="px-4 py-2 rounded-sm text-sm" style={{ background: "#2F4550", color: "#F4F0E6" }}>
                  Add
                </button>
              </div>
            </form>

            {Object.keys(holdingsByType).length === 0 ? (
              <div className="text-sm py-8 text-center rounded-sm" style={{ color: "#8A8272", border: "1px dashed #DCD4C0" }}>
                No holdings yet — add your first one above.
              </div>
            ) : (
              Object.entries(holdingsByType).map(([type, items]) => {
                const sectionTotal = items.reduce((a, h) => a + Number(h.current_value || 0), 0);
                return (
                  <div key={type} className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-xs uppercase tracking-widest" style={{ color: "#6B6355" }}>{type}</h3>
                      <span className="num text-xs" style={{ color: "#6B6355" }}>${formatMoney(sectionTotal)}</span>
                    </div>
                    <div className="space-y-2">
                      {items.map((h) => {
                        const gain = Number(h.current_value || 0) - Number(h.invested || 0);
                        return (
                          <div key={h.id} className="p-3 rounded-sm" style={{ background: "#FFFDF9", border: "1px solid #DCD4C0" }}>
                            <div className="flex justify-between items-start mb-1">
                              <span className="text-sm font-medium">{h.ticker ? `${h.ticker} — ${h.name}` : h.name}</span>
                              <button onClick={() => deleteHolding(h.id)} className="text-xs px-1" style={{ color: "#A23E3E" }}>✕</button>
                            </div>
                            <div className="flex justify-between text-xs mb-2">
                              <span style={{ color: "#6B6355" }}>Invested ${formatMoney(h.invested)}</span>
                              <span className="num" style={{ color: gain >= 0 ? "#5C6F52" : "#A23E3E" }}>
                                {gain >= 0 ? "+" : "-"}${formatMoney(Math.abs(gain))}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs" style={{ color: "#6B6355" }}>Current:</span>
                              <span className="text-xs">$</span>
                              <input
                                type="number"
                                step="0.01"
                                value={holdingEdits[h.id] ?? h.current_value}
                                onChange={(e) => setHoldingEdits({ ...holdingEdits, [h.id]: e.target.value })}
                                className="w-24 num bg-transparent border-b py-1 text-xs"
                                style={{ borderColor: "#DCD4C0" }}
                              />
                              <button onClick={() => updateHoldingValue(h.id)} className="px-2 py-1 rounded-sm text-xs" style={{ background: "#2F4550", color: "#F4F0E6" }}>
                                Update
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </>
        )}
      </div>

      <BottomNav page={page} setPage={setPage} />
    </div>
  );
}

/* ---------- Root: handles auth state ---------- */
export default function App() {
  const [session, setSession] = useState(undefined); // undefined = loading

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => listener.subscription.unsubscribe();
  }, []);

  if (session === undefined) {
    return (
      <div style={{ background: "#F4F0E6", minHeight: "100vh" }} className="flex items-center justify-center">
        <div style={{ color: "#2F4550", fontFamily: "Georgia, serif" }}>Loading…</div>
      </div>
    );
  }

  return session ? <Ledger userId={session.user.id} /> : <Login />;
}
