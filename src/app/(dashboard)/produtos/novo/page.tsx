'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useData } from '@/context/DataContext';
import { CommissionType } from '@/types/database';
import { STANDARD_UNITS } from '@/lib/productConstants';
import {
  ArrowLeft,
  Check,
  Package,
  AlertCircle,
  Upload,
  X,
  Image as ImageIcon,
  DollarSign,
  Percent,
} from 'lucide-react';

export default function NovoProdutoPage() {
  const router = useRouter();
  const { addProduct } = useData();

  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [unit, setUnit] = useState('UN');
  const [brand, setBrand] = useState('');
  const [costPrice, setCostPrice] = useState<number>(0);
  const [sellingPrice, setSellingPrice] = useState<number>(0);
  const [minPrice, setMinPrice] = useState<number>(0);
  const [currentStock, setCurrentStock] = useState<number>(100);
  const [minStock, setMinStock] = useState<number>(10);
  const [description, setDescription] = useState('');

  // Imagem
  const [imageUrl, setImageUrl] = useState<string>('');
  const [imageLoading, setImageLoading] = useState(false);

  // Comissão
  const [commissionType, setCommissionType] = useState<CommissionType>('NONE');
  const [commissionValue, setCommissionValue] = useState<number>(0);

  const [error, setError] = useState<string | null>(null);

  // Upload com pré-validação (PNG, JPG, JPEG, WEBP, máx 5MB)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setError('Formato inválido. Use JPG, PNG ou WEBP.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('A imagem deve ter no máximo 5MB.');
      return;
    }

    setImageLoading(true);
    const reader = new FileReader();
    reader.onload = () => {
      setImageUrl(reader.result as string);
      setImageLoading(false);
    };
    reader.onerror = () => {
      setError('Erro ao processar imagem.');
      setImageLoading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (sellingPrice <= 0) {
      setError('O preço de venda deve ser maior que zero.');
      return;
    }
    if (minPrice > sellingPrice) {
      setError('O preço mínimo não pode ser superior ao preço de venda padrão.');
      return;
    }
    if (commissionType !== 'NONE' && commissionValue < 0) {
      setError('O valor de comissão deve ser positivo.');
      return;
    }

    addProduct({
      name,
      sku,
      barcode,
      unit,
      brand,
      cost_price: costPrice,
      selling_price: sellingPrice,
      min_price: minPrice || sellingPrice,
      current_stock: currentStock,
      min_stock: minStock,
      description,
      image_url: imageUrl || null,
      commission_type: commissionType,
      commission_value: commissionType === 'NONE' ? 0 : commissionValue,
      active: true,
    });

    router.push('/produtos');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <Link
          href="/produtos"
          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Cadastrar Novo Produto
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure margens, imagem, comissões de venda e regras de negociação comercial.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-center space-x-3 text-xs text-red-800 font-semibold">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Formulário */}
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
        {/* Bloco 1: Imagem do Produto */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            Imagem do Produto
          </h3>
          <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            {imageUrl ? (
              <div className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-blue-500 shadow-sm shrink-0 bg-white">
                <img src={imageUrl} alt="Preview do produto" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setImageUrl('')}
                  className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 shadow-xs"
                  title="Remover Imagem"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 shrink-0 bg-white">
                <ImageIcon className="w-7 h-7 mb-1" />
                <span className="text-[10px] font-medium">Sem imagem</span>
              </div>
            )}

            <div className="flex-1 text-center sm:text-left">
              <label className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-md shadow-blue-600/20 active:scale-95">
                <Upload className="w-4 h-4" />
                <span>{imageLoading ? 'Carregando...' : imageUrl ? 'Trocar Imagem' : 'Enviar Imagem'}</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/jpg"
                  onChange={handleImageUpload}
                  disabled={imageLoading}
                  className="hidden"
                />
              </label>
              <p className="text-[11px] text-slate-400 mt-1.5">
                Formatos aceitos: JPG, PNG, WEBP (máx. 5MB). Otimizada automaticamente para listagens e vendas.
              </p>
            </div>
          </div>
        </div>

        {/* Bloco 2: Dados do Produto */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
            Identificação & Categorização
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">Nome do Produto *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Cimento CP II 50kg ou Cabo Flexível 2,5mm"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Marca / Fabricante</label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="Ex: Tigre, Bosch, Votoran"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Código Interno / SKU</label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="Ex: MAT-CIM-50"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Código de Barras (EAN)</label>
              <input
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="Ex: 7891000000000"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Unidade de Medida *</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                {STANDARD_UNITS.map((u) => (
                  <option key={u.value} value={u.value}>
                    {u.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Bloco 3: Preços e Parâmetros Comerciais */}
        <div className="pt-4 border-t border-slate-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
            Precificação & Parâmetros de Negociação
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Preço de Custo (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={costPrice}
                onChange={(e) => setCostPrice(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Preço de Venda Padrão (R$) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={sellingPrice}
                onChange={(e) => setSellingPrice(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-blue-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Preço Mínimo Permitido (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={minPrice}
                onChange={(e) => setMinPrice(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-amber-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Preços abaixo deste valor bloquearão a venda exigindo aprovação.
              </span>
            </div>
          </div>
        </div>

        {/* Bloco 4: Regras de Comissão para Profissionais */}
        <div className="pt-4 border-t border-slate-100">
          <div className="flex items-center space-x-2 mb-3">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Comissão do Profissional / Vendedor
            </h3>
          </div>
          <p className="text-[11px] text-slate-500 mb-4">
            Defina se este produto remunera o profissional com comissão percentual, fixa ou se não possui comissão.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-emerald-50/40 p-4 rounded-2xl border border-emerald-100">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tipo de Comissão</label>
              <select
                value={commissionType}
                onChange={(e) => {
                  const val = e.target.value as CommissionType;
                  setCommissionType(val);
                  if (val === 'NONE') setCommissionValue(0);
                }}
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              >
                <option value="NONE">Sem comissão (0)</option>
                <option value="PERCENTAGE">Percentual (%)</option>
                <option value="FIXED">Valor fixo (R$)</option>
              </select>
            </div>

            {commissionType !== 'NONE' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {commissionType === 'PERCENTAGE' ? 'Percentual (%)' : 'Valor Fixo (R$ por unidade)'} *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={commissionValue}
                    onChange={(e) => setCommissionValue(Number(e.target.value))}
                    placeholder={commissionType === 'PERCENTAGE' ? 'Ex: 10' : 'Ex: 15.00'}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-emerald-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">
                    {commissionType === 'PERCENTAGE' ? '%' : 'R$'}
                  </span>
                </div>
                {sellingPrice > 0 && commissionType === 'PERCENTAGE' && (
                  <span className="text-[10px] text-emerald-700 font-semibold block mt-1">
                    Estimativa: R$ {((sellingPrice * commissionValue) / 100).toFixed(2)} por unidade no preço padrão.
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bloco 5: Controle de Estoque */}
        <div className="pt-4 border-t border-slate-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
            Controle de Estoque
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Estoque Atual</label>
              <input
                type="number"
                min="0"
                value={currentStock}
                onChange={(e) => setCurrentStock(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Estoque Mínimo (Alerta)</label>
              <input
                type="number"
                min="0"
                value={minStock}
                onChange={(e) => setMinStock(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Ações */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
          <Link
            href="/produtos"
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            className="inline-flex items-center space-x-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20 active:scale-95"
          >
            <Check className="w-4 h-4" />
            <span>Salvar Produto</span>
          </button>
        </div>
      </form>
    </div>
  );
}
