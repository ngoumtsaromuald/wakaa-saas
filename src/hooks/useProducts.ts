
"use client";

import { useState, useEffect, useCallback } from 'react';
import { api, ApiError } from '@/lib/api-client';
import { toast } from 'sonner';

interface Product {
  id: number;
  merchant_id: number;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  category?: string;
  stock_quantity: number;
  is_active: boolean;
  sku?: string;
  weight?: number;
  dimensions?: any;
  create_time: string;
  modify_time: string;
}

interface UseProductsOptions {
  merchantId?: number;
  category?: string;
  isActive?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function useProducts(options: UseProductsOptions = {}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async (searchParams?: Record<string, string>) => {
    setLoading(true);
    setError(null);
    
    try {
      const params: Record<string, string> = {
        limit: '1000',
        offset: '0',
        ...searchParams
      };

      if (options.merchantId) {
        params.merchant_id = options.merchantId.toString();
      }

      if (options.category) {
        params.category = options.category;
      }

      if (options.isActive !== undefined) {
        params.is_active = options.isActive.toString();
      }

      const data = await api.get<Product[]>('/products', params);
      setProducts(data || []);
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Erreur lors du chargement des produits';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [options.merchantId, options.category, options.isActive]);

  const createProduct = async (productData: Partial<Product>) => {
    try {
      const newProduct = await api.post<Product>('/products', {
        ...productData,
        merchant_id: options.merchantId || productData.merchant_id
      });
      setProducts(prev => [newProduct, ...prev]);
      toast.success('Produit créé avec succès');
      return newProduct;
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Erreur lors de la création du produit';
      toast.error(errorMessage);
      throw err;
    }
  };

  const updateProduct = async (productId: number, updateData: Partial<Product>) => {
    try {
      const updatedProduct = await api.put<Product>(`/products?id=${productId}`, updateData);
      setProducts(prev => prev.map(product => 
        product.id === productId ? updatedProduct : product
      ));
      toast.success('Produit mis à jour avec succès');
      return updatedProduct;
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Erreur lors de la mise à jour du produit';
      toast.error(errorMessage);
      throw err;
    }
  };

  const deleteProduct = async (productId: number) => {
    try {
      await api.delete(`/products?id=${productId}`);
      setProducts(prev => prev.filter(product => product.id !== productId));
      toast.success('Produit supprimé avec succès');
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Erreur lors de la suppression du produit';
      toast.error(errorMessage);
      throw err;
    }
  };

  const toggleProductStatus = async (productId: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    try {
      const updatedProduct = await api.put<Product>(`/products?id=${productId}`, {
        is_active: !product.is_active
      });
      setProducts(prev => prev.map(p => 
        p.id === productId ? updatedProduct : p
      ));
      toast.success(`Produit ${updatedProduct.is_active ? 'activé' : 'désactivé'}`);
      return updatedProduct;
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Erreur lors de la mise à jour du statut';
      toast.error(errorMessage);
      throw err;
    }
  };

  const getProductById = (productId: number): Product | undefined => {
    return products.find(product => product.id === productId);
  };

  const getProductsByCategory = (category: string): Product[] => {
    return products.filter(product => product.category === category);
  };

  const getLowStockProducts = (threshold: number = 10): Product[] => {
    return products.filter(product => product.stock_quantity < threshold);
  };

  const searchProducts = (searchTerm: string): Product[] => {
    const term = searchTerm.toLowerCase();
    return products.filter(product => 
      product.name.toLowerCase().includes(term) ||
      product.description?.toLowerCase().includes(term) ||
      product.sku?.toLowerCase().includes(term)
    );
  };

  // Auto-refresh si activé
  useEffect(() => {
    if (options.autoRefresh) {
      const interval = setInterval(() => {
        fetchProducts();
      }, options.refreshInterval || 60000); // 1 minute par défaut

      return () => clearInterval(interval);
    }
  }, [fetchProducts, options.autoRefresh, options.refreshInterval]);

  // Chargement initial
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return {
    products,
    loading,
    error,
    fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    toggleProductStatus,
    getProductById,
    getProductsByCategory,
    getLowStockProducts,
    searchProducts,
    refresh: fetchProducts
  };
}
