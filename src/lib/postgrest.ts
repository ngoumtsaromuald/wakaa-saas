import { PostgrestClient } from "@supabase/postgrest-js";

// 直接从环境变量读取配置
const POSTGREST_URL = process.env.POSTGREST_URL || "http://localhost:3001";
const POSTGREST_SCHEMA = process.env.POSTGREST_SCHEMA || "public";
const POSTGREST_API_KEY = process.env.POSTGREST_API_KEY || "";

// 此客户端仅在服务器端（API 路由）使用
export const postgrestClient = new PostgrestClient(POSTGREST_URL, {
  schema: POSTGREST_SCHEMA,
  fetch: (...args) => {
    let [url, options] = args;

    // 检查并修复 URL 中的 columns 参数
    if (url instanceof URL || typeof url === "string") {
      const urlObj = url instanceof URL ? url : new URL(url);
      const columns = urlObj.searchParams.get("columns");

      if (columns && columns.includes('"')) {
        // 移除所有双引号
        const fixedColumns = columns.replace(/"/g, "");
        urlObj.searchParams.set("columns", fixedColumns);
        url = urlObj.toString();
      }
    }

    // Headers pour les requêtes
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...((options as RequestInit)?.headers || {}),
    };

    // Ajouter l'authentification seulement si la clé API est définie et non vide
    // En développement local sans JWT, on n'envoie pas de header Authorization
    if (POSTGREST_API_KEY && 
        POSTGREST_API_KEY.trim() !== '' && 
        POSTGREST_API_KEY !== 'wakaa-dev-api-key' &&
        !POSTGREST_API_KEY.startsWith('wakaa-dev-')) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${POSTGREST_API_KEY}`;
    }

    return fetch(url, {
      ...options,
      headers,
    } as RequestInit).catch((error) => {
      console.error('PostgREST fetch error:', error);
      throw new Error(`Erreur de connexion à PostgREST: ${error.message}`);
    });
  },
});
