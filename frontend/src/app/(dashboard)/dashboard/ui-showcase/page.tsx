import {
  Inbox,
  LayoutTemplate,
  ListMusic,
  Moon,
  Music,
  Radio,
  Search,
  Sun,
  User,
  Zap,
} from "lucide-react";
import {
  ActivityList,
  ChartCard,
  DataTableCard,
  StatCard,
} from "@/components/dashboard";
import { PageContainer } from "@/components/layout/page-container";
import { SetDashboardTitle } from "@/components/layout/set-dashboard-title";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SectionHeader } from "@/components/ui/section-header";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

/**
 * Golden reference — แหล่งอ้างอิงภาพเดียว (Celestial-inspired admin, modernized)
 * Shell: sidebar + top navbar มาจาก layout แดชบอร์ด — หน้านี้แสดงเฉพาะเนื้อหาใน `<main>`
 */
export default function UiShowcasePage() {
  return (
    <>
      <SetDashboardTitle title="UI อ้างอิง" />
      <PageContainer data-testid="page-ui-showcase" className="pb-10">
        {/* —— หัวเรื่องหน้า —— */}
        <SectionHeader
          title="UI อ้างอิง (Golden page)"
          description="แหล่งอ้างอิงเดียวสำหรับ shell, การ์ด, ฟอร์ม, ตาราง, สถานะโหลด และธีม — หน้าใหม่ควรประกอบจาก primitive เหล่านี้ ไม่เขียนสไตล์สุ่มในหน้า"
          action={
            <Badge variant="secondary" className="shrink-0">
              Design system
            </Badge>
          }
        />

        {/* —— Shell (อธิบาย — ไม่เรนเดอร์ซ้ำ) —— */}
        <Card variant="flat" className="border-dashed border-primary/20 bg-primary/[0.04] dark:bg-primary/[0.06]">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">โครง Shell (Sidebar + Top navbar)</CardTitle>
            <CardDescription>
              โครงนี้ใช้จาก layout แดชบอร์ดแล้ว — ไซด์บาร์ซ้าย แถบชื่อหน้าและเมนูผู้ใช้ด้านบน พื้นหลังฟ้าอ่อน (
              <code className="rounded bg-muted px-1 py-0.5 text-xs">background</code>
              ) การ์ดลอยบน canvas แบบ Celestial
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>
              คุณกำลังดูหน้านี้ภายใน{" "}
              <span className="font-medium text-foreground">AppShell</span> — ไม่ต้องใส่ sidebar/navbar
              ซ้ำในหน้านี้
            </p>
          </CardContent>
        </Card>

        {/* —— Typography —— */}
        <section className="space-y-4" aria-labelledby="showcase-typography">
          <h2 id="showcase-typography" className="text-section-title">
            Typography
          </h2>
          <div className="rounded-lg border border-border bg-card p-5 shadow-card md:p-6">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              คำอธิบายเมตา
            </p>
            <h3 className="mt-2 text-page-title">หัวข้อหลักของหน้า</h3>
            <p className="mt-3 max-w-2xl text-body text-muted-foreground">
              เนื้อหาอธิบาย — ใช้{" "}
              <code className="rounded-md bg-muted px-1.5 py-0.5 text-xs">text-page-title</code>{" "}
              <code className="rounded-md bg-muted px-1.5 py-0.5 text-xs">text-body</code>{" "}
              <code className="rounded-md bg-muted px-1.5 py-0.5 text-xs">text-helper</code>
            </p>
          </div>
        </section>

        {/* —— Stat cards —— */}
        <section className="space-y-4" aria-labelledby="showcase-stats">
          <h2 id="showcase-stats" className="text-section-title">
            วิดเจ็ตสถิติ (StatCard)
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="เพลงทั้งหมด"
              value="1,248"
              hint="ข้อมูลตัวอย่าง — เชื่อม API แล้วแทนที่ได้"
              icon={<Music className="h-4 w-4" aria-hidden />}
              trend={{ direction: "up", value: "+3.2%", label: "เทียบเดือนที่แล้ว" }}
            />
            <StatCard
              label="เซ็ตลิสต์"
              value="42"
              icon={<ListMusic className="h-4 w-4" aria-hidden />}
              trend={{ direction: "down", value: "−2", label: "สัปดาห์นี้" }}
            />
            <StatCard
              label="เซสชันไลฟ์"
              value="7"
              hint="กำลังเปิดอยู่"
              icon={<Radio className="h-4 w-4" aria-hidden />}
              trend={{ direction: "neutral", value: "0%", label: "ไม่เปลี่ยน" }}
            />
            <StatCard
              label="การมีส่วนร่วม"
              value="89%"
              icon={<Zap className="h-4 w-4" aria-hidden />}
              trend={{ direction: "up", value: "+12%", label: "30 วันล่าสุด" }}
            />
          </div>
        </section>

        {/* —— Cards —— */}
        <section className="space-y-4" aria-labelledby="showcase-cards">
          <h2 id="showcase-cards" className="text-section-title">
            การ์ด (variants)
          </h2>
          <div className="grid gap-4 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Default</CardTitle>
                <CardDescription>ขอบ + shadow-card — ค่าเริ่มต้นของระบบ</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                เนื้อหาภายในใช้ <span className="text-foreground">text-body</span> และ{" "}
                <span className="text-helper">text-helper</span>
              </CardContent>
            </Card>
            <Card variant="elevated">
              <CardHeader>
                <CardTitle>Elevated</CardTitle>
                <CardDescription>เงาเข้มขึ้น — เน้นวิดเจ็ตสำคัญ</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                เหมาะกับการ์ดที่ต้องลอยจากพื้นเล็กน้อย
              </CardContent>
            </Card>
            <Card variant="flat">
              <CardHeader>
                <CardTitle>Flat</CardTitle>
                <CardDescription>เงาน้อย — เน้นขอบอ่อน</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                ใช้คู่กับพื้นหลังที่มีสีอยู่แล้ว
              </CardContent>
            </Card>
          </div>
          <Card className="border-primary/25 bg-primary/5 dark:bg-primary/10">
            <CardHeader>
              <CardTitle>การ์ดเน้น (accent)</CardTitle>
              <CardDescription>สี primary เบา — callout / คำแนะนำ</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              ไม่ทับเนื้อหา — ยังอ่านสบายในโหมดมืด
            </CardContent>
            <CardFooter className="justify-end gap-2 border-t border-border/60 pt-4">
              <Button type="button" variant="outline" size="sm">
                ทีหลัง
              </Button>
              <Button type="button" size="sm">
                ตกลง
              </Button>
            </CardFooter>
          </Card>
        </section>

        {/* —— Buttons —— */}
        <section className="space-y-4" aria-labelledby="showcase-buttons">
          <h2 id="showcase-buttons" className="text-section-title">
            ปุ่ม (Button)
          </h2>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Variants และขนาด</CardTitle>
              <CardDescription>primary / secondary / outline / ghost / destructive</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-3">
              <Button type="button">หลัก</Button>
              <Button type="button" variant="secondary">
                รอง
              </Button>
              <Button type="button" variant="outline">
                ขอบ
              </Button>
              <Button type="button" variant="ghost">
                Ghost
              </Button>
              <Button type="button" variant="destructive">
                ลบ
              </Button>
              <Button type="button" size="sm">
                เล็ก
              </Button>
              <Button type="button" size="lg">
                ใหญ่
              </Button>
              <Button type="button" variant="outline" size="icon" aria-label="ค้นหา">
                <Search className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </section>

        {/* —— Inputs —— */}
        <section className="space-y-4" aria-labelledby="showcase-inputs">
          <h2 id="showcase-inputs" className="text-section-title">
            ฟอร์ม (Input / Textarea / Label)
          </h2>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="max-w-xl lg:max-w-none">
              <CardHeader>
                <CardTitle className="text-base">สถานะปกติ</CardTitle>
                <CardDescription>ระยะห่างแนวตั้ง space-y-4</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="showcase-name">ชื่อรายการ</Label>
                  <Input id="showcase-name" placeholder="พิมพ์เป็นภาษาไทยได้" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="showcase-search">ค้นหา</Label>
                  <Input id="showcase-search" placeholder="คำค้น…" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="showcase-note">หมายเหตุ</Label>
                  <Textarea
                    id="showcase-note"
                    placeholder="ข้อความหลายบรรทัด"
                    rows={3}
                  />
                </div>
                <p className="text-helper">ข้อความช่วยใต้ฟิลด์ — สี muted</p>
              </CardContent>
            </Card>
            <Card className="max-w-xl border-destructive/30 lg:max-w-none">
              <CardHeader>
                <CardTitle className="text-base">สถานะผิดพลาด</CardTitle>
                <CardDescription>Input variant=&quot;error&quot;</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="showcase-email">อีเมล</Label>
                  <Input
                    id="showcase-email"
                    type="email"
                    variant="error"
                    placeholder="name@example.com"
                    defaultValue="ไม่ใช่รูปแบบอีเมล"
                    aria-invalid
                  />
                  <p className="text-xs text-destructive">กรุณากรอกอีเมลให้ถูกต้อง</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* —— Badges —— */}
        <section className="space-y-4" aria-labelledby="showcase-badges">
          <h2 id="showcase-badges" className="text-section-title">
            ป้ายสถานะ (Badge)
          </h2>
          <Card>
            <CardContent className="flex flex-wrap gap-2 pt-6">
              <Badge>ค่าเริ่มต้น</Badge>
              <Badge variant="secondary">รอง</Badge>
              <Badge variant="outline">ขอบ</Badge>
              <Badge variant="success">สำเร็จ</Badge>
              <Badge variant="warning">คำเตือน</Badge>
              <Badge variant="destructive">ผิดพลาด</Badge>
              <Badge variant="error">error</Badge>
              <Badge variant="info">ข้อมูล</Badge>
            </CardContent>
          </Card>
        </section>

        {/* —— Tables —— */}
        <section className="space-y-4" aria-labelledby="showcase-tables">
          <h2 id="showcase-tables" className="text-section-title">
            ตาราง (Table + TableContainer)
          </h2>
          <TableContainer>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ชื่อเพลง</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead className="text-right">การดำเนินการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">พระเจ้าทรงยิ่งใหญ่</TableCell>
                  <TableCell>
                    <Badge variant="success">เผยแพร่</Badge>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">แก้ไข</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">รอการตรวจ</TableCell>
                  <TableCell>
                    <Badge variant="warning">ฉบับร่าง</Badge>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">แก้ไข</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">
                    ตัวอย่างยาว — ทดสอบการตัดบรรทัดภาษาไทย
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">ซ่อน</Badge>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">—</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>

          <DataTableCard
            title="ตารางในการ์ด (DataTableCard)"
            description="หัวการ์ด + ปุ่มด้านขวา — ตารางต่อจากเส้นคั่น"
            headerActions={
              <>
                <Button type="button" variant="outline" size="sm">
                  ส่งออก
                </Button>
                <Button type="button" size="sm">
                  เพิ่ม
                </Button>
              </>
            }
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>รายการ</TableHead>
                  <TableHead className="text-right">จำนวน</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>เพลงที่เผยแพร่</TableCell>
                  <TableCell className="text-right tabular-nums">1,248</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>เซ็ตลิสต์</TableCell>
                  <TableCell className="text-right tabular-nums">42</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </DataTableCard>
        </section>

        {/* —— Chart —— */}
        <section className="space-y-4" aria-labelledby="showcase-chart">
          <h2 id="showcase-chart" className="text-section-title">
            กราฟ (ChartCard)
          </h2>
          <ChartCard
            title="แนวโน้มการใช้งาน"
            description="พื้นที่สำหรับ Recharts — ถ้ายังไม่มีข้อมูลจะแสดง placeholder"
            action={
              <Button type="button" variant="outline" size="sm">
                รายงาน
              </Button>
            }
          >
            <div className="flex h-44 items-end justify-center gap-2 px-2 sm:gap-3">
              {(
                [
                  "h-12",
                  "h-20",
                  "h-14",
                  "h-24",
                  "h-16",
                  "h-[5.5rem]",
                  "h-14",
                ] as const
              ).map((hClass, i) => (
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
              แท่งตัวอย่าง — แทนที่ด้วยกราฟจริงและข้อมูลจาก API
            </p>
          </ChartCard>
        </section>

        {/* —— Activity —— */}
        <section className="space-y-4" aria-labelledby="showcase-activity">
          <h2 id="showcase-activity" className="text-section-title">
            กิจกรรมล่าสุด (ActivityList)
          </h2>
          <ActivityList
            title="ล่าสุด"
            description="รายการแบบแดชบอร์ด — รองรับลิงก์"
            items={[
              {
                id: "1",
                icon: <Music className="h-4 w-4" aria-hidden />,
                title: "แก้ไขเพลง «พระเจ้าทรงยิ่งใหญ่»",
                description: "อัปเดตเนื้อร้องท่อน B",
                time: "10 นาทีที่แล้ว",
              },
              {
                id: "2",
                icon: <Radio className="h-4 w-4" aria-hidden />,
                title: "เริ่มเซสชันไลฟ์",
                description: "คริสตจักรตัวอย่าง",
                time: "เมื่อวาน",
                href: "/dashboard/live",
              },
              {
                id: "3",
                icon: <User className="h-4 w-4" aria-hidden />,
                title: "อัปเดตโปรไฟล์",
                time: "3 วันก่อน",
              },
            ]}
          />
        </section>

        {/* —— Empty state —— */}
        <section className="space-y-4" aria-labelledby="showcase-empty">
          <h2 id="showcase-empty" className="text-section-title">
            สถานะว่าง (EmptyState)
          </h2>
          <EmptyState
            icon={Inbox}
            title="ยังไม่มีรายการ"
            description="ใช้เมื่อไม่มีข้อมูล — พื้น dashed border ไม่ใช้ glass"
          >
            <Button type="button" size="sm">
              เพิ่มรายการ
            </Button>
          </EmptyState>
        </section>

        {/* —— Loading —— */}
        <section className="space-y-4" aria-labelledby="showcase-loading">
          <h2 id="showcase-loading" className="text-section-title">
            สถานะโหลด (Skeleton)
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden">
                <CardHeader className="space-y-2 pb-2">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-16" variant="text" />
                </CardHeader>
                <CardContent className="space-y-3 pb-5 pt-0">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-3 w-full max-w-[12rem]" variant="text" />
                </CardContent>
              </Card>
            ))}
          </div>
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-full max-w-md" variant="text" />
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 shrink-0" variant="circular" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-2/3" variant="text" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 shrink-0" variant="circular" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-3/4" variant="text" />
                </div>
              </div>
            </CardContent>
          </Card>
          <TableContainer>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>คอลัมน์ A</TableHead>
                  <TableHead>คอลัมน์ B</TableHead>
                  <TableHead className="text-right">คอลัมน์ C</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[0, 1, 2].map((row) => (
                  <TableRow key={row}>
                    <TableCell>
                      <Skeleton className="h-4 w-32" variant="text" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" variant="text" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="ml-auto h-4 w-16" variant="text" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </section>

        {/* —— Theme tokens —— */}
        <section className="space-y-4" aria-labelledby="showcase-theme">
          <h2 id="showcase-theme" className="text-section-title">
            ธีมสว่าง / มืด
          </h2>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Sun className="h-5 w-5 text-amber-500" aria-hidden />
                <Moon className="h-5 w-5 text-slate-400" aria-hidden />
                ความเข้ากันได้ของธีม
              </CardTitle>
              <CardDescription>
                สลับโหมดจากไอคอนในแถบด้านบน — โทเค็น semantic (background, card, border, muted)
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-border bg-background p-3 text-center text-xs font-medium text-muted-foreground">
                bg-background
              </div>
              <div className="rounded-lg border border-border bg-card p-3 text-center text-xs font-medium shadow-card">
                bg-card
              </div>
              <div className="rounded-lg border border-border bg-muted p-3 text-center text-xs font-medium text-muted-foreground">
                bg-muted
              </div>
            </CardContent>
          </Card>
        </section>

        {/* —— Footer —— */}
        <p className="border-t border-border pt-8 text-center text-helper">
          <LayoutTemplate
            className="mr-1 inline h-3.5 w-3.5 align-text-bottom"
            aria-hidden
          />
          Golden reference — อิงโครง Celestial admin (sidebar + topbar) · primitive ร่วมกันทั้งโปรเจกต์
        </p>
      </PageContainer>
    </>
  );
}
