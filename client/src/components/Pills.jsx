export const MEALS = ["Breakfast", "Lunch", "Dinner"];
export const STATUSES = ["Pending", "In Progress", "Resolved"];

const MEAL_PILLS = {
  Breakfast: "bg-warn-soft text-warn",
  Lunch: "bg-primary-soft text-primary",
  Dinner: "bg-accent-soft text-accent"
};
const STATUS_PILLS = {
  Pending: "bg-warn-soft text-warn",
  "In Progress": "bg-accent-soft text-accent",
  Resolved: "bg-success-soft text-success"
};

export function MealPill({ meal }) {
  return <span className={`pill ${MEAL_PILLS[meal]}`}>{meal}</span>;
}

export function StatusPill({ status }) {
  return (
    <span className={`pill inline-flex items-center gap-1.5 before:size-1.5 before:rounded-full before:bg-current ${STATUS_PILLS[status]}`}>
      {status}
    </span>
  );
}
