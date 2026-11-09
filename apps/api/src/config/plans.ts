export const PLAN_CATALOG = {
  FREE: {
    name: "AVIA Free",
    price: 0,
    currency: "INR",
    billing: "Free forever",
    features: [
      "Goal management",
      "Habit tracking",
      "Weekly planning",
      "Life balance analytics",
      "Personal journal",
      "Resource library",
      "AI Coach",
    ],
  },

  PRO: {
    name: "AVIA Pro",
    price: null,
    currency: "INR",
    billing: "Pricing to be announced",
    features: [
      "Advanced AI Coach",
      "Deeper life intelligence",
      "Advanced analytics",
      "AI-powered weekly reports",
      "Extended progress insights",
    ],
  },
} as const;