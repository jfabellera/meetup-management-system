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
import { cn } from '@/lib/utils';
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
  compact?: boolean;
  mobileOpen?: boolean;
  setMobileOpen?: (open: boolean) => void;
}

const activeItemClasses =
  'data-[active=true]:bg-transparent data-[active=true]:text-primary data-[active=true]:hover:bg-primary/10 data-[active=true]:hover:text-primary';

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
  compact = false,
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
                className="text-muted-foreground h-11 gap-3 px-3 text-[0.9375rem] [&>svg]:size-5"
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
            <SidebarMenu className="gap-2">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.value}>
                    <SidebarMenuButton
                      isActive={item.value === value}
                      onClick={() => {
                        goTo(item.url, item.value);
                      }}
                      className={cn(
                        activeItemClasses,
                        'h-11 gap-3 px-3 text-[0.9375rem] [&>svg]:size-5'
                      )}
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

  const compactMenu = (
    <SidebarContent>
      <SidebarGroup className="px-1.5">
        <SidebarGroupContent>
          <SidebarMenu className="gap-2">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              return (
                <SidebarMenuItem key={item.value}>
                  <SidebarMenuButton
                    isActive={item.value === value}
                    onClick={() => {
                      goTo(item.url, item.value);
                    }}
                    className={cn(
                      activeItemClasses,
                      'h-auto flex-col gap-1 px-1 py-2 text-xs font-medium [&>svg]:size-5'
                    )}
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
  );

  return (
    <>
      <SidebarPrimitive
        collapsible="none"
        className={cn(
          'hidden h-full border-r md:flex',
          compact && 'w-[4.5rem]'
        )}
      >
        {compact ? compactMenu : menu}
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
