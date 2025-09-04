
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  MessageSquare, 
  CreditCard, 
  BarChart3, 
  Shield, 
  Smartphone, 
  Users,
  CheckCircle,
  Star,
  ArrowRight,
  Zap,
  Globe,
  TrendingUp,
  User,
  Settings
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { useAuth } from "@/components/providers/AuthProvider";

const features = [
  {
    icon: MessageSquare,
    title: "Gestion WhatsApp Automatisée",
    description: "Réception et traitement automatique des commandes via WhatsApp avec parser intelligent NLP",
    color: "text-green-600"
  },
  {
    icon: CreditCard,
    title: "Paiements Mobiles Intégrés",
    description: "Intégration CinetPay pour MTN Mobile Money et Orange Money avec liens sécurisés",
    color: "text-blue-600"
  },
  {
    icon: BarChart3,
    title: "Tableaux de Bord Avancés",
    description: "Analytics temps réel, KPI, projections de revenus et rapports exportables",
    color: "text-purple-600"
  },
  {
    icon: Shield,
    title: "Sécurité Renforcée",
    description: "Chiffrement AES-256, authentification 2FA et conformité RGPD",
    color: "text-red-600"
  },
  {
    icon: Smartphone,
    title: "Progressive Web App",
    description: "Application mobile native avec synchronisation offline et notifications push",
    color: "text-orange-600"
  },
  {
    icon: Users,
    title: "Gestion Clients Complète",
    description: "CRM intégré avec historique, segmentation et campagnes marketing",
    color: "text-teal-600"
  }
];

const plans = [
  {
    name: "Gratuit",
    price: "0",
    period: "FCFA/mois",
    description: "Parfait pour débuter",
    features: [
      "10 commandes/mois",
      "Fonctionnalités de base",
      "Support communautaire",
      "Intégration WhatsApp",
      "Rapports basiques"
    ],
    popular: false,
    cta: "Commencer Gratuitement"
  },
  {
    name: "Standard",
    price: "5 000",
    period: "FCFA/mois",
    description: "Pour les entreprises en croissance",
    features: [
      "500 commandes/mois",
      "Analytics avancées",
      "Support email",
      "Paiements mobiles",
      "Gestion du stock",
      "Rapports détaillés"
    ],
    popular: true,
    cta: "Essai Gratuit 14 Jours"
  },
  {
    name: "Premium",
    price: "10 000",
    period: "FCFA/mois",
    description: "Pour les entreprises établies",
    features: [
      "Commandes illimitées",
      "Analytics premium",
      "Support prioritaire",
      "API access",
      "Intégrations avancées",
      "Formation personnalisée",
      "Manager dédié"
    ],
    popular: false,
    cta: "Contactez-nous"
  }
];

const testimonials = [
  {
    name: "Marie Ngono",
    business: "Boutique Mode Yaoundé",
    content: "Wakaa a transformé mon business ! Je gère maintenant 200+ commandes/mois sans stress.",
    rating: 5,
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=64&h=64&fit=crop&crop=face"
  },
  {
    name: "Jean-Paul Mbarga",
    business: "Électronique Douala",
    content: "Les paiements mobiles automatiques ont augmenté mes ventes de 300% en 6 mois.",
    rating: 5,
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=64&h=64&fit=crop&crop=face"
  },
  {
    name: "Fatima Bello",
    business: "Cosmétiques Naturels",
    content: "Interface intuitive, support excellent. Mes clients adorent la simplicité des commandes.",
    rating: 5,
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=64&h=64&fit=crop&crop=face"
  }
];

