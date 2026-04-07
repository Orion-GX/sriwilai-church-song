"use client";

import { LiveSessionRoom } from "@/components/live/live-session-room";
import { PageContainer } from "@/components/layout/page-container";
import { SetDashboardTitle } from "@/components/layout/set-dashboard-title";
import { FormErrorBanner } from "@/components/ui/form-error-banner";
import { SectionHeader } from "@/components/ui/section-header";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { useCan } from "@/lib/auth/use-can";

export default function LiveSessionPage({
  params,
}: {
  params: { sessionId: string };
}) {
  const canReadLive = useCan(PERMISSIONS.LIVE_READ);
  return (
    <>
      <SetDashboardTitle title="ห้องไลฟ์" />
      <PageContainer constrained={false} className="w-full max-w-none">
        <SectionHeader
          title="ห้องไลฟ์"
          description="ควบคุมการแสดงและซิงค์กับผู้เข้าร่วม"
        />
        {canReadLive ? (
          <LiveSessionRoom sessionId={params.sessionId} />
        ) : (
          <FormErrorBanner data-testid="live-room-forbidden">
            บัญชีนี้ไม่มีสิทธิ์เข้าถึงห้องไลฟ์
          </FormErrorBanner>
        )}
      </PageContainer>
    </>
  );
}
