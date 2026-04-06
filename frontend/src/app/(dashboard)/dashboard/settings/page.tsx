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

export default function DashboardSettingsPage() {
  return (
    <>
      <SetDashboardTitle title="ตั้งค่า" />
      <PageContainer data-testid="page-settings">
        <SectionHeader
          title="ตั้งค่า"
          description="โปรไฟล์และการตั้งค่าแอป (ขยายฟอร์มและ API ได้ภายหลัง)"
        />
        <Card>
          <CardHeader>
            <CardTitle>ทั่วไป</CardTitle>
            <CardDescription>หน้าโครง — เพิ่มฟอร์มและการเรียก API ตามต้องการ</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-body text-muted-foreground">
              Scaffold — เพิ่มฟอร์มและการเชื่อม API ได้ตามต้องการ
            </p>
          </CardContent>
        </Card>
      </PageContainer>
    </>
  );
}
