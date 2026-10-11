"use client";

import { useState, useTransition } from "react";
import { Loader2, MonitorX } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  createRenewalOrder,
  createUpgradeOrder,
  deactivateMyDevice,
} from "@/server/actions/licenses";

export function DeactivateDeviceButton({ deviceId, name }: { deviceId: string; name: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (
          !confirm(
            `دستگاه «${name}» غیرفعال شود؟ پس از آن می‌توانید لایسنس را روی دستگاه دیگری فعال کنید.`,
          )
        )
          return;
        start(async () => void (await deactivateMyDevice(deviceId)));
      }}
      className="text-destructive hover:bg-destructive/10 inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold"
    >
      {pending ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : (
        <MonitorX className="size-3.5" aria-hidden />
      )}
      غیرفعال‌سازی
    </button>
  );
}

function usePayAction() {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const run = (
    fn: () => Promise<{ ok: true; redirectUrl: string } | { ok: false; message: string }>,
  ) =>
    start(async () => {
      setError(null);
      const r = await fn();
      if (r.ok) window.location.assign(r.redirectUrl);
      else setError(r.message);
    });
  return { error, pending, run };
}

export function RenewButton({ licenseId }: { licenseId: string }) {
  const { error, pending, run } = usePayAction();
  return (
    <span>
      <Button
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() => run(() => createRenewalOrder(licenseId))}
        className="rounded-lg"
      >
        {pending && <Loader2 className="size-3.5 animate-spin" />}تمدید سالانه
      </Button>
      {error && (
        <span role="alert" className="text-destructive ms-2 text-xs">
          {error}
        </span>
      )}
    </span>
  );
}

export function UpgradeButton({
  licenseId,
  planCode,
  label,
}: {
  licenseId: string;
  planCode: string;
  label: string;
}) {
  const { error, pending, run } = usePayAction();
  return (
    <div>
      <Button
        disabled={pending}
        onClick={() => run(() => createUpgradeOrder(licenseId, planCode))}
        className="h-11 w-full rounded-xl font-bold"
      >
        {pending && <Loader2 className="size-4 animate-spin" />}
        {label}
      </Button>
      {error && (
        <p role="alert" className="text-destructive mt-2 text-sm">
          {error}
        </p>
      )}
    </div>
  );
}
