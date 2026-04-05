import { LiveSessionRoom } from "@/components/live/live-session-room";
import { SetDashboardTitle } from "@/components/layout/set-dashboard-title";

export default function LiveSessionPage({
  params,
}: {
  params: { sessionId: string };
}) {
  return (
    <>
      <SetDashboardTitle title="ห้องไลฟ์" />
      <LiveSessionRoom sessionId={params.sessionId} />
    </>
  );
}
