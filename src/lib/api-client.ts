
// 前端 API 客户端 - 用于调用 Next.js API 路由
// 替代直接的 postgrest 调用

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function apiRequest<T = any>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  try {
    // Récupérer le token d'authentification (côté client uniquement)
    let token = '';
    if (typeof window !== 'undefined') {
      token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token') || '';
    }
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options?.headers as Record<string, string>,
    };

    // Ajouter le token d'authentification si disponible
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      headers['X-Session-Token'] = token;
    }

    const response = await fetch(`/next_api${endpoint}`, {
      ...options,
      headers,
    });

    const result: ApiResponse<T> = await response.json();

    if (!response.ok || !result.success) {
      // Si erreur d'authentification, rediriger vers la page de connexion
      if (response.status === 401 && typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        sessionStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
        window.location.href = '/auth/login';
        return Promise.reject(new ApiError(401, 'Session expirée'));
      }
      
      throw new ApiError(response.status, result.error || 'API request failed');
    }

    return result.data as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    console.error('API request error:', error);
    throw new ApiError(500, 'Network error or invalid response');
  }
}

// HTTP 方法的便捷函数
export const api = {
  get: <T = any>(endpoint: string, params?: Record<string, string>) => {
    const url = params 
      ? `${endpoint}?${new URLSearchParams(params).toString()}`
      : endpoint;
    return apiRequest<T>(url, { method: 'GET' });
  },

  post: <T = any>(endpoint: string, data?: any) =>
    apiRequest<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),

  put: <T = any>(endpoint: string, data?: any) =>
    apiRequest<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: <T = any>(endpoint: string) =>
    apiRequest<T>(endpoint, { method: 'DELETE' }),
};

// 导出 ApiError 以便组件中进行错误处理
export { ApiError };
export type { ApiResponse };
