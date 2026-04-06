import { PageContainer } from "@/components/layout/page-container";
import { SetDashboardTitle } from "@/components/layout/set-dashboard-title";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";

export default function DashboardSetlistsPage() {
  return (
    <>
      <SetDashboardTitle title="เซ็ตลิสต์" />
      <PageContainer data-testid="page-setlists">
        <SectionHeader
          title="เซ็ตลิสต์"
          description="เซ็ตลิสต์ส่วนตัว — เชื่อมต่อ API แล้วจะแสดงรายการจริง"
        />
        <Card>
          <CardHeader>
            <CardTitle>รายการของคุณ</CardTitle>
            <CardDescription>
              ดึงจาก{" "}
              <code className="rounded-md bg-muted px-1.5 py-0.5 text-xs">
                NEXT_PUBLIC_API_URL
              </code>{" "}
              เมื่อต่อสายแล้ว
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-body text-muted-foreground">
              ยังไม่มีข้อมูล — เพิ่มชั้นข้อมูล (เช่น TanStack Query + Bearer) ในขั้นถัดไป
            </p>
          </CardContent>
        </Card>
      </PageContainer>
    </>
  );
}
