
import { NextRequest } from 'next/server';
import { postgrestClient } from './postgrest';

// API 响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// Validation des variables d'environnement
export function validateEnv(): void {
  const requiredVars = ['POSTGREST_URL', 'POSTGREST_SCHEMA'];
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(`Variables d'environnement manquantes: ${missing.join(', ')}`);
  }

  // POSTGREST_API_KEY est optionnelle en développement
  if (!process.env.POSTGREST_API_KEY) {
    console.warn('⚠️  POSTGREST_API_KEY non définie - mode développement sans authentification');
  }
}

// 标准化错误响应
export function errorResponse(error: string, status: number = 500): Response {
  console.error('Erreur API:', error);
  return Response.json(
    { success: false, error } as ApiResponse,
    { status }
  );
}

// 标准化成功响应
export function successResponse<T>(data: T, status: number = 200): Response {
  return Response.json(
    { success: true, data } as ApiResponse<T>,
    { status }
  );
}

// 解析查询参数
export function parseQueryParams(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  return {
    limit: parseInt(searchParams.get('limit') || '10'),
    offset: parseInt(searchParams.get('offset') || '0'),
    id: searchParams.get('id'),
    search: searchParams.get('search'),
    merchant_id: searchParams.get('merchant_id'),
    customer_id: searchParams.get('customer_id'),
    order_id: searchParams.get('order_id'),
    status: searchParams.get('status'),
    payment_status: searchParams.get('payment_status'),
    provider: searchParams.get('provider'),
    category: searchParams.get('category'),
    is_active: searchParams.get('is_active'),
    user_type: searchParams.get('user_type'),
    user_id: searchParams.get('user_id'),
    action: searchParams.get('action'),
    resource_type: searchParams.get('resource_type'),
    start_date: searchParams.get('start_date'),
    end_date: searchParams.get('end_date'),
    event_type: searchParams.get('event_type'),
    type: searchParams.get('type'),
    channel: searchParams.get('channel'),
    priority: searchParams.get('priority'),
    assigned_to: searchParams.get('assigned_to'),
    plan_type: searchParams.get('plan_type'),
    role: searchParams.get('role'),
    days_old: searchParams.get('days_old')
  };
}

// 验证请求体
export async function validateRequestBody(request: NextRequest): Promise<any> {
  try {
    const body = await request.json();
    
    if (!body || typeof body !== 'object') {
      throw new Error('Corps de requête invalide');
    }
    
    return body;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('JSON invalide dans le corps de la requête');
    }
    throw error;
  }
}

// 通用CRUD操作包装器
export class CrudOperations {
  constructor(private tableName: string) {}

  async findMany(filters?: Record<string, any>, limit?: number, offset?: number) {
    validateEnv();
    
    let query = postgrestClient.from(this.tableName).select('*');
    
    // 应用过滤器
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      });
    }
    
    // 应用分页
    if (limit && offset !== undefined) {
      query = query.range(offset, offset + limit - 1);
    }
    
    const { data, error } = await query;
    
    if (error) {
      throw new Error(`Échec de récupération ${this.tableName}: ${error.message}`);
    }
    
    return data;
  }

  async findById(id: string | number) {
    validateEnv();
    
    const { data, error } = await postgrestClient
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null; // 未找到记录
      }
      throw new Error(`Échec de récupération ${this.tableName} par id: ${error.message}`);
    }
    
    return data;
  }

  async create(data: Record<string, any>) {
    validateEnv();
    
    const { data: result, error } = await postgrestClient
      .from(this.tableName)
      .insert([data])
      .select()
      .single();
    
    if (error) {
      throw new Error(`Échec de création ${this.tableName}: ${error.message}`);
    }
    
    return result;
  }

  async update(id: string | number, data: Record<string, any>) {
    validateEnv();
    
    const { data: result, error } = await postgrestClient
      .from(this.tableName)
      .update(data)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Échec de mise à jour ${this.tableName}: ${error.message}`);
    }
    
    return result;
  }

  async delete(id: string | number) {
    validateEnv();
    
    const { error } = await postgrestClient
      .from(this.tableName)
      .delete()
      .eq('id', id);
    
    if (error) {
      throw new Error(`Échec de suppression ${this.tableName}: ${error.message}`);
    }
    
    return { id };
  }
}

// API 路由处理器包装器 - CORRIGÉ
export function withErrorHandling(
  handler: (request: NextRequest, context?: any) => Promise<Response>
) {
  return async (request: NextRequest, context?: any): Promise<Response> => {
    try {
      return await handler(request, context);
    } catch (error) {
      console.error('Erreur API non gérée:', error);
      
      if (error instanceof Error) {
        return errorResponse(error.message);
      }
      
      return errorResponse('Erreur interne du serveur');
    }
  };
}
