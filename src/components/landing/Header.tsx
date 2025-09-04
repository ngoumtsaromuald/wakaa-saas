
"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { 
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, MessageSquare, CreditCard, BarChart3, Users } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { UserNavigation } from "@/components/navigation/UserNavigation";

const features = [
  {
    title: "Gestion WhatsApp",
    description: "Automatisation complète des commandes",
    icon: MessageSquare,
    href: "/features/whatsapp"
  },
  {
    title: "Paiements Mobiles",
    description: "MTN & Orange Money intégrés",
    icon: CreditCard,
    href: "/features/payments"
  },
  {
    title: "Analytics Avancées",
    description: "Tableaux de bord en temps réel",
    icon: BarChart3,
    href: "/features/analytics"
  },
  {
    title: "Gestion Clients",
    description: "CRM complet et segmentation",
    icon: Users,
    href: "/features/crm"
  }
];

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, loading } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-green-600 to-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">W</span>
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            Wakaa
          </span>
        </Link>

        {/* Desktop Navigation */}
        <NavigationMenu className="hidden md:flex">
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Fonctionnalités</NavigationMenuTrigger>
              <NavigationMenuContent>
                <div className="grid w-[600px] gap-3 p-4 md:grid-cols-2">
                  {features.map((feature) => (
                    <NavigationMenuLink key={feature.title} asChild>
                      <Link
                        href={feature.href}
                        className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                      >
                        <div className="flex items-center space-x-2">
                          <feature.icon className="w-4 h-4 text-green-600" />
                          <div className="text-sm font-medium leading-none">
                            {feature.title}
                          </div>
                        </div>
                        <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                          {feature.description}
                        </p>
                      </Link>
                    </NavigationMenuLink>
                  ))}
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>
            
            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <Link href="/pricing" className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50">
                  Tarifs
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
            
            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <Link href="/about" className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50">
                  À Propos
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
            
            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <Link href="/contact" className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50">
                  Contact
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center space-x-4">
          <ThemeToggle />
          {!loading && (
            user ? (
              <UserNavigation />
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/auth/login">Connexion</Link>
                </Button>
                <Button className="bg-green-600 hover:bg-green-700" asChild>
                  <Link href="/auth/register">Commencer</Link>
                </Button>
              </>
            )
          )}
        </div>

        {/* Mobile Menu */}
        <div className="flex md:hidden items-center space-x-2">
          <ThemeToggle />
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <nav className="flex flex-col space-y-4">
                <Link
                  href="/features"
                  className="text-lg font-medium hover:text-green-600 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  Fonctionnalités
                </Link>
                <Link
                  href="/pricing"
                  className="text-lg font-medium hover:text-green-600 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  Tarifs
                </Link>
                <Link
                  href="/about"
                  className="text-lg font-medium hover:text-green-600 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  À Propos
                </Link>
                <Link
                  href="/contact"
                  className="text-lg font-medium hover:text-green-600 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  Contact
                </Link>
                
                <div className="pt-4 border-t space-y-2">
                  {!loading && (
                    user ? (
                      <>
                        <Button variant="outline" className="w-full" asChild>
                          <Link href="/dashboard" onClick={() => setIsOpen(false)}>
                            Dashboard
                          </Link>
                        </Button>
                        <Button variant="outline" className="w-full" asChild>
                          <Link href="/profile" onClick={() => setIsOpen(false)}>
                            Profil
                          </Link>
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button variant="outline" className="w-full" asChild>
                          <Link href="/auth/login" onClick={() => setIsOpen(false)}>
                            Connexion
                          </Link>
                        </Button>
                        <Button className="w-full bg-green-600 hover:bg-green-700" asChild>
                          <Link href="/auth/register" onClick={() => setIsOpen(false)}>
                            Commencer
                          </Link>
                        </Button>
                      </>
                    )
                  )}
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
