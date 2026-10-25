const SIZES = {
  sm: "size-[18px] border-2",
  lg: "size-8 border-3"
};

export default function Spinner({ size = "sm", className = "" }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={`inline-block animate-spin rounded-full border-current/30 border-t-current ${SIZES[size]} ${className}`}
    />
  );
}
