"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "../lib/api";

type Task = {
  id: number;
  title: string;
  completed: boolean;
  visible: boolean;
};

type GoalType = "milestone" | "recurring";
type GoalFrequency = "daily" | "weekly";
type TrackingMode = "quantity" | "completion";
type ApiProgressHistory = {
  id: string;
  progress: number;
  createdAt: string;
};

type Goal = {
  id: string;
  title: string;
  area: string;
  type: GoalType;
  frequency: GoalFrequency | null;
  targetDate: string;
  progress: number;
  trackingMode: TrackingMode | null;
  trackingRecords: ApiTracking[];
  progressHistory: ApiProgressHistory[];
  dailyTarget: number | null;
  unit: string;
  dailyAmount: number;
  dailyCompleted: boolean;
};

type ApiTracking = {
  id: string;
  periodStart: string;
  amount: number;
  completed: boolean;
};

type ApiHabitEntry = {
  id: string;
  entryDate: string;
  completed: boolean;
};

type ApiHabit = {
  id: string;
  entries: ApiHabitEntry[];
};

type ApiHabitResponse = {
  data: ApiHabit[];
};

type ApiGoal = {
  id: string;
  title: string;
  description: string | null;
  status: "ACTIVE" | "COMPLETED" | "PAUSED";
  area: string;
  type: "MILESTONE" | "RECURRING";
  frequency: "DAILY" | "WEEKLY" | null;
  targetDate: string | null;
  progress: number;
  trackingMode: "QUANTITY" | "COMPLETION" | null;
  dailyTarget: number | null;
  unit: string | null;
  trackingRecords: ApiTracking[];
  progressHistory: ApiProgressHistory[];
};

const initialTasks: Task[] = [
  { id: 1, title: "Complete one focused study session", completed: false, visible: true },
  { id: 2, title: "Finish today's workout", completed: false, visible: true },
  { id: 3, title: "Review daily goals", completed: false, visible: true },
];

// Define the life areas AVIA can track.
const areas = [
  { name: "Fitness", color: "#8be0ad" },
  { name: "Learning", color: "#8cbcff" },
  { name: "Nutrition", color: "#e9c77b" },
  { name: "Habits", color: "#c1a5ff" },
  { name: "Career", color: "#8cbcff" },
  { name: "Relationships", color: "#c1a5ff" },
  { name: "Recovery", color: "#8be0ad" },
];

const goalAreas = [
  "Fitness",
  "Learning",
  "Nutrition",
  "Habits",
  "Career",
  "Relationships",
  "Recovery",
];

