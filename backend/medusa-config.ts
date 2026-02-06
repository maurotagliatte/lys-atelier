import { defineConfig, loadEnv } from "@medusajs/framework/utils"

loadEnv(process.env.NODE_ENV || "development", process.cwd())

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:9000"
const STORE_CORS = process.env.STORE_CORS || "http://localhost:3000,http://localhost:8000"
const ADMIN_CORS = process.env.ADMIN_CORS || "http://localhost:5173,http://localhost:9000"
const AUTH_CORS = process.env.AUTH_CORS || "http://localhost:5173,http://localhost:9000"
const DATABASE_URL = process.env.DATABASE_URL || "postgres://maurotagliatte@localhost:5432/lys_atelier"
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379"

export default defineConfig({
  projectConfig: {
    databaseUrl: DATABASE_URL,
    redisUrl: REDIS_URL,
    http: {
      storeCors: STORE_CORS,
      adminCors: ADMIN_CORS,
      authCors: AUTH_CORS,
      jwtSecret: process.env.JWT_SECRET || (process.env.NODE_ENV === "production" ? (() => { throw new Error("JWT_SECRET required in production") })() : "supersecret-dev-only"),
      cookieSecret: process.env.COOKIE_SECRET || (process.env.NODE_ENV === "production" ? (() => { throw new Error("COOKIE_SECRET required in production") })() : "supersecret-dev-only"),
    },
    workerMode: process.env.MEDUSA_WORKER_MODE as "shared" | "worker" | "server" || "shared",
    databaseDriverOptions: {
      connection: {
        ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
      },
    },
  },
  admin: {
    backendUrl: BACKEND_URL,
    disable: process.env.DISABLE_ADMIN === "true",
  },
  modules: [
    {
      resolve: "./src/modules/wedding-list",
    },
    {
      resolve: "@medusajs/medusa/payment",
      options: {
        providers: [
          {
            resolve: "./src/modules/asaas-payment",
            id: "asaas",
            options: {
              api_key: process.env.ASAAS_API_KEY,
              base_url: process.env.ASAAS_BASE_URL || "https://sandbox.asaas.com/api/v3",
              webhook_token: process.env.ASAAS_WEBHOOK_TOKEN,
            },
          },
        ],
      },
    },
  ],
})