export function LandingPage() {
  const [activeTab, setActiveTab] = useState("features");
  const { user, loading } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Header />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {!loading && user ? (
              // Section pour utilisateur connecté
              <>
                <Badge variant="secondary" className="mb-4 px-4 py-2">
                  <User className="w-4 h-4 mr-2" />
                  Bienvenue, {user.full_name}
                </Badge>
                
                <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                  Bon retour sur Wakaa !
                </h1>
                
                <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
                  Continuez à développer votre business avec nos outils avancés. 
                  Accédez à votre dashboard pour gérer vos commandes et suivre vos performances.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                  <Button size="lg" className="bg-green-600 hover:bg-green-700" asChild>
                    <Link href="/dashboard">
                      Accéder au Dashboard
                      <BarChart3 className="ml-2 w-4 h-4" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <Link href="/profile">
                      <Settings className="mr-2 w-4 h-4" />
                      Mon Profil
                    </Link>
                  </Button>
                </div>
              </>
            ) : (
              // Section pour visiteur non connecté
              <>
                <Badge variant="secondary" className="mb-4 px-4 py-2">
                  <Zap className="w-4 h-4 mr-2" />
                  Plateforme SaaS N°1 au Cameroun
                </Badge>
                
                <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                  Transformez vos Commandes WhatsApp en Business Structuré
                </h1>
                
                <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
                  Wakaa automatise la gestion de vos commandes WhatsApp, intègre les paiements mobiles 
                  et vous donne les outils pour faire croître votre micro-entreprise au Cameroun.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                  <Button size="lg" className="bg-green-600 hover:bg-green-700" asChild>
                    <Link href="/auth/register">
                      Commencer Gratuitement
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <Link href="/demo">
                      Voir la Démo
                    </Link>
                  </Button>
                </div>
              </>
            )}
          </motion.div>
          
          {/* Hero Image/Video */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="relative"
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-4xl mx-auto">
              <Image 
                src="https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&h=500&fit=crop" 
                alt="Dashboard Wakaa"
                width={800}
                height={500}
                className="w-full h-auto rounded-lg"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Fonctionnalités Puissantes pour Votre Croissance
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Découvrez comment Wakaa révolutionne la gestion de votre business
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <feature.icon className={`w-12 h-12 ${feature.color} mb-4`} />
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Tarifs Transparents et Abordables
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Choisissez le plan qui correspond à vos besoins et votre budget
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className={`h-full relative ${plan.popular ? 'border-green-500 shadow-lg scale-105' : ''}`}>
                  {plan.popular && (
                    <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-green-600">
                      Plus Populaire
                    </Badge>
                  )}
                  
                  <CardHeader className="text-center">
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <div className="text-4xl font-bold text-green-600">
                      {plan.price}
                      <span className="text-lg text-muted-foreground ml-1">
                        {plan.period}
                      </span>
                    </div>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <ul className="space-y-3">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-center">
                          <CheckCircle className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    
                    <Button 
                      className={`w-full ${plan.popular ? 'bg-green-600 hover:bg-green-700' : ''}`}
                      variant={plan.popular ? 'default' : 'outline'}
                      asChild
                    >
                      <Link href="/auth/register">
                        {plan.cta}
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ce que Disent Nos Clients
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Découvrez comment Wakaa transforme les businesses de nos utilisateurs
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full">
                  <CardContent className="p-6">
                    <div className="flex mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                      ))}
                    </div>
                    
                    <p className="text-muted-foreground mb-6 italic">
                      "{testimonial.content}"
                    </p>
                    
                    <div className="flex items-center">
                      <Image 
                        src={testimonial.avatar}
                        alt={testimonial.name}
                        width={48}
                        height={48}
                        className="rounded-full mr-4"
                      />
                      <div>
                        <div className="font-semibold">{testimonial.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {testimonial.business}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <div className="text-4xl font-bold text-green-600 mb-2">500+</div>
              <div className="text-muted-foreground">Marchands Actifs</div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <div className="text-4xl font-bold text-blue-600 mb-2">50K+</div>
              <div className="text-muted-foreground">Commandes Traitées</div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <div className="text-4xl font-bold text-purple-600 mb-2">2M+</div>
              <div className="text-muted-foreground">FCFA Traités</div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              viewport={{ once: true }}
            >
              <div className="text-4xl font-bold text-orange-600 mb-2">99.9%</div>
              <div className="text-muted-foreground">Disponibilité</div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-green-600 to-blue-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Prêt à Transformer Votre Business ?
            </h2>
            
            <p className="text-xl mb-8 opacity-90">
              Rejoignez des centaines de micro-entrepreneurs qui ont déjà révolutionné 
              leur gestion des commandes avec Wakaa.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" asChild>
                <Link href="/auth/register">
                  Commencer Maintenant - Gratuit
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-green-600" asChild>
                <Link href="/contact">
                  Parler à un Expert
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
