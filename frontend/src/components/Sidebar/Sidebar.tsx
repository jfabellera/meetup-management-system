import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  Sidebar as SidebarPrimitive,
} from '@/components/ui/sidebar';
import { type Dispatch, type ReactNode, type SetStateAction } from 'react';
import { type IconType } from 'react-icons';
import { FiArrowLeft } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

export interface SidebarItem {
  name: string;
  value: string;
  icon: IconType;
  url: string;
}

export interface SidebarBackLink {
  label: string;
  url: string;
}

interface SidebarProps {
  sidebarItems: SidebarItem[];
  value: string;
  setValue: Dispatch<SetStateAction<string>>;
  /** Optional link rendered above the nav for returning to a parent view. */
  backTo?: SidebarBackLink;
  mobileOpen?: boolean;
  setMobileOpen?: (open: boolean) => void;
}

/**
 * Desktop navigation rail built on shadcn's sidebar primitives. When
 * {@link SidebarProps.setMobileOpen} is provided it also renders a mobile
 * drawer; otherwise mobile navigation is handled by
 * {@link ../BottomNav/BottomNav BottomNav} instead.
 */
const Sidebar = ({
  sidebarItems,
  value,
  setValue,
  backTo,
  mobileOpen,
  setMobileOpen,
}: SidebarProps): ReactNode => {
  const navigate = useNavigate();

  const goTo = (url: string, itemValue?: string): void => {
    if (itemValue != null) setValue(itemValue);
    void navigate(url, { replace: itemValue != null });
    setMobileOpen?.(false);
  };

  const menu = (
    <>
      {backTo != null ? (
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                className="text-muted-foreground"
                onClick={() => {
                  goTo(backTo.url);
                }}
              >
                <FiArrowLeft />
                <span>{backTo.label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
      ) : null}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.value}>
                    <SidebarMenuButton
                      isActive={item.value === value}
                      onClick={() => {
                        goTo(item.url, item.value);
                      }}
                      className="data-[active=true]:bg-primary data-[active=true]:text-primary-foreground data-[active=true]:hover:bg-primary data-[active=true]:hover:text-primary-foreground"
                    >
                      <Icon />
                      <span>{item.name}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </>
  );

  return (
    <>
      <SidebarPrimitive
        collapsible="none"
        className="hidden h-full border-r md:flex"
      >
        {menu}
      </SidebarPrimitive>
      {setMobileOpen != null ? (
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent
            side="left"
            showCloseButton={false}
            // Slide over the content area only; the navbar (h-16) sits at the top of the viewport.
            overlayClassName="top-16!"
            className="bg-sidebar top-16! h-auto! w-64 gap-0 p-0"
          >
            <SheetHeader className="sr-only">
              <SheetTitle>Menu</SheetTitle>
            </SheetHeader>
            <div className="text-sidebar-foreground flex h-full w-full flex-col">
              {menu}
            </div>
          </SheetContent>
        </Sheet>
      ) : null}
    </>
  );
};

export default Sidebar;
