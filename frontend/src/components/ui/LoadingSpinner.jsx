import { cn } from "../../lib/utils";

const sizeMap = {
  sm: "h-4 w-4 border-2",
  md: "h-8 w-8 border-2",
  lg: "h-12 w-12 border-3",
};

export function LoadingSpinner({ size = "md", className }) {
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div
        className={cn(
          "animate-spin rounded-full border-teal-700 border-t-transparent",
          sizeMap[size],
        )}
      />
    </div>
  );
}
