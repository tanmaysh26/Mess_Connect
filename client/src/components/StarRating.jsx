import { useState } from "react";

export const RATING_LABELS = ["", "Poor", "Below average", "Okay", "Good", "Excellent"];

function Star({ filled, className }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={`transition ${filled ? "fill-star" : "fill-star-empty"} ${className}`}>
      <path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z" />
    </svg>
  );
}

// Interactive 1–5 star picker. Uses radio inputs underneath so it works with the keyboard.
export default function StarRating({ value, onChange }) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;

  return (
    <div className="flex flex-wrap items-center gap-3.5">
      <div role="radiogroup" aria-label="Rating" className="flex gap-1" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <label
            key={n}
            onMouseEnter={() => setHover(n)}
            className="group relative cursor-pointer rounded-md p-0.5 has-focus-visible:outline-2 has-focus-visible:outline-star"
          >
            <input
              type="radio"
              name="rating"
              value={n}
              checked={value === n}
              onChange={() => onChange(n)}
              aria-label={`${n} – ${RATING_LABELS[n]}`}
              className="sr-only"
            />
            <Star filled={n <= shown} className="size-[30px] group-hover:scale-110 sm:size-[34px]" />
          </label>
        ))}
      </div>
      <span className={`text-sm ${shown ? "font-semibold text-ink" : "font-medium text-muted"}`}>
        {shown ? RATING_LABELS[shown] : "Tap a star"}
      </span>
    </div>
  );
}

// Read-only stars for tables.
export function Stars({ value }) {
  return (
    <span className="inline-flex gap-px" aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => <Star key={n} filled={n <= value} className="size-4" />)}
    </span>
  );
}
