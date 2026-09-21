'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Image as ImageIcon, Upload, Trash2, Check, ArrowLeft, ShieldAlert, Sparkles, Building2 } from 'lucide-react';
import Link from 'next/link';

export default function IdentidadeVisualPage() {
  const router = useRouter();
  const { user, company, updateCompany, isLoading } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [logoPreview, setLogoPreview] = useState<string | null>(company?.logo_url || null);
  const [saved, setSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isAdmin) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center space-y-4 animate-in fade-in">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-slate-900 tracking-tight">
          Acesso Restrito a Administradores
        </h2>
        <p className="text-xs text-slate-600 max-w-md mx-auto">
          Apenas o administrador do estabelecimento possui permissão para alterar o logotipo e a identidade visual da empresa.
        </p>
        <div className="pt-2">
          <Link
            href="/dashboard"
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-md"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar ao Dashboard</span>
          </Link>
        </div>
      </div>
    );
  }

  // Manipulador de upload de arquivo
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);

    // Validação de tipo de arquivo
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setErrorMessage('Por favor, selecione uma imagem no formato PNG, JPG, JPEG ou WEBP.');
      return;
    }

    // Validação de tamanho (máximo 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setErrorMessage('O arquivo deve ter no máximo 2MB de tamanho.');
      return;
    }

    // Leitura em Base64 Data URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveLogo = () => {
    if (!isAdmin) return;
    updateCompany({ logo_url: logoPreview });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleRemoveLogo = () => {
    setLogoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900">
          Identidade Visual & Logotipo
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Personalize a marca da sua empresa exibida nos comprovantes de venda (A4 e Cupom), cabeçalhos e relatórios.
        </p>
      </div>

      {saved && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center space-x-2 text-xs text-emerald-800 font-bold animate-in fade-in">
          <Check className="w-5 h-5 text-emerald-600" />
          <span>Logotipo salvo com sucesso no perfil do estabelecimento!</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
          {errorMessage}
        </div>
      )}

      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center space-x-2">
            <ImageIcon className="w-4 h-4 text-blue-600" />
            <span>Logotipo do Estabelecimento</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            {/* Caixa de Pré-visualização da Logo */}
            <div className="md:col-span-5 flex flex-col items-center justify-center p-6 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 min-h-[220px]">
              {logoPreview ? (
                <div className="text-center space-y-3">
                  <div className="p-3 bg-white rounded-xl shadow-xs border border-slate-200 inline-block">
                    <img
                      src={logoPreview}
                      alt="Logo do Estabelecimento"
                      className="max-h-28 max-w-full object-contain mx-auto"
                    />
                  </div>
                  <span className="text-[11px] font-bold text-emerald-700 block">
                    ✓ Logo personalizada carregada
                  </span>
                </div>
              ) : (
                <div className="text-center space-y-2">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                    <Building2 className="w-7 h-7" />
                  </div>
                  <p className="text-xs font-bold text-slate-700">Logo Padrão NegociaPro</p>
                  <p className="text-[11px] text-slate-400 max-w-xs">
                    Nenhuma logo personalizada foi enviada ainda. O sistema utilizará a marca padrão nos comprovantes.
                  </p>
                </div>
              )}
            </div>

            {/* Ações de Upload e Informações */}
            <div className="md:col-span-7 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Selecionar Arquivo de Imagem
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                  id="logo-upload-input"
                />
                <label
                  htmlFor="logo-upload-input"
                  className="inline-flex items-center space-x-2 px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold transition-all border border-blue-200 cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>Fazer upload da logo</span>
                </label>
                <p className="text-[11px] text-slate-400 mt-2">
                  Formatos aceitos: <strong>PNG, JPG, JPEG, WEBP</strong>. Resolução recomendada: 400x120px ou superior. Tamanho máximo: 2MB.
                </p>
              </div>

              {/* Regra de Fallback Informativa */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 space-y-1">
                <span className="font-bold text-slate-900 flex items-center space-x-1">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>Regra Automática de Exibição</span>
                </span>
                <p className="text-[11px] text-slate-500">
                  Se existir uma logo personalizada, ela será aplicada automaticamente em:
                  <strong> comprovantes A4, cupons térmicos de 80mm, PDFs e impressões</strong>.
                  Caso contrário, a marca do NegociaPro será mantida como padrão.
                </p>
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={handleSaveLogo}
                  className="inline-flex items-center space-x-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20 active:scale-95 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Salvar Logo</span>
                </button>

                {logoPreview && (
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="inline-flex items-center space-x-1.5 px-4 py-2.5 bg-slate-100 hover:bg-red-50 hover:text-red-700 text-slate-600 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Remover Logo</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
