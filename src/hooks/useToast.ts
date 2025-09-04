"use client";

import { useRef } from 'react';
import { toast } from 'sonner';

interface ToastOptions {
  id?: string;
  duration?: number;
  preventDuplicates?: boolean;
}

export function useToast() {
  const toastIds = useRef<Set<string>>(new Set());
  const lastToastTime = useRef<Map<string, number>>(new Map());

  const showToast = (
    type: 'success' | 'error' | 'warning' | 'info',
    message: string,
    options: ToastOptions = {}
  ) => {
    const { 
      id = message, 
      duration = 4000, 
      preventDuplicates = true 
    } = options;

    // Prévenir les doublons si activé
    if (preventDuplicates) {
      const now = Date.now();
      const lastTime = lastToastTime.current.get(id);
      
      // Si le même message a été affiché il y a moins de 2 secondes, l'ignorer
      if (lastTime && (now - lastTime) < 2000) {
        return;
      }
      
      lastToastTime.current.set(id, now);
    }

    // Fermer le toast précédent avec le même ID s'il existe
    if (toastIds.current.has(id)) {
      toast.dismiss(id);
    }

    let toastId: string | number;

    switch (type) {
      case 'success':
        toastId = toast.success(message, { id, duration });
        break;
      case 'error':
        toastId = toast.error(message, { id, duration });
        break;
      case 'warning':
        toastId = toast.warning(message, { id, duration });
        break;
      case 'info':
        toastId = toast.info(message, { id, duration });
        break;
      default:
        toastId = toast(message, { id, duration });
    }

    toastIds.current.add(String(toastId));

    // Nettoyer l'ID après la durée du toast
    setTimeout(() => {
      toastIds.current.delete(String(toastId));
      lastToastTime.current.delete(id);
    }, duration + 1000);

    return toastId;
  };

  return {
    success: (message: string, options?: ToastOptions) => 
      showToast('success', message, options),
    error: (message: string, options?: ToastOptions) => 
      showToast('error', message, options),
    warning: (message: string, options?: ToastOptions) => 
      showToast('warning', message, options),
    info: (message: string, options?: ToastOptions) => 
      showToast('info', message, options),
    dismiss: (id?: string) => toast.dismiss(id),
    dismissAll: () => toast.dismiss()
  };
}