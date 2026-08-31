import React, { useState, useEffect, useRef, useMemo } from "react";
import { supabase } from "./supabaseClient";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

const DEFAULT_CATEGORIES = [
  { label: "Needs", note: "food, transport, essentials", pct: 50, color: "#8A6D3B", sort_order: 0 },
  { label: "Wants", note: "going out, extras", pct: 30, color: "#5C6F52", sort_order: 1 },
  { label: "Saving", note: "set aside, don't touch", pct: 20, color: "#2F4550", sort_order: 2 },
];

const PALETTE = ["#8A6D3B", "#5C6F52", "#2F4550", "#A2543E", "#6B5B95", "#3D5A6C", "#7A5230", "#4E6E58"];

const THEMES = {
  light: {
    bg: "#F4F0E6",
    card: "#FFFDF9",
    border: "#DCD4C0",
    text: "#2A2620",
    textMuted: "#6B6355",
    textFaint: "#8A8272",
    accent: "#2F4550",
    accentText: "#F4F0E6",
    danger: "#A23E3E",
    success: "#5C6F52",
    flashBg: "#EFE9D8",
    trackBg: "#E4DCC8",
  },
  dark: {
    bg: "#16181C",
    card: "#202327",
    border: "#3A3D42",
    text: "#FFFFFF",
    textMuted: "#B0B3B8",
    textFaint: "#8A8D91",
    accent: "#FFFFFF",
    accentText: "#000000",
    danger: "#E08585",
    success: "#9BC08A",
    flashBg: "#26292E",
    trackBg: "#2E3136",
  },
};

const CURRENCIES = { USD: "$", MYR: "RM", EUR: "€", GBP: "£", SGD: "S$", JPY: "¥", AUD: "A$", INR: "₹" };

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
function IconRepeat(props) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m17 2 4 4-4 4" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <path d="m7 22-4-4 4-4" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  );
}
function IconSun(props) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}
function IconMoon(props) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z" />
    </svg>
  );
}

/* ---------- Login screen ---------- */
/* ---------- Set new password (after clicking a reset link) ---------- */
function SetNewPassword({ onDone, theme }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSubmitting(false);
    if (error) setError(error.message);
    else onDone();
  }

  return (
    <div style={{ background: theme.bg, minHeight: "100vh", fontFamily: "Georgia, serif" }} className="flex items-center justify-center px-5">
      <style>{`input, select, textarea { color: inherit; } input::placeholder { color: inherit; opacity: 0.5; }`}</style>
      <form onSubmit={handleSubmit} className="w-full max-w-sm p-6 rounded-sm" style={{ background: theme.card, border: `1px solid ${theme.border}` }}>
        <h1 className="text-2xl mb-2" style={{ color: theme.text }}>Set a new password</h1>
        <p className="text-sm mb-4" style={{ color: theme.textMuted }}>Choose a new password for your account.</p>
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="New password (min 6 characters)"
          className="w-full text-base bg-transparent border-b-2 py-2 mb-4"
          style={{ borderColor: theme.text }}
        />
        <input
          type="password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Confirm new password"
          className="w-full text-base bg-transparent border-b-2 py-2 mb-4"
          style={{ borderColor: theme.text }}
        />
        <button type="submit" disabled={submitting} className="w-full px-4 py-2 rounded-sm text-sm" style={{ background: theme.accent, color: theme.accentText }}>
          {submitting ? "Saving..." : "Save new password"}
        </button>
        {error && <p className="text-sm mt-3" style={{ color: theme.danger }}>{error}</p>}
      </form>
    </div>
  );
}

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("signin"); // "signin" | "signup"
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [darkMode, setDarkMode] = useState(() => typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
  const theme = darkMode ? THEMES.dark : THEMES.light;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setInfo("");
    setSubmitting(true);
    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
      // On success, the auth state listener in App() picks up the new session automatically.
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(error.message);
      } else if (data.session) {
        // Email confirmation is off in Supabase settings — signed in immediately.
      } else {
        setInfo("Account created — check your email to confirm, then sign in.");
        setMode("signin");
      }
    }
    setSubmitting(false);
  }

  async function handleForgotPassword() {
    if (!email) {
      setError("Enter your email above first, then tap this link.");
      return;
    }
    setError("");
    setInfo("");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    if (error) setError(error.message);
    else setInfo("Check your email for a password reset link.");
  }

  return (
    <div style={{ background: theme.bg, minHeight: "100vh", fontFamily: "Georgia, serif" }} className="flex items-center justify-center px-5">
      <style>{`input, select, textarea { color: inherit; } input::placeholder { color: inherit; opacity: 0.5; }`}</style>
      <button
        onClick={() => setDarkMode(!darkMode)}
        className="fixed top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center z-50"
        style={{ background: theme.card, border: `1px solid ${theme.border}`, color: theme.text }}
        aria-label="Toggle dark mode"
      >
        {darkMode ? <IconSun /> : <IconMoon />}
      </button>
      <form onSubmit={handleSubmit} className="w-full max-w-sm p-6 rounded-sm" style={{ background: theme.card, border: `1px solid ${theme.border}` }}>
        <h1 className="text-2xl mb-2" style={{ color: theme.text }}>Allocation Ledger</h1>
        <p className="text-sm mb-4" style={{ color: theme.textMuted }}>
          {mode === "signin" ? "Sign in with your email and password." : "Create an account with an email and password."}
        </p>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full text-base bg-transparent border-b-2 py-2 mb-4"
          style={{ borderColor: theme.text }}
        />
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password (min 6 characters)"
          className="w-full text-base bg-transparent border-b-2 py-2 mb-4"
          style={{ borderColor: theme.text }}
        />
        <button type="submit" disabled={submitting} className="w-full px-4 py-2 rounded-sm text-sm" style={{ background: theme.accent, color: theme.accentText }}>
          {submitting ? "Please wait..." : mode === "signin" ? "Sign in" : "Create account"}
        </button>
        <button
          type="button"
          onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(""); setInfo(""); }}
          className="w-full text-xs underline mt-3"
          style={{ color: theme.textMuted }}
        >
          {mode === "signin" ? "New here? Create an account" : "Already have an account? Sign in"}
        </button>
        {mode === "signin" && (
          <button type="button" onClick={handleForgotPassword} className="w-full text-xs underline mt-2" style={{ color: theme.textMuted }}>
            Forgot password?
          </button>
        )}
        {info && <p className="text-sm mt-3" style={{ color: theme.success }}>{info}</p>}
        {error && <p className="text-sm mt-3" style={{ color: theme.danger }}>{error}</p>}
      </form>
    </div>
  );
}

