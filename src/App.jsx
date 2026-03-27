import { useState, useEffect } from "react";

// ── STUDY TOPIC ROTATION ─────────────────────────────────────────
// 6-week rotating schedule — each week focuses on one topic area
// Weeks repeat after 6 cycles so all topics get revisited
const STUDY_ROTATION = [
  {
    week: 1, topic: "SPARK INTERNALS",
    color: "#00FF41",
    items: [
      "DAG execution: stages, tasks, jobs — draw the flow",
      "Transformations vs Actions — lazy evaluation explained",
      "Shuffle operations — why they're expensive, how to minimise",
      "Partitioning: repartition() vs coalesce() — when to use each",
      "Broadcast joins — when and how, broadcast threshold config",
      "AQE (Adaptive Query Execution) — 3 optimisations it does",
      "Caching: cache() vs persist() vs DISK_ONLY — trade-offs",
    ],
  },
  {
    week: 2, topic: "DELTA LAKE & DATABRICKS",
    color: "#00D4FF",
    items: [
      "ACID transactions in Delta — how it works under the hood",
      "Time travel — RESTORE, VERSION AS OF, TIMESTAMP AS OF",
      "OPTIMIZE command — what it does, when to run it",
      "Z-ORDER clustering — how it works, best columns to Z-ORDER",
      "VACUUM — what it deletes, why RETAIN 168 HOURS default",
      "Schema evolution — mergeSchema, overwriteSchema options",
      "Unity Catalog — lineage, fine-grained access, 3-level namespace",
    ],
  },
  {
    week: 3, topic: "ML FUNDAMENTALS",
    color: "#CCFF00",
    items: [
      "Bias vs Variance trade-off — draw the curve, explain underfitting/overfitting",
      "Decision Trees — how splits work, Gini vs Entropy",
      "Random Forest — bagging, feature randomness, voting — explain simply",
      "Gradient Boosting — XGBoost, LightGBM — how boosting differs from bagging",
      "Regularisation — L1 (Lasso) vs L2 (Ridge) — what each penalises",
      "Cross-validation — K-Fold, Stratified K-Fold — why it matters",
      "Feature importance — how Random Forest calculates it",
    ],
  },
  {
    week: 4, topic: "ML EVALUATION & STATISTICS",
    color: "#FF6EC7",
    items: [
      "Confusion matrix — TP, TN, FP, FN — draw it from scratch",
      "Precision vs Recall — formula, when to prioritise each",
      "F1 Score — harmonic mean, when to use over accuracy",
      "ROC-AUC — what the curve shows, what AUC = 0.5 means",
      "Imbalanced datasets — SMOTE, class weights, undersampling",
      "Correlation vs Causation — 3 real examples of each",
      "Distributions — Normal, Skewed — mean vs median in each",
    ],
  },
  {
    week: 5, topic: "GENAI & LLM",
    color: "#BF5FFF",
    items: [
      "RAG pipeline end-to-end — draw the full architecture",
      "Chunking strategies — fixed, semantic, sliding window + overlap",
      "Embedding models — what they do, cosine similarity",
      "Vector search — HNSW indexing, ANN vs exact search",
      "LangGraph — nodes, edges, state, conditional routing",
      "LLM evaluation — RAGAS metrics: faithfulness, relevancy, recall",
      "Hallucination — causes and 3 ways to reduce it in production",
    ],
  },
  {
    week: 6, topic: "DATA ENGINEERING & SYSTEM DESIGN",
    color: "#FF9500",
    items: [
      "Medallion architecture — Bronze/Silver/Gold — what goes in each",
      "Lambda vs Kappa architecture — batch + streaming vs streaming only",
      "ETL vs ELT — when to transform before vs after loading",
      "Data quality — Great Expectations, Delta constraints, schema checks",
      "Idempotency — what it means, how to design idempotent pipelines",
      "Feature stores — what they are, online vs offline store",
      "SCD Type 1 vs Type 2 — slowly changing dimensions with examples",
    ],
  },
];

// Get today's study topic based on week number in the plan
function getTodayStudyTopic(weekId) {
  const weekNum = parseInt(weekId.replace("w", "")) || 1;
  const rotationIdx = (weekNum - 1) % STUDY_ROTATION.length;
  return STUDY_ROTATION[rotationIdx];
}

// ── HABITS CONFIG ────────────────────────────────────────────────
const HABITS = [
  { id: "leet1", label: "LeetCode Problem #1", cat: "LEETCODE", color: "#CCFF00", icon: "⌨" },
  { id: "leet2", label: "LeetCode Problem #2", cat: "LEETCODE", color: "#CCFF00", icon: "⌨" },
  { id: "study1", label: "Study Session 1 — 30 min (see topic below)", cat: "STUDY", color: "#00D4FF", icon: "📖" },
  { id: "study2", label: "Study Session 2 — 30 min (different item)", cat: "STUDY2", color: "#00D4FF", icon: "📗" },
  { id: "project", label: "Work on GitHub Project", cat: "PROJECT", color: "#00FF41", icon: "💻" },
  { id: "linkedin", label: "LinkedIn — Engage / Connect / Post", cat: "LINKEDIN", color: "#0096FF", icon: "🔗" },
  { id: "revise", label: "Revise 1 concept from yesterday", cat: "REVISE", color: "#BF5FFF", icon: "🔄" },
  { id: "mock", label: "Mock Interview / Practice Q&A (3x/week min)", cat: "MOCK", color: "#FF6EC7", icon: "🎤", targetPerWeek: 3 },
];

