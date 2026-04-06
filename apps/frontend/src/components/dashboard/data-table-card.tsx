import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  type CardProps,
} from "@/components/ui/card";
import { TableContainer } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export type DataTableCardProps = {
  title: string;
  description?: React.ReactNode;
  /** ปุ่มกรอง / สร้าง / ดาวน์โหลด ฯลฯ */
  headerActions?: React.ReactNode;
  /** เนื้อหาตาราง — มักเป็น TableContainer + Table + … */
  children: React.ReactNode;
  className?: string;
  cardVariant?: CardProps["variant"];
  /** ส่งต่อไปยัง TableContainer (เช่น className) */
  tableContainerProps?: React.ComponentProps<typeof TableContainer>;
};

/**
 * ตารางในการ์ด — หัวชัด แยก action ขวา เส้นคั่นระหว่างหัวกับตาราง
 */
export function DataTableCard({
  title,
  description,
  headerActions,
  children,
  className,
  cardVariant = "default",
  tableContainerProps,
}: DataTableCardProps) {
  return (
    <Card variant={cardVariant} className={cn("overflow-hidden", className)}>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4 space-y-0 pb-4">
        <div className="min-w-0 space-y-1">
          <CardTitle className="text-base md:text-lg">{title}</CardTitle>
          {description ? (
            <CardDescription>{description}</CardDescription>
          ) : null}
        </div>
        {headerActions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {headerActions}
          </div>
        ) : null}
      </CardHeader>
      <CardContent className="p-0">
        <div className="border-t border-border">
          <TableContainer
            variant="flat"
            {...tableContainerProps}
            className={cn(
              "rounded-none border-0 border-t-0 bg-transparent shadow-none",
              tableContainerProps?.className,
            )}
          >
            {children}
          </TableContainer>
        </div>
      </CardContent>
    </Card>
  );
}
