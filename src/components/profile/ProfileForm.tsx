/**
 * Formulaire de modification du profil marchand
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Globe, 
  Camera,
  Save,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { MerchantProfile } from '@/lib/subscription-validation';

interface ProfileFormProps {
  profile: MerchantProfile | null;
  onSave: (data: Partial<MerchantProfile>) => Promise<void>;
  isLoading?: boolean;
  className?: string;
}

const CURRENCIES = [
  { value: 'FCFA', label: 'FCFA (Franc CFA)' },
  { value: 'EUR', label: 'EUR (Euro)' },
  { value: 'USD', label: 'USD (Dollar US)' }
];

const TIMEZONES = [
  { value: 'Africa/Douala', label: 'Douala (GMT+1)' },
  { value: 'Africa/Yaoundé', label: 'Yaoundé (GMT+1)' },
  { value: 'Europe/Paris', label: 'Paris (GMT+1)' },
  { value: 'America/New_York', label: 'New York (GMT-5)' }
];

const COUNTRIES = [
  { value: 'Cameroon', label: 'Cameroun' },
  { value: 'France', label: 'France' },
  { value: 'Senegal', label: 'Sénégal' },
  { value: 'Ivory Coast', label: 'Côte d\'Ivoire' }
];

export const ProfileForm: React.FC<ProfileFormProps> = ({
  profile,
  onSave,
  isLoading = false,
  className = ''
}) => {
  const [formData, setFormData] = useState<Partial<MerchantProfile>>({});
  const [errors, setErrors] = useState<string[]>([]);
  const [success, setSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormData({
        business_name: profile.business_name || '',
        whatsapp_number: profile.whatsapp_number || '',
        email: profile.email || '',
        profile_image_url: profile.profile_image_url || '',
        address: profile.address || '',
        city: profile.city || '',
        country: profile.country || 'Cameroon',
        currency: profile.currency || 'FCFA',
        timezone: profile.timezone || 'Africa/Douala'
      });
    }
  }, [profile]);

  const handleInputChange = (field: keyof MerchantProfile, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Effacer les erreurs et le succès lors de la modification
    if (errors.length > 0) setErrors([]);
    if (success) setSuccess(false);
  };

  const validateForm = (): string[] => {
    const validationErrors: string[] = [];

    if (!formData.business_name?.trim()) {
      validationErrors.push('Le nom de l\'entreprise est obligatoire');
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      validationErrors.push('Le format de l\'email est invalide');
    }

    if (formData.whatsapp_number && !/^\+[1-9]\d{1,14}$/.test(formData.whatsapp_number)) {
      validationErrors.push('Le numéro WhatsApp doit être au format international (+237...)');
    }

    if (formData.profile_image_url) {
      try {
        new URL(formData.profile_image_url);
      } catch {
        validationErrors.push('L\'URL de l\'image de profil doit être valide');
      }
    }

    return validationErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSaving(true);
    setErrors([]);

    try {
      await onSave(formData);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde:', error);
      
      if (error.response?.data?.error?.details?.validationErrors) {
        setErrors(error.response.data.error.details.validationErrors);
      } else if (error.response?.data?.error?.message) {
        setErrors([error.response.data.error.message]);
      } else {
        setErrors(['Erreur lors de la sauvegarde du profil']);
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (!profile) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            Chargement du profil...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Mon profil
        </CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Messages d'erreur */}
          {errors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Message de succès */}
          {success && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Profil mis à jour avec succès !
              </AlertDescription>
            </Alert>
          )}

          {/* Informations de base */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="business_name">Nom de l'entreprise *</Label>
              <Input
                id="business_name"
                value={formData.business_name || ''}
                onChange={(e) => handleInputChange('business_name', e.target.value)}
                placeholder="Ex: Boutique Mama Grace"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="votre@email.com"
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsapp_number">Numéro WhatsApp</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="whatsapp_number"
                  value={formData.whatsapp_number || ''}
                  onChange={(e) => handleInputChange('whatsapp_number', e.target.value)}
                  placeholder="+237670123456"
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile_image_url">URL de l'image de profil</Label>
              <div className="relative">
                <Camera className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="profile_image_url"
                  type="url"
                  value={formData.profile_image_url || ''}
                  onChange={(e) => handleInputChange('profile_image_url', e.target.value)}
                  placeholder="https://exemple.com/image.jpg"
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Adresse */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Adresse</h3>
            
            <div className="space-y-2">
              <Label htmlFor="address">Adresse complète</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Textarea
                  id="address"
                  value={formData.address || ''}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="123 Rue de la Paix, Quartier Bonanjo"
                  className="pl-10"
                  rows={2}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">Ville</Label>
                <Input
                  id="city"
                  value={formData.city || ''}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="Douala"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Pays</Label>
                <Select
                  value={formData.country || 'Cameroon'}
                  onValueChange={(value) => handleInputChange('country', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((country) => (
                      <SelectItem key={country.value} value={country.value}>
                        {country.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Paramètres régionaux */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Paramètres régionaux</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="currency">Devise</Label>
                <Select
                  value={formData.currency || 'FCFA'}
                  onValueChange={(value) => handleInputChange('currency', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((currency) => (
                      <SelectItem key={currency.value} value={currency.value}>
                        {currency.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="timezone">Fuseau horaire</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Select
                    value={formData.timezone || 'Africa/Douala'}
                    onValueChange={(value) => handleInputChange('timezone', value)}
                  >
                    <SelectTrigger className="pl-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMEZONES.map((timezone) => (
                        <SelectItem key={timezone.value} value={timezone.value}>
                          {timezone.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          {/* Bouton de sauvegarde */}
          <div className="flex justify-end pt-4 border-t">
            <Button 
              type="submit" 
              disabled={isSaving || isLoading}
              className="min-w-32"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Sauvegarde...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Sauvegarder
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};