function isCurrentPeriod(
  periodStart: string,
  frequency: "DAILY" | "WEEKLY" | null,
): boolean {
  if (!frequency) return false;

  const now = new Date();
  const start = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );

  if (frequency === "WEEKLY") {
    const day = start.getUTCDay();
    start.setUTCDate(start.getUTCDate() - ((day + 6) % 7));
  }

  return new Date(periodStart).getTime() === start.getTime();
}

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [completed, setCompleted] = useState<number[]>([]);
  const [focus, setFocus] = useState("Today");
  const [newTask, setNewTask] = useState("");
  const [showManager, setShowManager] = useState(false);
  const [priorityGoalId, setPriorityGoalId] = useState("");

  // Goals management state
  const [goals, setGoals] = useState<Goal[]>([]);
  const [goalsLoading, setGoalsLoading] = useState(true);
  const [goalError, setGoalError] = useState("");
  const [habitEntries, setHabitEntries] = useState<ApiHabitEntry[]>([]);
  const [habitsLoading, setHabitsLoading] = useState(true);
  const [habitsError, setHabitsError] = useState("");
  const [newGoal, setNewGoal] = useState("");
  const [goalArea, setGoalArea] = useState("Learning");
  const [goalType, setGoalType] = useState<GoalType>("milestone");
  const [goalFrequency, setGoalFrequency] =
    useState<GoalFrequency>("daily");
  const [goalDate, setGoalDate] = useState("");
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [trackingMode, setTrackingMode] =
    useState<TrackingMode>("quantity");
  const [dailyTarget, setDailyTarget] = useState("100");
  const [goalUnit, setGoalUnit] = useState("g");
  const visibleTasks = tasks.filter((task) => task.visible);
  const completedCount = visibleTasks.filter((task) =>
    completed.includes(task.id)
  ).length;
  const completedGoals = goals.filter((goal) => goal.progress === 100).length;
  const activeGoals = goals.filter((goal) => goal.progress < 100).length;

  // Load saved goals and their current tracking records.
  useEffect(() => {
    let cancelled = false;

    async function loadGoals() {
      try {
        const response = await apiRequest<{ data: ApiGoal[] }>(
          "/goals?page=1&limit=50"
        );

        if (cancelled) return;

        setGoals(
          response.data.map((goal) => {
            const record = goal.trackingRecords?.find((item) =>
              isCurrentPeriod(item.periodStart, goal.frequency)
            );

            return {
              id: goal.id,
              title: goal.title,
              area: goal.area,
              type: goal.type === "RECURRING" ? "recurring" : "milestone",
              frequency:
                goal.frequency === "WEEKLY"
                  ? "weekly"
                  : goal.frequency === "DAILY"
                    ? "daily"
                    : null,
              targetDate: goal.targetDate?.slice(0, 10) ?? "",
              progress:
                goal.type === "MILESTONE"
                  ? goal.progress
                  : goal.trackingMode === "QUANTITY" && goal.dailyTarget
                    ? Math.min(
                        100,
                        Math.round(
                          ((record?.amount ?? 0) / goal.dailyTarget) * 100
                        )
                      )
                    : record?.completed
                      ? 100
                      : 0,
              trackingMode:
                goal.trackingMode === "QUANTITY"
                  ? "quantity"
                  : goal.trackingMode === "COMPLETION"
                    ? "completion"
                    : null,
              dailyTarget: goal.dailyTarget,
              unit: goal.unit ?? "",
              dailyAmount: record?.amount ?? 0,
              dailyCompleted: record?.completed ?? false,
              progressHistory: goal.progressHistory ?? [],
              trackingRecords: goal.trackingRecords ?? [],
            };
          })
        );

        setGoalError("");
      } catch (error) {
        if (!cancelled) {
          setGoalError(
            error instanceof Error ? error.message : "Failed to load goals."
          );
        }
      } finally {
        if (!cancelled) {
          setGoalsLoading(false);
        }
      }
    }

    void loadGoals();

    return () => {
      cancelled = true;
    };
  }, []);

  // Load saved habit check-ins for weekly consistency insights.
  useEffect(() => {
    let cancelled = false;

    async function loadHabitEntries() {
      try {
        const response = await apiRequest<ApiHabitResponse>("/habits");

        if (cancelled) return;

        setHabitEntries(
          response.data.flatMap((habit) => habit.entries)
        );
        setHabitsError("");
      } catch {
        if (!cancelled) {
          setHabitsError("Habit history is currently unavailable.");
        }
      } finally {
        if (!cancelled) {
          setHabitsLoading(false);
        }
      }
    }

    void loadHabitEntries();

    return () => {
      cancelled = true;
    };
  }, []);

  // Calculate progress using the goals assigned to each life area.
  const trackedAreas = areas.map((area) => {
    const areaGoals = goals.filter((goal) => goal.area === area.name);

    const score =
      areaGoals.length > 0
        ? Math.round(
            areaGoals.reduce((total, goal) => total + goal.progress, 0) /
              areaGoals.length
          )
        : null;

    const completedCount = areaGoals.filter(
      (goal) => goal.progress === 100
    ).length;

    return {
      ...area,
      score,
      goalCount: areaGoals.length,
      completedCount,
    };
  });

  // Average only the areas that have goals.
  const trackedScores = trackedAreas
    .map((area) => area.score)
    .filter((score): score is number => score !== null);

  const balanceScore =
    trackedScores.length > 0
      ? Math.round(
          trackedScores.reduce((total, score) => total + score, 0) /
            trackedScores.length
        )
      : null;

  // Generate an insight from actual goal progress across life areas.
  const balanceInsight = (() => {
    if (goalsLoading) {
      return "Reviewing your current goal progress...";
    }

    if (goalError) {
      return "Your goal data could not be fully loaded. Try again before drawing conclusions.";
    }

    if (goals.length === 0) {
      return "Start with one meaningful goal to begin understanding your life balance.";
    }

    const areasWithGoals = trackedAreas.filter(
      (area) => area.score !== null
    );

    if (areasWithGoals.length === 0) {
      return "Add goals to your life areas to identify where your attention is going.";
    }

    if (goals.every((goal) => goal.progress === 100)) {
      return "All your current goals show 100% progress. Consider reviewing them and choosing your next meaningful milestones.";
    }

    const lowestArea = areasWithGoals.reduce((lowest, area) =>
      area.score! < lowest.score! ? area : lowest
    );

    const highestArea = areasWithGoals.reduce((highest, area) =>
      area.score! > highest.score! ? area : highest
    );

    const progressGap = highestArea.score! - lowestArea.score!;

    if (progressGap >= 40 && lowestArea.name !== highestArea.name) {
      return `Your goal progress is uneven: ${highestArea.name} is at ${highestArea.score}%, while ${lowestArea.name} is at ${lowestArea.score}%. Consider whether ${lowestArea.name} deserves more attention this week.`;
    }

    if (lowestArea.score! < 40) {
      return `${lowestArea.name} has ${lowestArea.score}% average goal progress. Choose one small, achievable next step to build momentum in this area.`;
    }

    if (balanceScore !== null && balanceScore >= 75) {
      return "Your tracked goals are progressing well overall. Review your priorities to maintain momentum without overloading your schedule.";
    }

    return "Your progress is developing across your tracked areas. Choose a manageable next step and review your priorities regularly.";
  })();

  // Recommend one manageable action for the lowest-progress life area.
  const balanceRecommendation = (() => {
    const areasWithGoals = trackedAreas.filter(
      (area) => area.score !== null
    );

    if (goalsLoading || goalError || areasWithGoals.length === 0) {
      return null;
    }

    const lowestArea = [...areasWithGoals].sort(
      (a, b) => a.score! - b.score!
    )[0];

    const actions: Record<string, string> = {
      Fitness: "Schedule one manageable workout or movement session.",
      Learning: "Complete one focused learning session without distractions.",
      Nutrition: "Plan one balanced meal that fits your routine.",
      Habits: "Choose one small habit and complete its next check-in.",
      Career: "Make one concrete step on a project or career skill.",
      Relationships: "Set aside a little time for a meaningful conversation.",
      Recovery: "Protect time for rest and a consistent bedtime.",
    };

    return {
      area: lowestArea.name,
      score: lowestArea.score,
      action:
        actions[lowestArea.name] ??
        `Choose one manageable action for ${lowestArea.name}.`,
    };
  })();

