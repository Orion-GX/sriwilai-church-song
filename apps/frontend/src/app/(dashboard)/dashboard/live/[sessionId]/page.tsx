import { LiveSessionRoom } from "@/components/live/live-session-room";
import { PageContainer } from "@/components/layout/page-container";
import { SetDashboardTitle } from "@/components/layout/set-dashboard-title";
import { SectionHeader } from "@/components/ui/section-header";

export default function LiveSessionPage({
  params,
}: {
  params: { sessionId: string };
}) {
  return (
    <>
      <SetDashboardTitle title="ห้องไลฟ์" />
      <PageContainer constrained={false} className="w-full max-w-none">
        <SectionHeader
          title="ห้องไลฟ์"
          description="ควบคุมการแสดงและซิงค์กับผู้เข้าร่วม"
        />
        <LiveSessionRoom sessionId={params.sessionId} />
      </PageContainer>
    </>
  );
}
