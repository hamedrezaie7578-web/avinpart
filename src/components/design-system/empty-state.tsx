import type { ReactNode } from "react";
import { Icon } from "./icon";

export function EmptyState({
  icon = "Package",
  title,
  description,
  action,
}: {
  icon?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed px-6 py-14 text-center">
      <span className="bg-muted text-muted-foreground mb-4 flex size-14 items-center justify-center rounded-2xl">
        <Icon name={icon} className="size-7" />
      </span>
      <h3 className="text-lg font-bold">{title}</h3>
      {description && (
        <p className="text-muted-foreground mt-2 max-w-md leading-7">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