// Compare completed habit check-ins across two Monday-to-Sunday periods.
const weeklyConsistency = (() => {
  if (habitsLoading) {
    return {
      message: "Reviewing your recent habit activity...",
      change: null as number | null,
    };
  }

  if (habitsError) {
    return {
      message: habitsError,
      change: null as number | null,
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const currentWeekStart = new Date(today);
  currentWeekStart.setDate(
    today.getDate() - ((today.getDay() + 6) % 7),
  );

  const previousWeekStart = new Date(currentWeekStart);
  previousWeekStart.setDate(currentWeekStart.getDate() - 7);

  const countCompleted = (start: Date, end: Date) =>
    habitEntries.filter((entry) => {
      if (!entry.completed) return false;

      const date = new Date(entry.entryDate);

      return date >= start && date < end;
    }).length;

  const currentWeekEnd = new Date(today);
  currentWeekEnd.setDate(today.getDate() + 1);

  const currentCount = countCompleted(
    currentWeekStart,
    currentWeekEnd,
  );

  const previousCount = countCompleted(
    previousWeekStart,
    currentWeekStart,
  );

  if (previousCount === 0 && currentCount === 0) {
    return {
      message: "Complete a habit check-in to begin tracking weekly consistency.",
      change: null as number | null,
    };
  }

  if (previousCount === 0) {
    return {
      message: `You've recorded ${currentCount} completed check-ins this week. Complete check-ins in another week to establish a comparison.`,
      change: null as number | null,
    };
  }

  const change = Math.round(
    ((currentCount - previousCount) / previousCount) * 100,
  );

  if (change > 0) {
    return {
      message: `You've recorded ${currentCount} completed check-ins so far this week, compared with ${previousCount} last week.`,
      change,
    };
  }

  if (change < 0) {
    return {
      message: `You've recorded ${currentCount} completed check-ins so far this week, compared with ${previousCount} last week. Consider whether your current routine remains realistic.`,
      change,
    };
  }

  return {
    message: `Your completed check-ins are currently matching last week's total of ${previousCount}.`,
    change,
  };
})();

// Summarize recent tracking activity for each goal.
  const goalMomentum = goals.map((goal) => {
    const latestRecord = [...goal.trackingRecords].sort(
      (a, b) =>
        new Date(b.periodStart).getTime() -
        new Date(a.periodStart).getTime()
    )[0];

    const daysSinceUpdate = latestRecord
      ? Math.floor(
          (Date.now() - new Date(latestRecord.periodStart).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : null;

    let status:
      | "Just started"
      | "Making progress"
      | "Needs a check-in"
      | "Deadline approaching"
      | "Overdue";

    let message: string;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const deadline = goal.targetDate
      ? new Date(`${goal.targetDate.slice(0, 10)}T00:00:00`)
      : null;

    const daysUntilDeadline = deadline
      ? Math.round(
          (deadline.getTime() - today.getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : null;

    if (goal.type === "milestone" && goal.progress >= 100) {
      status = "Making progress";
      message = "This milestone is complete. Celebrate the win!";
    } else if (
      goal.type === "milestone" &&
      daysUntilDeadline !== null &&
      daysUntilDeadline < 0
    ) {
      status = "Overdue";
      message = `This goal passed its target date ${Math.abs(
        daysUntilDeadline
      )} day${Math.abs(daysUntilDeadline) === 1 ? "" : "s"} ago. Review your plan and choose a realistic next step.`;
    } else if (
      goal.type === "milestone" &&
      daysUntilDeadline !== null &&
      daysUntilDeadline <= 3
    ) {
      status = "Deadline approaching";
      message =
        daysUntilDeadline === 0
          ? "This goal is due today. Focus on the most important remaining step."
          : `This goal is due in ${daysUntilDeadline} day${daysUntilDeadline === 1 ? "" : "s"}. Prioritize the remaining work.`;
    } else if (!latestRecord) {
      status = "Just started";
      message = "Record your first check-in to establish a baseline.";
    } else if (daysSinceUpdate !== null && daysSinceUpdate > 7) {
      status = "Needs a check-in";
      message = "There hasn't been a recorded update in over a week.";
    } else {
      status = "Making progress";
      message = "Your goal has recent tracking activity. Keep it going.";
    }

    return {
      id: goal.id,
      title: goal.title,
      status,
      message,
    };
  });

  // Calculate the data displayed in the weekly goal review.
  const weeklyGoalReview = (() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - ((today.getDay() + 6) % 7));

    const milestoneGoals = goals.filter(
      (goal) => goal.type === "milestone"
    );

    const goalsAdvanced = milestoneGoals.flatMap((goal) => {
      const history = [...goal.progressHistory].sort(
        (a, b) =>
          new Date(a.createdAt).getTime() -
          new Date(b.createdAt).getTime()
      );

      const thisWeek = history.filter(
        (entry) => new Date(entry.createdAt) >= weekStart
      );

      if (thisWeek.length === 0) return [];

      const previousEntries = history.filter(
        (entry) => new Date(entry.createdAt) < weekStart
      );

      const baseline =
        previousEntries.length > 0
          ? previousEntries[previousEntries.length - 1].progress
          : 0;

      const latestProgress = thisWeek[thisWeek.length - 1].progress;
      const progressMade = Math.max(0, latestProgress - baseline);

      return progressMade > 0
        ? [{ id: goal.id, title: goal.title, progressMade }]
        : [];
    });

    const completedThisWeek = milestoneGoals.filter((goal) => {
      const history = [...goal.progressHistory].sort(
        (a, b) =>
          new Date(a.createdAt).getTime() -
          new Date(b.createdAt).getTime()
      );

      const thisWeek = history.filter(
        (entry) => new Date(entry.createdAt) >= weekStart
      );

      const previousEntries = history.filter(
        (entry) => new Date(entry.createdAt) < weekStart
      );

      const previousProgress =
        previousEntries.length > 0
          ? previousEntries[previousEntries.length - 1].progress
          : 0;

      return (
        previousProgress < 100 &&
        thisWeek.some((entry) => entry.progress === 100)
      );
    });

    const overdueGoals = goals.filter((goal) => {
      if (
        goal.type !== "milestone" ||
        goal.progress >= 100 ||
        !goal.targetDate
      ) {
        return false;
      }

      return new Date(`${goal.targetDate.slice(0, 10)}T00:00:00`) < today;
    });

    const stalledGoals = goals.filter((goal) => {
      if (goal.progress >= 100) return false;

      const latestHistory = [...goal.progressHistory].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime()
      )[0];

      const latestTracking = [...goal.trackingRecords].sort(
        (a, b) =>
          new Date(b.periodStart).getTime() -
          new Date(a.periodStart).getTime()
      )[0];

      const lastUpdate =
        latestHistory?.createdAt ?? latestTracking?.periodStart;

      return (
        !lastUpdate ||
        today.getTime() - new Date(lastUpdate).getTime() >
          7 * 24 * 60 * 60 * 1000
      );
    });

    const suggestedPriority =
      overdueGoals[0] ??
      stalledGoals[0] ??
      goals.find((goal) => goal.progress < 100) ??
      null;

    return {
      goalsAdvanced,
      completedThisWeek,
      overdueGoals,
      stalledGoals,
      suggestedPriority,
    };
  })();

  // Add a custom action to the checklist
  function addTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = newTask.trim();
    if (!title) return;

    setTasks((previous) => [
      ...previous,
      { id: Date.now(), title, completed: false, visible: true },
    ]);
    setNewTask("");
  }

  function toggleTask(id: number) {
    setCompleted((previous) =>
      previous.includes(id)
        ? previous.filter((taskId) => taskId !== id)
        : [...previous, id]
    );
  }

  function toggleVisibility(id: number) {
    setTasks((previous) =>
      previous.map((task) =>
        task.id === id ? { ...task, visible: !task.visible } : task
      )
    );
  }

  function removeTask(id: number) {
    setTasks((previous) => previous.filter((task) => task.id !== id));
    setCompleted((previous) => previous.filter((taskId) => taskId !== id));
  }

  // Create a goal through the backend
async function addGoal(event: React.FormEvent<HTMLFormElement>) {
  event.preventDefault();

  const title = newGoal.trim();
  const parsedTarget = Number(dailyTarget);

  if (!title) return;
  if (goalType === "milestone" && !goalDate) return;

  if (
    goalType === "recurring" &&
    trackingMode === "quantity" &&
    (!Number.isFinite(parsedTarget) ||
      parsedTarget <= 0 ||
      !goalUnit.trim())
  ) {
    return;
  }

  setGoalError("");

  try {
    const savedGoal = await apiRequest<ApiGoal>("/goals", {
      method: "POST",
      body: JSON.stringify({
        title,
        area: goalArea,
        type: goalType,
        frequency: goalType === "recurring" ? goalFrequency : null,
        targetDate: goalType === "milestone" ? goalDate : null,
        progress: 0,
        trackingMode: goalType === "recurring" ? trackingMode : null,
        dailyTarget:
          goalType === "recurring" && trackingMode === "quantity"
            ? parsedTarget
            : null,
        unit:
          goalType === "recurring" && trackingMode === "quantity"
            ? goalUnit.trim()
            : null,
      }),
    });

    setGoals((previous) => [
      ...previous,
      {
        id: savedGoal.id,
        title: savedGoal.title,
        area: goalArea,
        type: goalType,
        frequency: goalType === "recurring" ? goalFrequency : null,
        targetDate: goalType === "milestone" ? goalDate : "",
        progress: 0,
        trackingMode: goalType === "recurring" ? trackingMode : null,
        dailyTarget:
          goalType === "recurring" && trackingMode === "quantity"
            ? parsedTarget
            : null,
        unit:
          goalType === "recurring" && trackingMode === "quantity"
            ? goalUnit.trim()
            : "",
        dailyAmount: 0,
        dailyCompleted: false,
        trackingRecords: [],
        progressHistory: [],
      },
    ]);

    setNewGoal("");
    setGoalArea("Learning");
    setGoalType("milestone");
    setGoalFrequency("daily");
    setTrackingMode("quantity");
    setDailyTarget("100");
    setGoalUnit("g");
    setGoalDate("");
    setShowGoalForm(false);
  } catch (error) {
    setGoalError(
      error instanceof Error ? error.message : "Failed to create goal."
    );
  }
}

  // Update progress or mark a goal complete
  async function updateGoalProgress(id: string, progress: number) {
  const goal = goals.find((item) => item.id === id);
  if (!goal) return;

  const previousProgress = goal.progress;

  setGoals((previous) =>
    previous.map((item) => item.id === id ? { ...item, progress } : item)
  );

  try {
    await apiRequest<ApiGoal>(`/goals/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify({
        progress,
        status: progress === 100 ? "COMPLETED" : "ACTIVE",
      }),
    });
  } catch (error) {
    setGoals((previous) =>
      previous.map((item) =>
        item.id === id ? { ...item, progress: previousProgress } : item
      )
    );
    setGoalError(error instanceof Error ? error.message : "Failed to save progress.");
  }
}

  // Update the amount recorded for a recurring goal
  async function updateGoalAmount(id: string, amount: number) {
    if (!Number.isFinite(amount) || amount < 0) return;

    const goal = goals.find((item) => item.id === id);
    if (
      !goal ||
      goal.type !== "recurring" ||
      goal.trackingMode !== "quantity" ||
      goal.dailyTarget === null
    ) {
      return;
    }

    const progress = Math.min(
      100,
      Math.round((amount / goal.dailyTarget) * 100),
    );

    setGoals((previous) =>
      previous.map((item) =>
        item.id === id ? { ...item, dailyAmount: amount, progress } : item
      )
    );

    try {
      await apiRequest<ApiTracking>(`/goals/${encodeURIComponent(id)}/tracking`, {
        method: "PUT",
        body: JSON.stringify({ amount }),
      });
    } catch (error) {
      setGoalError(error instanceof Error ? error.message : "Failed to save amount.");
    }
  }

  // Toggle completion for a completion-based recurring goal
  async function toggleRecurringCompletion(id: string) {
    const goal = goals.find((item) => item.id === id);
    if (!goal || goal.type !== "recurring" || goal.trackingMode !== "completion") {
      return;
    }

    const completed = !goal.dailyCompleted;

    setGoals((previous) =>
      previous.map((item) =>
        item.id === id
          ? { ...item, dailyCompleted: completed, progress: completed ? 100 : 0 }
          : item
      )
    );

    try {
      await apiRequest<ApiTracking>(`/goals/${encodeURIComponent(id)}/tracking`, {
        method: "PUT",
        body: JSON.stringify({ completed }),
      });
    } catch (error) {
      setGoalError(error instanceof Error ? error.message : "Failed to save completion.");
    }
  }

  // Delete a saved goal through the backend
  async function removeGoal(id: string) {
    setGoalError("");

    try {
      await apiRequest<void>(`/goals/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });

      setGoals((previous) => previous.filter((goal) => goal.id !== id));
    } catch (error) {
      setGoalError(
        error instanceof Error ? error.message : "Failed to delete goal."
      );
    }
  }

  return (
    <main className="avia-shell">
      
      <section className="avia-main">
        {/* Dashboard heading */}
        <header className="avia-header">
          <div>
            <p className="avia-eyebrow">YOUR PERSONAL DASHBOARD</p>
            <h1>Your life, in motion.</h1>
            <p className="avia-muted">
              Small actions. Meaningful progress. A better-balanced life.
            </p>
          </div>
          <div className="avia-avatar">A</div>
        </header>

        {/* Welcome card */}
        <div className="avia-welcome">
          <div>
            <span className="avia-pill">✦ YOUR PERSONAL LIFE OS</span>
            <h2>Build momentum, one day at a time.</h2>
            <p>
              Progress isn't doing everything. It's making the right things
              work together.
            </p>
          </div>
          <div className="avia-orb" aria-hidden="true">
            <span>AV</span>
          </div>
        </div>

        {/* Overview period selector */}
        <div className="avia-section-heading">
          <div>
            <h2>Your overview</h2>
            <p className="avia-muted">A snapshot of your personal progress</p>
          </div>
          <select
            aria-label="Dashboard period"
            value={focus}
            onChange={(event) => setFocus(event.target.value)}
          >
            <option>Today</option>
            <option>This week</option>
          </select>
        </div>

        {/* Summary cards */}
        <div className="avia-stats">
          <article className="avia-card">
            <span className="avia-card-label">Life balance</span>

            <strong className="avia-stat-value">
              {balanceScore === null ? "—" : balanceScore}
              {balanceScore !== null && <span>%</span>}
            </strong>

            <div className="avia-progress">
              <span style={{ width: `${balanceScore ?? 0}%` }} />
            </div>

            <small>
              {balanceScore === null
                ? "Add goals to track progress"
                : `Progress across ${trackedScores.length} tracked ${
                    trackedScores.length === 1 ? "area" : "areas"
                  }`}
            </small>

            <div className="avia-insight avia-insight--sunshine">
              <div className="avia-insight-heading">
                <span className="avia-insight-icon" aria-hidden="true">
                  ☀
                </span>
                <span>Life Balance</span>
              </div>

              <p className="avia-insight-message">
                {balanceScore === null
                  ? "Add goals across different areas of your life to begin tracking your balance."
                  : "Your score reflects progress across your tracked life areas, not your overall wellbeing. Keep building consistency across the areas that matter to you."}
              </p>
            </div>
          </article>

          <article className="avia-card">
            <span className="avia-card-label">Daily actions</span>
            <strong className="avia-stat-value">
              {completedCount}<span>/{visibleTasks.length}</span>
            </strong>
            <div className="avia-progress blue">
              <span
                style={{
                  width: `${
                    visibleTasks.length
                      ? (completedCount / visibleTasks.length) * 100
                      : 0
                  }%`,
                }}
              />
            </div>
            <small>
              {visibleTasks.length - completedCount} actions remaining
            </small>
          </article>

          <article className="avia-card">
            <span className="avia-card-label">Focus mode</span>
            <strong className="avia-stat-value">
              {activeGoals}<span> active</span>
            </strong>
            <div className="avia-status">
              <span /> {focus} priorities
            </div>
            <small>Keep the important things important</small>
          </article>
        </div>

        {/* Today's Priority */}
        <section className="avia-card avia-priority">
          <div className="avia-section-heading">
            <div>
              <span className="avia-card-label">YOUR NEXT IMPORTANT STEP</span>
              <h2>Today's Priority</h2>
              <p className="avia-muted">
                Choose one active goal to focus on today.
              </p>
            </div>
          </div>

          {goalsLoading ? (
            <p className="avia-muted">Loading your goals...</p>
          ) : goals.filter((goal) => goal.progress < 100).length === 0 ? (
            <p className="avia-muted">
              Add an active goal to choose today's priority.
            </p>
          ) : (
            <>
              <label className="avia-goal-field">
                <span>Select your priority goal</span>
                <select
                  value={priorityGoalId}
                  onChange={(event) => setPriorityGoalId(event.target.value)}
                >
                  <option value="">Choose a goal</option>
                  {goals
                    .filter((goal) => goal.progress < 100)
                    .map((goal) => (
                      <option key={goal.id} value={goal.id}>
                        {goal.title} · {goal.area}
                      </option>
                    ))}
                </select>
              </label>

              {priorityGoalId &&
                (() => {
                  const selectedGoal = goals.find(
                    (goal) => goal.id === priorityGoalId
                  );

                  return selectedGoal ? (
                    <div className="avia-insight avia-insight--growth">
                      <div className="avia-insight-heading">
                        <span className="avia-insight-icon" aria-hidden="true">
                          ↗
                        </span>
                        <span>{selectedGoal.area}</span>
                      </div>
                      <p className="avia-insight-message">
                        Focus on making progress toward{" "}
                        <strong>{selectedGoal.title}</strong> today.
                        Current progress: {selectedGoal.progress}%.
                      </p>
                    </div>
                  ) : null;
                })()}
            </>
          )}
        </section>

        {/* Goals management */}
        <section className="avia-card avia-goals" id="goals">
          <div className="avia-section-heading avia-goals-heading">
            <div>
              <h2>Your goals</h2>
              <p className="avia-muted">
                Turn bigger ambitions into measurable progress.
              </p>
            </div>
            <button
              type="button"
              className="avia-goal-primary"
              onClick={() => setShowGoalForm((previous) => !previous)}
              aria-expanded={showGoalForm}
            >
              {showGoalForm ? "Cancel" : "+ Add goal"}
            </button>
          </div>

          <div className="avia-goal-summary">
            <span>{goals.length} total goals</span>
            <span>{completedGoals} completed</span>
          </div>

          {goalsLoading && (
            <p className="avia-muted">Loading your saved goals...</p>
          )}

          {goalError && (
            <p role="alert" className="avia-muted">
              {goalError}
            </p>
          )}

          {showGoalForm && (
  <form className="avia-goal-form" onSubmit={addGoal}>
    <div className="avia-goal-field avia-goal-title-field">
      <label htmlFor="avia-goal-title">Goal title</label>
      <input
        id="avia-goal-title"
        value={newGoal}
        onChange={(event) => setNewGoal(event.target.value)}
        placeholder="e.g. Solve 100 DSA problems"
        maxLength={100}
        required
      />
    </div>

    <div className="avia-goal-field">
      <label htmlFor="avia-goal-type">Goal type</label>
      <select
        id="avia-goal-type"
        value={goalType}
        onChange={(event) => {
          setGoalType(event.target.value as GoalType);
          setGoalDate("");
        }}
      >
        <option value="milestone">Milestone</option>
        <option value="recurring">Recurring target</option>
      </select>
    </div>

    <div className="avia-goal-field">
      <label htmlFor="avia-goal-area">Life area</label>
      <select
        id="avia-goal-area"
        value={goalArea}
        onChange={(event) => setGoalArea(event.target.value)}
      >
        {goalAreas.map((area) => (
          <option key={area}>{area}</option>
        ))}
      </select>
    </div>

    {goalType === "recurring" ? (
        <>
          <div className="avia-goal-field">
            <label htmlFor="avia-goal-frequency">Frequency</label>
            <select
              id="avia-goal-frequency"
              value={goalFrequency}
              onChange={(event) =>
                setGoalFrequency(event.target.value as GoalFrequency)
              }
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>

          <div className="avia-goal-field">
            <label htmlFor="avia-tracking-mode">Tracking method</label>
            <select
              id="avia-tracking-mode"
              value={trackingMode}
              onChange={(event) =>
                setTrackingMode(event.target.value as TrackingMode)
              }
            >
              <option value="quantity">Track a quantity</option>
              <option value="completion">Track completion</option>
            </select>
          </div>

          {trackingMode === "quantity" && (
            <>
              <div className="avia-goal-field">
                <label htmlFor="avia-daily-target">Target amount</label>
                <input
                  id="avia-daily-target"
                  type="number"
                  min="0.01"
                  step="any"
                  value={dailyTarget}
                  onChange={(event) => setDailyTarget(event.target.value)}
                  required
                />
              </div>

              <div className="avia-goal-field">
                <label htmlFor="avia-goal-unit">Unit</label>
                <select
                  id="avia-goal-unit"
                  value={goalUnit}
                  onChange={(event) => setGoalUnit(event.target.value)}
                >
                  <option value="g">Grams (g)</option>
                  <option value="ml">Millilitres (ml)</option>
                  <option value="L">Litres (L)</option>
                  <option value="minutes">Minutes</option>
                  <option value="pages">Pages</option>
                  <option value="reps">Repetitions</option>
                </select>
              </div>
            </>
          )}
        </>
      ) : (
  <div className="avia-goal-field">
    <label htmlFor="avia-goal-date">Target date</label>
    <input
      id="avia-goal-date"
      type="date"
      value={goalDate}
      min={new Date().toLocaleDateString("en-CA")}
      onChange={(event) => setGoalDate(event.target.value)}
      required
    />
  </div>
)}

    <button
      type="submit"
      className="avia-goal-primary avia-goal-submit"
      disabled={
      !newGoal.trim() ||
      (goalType === "milestone" && !goalDate) ||
      (goalType === "recurring" &&
        trackingMode === "quantity" &&
        (!Number.isFinite(Number(dailyTarget)) ||
          Number(dailyTarget) <= 0 ||
          !goalUnit.trim()))
    }
    >
      Create goal
    </button>
  </form>
)}

          {goals.length === 0 ? (
            <div className="avia-goals-empty">
              <span className="avia-goal-target-icon">◎</span>
              <h3>No goals added yet</h3>
              <p className="avia-muted">
                Start with one meaningful goal. You can update its progress
                as you work towards it.
              </p>
              {!showGoalForm && (
                <button
                  type="button"
                  className="avia-goal-secondary"
                  onClick={() => setShowGoalForm(true)}
                >
                  Create your first goal
                </button>
              )}
            </div>
          ) : (
            <div className="avia-goal-list">
              {goals.map((goal) => (
                <article className="avia-goal-item" key={goal.id}>
                  <div className="avia-goal-item-heading">
                    <div className="avia-goal-copy">
                      <span className="avia-goal-area">{goal.area}</span>
                    <h3>{goal.title}</h3>
                    <p className="avia-muted">
                      {goal.type === "recurring"
                        ? `Recurring · ${goal.frequency === "daily" ? "Daily" : "Weekly"}`
                        : goal.targetDate
                          ? `Target: ${new Date(
                              `${goal.targetDate}T12:00:00`
                            ).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}`
                          : "Milestone"}
                    </p>
                    </div>
                    <button
                      type="button"
                      className="avia-goal-delete"
                      onClick={() => removeGoal(goal.id)}
                      aria-label={`Delete goal: ${goal.title}`}
                      title="Delete goal"
                    >
                      <span aria-hidden="true">×</span>
                    </button>
                  </div>

                  {goalMomentum
                    .filter((item) => item.id === goal.id)
                    .map((momentum) => (
                      <div
                        className={`avia-insight ${
                          momentum.status === "Overdue"
                            ? "avia-insight--overdue"
                            : momentum.status === "Deadline approaching"
                              ? "avia-insight--deadline"
                              : "avia-insight--water"
                        }`}
                        key={momentum.id}
                      >
                        <div className="avia-insight-heading">
                          <span className="avia-insight-icon" aria-hidden="true">
                            ↗
                          </span>
                          <span>{momentum.status}</span>
                        </div>
                        <p className="avia-insight-message">
                          {momentum.message}
                        </p>
                      </div>
                    ))}

                  {goal.type === "recurring" && (
                    <div className="avia-goal-tracking">
                      {goal.trackingMode === "quantity" && goal.dailyTarget !== null ? (
                        <>
                          <label htmlFor={`goal-amount-${goal.id}`}>
                            Recorded amount ({goal.unit})
                          </label>

                          <input
                            id={`goal-amount-${goal.id}`}
                            type="number"
                            min="0"
                            step="any"
                            value={goal.dailyAmount}
                            onChange={(event) => {
                              const value = event.target.value;

                              if (value.trim() === "") {
                                updateGoalAmount(goal.id, 0);
                                return;
                              }

                              updateGoalAmount(goal.id, Number(value));
                            }}
                          />

                          <p className="avia-muted">
                            Target: {goal.dailyTarget} {goal.unit} · Remaining:{" "}
                            {Math.max(0, goal.dailyTarget - goal.dailyAmount)} {goal.unit}
                          </p>
                        </>
                      ) : (
                        <button
                          type="button"
                          className="avia-goal-secondary"
                          onClick={() => toggleRecurringCompletion(goal.id)}
                        >
                          {goal.dailyCompleted ? "Mark incomplete" : "Mark complete"}
                        </button>
                      )}
                    </div>
                  )}

                  <div className="avia-goal-progress-summary">
                    <div className="avia-goal-progress-heading">
                      <span>Progress</span>
                    </div>

                    <div
                      className="avia-goal-progress-ring"
                      role="img"
                      aria-label={`${goal.title}: ${goal.progress}% complete`}
                    >
                      <svg viewBox="0 0 48 48" aria-hidden="true">
                        <circle
                          className="avia-goal-ring-track"
                          cx="24"
                          cy="24"
                          r="20"
                        />

                        <circle
                          className="avia-goal-ring-value"
                          cx="24"
                          cy="24"
                          r="20"
                          strokeDasharray="125.66"
                          strokeDashoffset={
                            125.66 - (125.66 * goal.progress) / 100
                          }
                        />
                      </svg>

                      <span>{goal.progress}%</span>
                    </div>
                  </div>

                  {goal.type === "milestone" && (
                    <input
                      className="avia-goal-range"
                      id={`goal-progress-${goal.id}`}
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={goal.progress}
                      onChange={(event) =>
                        updateGoalProgress(goal.id, Number(event.target.value))
                      }
                      aria-label={`Progress for ${goal.title}`}
                    />
                  )}

                  <div className="avia-goal-progress-track">
                    <span style={{ width: `${goal.progress}%` }} />
                  </div>

                  <div className="avia-goal-item-footer">
                    <span
                      className={
                        goal.progress === 100
                          ? "avia-goal-status is-complete"
                          : "avia-goal-status"
                      }
                    >
                      {goal.progress === 100 ? "Completed" : "In progress"}
                    </span>
                    <button
                      type="button"
                      className="avia-goal-secondary"
                      onClick={() =>
                        updateGoalProgress(
                          goal.id,
                          goal.progress === 100 ? 0 : 100
                        )
                      }
                    >
                      {goal.progress === 100
                        ? "Reopen goal"
                        : "Mark complete"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Today's actions and checklist controls */}
        <div className="avia-content-grid">
          <article className="avia-card avia-actions" id="planning">
            <div className="avia-section-heading">
              <div>
                <h2>Today's actions</h2>
                <p className="avia-muted">Consistency beats intensity.</p>
              </div>
              <span className="avia-count">
                {completedCount}/{visibleTasks.length}
              </span>
            </div>

            <button
              type="button"
              className="avia-action-manager-toggle"
              onClick={() => setShowManager((previous) => !previous)}
              aria-expanded={showManager}
            >
              {showManager ? "Close action manager" : "Manage actions"}
            </button>

            {showManager && (
              <div className="avia-action-manager">
                <form onSubmit={addTask} className="avia-add-task-form">
                  <label htmlFor="avia-new-task">Add your own action</label>
                  <div className="avia-add-task-row">
                    <input
                      id="avia-new-task"
                      type="text"
                      value={newTask}
                      onChange={(event) => setNewTask(event.target.value)}
                      placeholder="e.g. Read for 20 minutes"
                      maxLength={100}
                    />
                    <button type="submit" disabled={!newTask.trim()}>
                      Add
                    </button>
                  </div>
                </form>

                <p className="avia-footnote">
                  Choose which actions appear in your daily checklist.
                </p>

                {tasks.map((task) => (
                  <div className="avia-task-setting" key={task.id}>
                    <label>
                      <input
                        type="checkbox"
                        checked={task.visible}
                        onChange={() => toggleVisibility(task.id)}
                      />
                      <span>{task.title}</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => removeTask(task.id)}
                      aria-label={`Remove ${task.title}`}
                      title="Remove action"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="avia-task-list">
              {visibleTasks.length === 0 ? (
                <p className="avia-muted">
                  No actions selected. Open Manage actions to add or show one.
                </p>
              ) : (
                visibleTasks.map((task) => (
                  <label className="avia-task" key={task.id}>
                    <input
                      type="checkbox"
                      checked={completed.includes(task.id)}
                      onChange={() => toggleTask(task.id)}
                    />
                    <span className="avia-check" />
                    <span
                      className={
                        completed.includes(task.id) ? "avia-done" : ""
                      }
                    >
                      {task.title}
                    </span>
                  </label>
                ))
              )}
            </div>

            <p className="avia-footnote">
              Your counts and progress update as you complete actions.
            </p>
          </article>

          {/* Life Balance panel remains unchanged */}
          <article className="avia-card avia-balance" id="analytics">
            <div>
              <h2>Life balance</h2>
              <p className="avia-muted">Your key areas, at a glance</p>
            </div>
            <div className="avia-area-list">
              {trackedAreas.map((area) => (
                <div className="avia-area" key={area.name}>
                  <div className="avia-area-heading">
                  <span>
                    <i style={{ background: area.color }} />
                    {area.name}
                  </span>
                  <strong>
                    {area.score === null ? "Not tracked" : `${area.score}%`}
                  </strong>
                </div>

                <div className="avia-progress">
                  <span
                    style={{
                      width: `${area.score ?? 0}%`,
                      background: area.color,
                    }}
                  />
                </div>

                {area.goalCount > 0 && (
                  <small>
                    Based on {area.goalCount}{" "}
                    {area.goalCount === 1 ? "goal" : "goals"}
                  </small>
                )}
                </div>
              ))}
            </div>
            <p className="avia-footnote">
              Progress reflects your goals in each tracked life area, not an overall
              assessment of wellbeing.
            </p>

            

          <div className="avia-insight avia-insight--growth" aria-live="polite">
            <div className="avia-insight-heading">
              <span className="avia-insight-icon" aria-hidden="true">
                ↗
              </span>
              <span>Weekly Consistency</span>
            </div>

            {balanceRecommendation && (
              <div className="avia-insight avia-insight--growth">
                <div className="avia-insight-heading">
                  <span className="avia-insight-icon" aria-hidden="true">
                    ↗
                  </span>
                  <span>Your Next Balance Action</span>
                </div>

                <p className="avia-insight-message">
                  <strong>{balanceRecommendation.area}</strong> has the lowest
                  average goal progress at {balanceRecommendation.score}%.
                  {` ${balanceRecommendation.action}`}
                </p>
              </div>
            )}

            <p className="avia-insight-message">
              {weeklyConsistency.message}
              {weeklyConsistency.change !== null &&
                ` (${weeklyConsistency.change > 0 ? "+" : ""}${weeklyConsistency.change}% vs last week)`}
            </p>
          </div>
          </article>


          {/* Weekly goal review */}
          <section className="avia-card avia-weekly-review">
            <div className="avia-section-heading">
              <div>
                <h2>Weekly Goal Review</h2>
                <p className="avia-muted">
                  Reflect on your progress and choose your next priority.
                </p>
              </div>
            </div>

            {goalsLoading || habitsLoading ? (
              <p className="avia-muted">Preparing your weekly review...</p>
            ) : goalError || habitsError ? (
              <p className="avia-muted">
                Some data is unavailable. Review your saved goals and habit history.
              </p>
            ) : goals.length === 0 ? (
              <p className="avia-muted">
                Add a goal to start building your weekly review.
              </p>
            ) : (
              <>
                <div className="avia-review-stats">
                  <article>
                    <strong>{weeklyGoalReview.completedThisWeek.length}</strong>
                    <span>Milestones completed</span>
                  </article>
                  <article>
                    <strong>{weeklyGoalReview.goalsAdvanced.length}</strong>
                    <span>Goals progressed</span>
                  </article>
                  <article>
                    <strong>{weeklyGoalReview.overdueGoals.length}</strong>
                    <span>Overdue goals</span>
                  </article>
                </div>

                <div className="avia-review-section">
                  <h3>Your wins</h3>
                  {weeklyGoalReview.goalsAdvanced.length > 0 ? (
                    weeklyGoalReview.goalsAdvanced.map((goal) => (
                      <p key={goal.id}>
                        <span className="avia-review-marker is-positive">↗</span>
                        <strong>{goal.title}</strong>
                        {" "}— {goal.progressMade}% progress gained this week.
                      </p>
                    ))
                  ) : (
                    <p className="avia-muted">
                      No milestone progress changes were recorded this week. Record an
                      update when you make progress so your next review can recognize it.
                    </p>
                  )}
                </div>

                <div className="avia-review-section">
                  <h3>Needs attention</h3>
                  {weeklyGoalReview.overdueGoals.length > 0 ||
                  weeklyGoalReview.stalledGoals.length > 0 ? (
                    <>
                      {weeklyGoalReview.overdueGoals.slice(0, 3).map((goal) => (
                        <p key={`overdue-${goal.id}`}>
                          <span className="avia-review-marker is-warning">!</span>
                          <strong>{goal.title}</strong>
                          {" "}is overdue. Reassess the deadline or next step.
                        </p>
                      ))}
                      {weeklyGoalReview.stalledGoals
                        .filter(
                          (goal) =>
                            !weeklyGoalReview.overdueGoals.some(
                              (overdue) => overdue.id === goal.id
                            )
                        )
                        .slice(0, 3)
                        .map((goal) => (
                          <p key={`stalled-${goal.id}`}>
                            <span className="avia-review-marker">•</span>
                            <strong>{goal.title}</strong>
                            {" "}may need a check-in.
                          </p>
                        ))}
                    </>
                  ) : (
                    <p className="avia-muted">
                      No overdue or stalled active goals were identified.
                    </p>
                  )}
                </div>

                <div className="avia-review-priority">
                  <span className="avia-card-label">SUGGESTED NEXT-WEEK PRIORITY</span>
                  {weeklyGoalReview.suggestedPriority ? (
                    <>
                      <h3>{weeklyGoalReview.suggestedPriority.title}</h3>
                      <p className="avia-muted">
                        {weeklyGoalReview.overdueGoals.some(
                          (goal) =>
                            goal.id === weeklyGoalReview.suggestedPriority?.id
                        )
                          ? "Start by reassessing this overdue goal and defining a realistic next step."
                          : weeklyGoalReview.stalledGoals.some(
                              (goal) =>
                                goal.id === weeklyGoalReview.suggestedPriority?.id
                            )
                            ? "Restart with one small action and record your next check-in."
                            : "Choose one manageable action that moves this goal forward."}
                      </p>
                      <button
                        type="button"
                        className="avia-goal-secondary"
                        onClick={() =>
                          setPriorityGoalId(weeklyGoalReview.suggestedPriority!.id)
                        }
                      >
                        Set as today's priority
                      </button>
                    </>
                  ) : (
                    <p className="avia-muted">
                      All your current goals are complete. Choose a meaningful next milestone.
                    </p>
                  )}
                </div>

                <div className="avia-review-section">
                  <h3>Habit consistency</h3>
                  <p className="avia-muted">{weeklyConsistency.message}</p>
                </div>
              </>
            )}
          </section>



        </div>

        {/* Dashboard footer */}
        <footer className="avia-footer">
          <span>AVIA · A Vision in Action</span>
          <span>Designed for progress, not perfection.</span>
        </footer>
      </section>
    </main>
  );
}