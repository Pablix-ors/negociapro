// open-next.config.ts — Configuração do adaptador @opennextjs/cloudflare para NegociaPro
// Criado na Fase 2 da migração Vercel → Cloudflare Workers
// O NegociaPro não usa ISR nem cache incremental, portanto não precisamos do R2.
import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig({});
