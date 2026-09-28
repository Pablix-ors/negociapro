import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

// Inicializa o adapter OpenNext para Cloudflare apenas em modo de desenvolvimento local.
// Em produção (build), o adapter é aplicado via `npx opennextjs-cloudflare build`.
// Não altera nenhuma regra de negócio, layout ou funcionalidade do NegociaPro.
initOpenNextCloudflareForDev();

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
