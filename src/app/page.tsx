'use client';

import React from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  History,
  ShieldCheck,
  Zap,
  Users,
  BarChart3,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  DollarSign,
  AlertTriangle,
  Building2,
  Layers,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-600 selection:text-white relative overflow-x-hidden">
      {/* Luzes de fundo / Gradients decorativos */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-blue-600/20 via-indigo-600/10 to-transparent blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-1/3 right-0 w-[500px] h-[500px] bg-cyan-600/10 blur-[120px] pointer-events-none -z-10" />

      {/* NAVBAR */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/70 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:scale-105 transition-transform">
              <TrendingUp className="w-5 h-5 text-white stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center space-x-1">
                <span className="font-black tracking-tight text-white text-xl">Negocia</span>
                <span className="text-blue-400 font-black text-xl">Pro</span>
              </div>
              <span className="text-[10px] text-slate-400 tracking-wider block font-semibold uppercase">
                SaaS Comercial
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center space-x-8 text-xs font-semibold text-slate-300">
            <a href="#diferencial" className="hover:text-white transition-colors">Diferencial Único</a>
            <a href="#funcionalidades" className="hover:text-white transition-colors">Funcionalidades</a>
            <a href="#como-funciona" className="hover:text-white transition-colors">Como Funciona</a>
            <a href="#seguranca" className="hover:text-white transition-colors">Segurança Multi-Tenant</a>
          </nav>

          <div className="flex items-center space-x-3">
            <Link
              href="/login"
              className="px-4 py-2 text-xs font-bold text-slate-300 hover:text-white transition-colors"
            >
              Fazer Login
            </Link>
            <Link
              href="/cadastro"
              className="inline-flex items-center space-x-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-600/30 active:scale-95"
            >
              <span>Começar Agora</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="pt-20 pb-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center relative">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-blue-950/80 border border-blue-800/60 text-blue-400 text-xs font-semibold mb-8 animate-in fade-in slide-in-from-bottom-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>O primeiro software comercial centrado em histórico de negociação</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white max-w-5xl mx-auto leading-[1.1]">
          Venda com histórico. <br />
          <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">
            Negocie com inteligência.
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Chega de perder tempo procurando em pedidos antigos ou concedendo descontos no escuro.
          O NegociaPro entrega automaticamente na tela de venda quanto cada cliente pagou em negociações anteriores.
        </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/cadastro"
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl text-sm font-extrabold transition-all shadow-xl shadow-blue-600/25 active:scale-95 flex items-center justify-center space-x-2"
            >
              <span>Experimentar o NegociaPro</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/demonstracao"
              className="w-full sm:w-auto px-8 py-4 bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-2xl text-sm font-bold transition-all flex items-center justify-center space-x-2 group"
            >
              <Sparkles className="w-4 h-4 text-blue-400 group-hover:rotate-12 transition-transform" />
              <span>Ver Demonstração ao Vivo</span>
            </Link>
          </div>

        {/* Mockup Interativo da Tela de Venda */}
        <div className="mt-16 max-w-5xl mx-auto rounded-2xl border border-slate-800 bg-slate-900/80 p-3 shadow-2xl backdrop-blur-xl">
          <div className="bg-slate-950 rounded-xl p-6 border border-slate-800 text-left">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="text-xs text-slate-500 font-mono ml-2">negociapro.com.br/vendas/nova</span>
              </div>
              <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800/60 px-2.5 py-0.5 rounded-full">
                Inteligência Ativa
              </span>
            </div>

            {/* Simulação Visual do Diferencial */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Cliente Selecionado</span>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <p className="text-xs font-bold text-white">João da Silva Santos</p>
                    <p className="text-[11px] text-slate-400">CPF: 123.456.789-01 • São Paulo/SP</p>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Produto Adicionado</span>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <p className="text-xs font-bold text-white">Cimento CP II 50kg (Votoran)</p>
                    <p className="text-[11px] text-slate-400">Preço de Tabela Padrão: R$ 36,90</p>
                  </div>
                </div>
              </div>

              {/* O Diferencial em Destaque */}
              <div className="rounded-xl border border-blue-500/40 bg-gradient-to-br from-blue-950/60 to-indigo-950/40 p-4 relative overflow-hidden shadow-lg">
                <div className="flex items-center justify-between pb-2 border-b border-blue-800/40">
                  <div className="flex items-center space-x-2">
                    <History className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-black text-blue-300 uppercase tracking-wider">
                      Histórico Automático do Cliente
                    </span>
                  </div>
                  <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded font-bold">
                    ÚLTIMO PREÇO
                  </span>
                </div>

                <div className="my-3">
                  <div className="text-2xl font-black text-white">R$ 32,90</div>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    Negociado em 12/09/2026 • 40 unidades • Vendedor: Carlos
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-[10px] pt-2 border-t border-blue-900/60">
                  <div className="bg-slate-900/80 p-1.5 rounded">
                    <span className="text-slate-400 block">Menor</span>
                    <span className="font-bold text-emerald-400">R$ 32,90</span>
                  </div>
                  <div className="bg-slate-900/80 p-1.5 rounded">
                    <span className="text-slate-400 block">Médio</span>
                    <span className="font-bold text-blue-400">R$ 34,08</span>
                  </div>
                  <div className="bg-slate-900/80 p-1.5 rounded">
                    <span className="text-slate-400 block">Maior</span>
                    <span className="font-bold text-amber-400">R$ 35,00</span>
                  </div>
                </div>

                <div className="mt-3 p-2 rounded bg-amber-950/60 border border-amber-800/60 text-[11px] text-amber-300 flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Se cotar abaixo de R$ 32,90, o sistema alertará a equipe.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SEÇÃO DIFERENCIAL */}
      <section id="diferencial" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-900">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs font-black tracking-wider text-blue-400 uppercase">
            A dor que todo vendedor enfrenta
          </h2>
          <h3 className="text-3xl sm:text-4xl font-black text-white mt-2">
            “Quanto eu vendi para esse cliente da última vez?”
          </h3>
          <p className="text-sm text-slate-400 mt-3">
            Em distribuidoras e empresas comerciais, o cliente sempre diz: &quot;Você me fez mais barato da última vez&quot;.
            Com o NegociaPro, sua equipe tem a resposta exata em menos de 2 segundos.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-blue-500/50 transition-all">
            <div className="w-12 h-12 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center mb-4">
              <Zap className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-white mb-2">Consulta Instantânea Sem Troca de Tela</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              O vendedor não precisa abrir outra aba, consultar relatórios pesados ou ligar para o financeiro. O histórico aparece no ato.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-blue-500/50 transition-all">
            <div className="w-12 h-12 rounded-xl bg-amber-600/20 text-amber-400 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-white mb-2">Proteção Contra Preços Abaixo do Mínimo</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Defina o preço mínimo por produto. Se o vendedor tentar vender abaixo da margem permitida, o sistema bloqueia e exige autorização gerencial.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-blue-500/50 transition-all">
            <div className="w-12 h-12 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center mb-4">
              <History className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-white mb-2">Histórico Perpétuo e Imutável</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Mesmo que um cliente ou produto seja desativado, o histórico de preços negociados continua preservado no banco para auditoria.
            </p>
          </div>
        </div>
      </section>

      {/* SEÇÃO MULTI-TENANT & SEGURANÇA */}
      <section id="seguranca" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-slate-900/40 rounded-3xl border border-slate-800/60 my-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-950 text-emerald-400 text-xs font-bold mb-4">
              <ShieldCheck className="w-4 h-4" />
              <span>Multi-Tenancy Corporativo com RLS</span>
            </div>
            <h3 className="text-3xl font-black text-white leading-tight">
              Seus dados comerciais isolados e 100% protegidos.
            </h3>
            <p className="text-xs text-slate-400 mt-4 leading-relaxed">
              Cada empresa tem seus clientes, produtos, regras de margem e histórico de negociações estritamente isolados através de PostgreSQL Row Level Security (RLS). Uma empresa nunca acessa nem consulta dados de outra.
            </p>

            <ul className="mt-6 space-y-3 text-xs text-slate-300">
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Isolamento total por company_id em todas as consultas SQL</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Perfis de acesso RBAC: Administrador, Gerente e Vendedor</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Auditoria de alterações de preços e exclusões lógicas seguras</span>
              </li>
            </ul>
          </div>

          <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-3 font-mono text-xs">
            <div className="text-slate-500">// Row Level Security (RLS) Ativo</div>
            <div className="text-blue-400">CREATE POLICY &quot;price_history_isolation&quot;</div>
            <div className="text-slate-300 pl-4">ON public.price_history</div>
            <div className="text-slate-300 pl-4">FOR ALL USING (company_id = get_auth_company_id());</div>
            <div className="mt-4 pt-4 border-t border-slate-800 text-[11px] text-emerald-400 font-sans flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Garantia de conformidade e proteção de dados sigilosos</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-24 text-center px-4 max-w-4xl mx-auto">
        <h3 className="text-3xl sm:text-5xl font-black text-white">
          Pronto para profissionalizar as negociações da sua empresa?
        </h3>
        <p className="mt-4 text-sm text-slate-400">
          Cadastre sua distribuidora ou comércio e comece a vender com inteligência hoje mesmo.
        </p>
        <div className="mt-8 flex justify-center">
          <Link
            href="/cadastro"
            className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-sm font-extrabold transition-all shadow-xl shadow-blue-600/30 active:scale-95 flex items-center space-x-2"
          >
            <span>Criar Conta da Minha Empresa</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-900 py-8 px-4 text-center text-xs text-slate-600">
        <div className="flex items-center justify-center space-x-2 mb-2">
          <span className="font-bold text-slate-400">NegociaPro</span>
          <span>•</span>
          <span>“Venda com histórico. Negocie com inteligência.”</span>
        </div>
        <p>© 2026 NegociaPro. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}
