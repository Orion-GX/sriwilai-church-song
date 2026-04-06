import Link from "next/link";
import { Building2, ListMusic, Music, Radio } from "lucide-react";
import {
  ActivityList,
  ChartCard,
  DataTableCard,
  StatCard,
} from "@/components/dashboard";
import { PageContainer } from "@/components/layout/page-container";
import { SetDashboardTitle } from "@/components/layout/set-dashboard-title";
import { Badge } from "@/components/ui/badge";
import { Button, buttonClassName } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/section-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

const CHART_BARS = [
  "h-12",
  "h-20",
  "h-14",
  "h-24",
  "h-16",
  "h-[5.5rem]",
  "h-14",
] as const;

/**
 * ภาพรวม — หน้า golden สำหรับ production (Celestial layout + คอมโพเนนต์ร่วมเท่านั้น)
 */
export default function DashboardHomePage() {
  return (
    <>
      <SetDashboardTitle title="ภาพรวม" />
      <PageContainer data-testid="page-dashboard" className="pb-8">
        <SectionHeader
          title="ภาพรวม"
          description="สถิติ แนวโน้ม กิจกรรมล่าสุด และรายการล่าสุด — โครงและระยะห่างสอดคล้องหน้า UI อ้างอิง"
          action={
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="shrink-0">
                Live
              </Badge>
              <Link
                href="/dashboard/ui-showcase"
                className={buttonClassName("outline", "sm")}
              >
                UI อ้างอิง
              </Link>
            </div>
          }
        />

        {/* แถวสถิติ */}
        <section className="space-y-4" aria-labelledby="dash-stats-heading">
          <h2 id="dash-stats-heading" className="sr-only">
            สถิติสรุป
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="เพลงที่เผยแพร่"
              value="1,248"
              hint="ข้อมูลตัวอย่าง — เชื่อม API แล้วแทนที่ได้"
              icon={<Music className="h-4 w-4" aria-hidden />}
              trend={{ direction: "up", value: "+4.1%", label: "เทียบเดือนที่แล้ว" }}
            />
            <StatCard
              label="เซ็ตลิสต์ของฉัน"
              value="42"
              hint="เซ็ตลิสต์ส่วนตัวที่บันทึกไว้"
              icon={<ListMusic className="h-4 w-4" aria-hidden />}
              trend={{ direction: "up", value: "+2", label: "สัปดาห์นี้" }}
            />
            <StatCard
              label="เซสชันไลฟ์"
              value="3"
              hint="กำลังเปิดอยู่ (ตัวอย่าง)"
              icon={<Radio className="h-4 w-4" aria-hidden />}
              trend={{ direction: "neutral", value: "0", label: "ไม่เปลี่ยน" }}
            />
            <StatCard
              label="คริสตจักร"
              value="5"
              hint="ที่คุณเป็นสมาชิกหรือเจ้าของ"
              icon={<Building2 className="h-4 w-4" aria-hidden />}
              trend={{ direction: "up", value: "+1", label: "เดือนนี้" }}
            />
          </div>
        </section>

        {/* กราฟ */}
        <section className="space-y-4" aria-labelledby="dash-chart-heading">
          <h2 id="dash-chart-heading" className="text-section-title">
            แนวโน้มการใช้งาน
          </h2>
          <ChartCard
            title="การเปิดดูเพลง (7 วันล่าสุด)"
            description="ข้อมูลจริงมาจาก API เมื่อพร้อม — ตำแหน่งและความสูงสอดคล้องหน้า UI อ้างอิง"
            action={
              <Link href="/songs" className={buttonClassName("outline", "sm")}>
                ดูเพลงทั้งหมด
              </Link>
            }
          >
            <div className="flex h-44 items-end justify-center gap-2 px-2 sm:gap-3">
              {CHART_BARS.map((hClass, i) => (
                <div
                  key={i}
                  className={cn(
                    "w-full max-w-10 rounded-t-md bg-primary/80 sm:max-w-[2.5rem]",
                    hClass,
                  )}
                />
              ))}
            </div>
            <p className="mt-4 text-center text-xs text-muted-foreground">
              แท่งตัวอย่าง — แทนที่ด้วยกราฟจริง (เช่น Recharts)
            </p>
          </ChartCard>
        </section>

        {/* กิจกรรมล่าสุด */}
        <section className="space-y-4" aria-labelledby="dash-activity-heading">
          <h2 id="dash-activity-heading" className="text-section-title">
            กิจกรรมล่าสุด
          </h2>
          <ActivityList
            title="ล่าสุดในระบบ"
            description="รายการย่อ — หน้าจริงดึงจาก API"
            items={[
              {
                id: "a1",
                icon: <Music className="h-4 w-4" aria-hidden />,
                title: "แก้ไขเพลง «พระเจ้าทรงยิ่งใหญ่»",
                description: "อัปเดต ChordPro — ท่อน B",
                time: "10 นาทีที่แล้ว",
              },
              {
                id: "a2",
                icon: <ListMusic className="h-4 w-4" aria-hidden />,
                title: "สร้างเซ็ตลิสต์ «นมัสการวันอาทิตย์»",
                description: "บันทึกแล้ว",
                time: "เมื่อวาน",
                href: "/dashboard/setlists",
              },
              {
                id: "a3",
                icon: <Radio className="h-4 w-4" aria-hidden />,
                title: "เข้าห้องไลฟ์ Worship",
                description: "ช่วงที่ 2",
                time: "2 วันที่แล้ว",
                href: "/dashboard/live",
              },
            ]}
          />
        </section>

        {/* ตารางรายการ */}
        <section className="space-y-4" aria-labelledby="dash-table-heading">
          <h2 id="dash-table-heading" className="sr-only">
            รายการล่าสุด
          </h2>
          <DataTableCard
            title="รายการล่าสุด"
            description="ตารางสรุป — สถานะและเวลาในรูปแบบเดียวกับหน้า UI อ้างอิง"
            headerActions={
              <>
                <Button type="button" variant="outline" size="sm" disabled>
                  ส่งออก
                </Button>
                <Link href="/songs" className={buttonClassName("default", "sm")}>
                  เปิดคลังเพลง
                </Link>
              </>
            }
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>กิจกรรม</TableHead>
                  <TableHead>รายละเอียด</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead className="whitespace-nowrap text-right">
                    เมื่อ
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">แก้ไขเพลง</TableCell>
                  <TableCell className="max-w-[200px] truncate text-muted-foreground sm:max-w-none">
                    อัปเดต ChordPro — ชื่อเพลงตัวอย่าง
                  </TableCell>
                  <TableCell>
                    <Badge variant="success">สำเร็จ</Badge>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    10 นาทีที่แล้ว
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">สร้างเซ็ตลิสต์</TableCell>
                  <TableCell className="text-muted-foreground">
                    นมัสการวันอาทิตย์
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">บันทึกแล้ว</Badge>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    เมื่อวาน
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">เข้าห้องไลฟ์</TableCell>
                  <TableCell className="text-muted-foreground">
                    Worship — ช่วงที่ 2
                  </TableCell>
                  <TableCell>
                    <Badge variant="info">ดำเนินการ</Badge>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    2 วันที่แล้ว
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">อัปเดตโปรไฟล์</TableCell>
                  <TableCell className="text-muted-foreground">
                    ชื่อแสดงและรูป
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">เสร็จสิ้น</Badge>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    3 วันก่อน
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </DataTableCard>
        </section>
      </PageContainer>
    </>
  );
}
