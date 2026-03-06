import clsx from "clsx";
import { ClaimStatus } from "@prisma/client";

type StatusBadgeProps = {
  status: ClaimStatus;
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={clsx(
        "rounded-full px-2 py-1 text-xs font-semibold",
        status === ClaimStatus.APPROVED && "bg-emerald-100 text-emerald-700",
        status === ClaimStatus.DENIED && "bg-rose-100 text-rose-700",
        status === ClaimStatus.PENDING && "bg-amber-100 text-amber-700",
      )}
    >
      {status}
    </span>
  );
}