const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const FULL_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const monthNames = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];

// Generate weeks — start from Apr 1, 2026 (Wednesday), first week is partial (Wed–Sun)
function generateWeeks() {
  const weeks = [];
  // Apr 1 2026 is a Wednesday — Mon-based index: Wed=2
  const START = new Date(2026, 3, 1); // April 1
  const startDayOfWeek = START.getDay(); // 0=Sun ... 6=Sat
  const monBasedIdx = (startDayOfWeek + 6) % 7; // Wed → 2

  // First week: from Apr 1 to coming Sunday (partial — Wed, Thu, Fri, Sat, Sun)
  // Subsequent weeks: full Mon–Sun
  let weekStart = new Date(START);
  let weekNum = 1;

  // End date: Sep 30 2026
  const END = new Date(2026, 8, 30);

  while (weekStart <= END) {
    const days = [];
    // For week 1, start from Wednesday; for all others, start from Monday
    const startDayOffset = weekNum === 1 ? monBasedIdx : 0;

    for (let d = startDayOffset; d < 7; d++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + (d - startDayOffset));
      if (date > END) break;
      days.push({
        label: DAYS[d],
        full: FULL_DAYS[d],
        date: date.toISOString().split("T")[0],
        display: `${date.getDate()}/${date.getMonth() + 1}`,
      });
    }

    if (days.length > 0) {
      weeks.push({
        id: `w${weekNum}`,
        label: `Week ${weekNum}`,
        range: `${days[0].display} – ${days[days.length - 1].display}`,
        month: monthNames[new Date(days[0].date).getMonth()],
        days,
        partial: weekNum === 1,
      });
    }

    // Advance to next Monday
    const daysInThisWeek = 7 - startDayOffset;
    weekStart.setDate(weekStart.getDate() + daysInThisWeek);
    weekNum++;
  }

  return weeks;
}

const WEEKS = generateWeeks(); // Apr 1 → Sep 30 2026

// Group weeks by month
const MONTH_GROUPS = WEEKS.reduce((acc, w) => {
  if (!acc[w.month]) acc[w.month] = [];
  acc[w.month].push(w);
  return acc;
}, {});

const MONTHS_ORDER = ["MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP"];
const MONTH_COLORS = {
  MAR: "#00FF41",
  APR: "#00FF41",
  MAY: "#00D4FF",
  JUN: "#CCFF00",
  JUL: "#00D4FF",
  AUG: "#00FF41",
  SEP: "#CCFF00",
};

// ── CHECK IF WEEK IS COMPLETE ────────────────────────────────────
function isWeekComplete(weekId, checks) {
  const week = WEEKS.find(w => w.id === weekId);
  if (!week) return false;
  const daysInWeek = week.days.length; // handles partial weeks (e.g. week 1 = 5 days)
  for (const habit of HABITS) {
    if (habit.targetPerWeek) {
      // Scale target proportionally for partial weeks
      const scaledTarget = Math.min(habit.targetPerWeek, daysInWeek);
      const count = week.days.filter(d => checks[`${weekId}_${d.date}_${habit.id}`]).length;
      if (count < scaledTarget) return false;
    } else {
      // Must be checked every available day
      for (const day of week.days) {
        if (!checks[`${weekId}_${day.date}_${habit.id}`]) return false;
      }
    }
  }
  return true;
}

// ── STATS FOR WEEK ───────────────────────────────────────────────
function weekStats(weekId, checks) {
  const week = WEEKS.find(w => w.id === weekId);
  if (!week) return { total: 0, done: 0, pct: 0 };
  const daysInWeek = week.days.length;
  let total = 0, done = 0;
  for (const habit of HABITS) {
    const target = habit.targetPerWeek ? Math.min(habit.targetPerWeek, daysInWeek) : daysInWeek;
    total += target;
    done += Math.min(week.days.filter(d => checks[`${weekId}_${d.date}_${habit.id}`]).length, target);
  }
  return { total, done, pct: Math.round((done / total) * 100) };
}

// ── STREAK for a habit ───────────────────────────────────────────
function currentStreak(habitId, checks) {
  let streak = 0;
  const allDays = WEEKS.flatMap(w => w.days.map(d => ({ weekId: w.id, date: d.date })));
  const today = new Date().toISOString().split("T")[0];
  let idx = allDays.findIndex(d => d.date === today);
  if (idx === -1) idx = allDays.length - 1;
  for (let i = idx; i >= 0; i--) {
    const { weekId, date } = allDays[i];
    if (checks[`${weekId}_${date}_${habitId}`]) streak++;
    else break;
  }
  return streak;
}

