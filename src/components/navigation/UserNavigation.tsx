"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Settings,
  CreditCard,
  BarChart3,
  LogOut,
  ChevronDown,
  Shield,
  Package
} from "lucide-react";
import { toast } from "sonner";

export function UserNavigation() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  if (!user) return null;

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      toast.success("Déconnexion réussie");
      router.push("/");
    } catch (error) {
      toast.error("Erreur lors de la déconnexion");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleLabel = (role: string) => {
    const roleLabels = {
      merchant: "Marchand",
      customer: "Client",
      admin: "Admin",
      super_admin: "Super Admin",
      support: "Support",
      analyst: "Analyste"
    };
    return roleLabels[role as keyof typeof roleLabels] || role;
  };

  const getRoleColor = (role: string) => {
    const roleColors = {
      merchant: "bg-green-100 text-green-800",
      customer: "bg-blue-100 text-blue-800",
      admin: "bg-purple-100 text-purple-800",
      super_admin: "bg-red-100 text-red-800",
      support: "bg-orange-100 text-orange-800",
      analyst: "bg-teal-100 text-teal-800"
    };
    return roleColors[role as keyof typeof roleColors] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="flex items-center space-x-4">
      {/* Accès rapide Dashboard */}
      <Button variant="ghost" asChild>
        <Link href="/dashboard" className="hidden sm:flex items-center space-x-2">
          <BarChart3 className="w-4 h-4" />
          <span>Dashboard</span>
        </Link>
      </Button>

      {/* Menu utilisateur */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex items-center space-x-2 px-2">
            <Avatar className="w-8 h-8">
              <AvatarImage src={user.avatar_url} alt={user.full_name} />
              <AvatarFallback className="text-xs">
                {getInitials(user.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="hidden md:flex flex-col items-start">
              <span className="text-sm font-medium">{user.full_name}</span>
              <Badge variant="secondary" className={`text-xs ${getRoleColor(user.role)}`}>
                {getRoleLabel(user.role)}
              </Badge>
            </div>
            <ChevronDown className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium">{user.full_name}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
          </DropdownMenuLabel>
          
          <DropdownMenuSeparator />

          {/* Navigation principale */}
          <DropdownMenuItem asChild>
            <Link href="/dashboard" className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span>Dashboard</span>
            </Link>
          </DropdownMenuItem>

          {user.role === 'merchant' && (
            <DropdownMenuItem asChild>
              <Link href="/orders" className="flex items-center space-x-2">
                <Package className="w-4 h-4" />
                <span>Commandes</span>
              </Link>
            </DropdownMenuItem>
          )}

          <DropdownMenuItem asChild>
            <Link href="/profile" className="flex items-center space-x-2">
              <User className="w-4 h-4" />
              <span>Profil</span>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <Link href="/settings" className="flex items-center space-x-2">
              <Settings className="w-4 h-4" />
              <span>Paramètres</span>
            </Link>
          </DropdownMenuItem>

          {user.role === 'merchant' && (
            <DropdownMenuItem asChild>
              <Link href="/subscription" className="flex items-center space-x-2">
                <CreditCard className="w-4 h-4" />
                <span>Abonnement</span>
              </Link>
            </DropdownMenuItem>
          )}

          {(user.role === 'admin' || (user.role as any) === 'super_admin') && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/admin" className="flex items-center space-x-2">
                  <Shield className="w-4 h-4" />
                  <span>Administration</span>
                </Link>
              </DropdownMenuItem>
            </>
          )}

          <DropdownMenuSeparator />
          
          <DropdownMenuItem 
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="text-red-600 focus:text-red-600"
          >
            <LogOut className="w-4 h-4 mr-2" />
            {isLoggingOut ? "Déconnexion..." : "Se déconnecter"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}