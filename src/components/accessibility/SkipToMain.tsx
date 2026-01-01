import { cn } from "@/lib/utils";

export function SkipToMain() {
  return (
    <a
      href="#main-content"
      className={cn(
        "fixed top-0 left-0 z-[9999] p-4 bg-primary text-primary-foreground",
        "transform -translate-y-full focus:translate-y-0",
        "transition-transform duration-200",
        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      )}
    >
      Skip to main content
    </a>
  );
}