/* ---------- Bottom nav bar ---------- */
function BottomNav({ page, setPage, theme }) {
  const items = [
    { id: "home", label: "Home", Icon: IconHome },
    { id: "todos", label: "To-do", Icon: IconCheck },
    { id: "networth", label: "Net worth", Icon: IconTrend },
    { id: "subscriptions", label: "Subs", Icon: IconRepeat },
  ];
  return (
    <div
      className="fixed bottom-0 left-0 right-0 flex justify-around items-center"
      style={{ background: theme.card, borderTop: `1px solid ${theme.border}`, height: "64px", zIndex: 50 }}
    >
      {items.map(({ id, label, Icon }) => {
        const active = page === id;
        return (
          <button
            key={id}
            onClick={() => setPage(id)}
            className="flex flex-col items-center justify-center gap-1 flex-1 h-full"
            style={{ color: active ? theme.accent : theme.textFaint }}
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
  const [darkMode, setDarkMode] = useState(() => typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
  const [currency, setCurrency] = useState("USD");
  const theme = darkMode ? THEMES.dark : THEMES.light;
  const symbol = CURRENCIES[currency] || "$";
  const [categories, setCategories] = useState([]);
  const [entries, setEntries] = useState([]);
  const [todos, setTodos] = useState([]);
  const [holdings, setHoldings] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [newSub, setNewSub] = useState({ name: "", cost: "", cycle: "monthly", renewal_date: "", notes: "" });
  const [editingSubId, setEditingSubId] = useState(null);
  const [editSub, setEditSub] = useState({});
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState("");
  const [source, setSource] = useState("");
  const [editingPct, setEditingPct] = useState(false);
  const [draftCats, setDraftCats] = useState([]);
  const [flash, setFlash] = useState(null);
  const [error, setError] = useState("");
  const [editingEntryId, setEditingEntryId] = useState(null);
  const [editAmount, setEditAmount] = useState("");
  const [editSource, setEditSource] = useState("");
  const [searchText, setSearchText] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState("home");
  const [goalTarget, setGoalTarget] = useState(null);
  const [goalDraft, setGoalDraft] = useState("");
  const [goalCategoryIds, setGoalCategoryIds] = useState([]);
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
      .limit(1000);

    const { data: td } = await supabase
      .from("todos")
      .select("*")
      .order("created_at", { ascending: false });

    const { data: hd } = await supabase
      .from("net_worth_holdings")
      .select("*")
      .order("created_at", { ascending: true });

    const { data: subs } = await supabase
      .from("subscriptions")
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
    setSubscriptions(subs || []);
    setGoalTarget(goalRow ? goalRow.target : null);
    setGoalDraft(goalRow && goalRow.target != null ? String(goalRow.target) : "");
    setGoalCategoryIds(goalRow && goalRow.category_ids ? goalRow.category_ids : []);
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
  const goalProgress = goalCategoryIds.reduce((a, id) => a + (totals[id] || 0), 0);

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

  function startEditEntry(entry) {
    setEditingEntryId(entry.id);
    setEditAmount(String(entry.amount));
    setEditSource(entry.source);
  }

  function cancelEditEntry() {
    setEditingEntryId(null);
    setEditAmount("");
    setEditSource("");
  }

  async function saveEditEntry(id) {
    const amt = parseFloat(editAmount);
    if (!amt || amt <= 0) {
      setError("Enter an amount above zero.");
      return;
    }
    const split = {};
    categories.forEach((c) => {
      split[c.id] = Math.round(((amt * c.pct) / 100) * 100) / 100;
    });
    const { error: updateError } = await supabase
      .from("entries")
      .update({ amount: amt, source: editSource.trim() || "Unlabeled", split })
      .eq("id", id);
    if (!updateError) {
      setEntries(entries.map((e) => (e.id === id ? { ...e, amount: amt, source: editSource.trim() || "Unlabeled", split } : e)));
      cancelEditEntry();
    }
  }

  async function deleteEntry(id) {
    if (!confirm("Delete this entry?")) return;
    await supabase.from("entries").delete().eq("id", id);
    setEntries(entries.filter((e) => e.id !== id));
  }

  const filteredEntries = useMemo(() => {
    return entries.filter((e) => {
      if (searchText && !e.source.toLowerCase().includes(searchText.toLowerCase())) return false;
      if (dateFrom && new Date(e.created_at) < new Date(dateFrom)) return false;
      if (dateTo && new Date(e.created_at) > new Date(dateTo + "T23:59:59")) return false;
      return true;
    });
  }, [entries, searchText, dateFrom, dateTo]);

  async function saveGoal() {
    const val = parseFloat(goalDraft);
    const target = isNaN(val) ? null : val;
    const { error: upsertError } = await supabase
      .from("user_goal")
      .upsert({ user_id: userId, target, category_ids: goalCategoryIds }, { onConflict: "user_id" });
    if (!upsertError) {
      setGoalTarget(target);
      setGoalSaved(true);
      setTimeout(() => setGoalSaved(false), 1500);
    }
  }

  function toggleGoalCategory(catId) {
    setGoalCategoryIds(
      goalCategoryIds.includes(catId) ? goalCategoryIds.filter((id) => id !== catId) : [...goalCategoryIds, catId]
    );
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

  function nextRenewalDate(dateStr, cycle) {
    if (!dateStr) return null;
    const original = new Date(dateStr + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let next;
    if (cycle === "yearly") {
      next = new Date(today.getFullYear(), original.getMonth(), original.getDate());
      if (next < today) next = new Date(today.getFullYear() + 1, original.getMonth(), original.getDate());
    } else {
      next = new Date(today.getFullYear(), today.getMonth(), original.getDate());
      if (next < today) next = new Date(today.getFullYear(), today.getMonth() + 1, original.getDate());
    }
    return next;
  }

  function daysUntil(date) {
    if (!date) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.round((date - today) / (1000 * 60 * 60 * 24));
  }

  async function addSubscription(e) {
    e.preventDefault();
    if (!newSub.name.trim() || !newSub.cost || !newSub.renewal_date) return;
    const { data, error: insertError } = await supabase
      .from("subscriptions")
      .insert({
        user_id: userId,
        name: newSub.name.trim(),
        cost: parseFloat(newSub.cost) || 0,
        cycle: newSub.cycle,
        renewal_date: newSub.renewal_date,
        notes: newSub.notes.trim() || null,
        active: true,
      })
      .select();
    if (!insertError && data) {
      setSubscriptions([...subscriptions, data[0]]);
      setNewSub({ name: "", cost: "", cycle: "monthly", renewal_date: "", notes: "" });
    }
  }

  function startEditSub(s) {
    setEditingSubId(s.id);
    setEditSub({ name: s.name, cost: String(s.cost), cycle: s.cycle, renewal_date: s.renewal_date, notes: s.notes || "" });
  }

  async function saveEditSub(id) {
    const updates = {
      name: editSub.name.trim(),
      cost: parseFloat(editSub.cost) || 0,
      cycle: editSub.cycle,
      renewal_date: editSub.renewal_date,
      notes: editSub.notes.trim() || null,
    };
    const { error: updateError } = await supabase.from("subscriptions").update(updates).eq("id", id);
    if (!updateError) {
      setSubscriptions(subscriptions.map((s) => (s.id === id ? { ...s, ...updates } : s)));
      setEditingSubId(null);
    }
  }

  async function toggleSubActive(id, active) {
    await supabase.from("subscriptions").update({ active: !active }).eq("id", id);
    setSubscriptions(subscriptions.map((s) => (s.id === id ? { ...s, active: !active } : s)));
  }

  async function deleteSubscription(id) {
    if (!confirm("Delete this subscription completely?")) return;
    await supabase.from("subscriptions").delete().eq("id", id);
    setSubscriptions(subscriptions.filter((s) => s.id !== id));
  }

  const draftSum = pctSum(draftCats);

  const activeSubsSorted = useMemo(() => {
    return subscriptions
      .filter((s) => s.active)
      .map((s) => ({ ...s, _next: nextRenewalDate(s.renewal_date, s.cycle) }))
      .sort((a, b) => a._next - b._next);
  }, [subscriptions]);

  const inactiveSubs = subscriptions.filter((s) => !s.active);

  const totalMonthlySubs = subscriptions
    .filter((s) => s.active)
    .reduce((a, s) => a + (s.cycle === "yearly" ? Number(s.cost) / 12 : Number(s.cost)), 0);

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
      <div style={{ background: theme.bg, minHeight: "100vh" }} className="flex items-center justify-center">
        <div style={{ color: theme.accent, fontFamily: "Georgia, serif" }}>Opening ledger…</div>
      </div>
    );
  }

  return (
    <div style={{ background: theme.bg, minHeight: "100vh", fontFamily: "'Iowan Old Style', 'Georgia', serif", color: theme.text }} className="w-full">
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          .flash-in { animation: flashIn 0.4s ease-out; }
          .bar-fill { transition: width 0.6s cubic-bezier(0.22, 1, 0.36, 1); }
        }
        @keyframes flashIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
        .num { font-family: 'Courier New', Courier, monospace; font-variant-numeric: tabular-nums; }
        input:focus, button:focus, select:focus { outline: 2px solid #2F4550; outline-offset: 2px; }
        input, select, textarea { color: inherit; }
        input::placeholder { color: inherit; opacity: 0.5; }
      `}</style>

      <div className="fixed top-3 right-3 flex items-center gap-2 z-50">
        <select
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          className="text-xs rounded-sm px-2 py-1.5"
          style={{ background: theme.card, border: `1px solid ${theme.border}`, color: theme.text }}
        >
          {Object.keys(CURRENCIES).map((code) => (
            <option key={code} value={code}>{code}</option>
          ))}
        </select>
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: theme.card, border: `1px solid ${theme.border}`, color: theme.text }}
          aria-label="Toggle dark mode"
        >
          {darkMode ? <IconSun /> : <IconMoon />}
        </button>
      </div>

      <div className="max-w-2xl mx-auto px-5 py-10" style={{ paddingBottom: "88px" }}>

        {page === "home" && (
          <>
            <div className="flex items-baseline justify-between border-b-2 pb-4 mb-8" style={{ borderColor: theme.text }}>
              <div>
                <h1 className="text-3xl tracking-tight">Allocation Ledger</h1>
                <p className="text-sm mt-1" style={{ color: theme.textMuted }}>Every deposit, split on the spot.</p>
              </div>
              <div className="text-right">
                <div className="text-xs uppercase tracking-widest" style={{ color: theme.textMuted }}>Total handled</div>
                <div className="num text-2xl" style={{ color: theme.accent }}>{symbol}{formatMoney(grandTotal)}</div>
              </div>
            </div>

            <div className="flex gap-4 flex-wrap mb-8 items-stretch">
              <form onSubmit={handleSplit} className="flex-1 min-w-[260px] p-5 rounded-sm" style={{ background: theme.card, border: `1px solid ${theme.border}` }}>
                <div className="flex gap-3 flex-wrap items-end">
                  <div className="flex-1 min-w-[120px]">
                    <label className="block text-xs uppercase tracking-widest mb-1" style={{ color: theme.textMuted }}>Amount received</label>
                    <div className="flex items-center">
                      <span className="text-xl mr-1">{symbol}</span>
                      <input ref={inputRef} type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="500"
                        className="w-full text-xl num bg-transparent border-b-2 py-1" style={{ borderColor: theme.text }} />
                    </div>
                  </div>
                  <div className="flex-1 min-w-[120px]">
                    <label className="block text-xs uppercase tracking-widest mb-1" style={{ color: theme.textMuted }}>Source (optional)</label>
                    <input type="text" value={source} onChange={(e) => setSource(e.target.value)} placeholder="Allowance, part-time..."
                      className="w-full text-base bg-transparent border-b-2 py-1" style={{ borderColor: theme.text }} />
                  </div>
                  <button type="submit" className="px-5 py-2 rounded-sm text-sm tracking-wide" style={{ background: theme.accent, color: theme.accentText }}>
                    Split it
                  </button>
                </div>
                {!editingPct && error && <div className="mt-3 text-sm" style={{ color: theme.danger }}>{error}</div>}
              </form>

              <div className="flex-1 min-w-[260px] p-4 rounded-sm" style={{ background: theme.card, border: `1px solid ${theme.border}` }}>
                <h2 className="text-xs uppercase tracking-widest mb-3" style={{ color: theme.textMuted }}>Overall goal</h2>
                {goalTarget ? (
                  <>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="num">{symbol}{formatMoney(goalProgress)} / {symbol}{formatMoney(goalTarget)}</span>
                      <span style={{ color: theme.textMuted }}>{Math.min(Math.round((goalProgress / goalTarget) * 100), 100)}%</span>
                    </div>
                    <div className="h-2 rounded-full w-full mb-3" style={{ background: theme.trackBg }}>
                      <div className="bar-fill h-2 rounded-full" style={{ width: `${Math.min((goalProgress / goalTarget) * 100, 100)}%`, background: theme.accent }} />
                    </div>
                  </>
                ) : (
                  <p className="text-sm mb-3" style={{ color: theme.textFaint }}>No goal set yet.</p>
                )}
                <div className="flex flex-wrap gap-3 mb-3">
                  {categories.map((c) => (
                    <label key={c.id} className="flex items-center gap-1 text-xs" style={{ color: theme.textMuted }}>
                      <input
                        type="checkbox"
                        checked={goalCategoryIds.includes(c.id)}
                        onChange={() => toggleGoalCategory(c.id)}
                      />
                      <span style={{ color: c.color }}>{c.label}</span>
                    </label>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">{symbol}</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={goalDraft}
                    onChange={(e) => setGoalDraft(e.target.value)}
                    placeholder="Set a target"
                    className="w-28 num bg-transparent border-b-2 py-1 text-sm"
                    style={{ borderColor: theme.text }}
                  />
                  <button onClick={saveGoal} className="px-3 py-1 rounded-sm text-xs" style={{ background: theme.accent, color: theme.accentText }}>
                    {goalSaved ? "Saved ✓" : "Save"}
                  </button>
                </div>
              </div>
            </div>

            {flash && (
              <div className="flash-in mb-8 p-4 rounded-sm text-sm" style={{ background: theme.flashBg, border: "1px dashed #2A2620" }}>
                <span className="num">{symbol}{formatMoney(flash.amount)}</span> from {flash.source} →{" "}
                {categories.map((c) => `${c.label} ${symbol}${formatMoney(flash.split[c.id])}`).join("  ·  ")}
              </div>
            )}

            {grandTotal > 0 && (
              <div className="mb-8 p-4 rounded-sm" style={{ background: theme.card, border: `1px solid ${theme.border}` }}>
                <h2 className="text-xs uppercase tracking-widest mb-3" style={{ color: theme.textMuted }}>Split breakdown</h2>
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
                            {symbol}{formatMoney(value)}
                          </text>
                        );
                      }}
                    >
                      {categories.map((c) => (
                        <Cell key={c.id} fill={c.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${symbol}${formatMoney(value)}`} />
                    <Legend layout="vertical" verticalAlign="middle" align="left" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs uppercase tracking-widest" style={{ color: theme.textMuted }}>Where it's gone</h2>
                <button onClick={() => (editingPct ? setEditingPct(false) : openEditor())} className="text-xs underline" style={{ color: theme.accent }}>
                  {editingPct ? "Cancel" : "Edit categories"}
                </button>
              </div>

              {editingPct ? (
                <div className="p-4 rounded-sm space-y-3" style={{ background: theme.card, border: `1px solid ${theme.border}` }}>
                  {draftCats.map((c) => (
                    <div key={c.id} className="flex items-center gap-2 flex-wrap">
                      <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: c.color }} />
                      <input type="text" value={c.label} onChange={(e) => updateDraft(c.id, "label", e.target.value)} placeholder="Category name"
                        className="flex-1 min-w-[100px] text-sm bg-transparent border-b py-1" style={{ borderColor: theme.border }} />
                      <input type="text" value={c.note || ""} onChange={(e) => updateDraft(c.id, "note", e.target.value)} placeholder="note (optional)"
                        className="flex-1 min-w-[100px] text-xs bg-transparent border-b py-1" style={{ borderColor: theme.border, color: theme.textMuted }} />
                      <input type="number" min="0" max="100" value={c.pct} onChange={(e) => updateDraft(c.id, "pct", e.target.value)}
                        className="w-16 num bg-transparent border-b-2 py-1" style={{ borderColor: theme.text }} />
                      <span className="text-sm" style={{ color: theme.textMuted }}>%</span>
                      <button onClick={() => removeDraftCategory(c.id)} className="text-xs px-2" style={{ color: theme.danger }}>✕</button>
                    </div>
                  ))}
                  <button onClick={addDraftCategory} className="text-xs underline" style={{ color: theme.accent }}>+ Add category</button>
                  {error && <div className="text-sm" style={{ color: theme.danger }}>{error}</div>}
                  <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: theme.border }}>
                    <span className="text-xs" style={{ color: draftSum === 100 ? theme.success : theme.danger }}>
                      Sum: {draftSum}% {draftSum === 100 ? "✓" : "— needs to be 100%"}
                    </span>
                    <button onClick={saveCategories} className="px-4 py-1.5 rounded-sm text-sm" style={{ background: theme.accent, color: theme.accentText }}>
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
                            <span style={{ color: theme.textMuted }}>{c.note ? `· ${c.note} ` : ""}· {c.pct}%</span>
                          </span>
                          <span className="num">{symbol}{formatMoney(totals[c.id] || 0)}</span>
                        </div>
                        <div className="h-2 rounded-full w-full" style={{ background: theme.trackBg }}>
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
                <h2 className="text-xs uppercase tracking-widest" style={{ color: theme.textMuted }}>Entries</h2>
                {entries.length > 0 && (
                  <button onClick={handleReset} className="text-xs underline" style={{ color: theme.danger }}>Reset all</button>
                )}
              </div>

              {entries.length > 0 && (
                <div className="flex gap-2 flex-wrap mb-4">
                  <input
                    type="text"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    placeholder="Search source..."
                    className="flex-1 min-w-[120px] text-sm bg-transparent border-b py-1"
                    style={{ borderColor: theme.border }}
                  />
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="text-xs bg-transparent border-b py-1"
                    style={{ borderColor: theme.border, color: theme.textMuted }}
                  />
                  <span className="text-xs self-center" style={{ color: theme.textFaint }}>to</span>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="text-xs bg-transparent border-b py-1"
                    style={{ borderColor: theme.border, color: theme.textMuted }}
                  />
                  {(searchText || dateFrom || dateTo) && (
                    <button
                      onClick={() => { setSearchText(""); setDateFrom(""); setDateTo(""); }}
                      className="text-xs underline"
                      style={{ color: theme.accent }}
                    >
                      Clear
                    </button>
                  )}
                </div>
              )}

              {entries.length === 0 ? (
                <div className="text-sm py-8 text-center rounded-sm" style={{ color: theme.textFaint, border: "1px dashed #DCD4C0" }}>
                  Nothing logged yet — split your first deposit above.
                </div>
              ) : filteredEntries.length === 0 ? (
                <div className="text-sm py-8 text-center rounded-sm" style={{ color: theme.textFaint, border: "1px dashed #DCD4C0" }}>
                  No entries match that search.
                </div>
              ) : (
                <div className="divide-y" style={{ borderColor: theme.border }}>
                  {filteredEntries.map((h) =>
                    editingEntryId === h.id ? (
                      <div key={h.id} className="py-3" style={{ background: theme.flashBg }}>
                        <div className="flex gap-2 flex-wrap items-end px-2">
                          <div className="flex-1 min-w-[100px]">
                            <label className="block text-xs uppercase tracking-widest mb-1" style={{ color: theme.textMuted }}>Amount</label>
                            <div className="flex items-center">
                              <span className="mr-1">{symbol}</span>
                              <input
                                type="number" step="0.01" min="0" value={editAmount}
                                onChange={(e) => setEditAmount(e.target.value)}
                                className="w-full num bg-transparent border-b-2 py-1 text-sm" style={{ borderColor: theme.text }}
                              />
                            </div>
                          </div>
                          <div className="flex-1 min-w-[100px]">
                            <label className="block text-xs uppercase tracking-widest mb-1" style={{ color: theme.textMuted }}>Source</label>
                            <input
                              type="text" value={editSource}
                              onChange={(e) => setEditSource(e.target.value)}
                              className="w-full text-sm bg-transparent border-b-2 py-1" style={{ borderColor: theme.text }}
                            />
                          </div>
                          <button onClick={() => saveEditEntry(h.id)} className="px-3 py-1.5 rounded-sm text-xs" style={{ background: theme.accent, color: theme.accentText }}>
                            Save
                          </button>
                          <button onClick={cancelEditEntry} className="px-3 py-1.5 rounded-sm text-xs" style={{ border: "1px solid #2F4550", color: theme.accent }}>
                            Cancel
                          </button>
                        </div>
                        {error && <div className="text-xs mt-2 px-2" style={{ color: theme.danger }}>{error}</div>}
                      </div>
                    ) : (
                      <div key={h.id} className="py-3 flex justify-between items-center text-sm group">
                        <div>
                          <div>{h.source}</div>
                          <div className="text-xs" style={{ color: theme.textFaint }}>
                            {new Date(h.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="num">{symbol}{formatMoney(h.amount)}</div>
                          <button onClick={() => startEditEntry(h)} className="text-xs underline" style={{ color: theme.accent }}>Edit</button>
                          <button onClick={() => deleteEntry(h.id)} className="text-xs" style={{ color: theme.danger }}>✕</button>
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>

            <button onClick={() => supabase.auth.signOut()} className="mt-10 text-xs underline" style={{ color: theme.textMuted }}>
              Sign out
            </button>
          </>
        )}

        {page === "todos" && (
          <>
            <div className="mb-8">
              <h1 className="text-2xl tracking-tight">To-do</h1>
              <p className="text-sm mt-1" style={{ color: theme.textMuted }}>Quick checklist — money-related or not.</p>
            </div>

            <form onSubmit={addTodo} className="mb-6 flex gap-2">
              <input
                type="text"
                value={newTodoText}
                onChange={(e) => setNewTodoText(e.target.value)}
                placeholder="Add a task..."
                className="flex-1 text-base bg-transparent border-b-2 py-2"
                style={{ borderColor: theme.text }}
              />
              <button type="submit" className="px-4 py-2 rounded-sm text-sm" style={{ background: theme.accent, color: theme.accentText }}>
                Add
              </button>
            </form>

            {todos.length === 0 ? (
              <div className="text-sm py-8 text-center rounded-sm" style={{ color: theme.textFaint, border: "1px dashed #DCD4C0" }}>
                Nothing on your list yet.
              </div>
            ) : (
              <div className="space-y-2">
                {todos.map((t) => (
                  <div key={t.id} className="flex items-center gap-3 p-3 rounded-sm" style={{ background: theme.card, border: `1px solid ${theme.border}` }}>
                    <button
                      onClick={() => toggleTodo(t.id, t.done)}
                      className="w-5 h-5 rounded-sm flex-shrink-0 flex items-center justify-center"
                      style={{ border: `2px solid ${t.done ? theme.success : theme.text}`, background: t.done ? theme.success : "transparent" }}
                    >
                      {t.done && <span style={{ color: "#FFFDF9", fontSize: "12px" }}>✓</span>}
                    </button>
                    <span className="flex-1 text-sm" style={{ textDecoration: t.done ? "line-through" : "none", color: t.done ? theme.textFaint : theme.text }}>
                      {t.text}
                    </span>
                    <button onClick={() => deleteTodo(t.id)} className="text-xs px-1" style={{ color: theme.danger }}>✕</button>
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
              <p className="text-sm mt-1" style={{ color: theme.textMuted }}>Everything you've invested, tracked by type.</p>
            </div>

            <div className="mb-6 p-4 rounded-sm" style={{ background: theme.card, border: `1px solid ${theme.border}` }}>
              <div className="flex justify-between text-sm mb-1">
                <span style={{ color: theme.textMuted }}>Total current value</span>
                <span className="num text-lg" style={{ color: theme.accent }}>{symbol}{formatMoney(netWorthTotal)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span style={{ color: theme.textMuted }}>Invested {symbol}{formatMoney(investedTotal)}</span>
                <span className="num" style={{ color: overallGain >= 0 ? theme.success : theme.danger }}>
                  {overallGain >= 0 ? "+" : "-"}{symbol}{formatMoney(Math.abs(overallGain))} {investedTotal > 0 ? `(${((overallGain / investedTotal) * 100).toFixed(1)}%)` : ""}
                </span>
              </div>
            </div>

            {netWorthTotal > 0 && (
              <div className="mb-6 p-4 rounded-sm" style={{ background: theme.card, border: `1px solid ${theme.border}` }}>
                <h2 className="text-xs uppercase tracking-widest mb-3" style={{ color: theme.textMuted }}>What we own</h2>
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
                    <Tooltip formatter={(value, name) => [`${symbol}${formatMoney(value)} (${Math.round((value / netWorthTotal) * 100)}%)`, name]} />
                    <Legend layout="vertical" verticalAlign="middle" align="left" wrapperStyle={{ fontSize: "12px" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            <form onSubmit={addHolding} className="mb-8 p-4 rounded-sm space-y-2" style={{ background: theme.card, border: `1px solid ${theme.border}` }}>
              <div className="flex gap-2 flex-wrap">
                <select
                  value={newHolding.type}
                  onChange={(e) => setNewHolding({ ...newHolding, type: e.target.value })}
                  className="flex-1 min-w-[120px] text-sm bg-transparent border-b-2 py-2"
                  style={{ borderColor: theme.text }}
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
                    style={{ borderColor: theme.text }}
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
                  style={{ borderColor: theme.text }}
                />
                <input
                  type="text"
                  value={newHolding.name}
                  onChange={(e) => setNewHolding({ ...newHolding, name: e.target.value })}
                  placeholder="Name (e.g. Apple, S&P 500 ETF, Maybank FD)"
                  className="flex-1 text-sm bg-transparent border-b-2 py-2"
                  style={{ borderColor: theme.text }}
                />
              </div>
              <div className="flex gap-2 flex-wrap items-end">
                <div className="flex-1 min-w-[100px]">
                  <label className="block text-xs uppercase tracking-widest mb-1" style={{ color: theme.textMuted }}>Invested</label>
                  <div className="flex items-center">
                    <span className="mr-1">{symbol}</span>
                    <input type="number" min="0" step="0.01" value={newHolding.invested} onChange={(e) => setNewHolding({ ...newHolding, invested: e.target.value })}
                      className="w-full num bg-transparent border-b-2 py-1 text-sm" style={{ borderColor: theme.text }} />
                  </div>
                </div>
                <div className="flex-1 min-w-[100px]">
                  <label className="block text-xs uppercase tracking-widest mb-1" style={{ color: theme.textMuted }}>Current value</label>
                  <div className="flex items-center">
                    <span className="mr-1">{symbol}</span>
                    <input type="number" min="0" step="0.01" value={newHolding.currentValue} onChange={(e) => setNewHolding({ ...newHolding, currentValue: e.target.value })}
                      className="w-full num bg-transparent border-b-2 py-1 text-sm" style={{ borderColor: theme.text }} />
                  </div>
                </div>
                <button type="submit" className="px-4 py-2 rounded-sm text-sm" style={{ background: theme.accent, color: theme.accentText }}>
                  Add
                </button>
              </div>
            </form>

            {Object.keys(holdingsByType).length === 0 ? (
              <div className="text-sm py-8 text-center rounded-sm" style={{ color: theme.textFaint, border: "1px dashed #DCD4C0" }}>
                No holdings yet — add your first one above.
              </div>
            ) : (
              Object.entries(holdingsByType).map(([type, items]) => {
                const sectionTotal = items.reduce((a, h) => a + Number(h.current_value || 0), 0);
                return (
                  <div key={type} className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-xs uppercase tracking-widest" style={{ color: theme.textMuted }}>{type}</h3>
                      <span className="num text-xs" style={{ color: theme.textMuted }}>{symbol}{formatMoney(sectionTotal)}</span>
                    </div>
                    <div className="space-y-2">
                      {items.map((h) => {
                        const gain = Number(h.current_value || 0) - Number(h.invested || 0);
                        return (
                          <div key={h.id} className="p-3 rounded-sm" style={{ background: theme.card, border: `1px solid ${theme.border}` }}>
                            <div className="flex justify-between items-start mb-1">
                              <span className="text-sm font-medium">{h.ticker ? `${h.ticker} — ${h.name}` : h.name}</span>
                              <button onClick={() => deleteHolding(h.id)} className="text-xs px-1" style={{ color: theme.danger }}>✕</button>
                            </div>
                            <div className="flex justify-between text-xs mb-2">
                              <span style={{ color: theme.textMuted }}>Invested {symbol}{formatMoney(h.invested)}</span>
                              <span className="num" style={{ color: gain >= 0 ? theme.success : theme.danger }}>
                                {gain >= 0 ? "+" : "-"}{symbol}{formatMoney(Math.abs(gain))}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs" style={{ color: theme.textMuted }}>Current:</span>
                              <span className="text-xs">{symbol}</span>
                              <input
                                type="number"
                                step="0.01"
                                value={holdingEdits[h.id] ?? h.current_value}
                                onChange={(e) => setHoldingEdits({ ...holdingEdits, [h.id]: e.target.value })}
                                className="w-24 num bg-transparent border-b py-1 text-xs"
                                style={{ borderColor: theme.border }}
                              />
                              <button onClick={() => updateHoldingValue(h.id)} className="px-2 py-1 rounded-sm text-xs" style={{ background: theme.accent, color: theme.accentText }}>
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

        {page === "subscriptions" && (
          <>
            <div className="mb-6">
              <h1 className="text-2xl tracking-tight">Subscriptions</h1>
              <p className="text-sm mt-1" style={{ color: theme.textMuted }}>Bills, streaming, anything recurring.</p>
            </div>

            <div className="mb-6 p-4 rounded-sm" style={{ background: theme.card, border: `1px solid ${theme.border}` }}>
              <div className="flex justify-between text-sm">
                <span style={{ color: theme.textMuted }}>Total per month</span>
                <span className="num text-lg" style={{ color: theme.accent }}>{symbol}{formatMoney(totalMonthlySubs)}</span>
              </div>
              <div className="flex justify-between text-xs mt-1">
                <span style={{ color: theme.textFaint }}>Per year</span>
                <span className="num" style={{ color: theme.textFaint }}>{symbol}{formatMoney(totalMonthlySubs * 12)}</span>
              </div>
            </div>

            <form onSubmit={addSubscription} className="mb-8 p-4 rounded-sm space-y-2" style={{ background: theme.card, border: `1px solid ${theme.border}` }}>
              <input
                type="text"
                value={newSub.name}
                onChange={(e) => setNewSub({ ...newSub, name: e.target.value })}
                placeholder="Name (e.g. Spotify, Electricity bill)"
                className="w-full text-sm bg-transparent border-b-2 py-2"
                style={{ borderColor: theme.text }}
              />
              <div className="flex gap-2 flex-wrap items-end">
                <div className="flex-1 min-w-[90px]">
                  <label className="block text-xs uppercase tracking-widest mb-1" style={{ color: theme.textMuted }}>Cost</label>
                  <div className="flex items-center">
                    <span className="mr-1">{symbol}</span>
                    <input type="number" min="0" step="0.01" value={newSub.cost} onChange={(e) => setNewSub({ ...newSub, cost: e.target.value })}
                      className="w-full num bg-transparent border-b-2 py-1 text-sm" style={{ borderColor: theme.text }} />
                  </div>
                </div>
                <div className="flex-1 min-w-[100px]">
                  <label className="block text-xs uppercase tracking-widest mb-1" style={{ color: theme.textMuted }}>Cycle</label>
                  <select
                    value={newSub.cycle}
                    onChange={(e) => setNewSub({ ...newSub, cycle: e.target.value })}
                    className="w-full text-sm bg-transparent border-b-2 py-1"
                    style={{ borderColor: theme.text }}
                  >
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                <div className="flex-1 min-w-[130px]">
                  <label className="block text-xs uppercase tracking-widest mb-1" style={{ color: theme.textMuted }}>Next renewal</label>
                  <input
                    type="date"
                    value={newSub.renewal_date}
                    onChange={(e) => setNewSub({ ...newSub, renewal_date: e.target.value })}
                    className="w-full text-sm bg-transparent border-b-2 py-1"
                    style={{ borderColor: theme.text }}
                  />
                </div>
              </div>
              <input
                type="text"
                value={newSub.notes}
                onChange={(e) => setNewSub({ ...newSub, notes: e.target.value })}
                placeholder="Notes (optional)"
                className="w-full text-xs bg-transparent border-b py-1"
                style={{ borderColor: theme.border, color: theme.textMuted }}
              />
              <button type="submit" className="px-4 py-2 rounded-sm text-sm" style={{ background: theme.accent, color: theme.accentText }}>
                Add
              </button>
            </form>

            {activeSubsSorted.length === 0 && inactiveSubs.length === 0 ? (
              <div className="text-sm py-8 text-center rounded-sm" style={{ color: theme.textFaint, border: "1px dashed #DCD4C0" }}>
                No subscriptions yet — add your first one above.
              </div>
            ) : (
              <>
                <div className="space-y-2 mb-6">
                  {activeSubsSorted.map((s) => {
                    const days = daysUntil(s._next);
                    const soon = days <= 7;
                    return editingSubId === s.id ? (
                      <div key={s.id} className="p-3 rounded-sm space-y-2" style={{ background: theme.flashBg, border: `1px solid ${theme.border}` }}>
                        <input type="text" value={editSub.name} onChange={(e) => setEditSub({ ...editSub, name: e.target.value })}
                          className="w-full text-sm bg-transparent border-b-2 py-1" style={{ borderColor: theme.text }} />
                        <div className="flex gap-2 flex-wrap">
                          <input type="number" step="0.01" value={editSub.cost} onChange={(e) => setEditSub({ ...editSub, cost: e.target.value })}
                            className="flex-1 min-w-[80px] num bg-transparent border-b-2 py-1 text-sm" style={{ borderColor: theme.text }} />
                          <select value={editSub.cycle} onChange={(e) => setEditSub({ ...editSub, cycle: e.target.value })}
                            className="flex-1 min-w-[100px] text-sm bg-transparent border-b-2 py-1" style={{ borderColor: theme.text }}>
                            <option value="monthly">Monthly</option>
                            <option value="yearly">Yearly</option>
                          </select>
                          <input type="date" value={editSub.renewal_date} onChange={(e) => setEditSub({ ...editSub, renewal_date: e.target.value })}
                            className="flex-1 min-w-[130px] text-sm bg-transparent border-b-2 py-1" style={{ borderColor: theme.text }} />
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => saveEditSub(s.id)} className="px-3 py-1 rounded-sm text-xs" style={{ background: theme.accent, color: theme.accentText }}>Save</button>
                          <button onClick={() => setEditingSubId(null)} className="px-3 py-1 rounded-sm text-xs" style={{ border: "1px solid #2F4550", color: theme.accent }}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <div key={s.id} className="p-3 rounded-sm" style={{ background: theme.card, border: `1px solid ${soon ? theme.danger : theme.border}` }}>
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="text-sm font-medium">{s.name}</div>
                            <div className="text-xs" style={{ color: theme.textFaint }}>
                              {s.cycle === "monthly" ? "Monthly" : "Yearly"} · {s.notes}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="num text-sm">{symbol}{formatMoney(s.cost)}</div>
                            <div className="text-xs" style={{ color: soon ? theme.danger : theme.textFaint }}>
                              {days === 0 ? "renews today" : days === 1 ? "renews tomorrow" : `renews in ${days}d`}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-3 mt-2">
                          <button onClick={() => startEditSub(s)} className="text-xs underline" style={{ color: theme.accent }}>Edit</button>
                          <button onClick={() => toggleSubActive(s.id, s.active)} className="text-xs underline" style={{ color: theme.textMuted }}>Mark inactive</button>
                          <button onClick={() => deleteSubscription(s.id)} className="text-xs" style={{ color: theme.danger }}>✕</button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {inactiveSubs.length > 0 && (
                  <div>
                    <h3 className="text-xs uppercase tracking-widest mb-2" style={{ color: theme.textFaint }}>Inactive</h3>
                    <div className="space-y-2">
                      {inactiveSubs.map((s) => (
                        <div key={s.id} className="p-3 rounded-sm flex justify-between items-center" style={{ background: theme.bg, border: `1px solid ${theme.border}`, opacity: 0.7 }}>
                          <div>
                            <div className="text-sm" style={{ textDecoration: "line-through", color: theme.textFaint }}>{s.name}</div>
                            <div className="text-xs" style={{ color: theme.textFaint }}>{symbol}{formatMoney(s.cost)} · {s.cycle}</div>
                          </div>
                          <div className="flex gap-3">
                            <button onClick={() => toggleSubActive(s.id, s.active)} className="text-xs underline" style={{ color: theme.accent }}>Reactivate</button>
                            <button onClick={() => deleteSubscription(s.id)} className="text-xs" style={{ color: theme.danger }}>✕</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      <BottomNav page={page} setPage={setPage} theme={theme} />
    </div>
  );
}

/* ---------- Root: handles auth state ---------- */
export default function App() {
  const [session, setSession] = useState(undefined); // undefined = loading
  const [recovery, setRecovery] = useState(false);
  const [darkMode] = useState(() => typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
  const theme = darkMode ? THEMES.dark : THEMES.light;

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") setRecovery(true);
      setSession(session);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  if (session === undefined) {
    return (
      <div style={{ background: theme.bg, minHeight: "100vh" }} className="flex items-center justify-center">
        <div style={{ color: theme.accent, fontFamily: "Georgia, serif" }}>Loading…</div>
      </div>
    );
  }

  if (recovery) {
    return <SetNewPassword onDone={() => setRecovery(false)} theme={theme} />;
  }

  return session ? <Ledger userId={session.user.id} /> : <Login />;
}
