import {
  SideMenuItem,
  type SideMenuItemProps,
} from "@/components/homepage/side-menu-item";

type SideMenuProps = {
  items: SideMenuItemProps[];
};

export function SideMenu({ items }: SideMenuProps) {
  return (
    <nav aria-label="ลิงก์ช่วยเหลือ">
      <ul className="space-y-0.5">
        {items.map((item) => (
          <SideMenuItem key={item.label} {...item} />
        ))}
      </ul>
    </nav>
  );
}
