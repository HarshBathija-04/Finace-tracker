import {
  ShoppingBasket,
  UtensilsCrossed,
  ShoppingBag,
  Car,
  Clapperboard,
  Receipt,
  Plug,
  House,
  HeartPulse,
  GraduationCap,
  CircleEllipsis,
  BriefcaseBusiness,
  Laptop,
  TrendingUp,
  Gift,
  Undo2,
} from "lucide-react";

// Must match the API's lists in server/src/lib/domain.js.
export const EXPENSE_CATEGORIES = [
  "groceries",
  "food",
  "shopping",
  "travel",
  "entertainment",
  "bills",
  "utilities",
  "rent",
  "health",
  "education",
  "other",
];
export const INCOME_CATEGORIES = ["salary", "freelance", "investments", "gifts", "refund", "other"];
export const CURRENCIES = ["INR", "USD", "EUR", "GBP", "CAD", "AUD", "SGD", "AED"];
export const PAYMENTS = [
  { value: "upi", label: "UPI" },
  { value: "card", label: "Card" },
  { value: "cash", label: "Cash" },
  { value: "bank", label: "Bank transfer" },
];

// Mid-tone hues that read on both the light and dark canvas.
const CATEGORY_META = {
  groceries: { label: "Groceries", color: "#2f9e6f", icon: ShoppingBasket },
  food: { label: "Food & dining", color: "#e07a3f", icon: UtensilsCrossed },
  shopping: { label: "Shopping", color: "#c3559a", icon: ShoppingBag },
  travel: { label: "Travel & transport", color: "#3b82c4", icon: Car },
  entertainment: { label: "Entertainment", color: "#8b63d6", icon: Clapperboard },
  bills: { label: "Bills", color: "#c9a227", icon: Receipt },
  utilities: { label: "Utilities", color: "#2aa1a8", icon: Plug },
  rent: { label: "Rent", color: "#64748b", icon: House },
  health: { label: "Health", color: "#d9534f", icon: HeartPulse },
  education: { label: "Education", color: "#5b7fd6", icon: GraduationCap },
  other: { label: "Other", color: "#8a8f8c", icon: CircleEllipsis },
  salary: { label: "Salary", color: "#1f8a6f", icon: BriefcaseBusiness },
  freelance: { label: "Freelance", color: "#3fa37a", icon: Laptop },
  investments: { label: "Investments", color: "#4c9f9a", icon: TrendingUp },
  gifts: { label: "Gifts", color: "#c3559a", icon: Gift },
  refund: { label: "Refund", color: "#5b7fd6", icon: Undo2 },
};

export const categoryMeta = (c) => CATEGORY_META[c] || CATEGORY_META.other;
