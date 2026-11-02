import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

export interface UsuarioDB {
  id: number;
  nome: string;
  email: string;
  senha_hash: string;
  papel: 'admin' | 'operador';
  status: 'ativo' | 'inativo';
  criado_em?: string;
}

export interface VozDB {
  id: number;
  nome: string;
  voice_id: string;
  provedor: string;
  modelo: string;
  idioma: string;
  padrao: number;
  descricao?: string;
}

export const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'emribeir_romildo',
  password: process.env.DB_PASSWORD || 'Romildo2009@',
  database: process.env.DB_NAME || 'emribeir_jarvismulti',
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 4000,
};

let pool: mysql.Pool | null = null;
let isConnectedToMySQL = false;

// Memória local persistente para funcionamento 100% offline se o banco MySQL estiver inacessível
export const localVault = {
  usuarios: [
    {
      id: 1,
      nome: 'Romildo Coelho',
      email: 'romildocoelhooficial@gmail.com',
      senha_hash: hashSenha('Romildo2009@'),
      papel: 'admin' as const,
      status: 'ativo' as const,
      criado_em: new Date().toISOString(),
    },
    {
      id: 2,
      nome: 'Administrador JARVIS',
      email: 'admin@jarvis.ai',
      senha_hash: hashSenha('admin123'),
      papel: 'admin' as const,
      status: 'ativo' as const,
      criado_em: new Date().toISOString(),
    },
  ],
  vozes: [
    {
      id: 1,
      nome: 'JARVIS Oficial PT-BR',
      voice_id: '82d13948027e4be69892dd3d0104e681',
      provedor: 'fishaudio',
      modelo: 's2.1-pro-free',
      idioma: 'pt-BR',
      padrao: 1,
      descricao: 'Voz neural Fish Audio principal de alta fidelidade para todo o sistema',
    },
    {
      id: 2,
      nome: 'JARVIS Sólido Tático',
      voice_id: '3b18544a0eef4d40b9d7ef3ef30b8d5a',
      provedor: 'fishaudio',
      modelo: 's2.1-pro-free',
      idioma: 'pt-BR',
      padrao: 0,
      descricao: 'Voz alternativa de resposta rápida',
    },
  ],
};

export function hashSenha(senha: string): string {
  return crypto.createHash('sha256').update(senha).digest('hex');
}

export async function getDbConnection() {
  if (pool) return pool;
  try {
    pool = mysql.createPool(dbConfig);
    const conn = await pool.getConnection();
    isConnectedToMySQL = true;
    console.log(`[MySQL] Conexão estabelecida com sucesso no banco ${dbConfig.database}!`);
    conn.release();
    return pool;
  } catch (err: any) {
    console.warn(`[MySQL] Banco remoto indisponível (${err.message}). Modo de redundância local ativado automaticamente.`);
    isConnectedToMySQL = false;
    pool = null;
    return null;
  }
}

export function isDbOnline(): boolean {
  return isConnectedToMySQL;
}
