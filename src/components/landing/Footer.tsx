
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { 
  Facebook, 
  Twitter, 
  Instagram, 
  Linkedin, 
  Mail, 
  Phone, 
  MapPin,
  MessageSquare
} from "lucide-react";

const footerLinks = {
  product: [
    { name: "Fonctionnalités", href: "/features" },
    { name: "Tarifs", href: "/pricing" },
    { name: "Intégrations", href: "/integrations" },
    { name: "API", href: "/api" },
    { name: "Sécurité", href: "/security" }
  ],
  company: [
    { name: "À Propos", href: "/about" },
    { name: "Blog", href: "/blog" },
    { name: "Carrières", href: "/careers" },
    { name: "Presse", href: "/press" },
    { name: "Partenaires", href: "/partners" }
  ],
  support: [
    { name: "Centre d'Aide", href: "/help" },
    { name: "Documentation", href: "/docs" },
    { name: "Statut", href: "/status" },
    { name: "Contact", href: "/contact" },
    { name: "Formation", href: "/training" }
  ],
  legal: [
    { name: "Confidentialité", href: "/privacy" },
    { name: "Conditions", href: "/terms" },
    { name: "Cookies", href: "/cookies" },
    { name: "RGPD", href: "/gdpr" },
    { name: "Licences", href: "/licenses" }
  ]
};

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 py-16">
        {/* Newsletter Section */}
        <div className="mb-12 text-center">
          <h3 className="text-2xl font-bold mb-4">
            Restez Informé des Dernières Nouveautés
          </h3>
          <p className="text-gray-400 mb-6 max-w-2xl mx-auto">
            Recevez nos conseils business, mises à jour produit et success stories 
            directement dans votre boîte mail.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <Input 
              type="email" 
              placeholder="Votre adresse email"
              className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-400"
            />
            <Button className="bg-green-600 hover:bg-green-700">
              S'abonner
            </Button>
          </div>
        </div>

        <Separator className="bg-gray-800 mb-12" />

        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 mb-12">
          {/* Company Info */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-green-600 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">W</span>
              </div>
              <span className="text-xl font-bold">Wakaa</span>
            </Link>
            
            <p className="text-gray-400 mb-6 max-w-sm">
              La plateforme SaaS qui transforme la gestion chaotique des commandes WhatsApp 
              en un système structuré et automatisé pour les micro-entrepreneurs camerounais.
            </p>
            
            <div className="space-y-2 text-sm text-gray-400">
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4" />
                <span>Douala, Cameroun</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4" />
                <span>+237 6XX XXX XXX</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4" />
                <span>contact@wakaa.io</span>
              </div>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="font-semibold mb-4">Produit</h4>
            <ul className="space-y-2">
              {footerLinks.product.map((link) => (
                <li key={link.name}>
                  <Link 
                    href={link.href}
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="font-semibold mb-4">Entreprise</h4>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link 
                    href={link.href}
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <Link 
                    href={link.href}
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="font-semibold mb-4">Légal</h4>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <Link 
                    href={link.href}
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Separator className="bg-gray-800 mb-8" />

        {/* Bottom Footer */}
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="text-gray-400 text-sm mb-4 md:mb-0">
            © 2025 Wakaa. Tous droits réservés.
          </div>
          
          {/* Social Links */}
          <div className="flex space-x-4">
            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
              <Facebook className="w-4 h-4" />
              <span className="sr-only">Facebook</span>
            </Button>
            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
              <Twitter className="w-4 h-4" />
              <span className="sr-only">Twitter</span>
            </Button>
            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
              <Instagram className="w-4 h-4" />
              <span className="sr-only">Instagram</span>
            </Button>
            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
              <Linkedin className="w-4 h-4" />
              <span className="sr-only">LinkedIn</span>
            </Button>
            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
              <MessageSquare className="w-4 h-4" />
              <span className="sr-only">WhatsApp</span>
            </Button>
          </div>
        </div>
      </div>
    </footer>
  );
}