export default function HabitTracker() {
  const [checks, setChecks] = useState({});
  const [activeMonth, setActiveMonth] = useState("MAR");
  const [activeWeek, setActiveWeek] = useState("w1");
  const [glitch, setGlitch] = useState(false);
  const [toast, setToast] = useState(null);
  const [notifPermission, setNotifPermission] = useState("default");
  const [notifInterval, setNotifInterval] = useState(2);
  const [quietStart, setQuietStart] = useState("22:00");
  const [quietEnd, setQuietEnd] = useState("08:00");
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [nextCheckIn, setNextCheckIn] = useState(null);
  const notifTimerRef = useState(null);

  // Load from storage
  useEffect(() => {
    (async () => {
      try {
        const res = await Promise.resolve({ value: localStorage.getItem("habit_checks") });
        if (res?.value) setChecks(JSON.parse(res.value));
        const notifRes = await Promise.resolve({ value: localStorage.getItem("notif_settings") });
        if (notifRes?.value) {
          const settings = JSON.parse(notifRes.value);
          setNotifInterval(settings.interval || 2);
          setQuietStart(settings.quietStart || "22:00");
          setQuietEnd(settings.quietEnd || "08:00");
          setNotifEnabled(settings.enabled || false);
        }
      } catch {}
      // Check current permission state
      if ("Notification" in window) {
        setNotifPermission(Notification.permission);
      }
    })();
  }, []);

  // Save to storage on change
  useEffect(() => {
    if (Object.keys(checks).length === 0) return;
    (async () => {
      try {
        await Promise.resolve(localStorage.setItem("habit_checks", JSON.stringify(checks)));
      } catch {}
    })();
  }, [checks]);

  // ── Interval-based notification checker ─────────────────────
  useEffect(() => {
    if (!notifEnabled || notifPermission !== "granted") return;
    if (notifTimerRef[0]) clearInterval(notifTimerRef[0]);

    const isQuietTime = () => {
      const now = new Date();
      const cur = now.getHours() * 60 + now.getMinutes();
      const [qsh, qsm] = quietStart.split(":").map(Number);
      const [qeh, qem] = quietEnd.split(":").map(Number);
      const qs = qsh * 60 + qsm;
      const qe = qeh * 60 + qem;
      // Handle overnight quiet period e.g. 22:00 → 08:00
      if (qs > qe) return cur >= qs || cur < qe;
      return cur >= qs && cur < qe;
    };

    const getPendingCount = () => {
      const today = new Date().toISOString().split("T")[0];
      const todayWeek = WEEKS.find(w => w.days.some(d => d.date === today));
      if (!todayWeek) return 0;
      return HABITS.filter(h => !checks[`${todayWeek.id}_${today}_${h.id}`]).length;
    };

    const getPendingNames = () => {
      const today = new Date().toISOString().split("T")[0];
      const todayWeek = WEEKS.find(w => w.days.some(d => d.date === today));
      if (!todayWeek) return [];
      return HABITS
        .filter(h => !checks[`${todayWeek.id}_${today}_${h.id}`])
        .map(h => h.cat);
    };

    const checkAndNotify = () => {
      if (isQuietTime()) return; // silent during quiet hours
      const pending = getPendingCount();
      if (pending > 0 && Notification.permission === "granted") {
        const names = getPendingNames().join(" · ");
        new Notification(`⚡ ${pending} habit${pending > 1 ? "s" : ""} still pending`, {
          body: `[ ${names} ]\nOpen tracker and get it done.`,
          tag: "daily-habits", // same tag = replaces previous notification, no spam
          renotify: true,
        });
      }
    };

    // Fire once immediately (unless quiet time), then on interval
    checkAndNotify();
    const intervalMs = notifInterval * 60 * 60 * 1000;
    notifTimerRef[0] = setInterval(checkAndNotify, intervalMs);

    // Countdown timer — update every minute so user can see "next check in X min"
    const countdown = setInterval(() => {
      setNextCheckIn(prev => {
        if (prev === null || prev <= 1) return notifInterval * 60;
        return prev - 1;
      });
    }, 60 * 1000);
    setNextCheckIn(notifInterval * 60);

    return () => {
      if (notifTimerRef[0]) clearInterval(notifTimerRef[0]);
      clearInterval(countdown);
    };
  }, [notifEnabled, notifInterval, quietStart, quietEnd, notifPermission, checks]);

  const requestNotifPermission = async () => {
    if (!("Notification" in window)) {
      showToast("Notifications not supported in this browser", "#FF3131");
      return;
    }
    const result = await Notification.requestPermission();
    setNotifPermission(result);
    if (result === "granted") {
      setNotifEnabled(true);
      await Promise.resolve(localStorage.setItem("notif_settings", JSON.stringify({
        interval: notifInterval, quietStart, quietEnd, enabled: true,
      }));
      showToast("✓ Notifications enabled!", "#00FF41");
      new Notification("⚡ Habit Tracker Active", {
        body: `Checking every ${notifInterval}h. Quiet hours: ${quietStart}–${quietEnd}. Let's go.`,
        tag: "daily-habits-test",
      });
    } else {
      showToast("Permission denied — enable in browser settings", "#FF3131");
    }
  };

  const saveNotifSettings = async () => {
    await Promise.resolve(localStorage.setItem("notif_settings", JSON.stringify({
      interval: notifInterval, quietStart, quietEnd, enabled: notifEnabled,
    }));
    showToast(`✓ Checking every ${notifInterval}h · Quiet: ${quietStart}–${quietEnd}`, "#00FF41");
    setShowNotifPanel(false);
  };

  const disableNotifs = async () => {
    setNotifEnabled(false);
    if (notifTimerRef[0]) clearInterval(notifTimerRef[0]);
    await Promise.resolve(localStorage.setItem("notif_settings", JSON.stringify({
      interval: notifInterval, quietStart, quietEnd, enabled: false,
    }));
    showToast("Notifications disabled", "#FF6EC7");
  };

  const toggle = (key, habitLabel) => {
    setChecks(prev => {
      const next = { ...prev, [key]: !prev[key] };
      return next;
    });
  };

  const showToast = (msg, color = "#00FF41") => {
    setToast({ msg, color });
    setTimeout(() => setToast(null), 2500);
  };

  const switchWeek = (wid) => {
    setGlitch(true);
    setTimeout(() => { setActiveWeek(wid); setGlitch(false); }, 150);
  };

  const switchMonth = (m) => {
    setActiveMonth(m);
    const firstWeek = MONTH_GROUPS[m]?.[0];
    if (firstWeek) switchWeek(firstWeek.id);
  };

  const week = WEEKS.find(w => w.id === activeWeek);
  const weekComplete = isWeekComplete(activeWeek, checks);
  const { total, done, pct } = weekStats(activeWeek, checks);
  const monthColor = MONTH_COLORS[activeMonth] || "#00FF41";

  // Overall all-time stats
  const totalAllTime = WEEKS.reduce((acc, w) => acc + weekStats(w.id, checks).done, 0);
  const maxAllTime = WEEKS.reduce((acc, w) => acc + weekStats(w.id, checks).total, 0);

  return (
    <div style={{
      background: "#010B01", minHeight: "100vh",
      fontFamily: "'Courier New', Courier, monospace",
      color: "#99BB99", position: "relative", overflow: "hidden",
    }}>
      {/* Scanlines */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,20,0,0.25) 2px, rgba(0,20,0,0.25) 3px)",
      }} />
      {/* Grid */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        backgroundImage: "linear-gradient(rgba(0,255,65,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,65,0.025) 1px, transparent 1px)",
        backgroundSize: "22px 22px",
      }} />

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: "70px", left: "50%", transform: "translateX(-50%)",
          background: "#000D00", border: `1px solid ${toast.color}`,
          color: toast.color, padding: "10px 20px", fontSize: "11px",
          fontWeight: "bold", zIndex: 999, letterSpacing: "1px",
          boxShadow: `0 0 20px ${toast.color}40`,
        }}>
          {toast.msg}
        </div>
      )}

      {/* Top Bar */}
      <div style={{
        background: "#001400", borderBottom: "1.5px solid #00FF41",
        padding: "10px 20px", position: "sticky", top: 0, zIndex: 100,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: "6px",
      }}>
        <div>
          <span style={{ color: "#00FF41", fontSize: "11px", fontWeight: "bold" }}>
            // DAILY_HABITS.exe
          </span>
          <span style={{ color: "#446644", fontSize: "9px", marginLeft: "10px" }}>
            [ACTIVE] &gt;&gt; MAR–SEP 2026 &gt;&gt; 27 WEEKS
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <div style={{ color: "#446644", fontSize: "9px" }}>
            ALL_TIME: {totalAllTime}/{maxAllTime} &nbsp;|&nbsp;
            <span style={{ color: "#00FF41" }}>
              {Math.round((totalAllTime / Math.max(maxAllTime, 1)) * 100)}% COMPLETE
            </span>
          </div>
          {/* Notification button */}
          <button
            onClick={() => setShowNotifPanel(p => !p)}
            style={{
              background: notifEnabled && notifPermission === "granted" ? "#001a00" : "#000D00",
              border: `1px solid ${notifEnabled && notifPermission === "granted" ? "#00FF41" : "#446644"}`,
              color: notifEnabled && notifPermission === "granted" ? "#00FF41" : "#446644",
              padding: "4px 10px", fontSize: "9px", fontWeight: "bold",
              fontFamily: "Courier New, monospace", cursor: "pointer",
              letterSpacing: "1px",
            }}
          >
            {notifEnabled && notifPermission === "granted"
              ? `🔔 EVERY ${notifInterval}H · NEXT: ${nextCheckIn !== null ? `${Math.floor(nextCheckIn / 60)}h ${nextCheckIn % 60}m` : "—"}`
              : "🔔 SET REMINDER"}
          </button>
        </div>
      </div>

      {/* Notification Panel */}
      {showNotifPanel && (
        <div style={{
          position: "sticky", top: "45px", zIndex: 99,
          background: "#000D00", borderBottom: "1px solid #00FF41",
          padding: "16px 20px",
        }}>
          <div style={{ color: "#00FF41", fontSize: "10px", fontWeight: "bold", letterSpacing: "1px", marginBottom: "12px" }}>
            // NOTIFICATION_CONFIG — checks every few hours, only fires if tasks are still pending
          </div>

          {notifPermission !== "granted" ? (
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              <span style={{ color: "#99BB99", fontSize: "9px" }}>
                Allow notifications → tracker checks your habits every 2–4 hours → alerts you only if something is pending.
              </span>
              <button onClick={requestNotifPermission} style={{
                background: "#00FF41", color: "#010B01", border: "none",
                padding: "7px 16px", fontSize: "9px", fontWeight: "bold",
                fontFamily: "Courier New, monospace", cursor: "pointer", letterSpacing: "1px",
              }}>
                ENABLE NOTIFICATIONS
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {/* Interval selector */}
              <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                <span style={{ color: "#446644", fontSize: "9px", minWidth: "130px" }}>CHECK EVERY:</span>
                <div style={{ display: "flex", gap: "6px" }}>
                  {[1, 2, 3, 4].map(h => (
                    <button key={h} onClick={() => setNotifInterval(h)} style={{
                      background: notifInterval === h ? "#00FF41" : "#001400",
                      color: notifInterval === h ? "#010B01" : "#00FF41",
                      border: `1px solid ${notifInterval === h ? "#00FF41" : "#1A3A1A"}`,
                      padding: "5px 12px", fontSize: "9px", fontWeight: "bold",
                      fontFamily: "Courier New, monospace", cursor: "pointer",
                      boxShadow: notifInterval === h ? "0 0 8px #00FF4160" : "none",
                    }}>
                      {h}H
                    </button>
                  ))}
                </div>
                <span style={{ color: "#446644", fontSize: "9px" }}>
                  → notifies only if pending habits exist
                </span>
              </div>

              {/* Quiet hours */}
              <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                <span style={{ color: "#446644", fontSize: "9px", minWidth: "130px" }}>QUIET HOURS:</span>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <input type="time" value={quietEnd}
                    onChange={e => setQuietEnd(e.target.value)}
                    style={{
                      background: "#001400", border: "1px solid #446644",
                      color: "#99BB99", padding: "4px 8px", fontSize: "9px",
                      fontFamily: "Courier New, monospace", outline: "none",
                    }}
                  />
                  <span style={{ color: "#446644", fontSize: "9px" }}>to</span>
                  <input type="time" value={quietStart}
                    onChange={e => setQuietStart(e.target.value)}
                    style={{
                      background: "#001400", border: "1px solid #446644",
                      color: "#99BB99", padding: "4px 8px", fontSize: "9px",
                      fontFamily: "Courier New, monospace", outline: "none",
                    }}
                  />
                  <span style={{ color: "#446644", fontSize: "9px" }}>— no pings during sleep</span>
                </div>
              </div>

              {/* Action buttons */}
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                <button onClick={saveNotifSettings} style={{
                  background: "#00FF41", color: "#010B01", border: "none",
                  padding: "6px 16px", fontSize: "9px", fontWeight: "bold",
                  fontFamily: "Courier New, monospace", cursor: "pointer", letterSpacing: "1px",
                }}>
                  SAVE & ACTIVATE
                </button>
                {notifEnabled && (
                  <button onClick={disableNotifs} style={{
                    background: "transparent", color: "#FF3131",
                    border: "1px solid #FF3131",
                    padding: "6px 14px", fontSize: "9px", fontWeight: "bold",
                    fontFamily: "Courier New, monospace", cursor: "pointer",
                  }}>
                    DISABLE
                  </button>
                )}
                <button onClick={() => setShowNotifPanel(false)} style={{
                  background: "transparent", color: "#446644",
                  border: "1px solid #1A3A1A",
                  padding: "6px 12px", fontSize: "9px",
                  fontFamily: "Courier New, monospace", cursor: "pointer",
                }}>
                  CLOSE
                </button>
                {notifEnabled && nextCheckIn !== null && (
                  <span style={{ color: "#446644", fontSize: "9px" }}>
                    ✓ Active · next check in {Math.floor(nextCheckIn / 60)}h {nextCheckIn % 60}m
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <div style={{ maxWidth: "920px", margin: "0 auto", padding: "20px 14px", position: "relative", zIndex: 1 }}>

        {/* Title */}
        <div style={{ marginBottom: "20px" }}>
          <div style={{ color: "#00FF41", fontSize: "10px", letterSpacing: "3px", marginBottom: "3px" }}>
            // HABIT_TRACKER // NISHITA_TIJARE
          </div>
          <div style={{ color: "#E8FFE8", fontSize: "20px", fontWeight: "bold" }}>
            Daily Execution Dashboard
          </div>
          <div style={{ color: "#99BB99", fontSize: "10px", marginTop: "2px" }}>
            Complete all daily habits &rarr; week auto-checks &rarr; ₹15 LPA unlocked
          </div>
        </div>

        {/* Streak Cards */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "20px" }}>
          {HABITS.map(h => {
            const streak = currentStreak(h.id, checks);
            return (
              <div key={h.id} style={{
                background: "#000D00", border: `1px solid ${streak > 0 ? h.color : "#1A3A1A"}`,
                padding: "8px 12px", flex: "1", minWidth: "100px",
                boxShadow: streak > 0 ? `0 0 8px ${h.color}30` : "none",
              }}>
                <div style={{ fontSize: "16px", marginBottom: "3px" }}>{h.icon}</div>
                <div style={{ color: h.color, fontSize: "20px", fontWeight: "bold", lineHeight: 1 }}>
                  {streak}
                </div>
                <div style={{ color: "#446644", fontSize: "8px", marginTop: "2px", letterSpacing: "0.5px" }}>
                  {h.cat}
                </div>
                <div style={{ color: "#99BB99", fontSize: "8px" }}>day streak</div>
              </div>
            );
          })}
        </div>

        {/* Month Tabs */}
        <div style={{ display: "flex", gap: "6px", marginBottom: "12px", flexWrap: "wrap" }}>
          {MONTHS_ORDER.map(m => {
            const mWeeks = MONTH_GROUPS[m] || [];
            const mDone = mWeeks.reduce((a, w) => a + weekStats(w.id, checks).done, 0);
            const mTotal = mWeeks.reduce((a, w) => a + weekStats(w.id, checks).total, 0);
            const mPct = Math.round((mDone / Math.max(mTotal, 1)) * 100);
            const isActive = m === activeMonth;
            const mc = MONTH_COLORS[m];
            return (
              <button key={m} onClick={() => switchMonth(m)} style={{
                background: isActive ? mc : "#001400",
                color: isActive ? "#010B01" : mc,
                border: `1px solid ${mc}`,
                padding: "5px 14px", fontSize: "10px", fontWeight: "bold",
                fontFamily: "Courier New, monospace", cursor: "pointer",
                letterSpacing: "1px",
              }}>
                {m} {mPct > 0 && <span style={{
                  marginLeft: "4px", fontSize: "9px",
                  background: isActive ? "#010B01" : mc,
                  color: isActive ? mc : "#010B01",
                  padding: "1px 4px", borderRadius: "2px",
                }}>{mPct}%</span>}
              </button>
            );
          })}
        </div>

        {/* Week Tabs */}
        <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", marginBottom: "16px" }}>
          {(MONTH_GROUPS[activeMonth] || []).map(w => {
            const complete = isWeekComplete(w.id, checks);
            const { pct: wp } = weekStats(w.id, checks);
            const isActive = w.id === activeWeek;
            return (
              <button key={w.id} onClick={() => switchWeek(w.id)} style={{
                background: complete ? monthColor : isActive ? "#001a00" : "#000D00",
                color: complete ? "#010B01" : isActive ? monthColor : "#446644",
                border: `1px solid ${complete ? monthColor : isActive ? monthColor : "#1A3A1A"}`,
                padding: "4px 10px", fontSize: "9px", fontWeight: "bold",
                fontFamily: "Courier New, monospace", cursor: "pointer",
                boxShadow: complete ? `0 0 8px ${monthColor}60` : "none",
                position: "relative",
              }}>
                {complete && <span style={{ marginRight: "4px" }}>✓</span>}
                {w.label}
                <span style={{ color: complete ? "#010B01" : "#446644", fontSize: "8px", marginLeft: "4px" }}>
                  {w.range}
                </span>
                {!complete && wp > 0 && (
                  <div style={{
                    position: "absolute", bottom: 0, left: 0,
                    width: `${wp}%`, height: "2px", background: monthColor,
                  }} />
                )}
              </button>
            );
          })}
        </div>

        {/* Week Status Banner */}
        <div style={{
          background: weekComplete ? "#001a00" : "#000D00",
          border: `1px solid ${weekComplete ? monthColor : "#1A3A1A"}`,
          borderLeft: `4px solid ${weekComplete ? monthColor : "#446644"}`,
          padding: "12px 16px", marginBottom: "16px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          flexWrap: "wrap", gap: "8px",
          boxShadow: weekComplete ? `0 0 16px ${monthColor}40` : "none",
          opacity: glitch ? 0.1 : 1, transition: "opacity 0.15s",
        }}>
          <div>
            <div style={{ color: weekComplete ? monthColor : "#E8FFE8", fontSize: "13px", fontWeight: "bold" }}>
              {weekComplete ? "✓ WEEK COMPLETE — CHECKBOX AUTO-CHECKED" : `[ ${week?.label} ] // ${week?.range}`}
            </div>
            <div style={{ color: "#446644", fontSize: "9px", marginTop: "2px" }}>
              {weekComplete
                ? "All habits met for this week. Weekly task in your monthly plan is now checked."
                : `${done}/${total} habit-days complete this week${week?.partial ? " — partial week (Fri–Sun)" : ""}`}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: weekComplete ? monthColor : "#E8FFE8", fontSize: "24px", fontWeight: "bold" }}>
              {pct}%
            </div>
            <div style={{
              width: "80px", height: "5px", background: "#001400",
              marginTop: "4px", marginLeft: "auto",
            }}>
              <div style={{
                width: `${pct}%`, height: "100%", background: monthColor,
                transition: "width 0.4s", boxShadow: pct > 0 ? `0 0 6px ${monthColor}` : "none",
              }} />
            </div>
          </div>
        </div>

        {/* Study Topic Panel */}
        {(() => {
          const topic = getTodayStudyTopic(activeWeek);
          return (
            <div style={{
              background: "#000D00",
              border: `1px solid ${topic.color}`,
              borderLeft: `4px solid ${topic.color}`,
              padding: "14px 16px", marginBottom: "16px",
              boxShadow: `0 0 12px ${topic.color}20`,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "8px", marginBottom: "10px" }}>
                <div>
                  <div style={{ color: "#446644", fontSize: "8px", letterSpacing: "2px", marginBottom: "3px" }}>
                    // THIS WEEK'S STUDY TOPIC
                  </div>
                  <div style={{ color: topic.color, fontSize: "14px", fontWeight: "bold" }}>
                    [ {topic.topic} ]
                  </div>
                </div>
                <div style={{
                  background: `${topic.color}20`, border: `1px solid ${topic.color}`,
                  padding: "3px 10px", fontSize: "8px", color: topic.color,
                  fontWeight: "bold", letterSpacing: "1px",
                }}>
                  WEEK {((parseInt(activeWeek.replace("w",""))-1) % 6) + 1} OF 6
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                {topic.items.map((item, i) => (
                  <div key={i} style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                    <span style={{ color: topic.color, fontSize: "9px", flexShrink: 0, marginTop: "1px" }}>
                      {String(i + 1).padStart(2, "0")}.
                    </span>
                    <span style={{ color: "#99BB99", fontSize: "9px", lineHeight: "1.5" }}>
                      {item}
                    </span>
                  </div>
                ))}
              </div>
              <div style={{ color: "#446644", fontSize: "8px", marginTop: "10px", borderTop: "1px solid #1A3A1A", paddingTop: "8px" }}>
                Cover 1–2 items per study session · Revisit yesterday's item first · All 6 topics rotate every 6 weeks
              </div>
            </div>
          );
        })()}

        {/* Daily Grid */}
        <div style={{ opacity: glitch ? 0 : 1, transition: "opacity 0.15s" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "600px" }}>
              <thead>
                <tr>
                  <th style={{
                    textAlign: "left", padding: "8px 10px", color: "#446644",
                    fontSize: "9px", borderBottom: "1px solid #1A3A1A",
                    fontFamily: "Courier New", fontWeight: "bold", width: "200px",
                    letterSpacing: "1px",
                  }}>HABIT</th>
                  {week?.days.map(d => (
                    <th key={d.date} style={{
                      textAlign: "center", padding: "6px 4px",
                      color: "#446644", fontSize: "9px",
                      borderBottom: "1px solid #1A3A1A",
                      fontFamily: "Courier New", fontWeight: "bold",
                    }}>
                      <div style={{ color: monthColor }}>{d.label}</div>
                      <div style={{ color: "#446644", fontSize: "8px" }}>{d.display}</div>
                    </th>
                  ))}
                  <th style={{
                    textAlign: "center", padding: "6px 8px",
                    color: "#446644", fontSize: "9px",
                    borderBottom: "1px solid #1A3A1A",
                    fontFamily: "Courier New", fontWeight: "bold",
                  }}>DONE</th>
                </tr>
              </thead>
              <tbody>
                {HABITS.map((habit, hi) => {
                  const daysInWeek = week?.days.length || 7;
                  const weekChecked = week?.days.filter(d => checks[`${activeWeek}_${d.date}_${habit.id}`]).length || 0;
                  const target = habit.targetPerWeek ? Math.min(habit.targetPerWeek, daysInWeek) : daysInWeek;
                  const habitComplete = weekChecked >= target;
                  return (
                    <tr key={habit.id} style={{
                      background: hi % 2 === 0 ? "#000D00" : "#050F05",
                      borderBottom: "1px solid #0A1A0A",
                    }}>
                      {/* Habit label */}
                      <td style={{ padding: "8px 10px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span style={{ fontSize: "13px" }}>{habit.icon}</span>
                          <div>
                            <div style={{
                              color: habitComplete ? habit.color : "#E8FFE8",
                              fontSize: "9px", fontWeight: "bold",
                              textDecoration: habitComplete ? "none" : "none",
                            }}>
                              {habit.label}
                            </div>
                            <div style={{ color: habit.color, fontSize: "8px", letterSpacing: "1px" }}>
                              [{habit.cat}]{habit.targetPerWeek ? ` — ${habit.targetPerWeek}x/wk` : ""}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Day checkboxes */}
                      {week?.days.map(d => {
                        const key = `${activeWeek}_${d.date}_${habit.id}`;
                        const isDone = !!checks[key];
                        return (
                          <td key={d.date} style={{ textAlign: "center", padding: "6px 4px" }}>
                            <div
                              onClick={() => toggle(key, habit.label)}
                              style={{
                                width: "22px", height: "22px", margin: "0 auto",
                                border: `1.5px solid ${isDone ? habit.color : "#1A3A1A"}`,
                                background: isDone ? habit.color : "transparent",
                                cursor: "pointer",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                transition: "all 0.15s",
                                boxShadow: isDone ? `0 0 6px ${habit.color}80` : "none",
                              }}
                            >
                              {isDone && (
                                <span style={{ color: "#010B01", fontSize: "12px", fontWeight: "bold", lineHeight: 1 }}>✓</span>
                              )}
                            </div>
                          </td>
                        );
                      })}

                      {/* Done count */}
                      <td style={{ textAlign: "center", padding: "6px 8px" }}>
                        <span style={{
                          color: habitComplete ? habit.color : "#446644",
                          fontSize: "10px", fontWeight: "bold",
                          background: habitComplete ? `${habit.color}15` : "transparent",
                          padding: "2px 6px", borderRadius: "2px",
                          border: habitComplete ? `1px solid ${habit.color}60` : "1px solid transparent",
                        }}>
                          {weekChecked}/{target}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Day completion summary */}
          <div style={{ marginTop: "12px", display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {week?.days.map(d => {
              const dayDone = HABITS.filter(h => checks[`${activeWeek}_${d.date}_${h.id}`]).length;
              const dayPct = Math.round((dayDone / HABITS.length) * 100);
              const perfect = dayDone === HABITS.length;
              return (
                <div key={d.date} style={{
                  flex: 1, minWidth: "60px",
                  background: perfect ? "#001a00" : "#000D00",
                  border: `1px solid ${perfect ? monthColor : "#1A3A1A"}`,
                  padding: "8px 6px", textAlign: "center",
                  boxShadow: perfect ? `0 0 8px ${monthColor}40` : "none",
                }}>
                  <div style={{ color: perfect ? monthColor : "#446644", fontSize: "9px", fontWeight: "bold" }}>
                    {d.label}
                  </div>
                  <div style={{ color: perfect ? monthColor : "#E8FFE8", fontSize: "14px", fontWeight: "bold", margin: "4px 0 2px" }}>
                    {perfect ? "✓" : `${dayPct}%`}
                  </div>
                  <div style={{ background: "#001400", height: "3px", margin: "0 4px" }}>
                    <div style={{
                      width: `${dayPct}%`, height: "100%",
                      background: perfect ? monthColor : "#446644",
                      transition: "width 0.3s",
                    }} />
                  </div>
                  <div style={{ color: "#446644", fontSize: "8px", marginTop: "3px" }}>
                    {dayDone}/{HABITS.length}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div style={{
          marginTop: "20px", background: "#000D00",
          border: "1px solid #1A3A1A", padding: "12px 16px",
        }}>
          <div style={{ color: "#446644", fontSize: "9px", letterSpacing: "2px", marginBottom: "8px" }}>
            // HOW IT WORKS
          </div>
          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
            {[
              { color: "#00FF41", text: "Tick each habit daily by clicking the cell" },
              { color: "#CCFF00", text: "Mock interviews need 3x/week minimum" },
              { color: "#00D4FF", text: "Week auto-completes when all targets hit" },
              { color: "#FF6EC7", text: "Streaks track consecutive days — keep them alive!" },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{ width: "8px", height: "8px", background: item.color, flexShrink: 0 }} />
                <span style={{ color: "#99BB99", fontSize: "9px" }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* All weeks heatmap */}
        <div style={{ marginTop: "16px", background: "#000D00", border: "1px solid #1A3A1A", padding: "14px 16px" }}>
          <div style={{ color: "#446644", fontSize: "9px", letterSpacing: "2px", marginBottom: "10px" }}>
            // ALL_WEEKS_HEATMAP // MAR–SEP 2026
          </div>
          <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
            {WEEKS.map(w => {
              const { pct: wp } = weekStats(w.id, checks);
              const complete = isWeekComplete(w.id, checks);
              const wColor = MONTH_COLORS[w.month] || "#00FF41";
              const opacity = wp === 0 ? 0.15 : wp < 50 ? 0.4 : wp < 100 ? 0.7 : 1;
              return (
                <div
                  key={w.id}
                  onClick={() => { switchMonth(w.month); switchWeek(w.id); }}
                  title={`${w.label} (${w.range}) — ${wp}%`}
                  style={{
                    width: "22px", height: "22px",
                    background: wp > 0 ? wColor : "#001400",
                    opacity,
                    cursor: "pointer",
                    border: complete ? `1px solid ${wColor}` : "1px solid transparent",
                    boxShadow: complete ? `0 0 5px ${wColor}80` : "none",
                    transition: "all 0.2s",
                    position: "relative",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  {complete && <span style={{ fontSize: "10px", color: "#010B01", fontWeight: "bold" }}>✓</span>}
                </div>
              );
            })}
          </div>
          <div style={{ color: "#446644", fontSize: "8px", marginTop: "8px" }}>
            Each square = 1 week. Darker = more complete. ✓ = week fully done. Click to jump to week.
          </div>
        </div>

        {/* Footer */}
        <div style={{ color: "#446644", fontSize: "9px", marginTop: "14px", textAlign: "center" }}>
          // NISHITA_TIJARE // DAILY_HABITS.exe // STATUS: IN_PROGRESS // TARGET: OCT 2026
        </div>
      </div>
    </div>
  );
}
