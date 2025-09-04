/**
 * Utilitaires de validation pour l'authentification
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Valider les données de connexion
 */
export function validateLoginData(email: string, password: string): ValidationResult {
  const errors: string[] = [];

  // Validation de l'email
  if (!email) {
    errors.push('L\'adresse email est obligatoire');
  } else if (!isValidEmail(email)) {
    errors.push('Format d\'email invalide');
  }

  // Validation du mot de passe
  if (!password) {
    errors.push('Le mot de passe est obligatoire');
  } else if (password.length < 3) { // Minimum très bas pour les tests
    errors.push('Le mot de passe est trop court');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Valider les données d'inscription
 */
export function validateRegistrationData(data: {
  email: string;
  password: string;
  full_name: string;
  role: string;
  business_name?: string;
}): ValidationResult {
  const errors: string[] = [];

  // Validation de l'email
  if (!data.email) {
    errors.push('L\'adresse email est obligatoire');
  } else if (!isValidEmail(data.email)) {
    errors.push('Format d\'email invalide');
  }

  // Validation du mot de passe
  if (!data.password) {
    errors.push('Le mot de passe est obligatoire');
  } else if (data.password.length < 8) {
    errors.push('Le mot de passe doit contenir au moins 8 caractères');
  } else if (!isStrongPassword(data.password)) {
    errors.push('Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre');
  }

  // Validation du nom complet
  if (!data.full_name) {
    errors.push('Le nom complet est obligatoire');
  } else if (data.full_name.length < 2) {
    errors.push('Le nom complet doit contenir au moins 2 caractères');
  }

  // Validation du rôle
  const validRoles = ['merchant', 'customer', 'admin'];
  if (!data.role) {
    errors.push('Le rôle est obligatoire');
  } else if (!validRoles.includes(data.role)) {
    errors.push('Rôle invalide');
  }

  // Validation spécifique pour les marchands
  if (data.role === 'merchant') {
    if (!data.business_name) {
      errors.push('Le nom de l\'entreprise est obligatoire pour les marchands');
    } else if (data.business_name.length < 2) {
      errors.push('Le nom de l\'entreprise doit contenir au moins 2 caractères');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Valider un format d'email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Vérifier la force d'un mot de passe
 */
export function isStrongPassword(password: string): boolean {
  // Au moins 8 caractères, une majuscule, une minuscule, un chiffre
  const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  return strongPasswordRegex.test(password);
}

/**
 * Valider un numéro de téléphone (format international)
 */
export function isValidPhoneNumber(phone: string): boolean {
  // Format international basique: +[code pays][numéro]
  const phoneRegex = /^\+[1-9]\d{1,14}$/;
  return phoneRegex.test(phone);
}

/**
 * Valider les données de profil utilisateur
 */
export function validateProfileData(data: {
  full_name?: string;
  email?: string;
  phone_number?: string;
  address?: string;
}): ValidationResult {
  const errors: string[] = [];

  // Validation du nom complet
  if (data.full_name !== undefined) {
    if (!data.full_name) {
      errors.push('Le nom complet ne peut pas être vide');
    } else if (data.full_name.length < 2) {
      errors.push('Le nom complet doit contenir au moins 2 caractères');
    }
  }

  // Validation de l'email
  if (data.email !== undefined) {
    if (!data.email) {
      errors.push('L\'adresse email ne peut pas être vide');
    } else if (!isValidEmail(data.email)) {
      errors.push('Format d\'email invalide');
    }
  }

  // Validation du numéro de téléphone
  if (data.phone_number !== undefined && data.phone_number) {
    if (!isValidPhoneNumber(data.phone_number)) {
      errors.push('Format de numéro de téléphone invalide (utilisez le format international +237...)');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Valider les données d'un marchand
 */
export function validateMerchantData(data: {
  business_name?: string;
  email?: string;
  whatsapp_number?: string;
  city?: string;
  country?: string;
}): ValidationResult {
  const errors: string[] = [];

  // Validation du nom de l'entreprise
  if (data.business_name !== undefined) {
    if (!data.business_name) {
      errors.push('Le nom de l\'entreprise est obligatoire');
    } else if (data.business_name.length < 2) {
      errors.push('Le nom de l\'entreprise doit contenir au moins 2 caractères');
    }
  }

  // Validation de l'email
  if (data.email !== undefined) {
    if (!data.email) {
      errors.push('L\'adresse email est obligatoire');
    } else if (!isValidEmail(data.email)) {
      errors.push('Format d\'email invalide');
    }
  }

  // Validation du numéro WhatsApp
  if (data.whatsapp_number !== undefined && data.whatsapp_number) {
    if (!isValidPhoneNumber(data.whatsapp_number)) {
      errors.push('Format de numéro WhatsApp invalide (utilisez le format international +237...)');
    }
  }

  // Validation de la ville
  if (data.city !== undefined && data.city && data.city.length < 2) {
    errors.push('Le nom de la ville doit contenir au moins 2 caractères');
  }

  // Validation du pays
  if (data.country !== undefined && data.country && data.country.length < 2) {
    errors.push('Le nom du pays doit contenir au moins 2 caractères');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Nettoyer et normaliser les données d'entrée
 */
export function sanitizeInput(input: string): string {
  return input.trim().replace(/\s+/g, ' ');
}

/**
 * Nettoyer un email
 */
export function sanitizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

/**
 * Nettoyer un numéro de téléphone
 */
export function sanitizePhoneNumber(phone: string): string {
  // Supprimer tous les caractères non numériques sauf le +
  return phone.replace(/[^\d+]/g, '');
}

/**
 * Générer un slug à partir d'un nom
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Supprimer les caractères spéciaux
    .replace(/\s+/g, '-') // Remplacer les espaces par des tirets
    .replace(/-+/g, '-') // Supprimer les tirets multiples
    .replace(/^-|-$/g, ''); // Supprimer les tirets en début/fin
}

/**
 * Vérifier si une chaîne contient des caractères dangereux
 */
export function containsDangerousChars(input: string): boolean {
  const dangerousChars = /<script|javascript:|data:|vbscript:|onload|onerror/i;
  return dangerousChars.test(input);
}

/**
 * Échapper les caractères HTML
 */
export function escapeHtml(input: string): string {
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
}