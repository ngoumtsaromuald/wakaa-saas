
"use client";

import { useState, useEffect } from "react";
import { 
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  CreditCard,
  BarChart3,
  Settings,
  MessageSquare,
  Package,
  Bell,
  HelpCircle,
  LogOut,
  User,
  Crown
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { useOrders } from "@/hooks/useOrders";
import { useNotifications } from "@/hooks/useNotifications";
import { toast } from "sonner";

const menuItems = [
  {
    title: "Vue d'ensemble",
    icon: LayoutDashboard,
    href: "/dashboard",
    badge: null
  },
  {
    title: "Commandes",
    icon: ShoppingCart,
    href: "/dashboard/orders",
    badge: "pending_orders"
  },
  {
    title: "Clients",
    icon: Users,
    href: "/dashboard/customers",
    badge: null
  },
  {
    title: "Produits",
    icon: Package,
    href: "/dashboard/products",
    badge: null
  },
  {
    title: "Paiements",
    icon: CreditCard,
    href: "/dashboard/payments",
    badge: null
  },
  {
    title: "WhatsApp",
    icon: MessageSquare,
    href: "/dashboard/whatsapp",
    badge: "whatsapp_notifications"
  },
  {
    title: "Analytics",
    icon: BarChart3,
    href: "/dashboard/analytics",
    badge: null
  },
  {
    title: "Paramètres",
    icon: Settings,
    href: "/dashboard/settings",
    badge: null
  }
];

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [merchantId, setMerchantId] = useState<number | null>(null);

  // Récupérer l'ID du marchand depuis la base de données
  useEffect(() => {
    const fetchMerchantId = async () => {
      if (user?.role === 'merchant' && user?.email) {
        try {
          // Récupérer l'ID du marchand depuis l'API
          const merchants = await fetch(`/next_api/merchants?search=${user.email}`)
            .then(res => res.json())
            .then(data => data.data || []);
          
          if (merchants.length > 0) {
            setMerchantId(merchants[0].id);
          }
        } catch (error) {
          console.error('Erreur lors de la récupération de l\'ID marchand:', error);
          setMerchantId(1); // Fallback
        }
      } else {
        setMerchantId(1); // Fallback pour les tests
      }
    };

    fetchMerchantId();
  }, [user]);

  // Hooks pour les badges en temps réel (seulement si merchantId est disponible)
  const { orders } = useOrders({ 
    merchantId: merchantId || undefined, 
    autoRefresh: !!merchantId,
    refreshInterval: 30000 
  });
  
  const { notifications } = useNotifications({ 
    merchantId: merchantId || undefined,
    autoRefresh: !!merchantId,
    refreshInterval: 30000 
  });

  // Calculer les badges dynamiques
  const getBadgeValue = (badgeType: string) => {
    if (!merchantId) return null;
    
    switch (badgeType) {
      case 'pending_orders':
        return orders.filter(o => o.status === 'pending').length;
      case 'whatsapp_notifications':
        return notifications.filter(n => n.channel === 'whatsapp' && n.status === 'pending').length;
      default:
        return null;
    }
  };

  // Gérer la déconnexion
  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Déconnexion réussie');
      router.push('/auth/login');
    } catch (error) {
      toast.error('Erreur lors de la déconnexion');
    }
  };

  // Obtenir les initiales de l'utilisateur
  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar className="border-r">
          <SidebarHeader className="border-b p-4">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-green-600 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">W</span>
              </div>
              <div>
                <span className="text-lg font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                  Wakaa
                </span>
                <div className="flex items-center space-x-1">
                  <Badge variant="secondary" className="text-xs">
                    <Crown className="w-3 h-3 mr-1" />
                    Premium
                  </Badge>
                </div>
              </div>
            </Link>
          </SidebarHeader>

          <SidebarContent className="p-2">
            <SidebarMenu>
              {menuItems.map((item) => {
                const badgeValue = item.badge ? getBadgeValue(item.badge) : null;
                const showBadge = badgeValue && badgeValue > 0;
                
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.href}
                      className="w-full justify-start"
                    >
                      <Link href={item.href} className="flex items-center space-x-3">
                        <item.icon className="w-4 h-4" />
                        <span>{item.title}</span>
                        {showBadge && (
                          <Badge variant="secondary" className="ml-auto text-xs">
                            {badgeValue}
                          </Badge>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="border-t p-4">
            <div className="flex items-center space-x-3">
              <Avatar className="w-8 h-8">
                <AvatarImage src={user?.avatar_url} />
                <AvatarFallback>
                  {user?.full_name ? getUserInitials(user.full_name) : 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {user?.full_name || 'Utilisateur'}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.email}
                </p>
              </div>
            </div>
          </SidebarFooter>
        </Sidebar>

        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-16 items-center justify-between px-6">
              <div className="flex items-center space-x-4">
                <SidebarTrigger />
                <div>
                  <h1 className="text-lg font-semibold">
                    {menuItems.find(item => item.href === pathname)?.title || "Dashboard"}
                  </h1>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                {/* Notifications en temps réel */}
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="w-4 h-4" />
                  {notifications.filter(n => n.status === 'pending').length > 0 && (
                    <Badge className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center p-0 text-xs bg-red-500">
                      {notifications.filter(n => n.status === 'pending').length}
                    </Badge>
                  )}
                </Button>

                {/* Help */}
                <Button variant="ghost" size="icon">
                  <HelpCircle className="w-4 h-4" />
                </Button>

                <ThemeToggle />

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user?.avatar_url} />
                        <AvatarFallback>
                          {user?.full_name ? getUserInitials(user.full_name) : 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {user?.full_name || 'Utilisateur'}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user?.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/profile">
                        <User className="mr-2 h-4 w-4" />
                        <span>Profil</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/settings">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Paramètres</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Déconnexion</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
