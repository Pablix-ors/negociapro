'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useData } from '@/context/DataContext';
import { CommissionType, Product } from '@/types/database';
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

export default function EditarProdutoPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params?.id as string;
  const { products, updateProduct } = useData();

  const product = products.find((p) => p.id === productId);

  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [unit, setUnit] = useState('UN');
  const [brand, setBrand] = useState('');
  const [costPrice, setCostPrice] = useState<number>(0);
  const [sellingPrice, setSellingPrice] = useState<number>(0);
  const [minPrice, setMinPrice] = useState<number>(0);
  const [currentStock, setCurrentStock] = useState<number>(0);
  const [minStock, setMinStock] = useState<number>(10);
  const [description, setDescription] = useState('');

  // Imagem
  const [imageUrl, setImageUrl] = useState<string>('');
  const [imageLoading, setImageLoading] = useState(false);

  // Comissão
  const [commissionType, setCommissionType] = useState<CommissionType>('NONE');
  const [commissionValue, setCommissionValue] = useState<number>(0);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (product) {
      setName(product.name || '');
      setSku(product.sku || '');
      setBarcode(product.barcode || '');
      setUnit(product.unit || 'UN');
      setBrand(product.brand || '');
      setCostPrice(product.cost_price || 0);
      setSellingPrice(product.selling_price || 0);
      setMinPrice(product.min_price || 0);
      setCurrentStock(product.current_stock || 0);
      setMinStock(product.min_stock || 0);
      setDescription(product.description || '');
      setImageUrl(product.image_url || '');
      setCommissionType(product.commission_type || 'NONE');
      setCommissionValue(product.commission_value || 0);
    }
  }, [product]);

  if (!product) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center">
        <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h2 className="text-base font-bold text-slate-800">Produto não encontrado</h2>
        <p className="text-xs text-slate-400 mt-1">O produto pode ter sido removido ou o identificador é inválido.</p>
        <Link
          href="/produtos"
          className="mt-4 inline-flex items-center space-x-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para Produtos</span>
        </Link>
      </div>
    );
  }

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

    updateProduct(product.id, {
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
            Editar Produto: {product.name}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Atualize dados, foto, comissões de venda e parâmetros de negociação comercial.
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
            Foto do Produto
          </h3>
          <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            {imageUrl ? (
              <div className="relative w-28 h-28 rounded-2xl overflow-hidden border-2 border-blue-500 shadow-sm shrink-0 bg-white">
                <img src={imageUrl} alt="Foto do produto" className="w-full h-full object-cover" />
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
              <div className="w-28 h-28 rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 shrink-0 bg-white">
                <ImageIcon className="w-8 h-8 mb-1 text-slate-300" />
                <span className="text-[10px] font-medium">Sem imagem</span>
              </div>
            )}

            <div className="flex-1 text-center sm:text-left">
              <label className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-md shadow-blue-600/20 active:scale-95">
                <Upload className="w-4 h-4" />
                <span>{imageLoading ? 'Carregando...' : imageUrl ? 'Trocar Foto' : 'Enviar Foto'}</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/jpg"
                  onChange={handleImageUpload}
                  disabled={imageLoading}
                  className="hidden"
                />
              </label>
              <p className="text-[11px] text-slate-400 mt-1.5">
                Formatos aceitos: JPG, PNG, WEBP (máx. 5MB). Esta foto aparecerá na listagem e na tela de venda.
              </p>
            </div>
          </div>
        </div>

        {/* Bloco 2: Identificação */}
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
                <option value="UN">UN - Unidade</option>
                <option value="SC">SC - Saco</option>
                <option value="KG">KG - Quilograma</option>
                <option value="G">G - Grama</option>
                <option value="L">L - Litro</option>
                <option value="ML">ML - Mililitro</option>
                <option value="M">M - Metro</option>
                <option value="M²">M² - Metro Quadrado</option>
                <option value="M³">M³ - Metro Cúbico</option>
                <option value="CX">CX - Caixa</option>
                <option value="RL">RL - Rolo</option>
                <option value="PCT">PCT - Pacote</option>
                <option value="MIL">MIL - Milheiro</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bloco 3: Preços e Negociação */}
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
            </div>
          </div>
        </div>

        {/* Bloco 4: Comissão do Produto */}
        <div className="pt-4 border-t border-slate-100">
          <div className="flex items-center space-x-2 mb-3">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Comissão do Profissional / Vendedor
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-emerald-50/40 p-4 rounded-2xl border border-emerald-100">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tipo de Comissão</label>
              <select
                value={commissionType}
                onChange={(e) => setCommissionType(e.target.value as CommissionType)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              >
                <option value="NONE">Sem Comissão (0)</option>
                <option value="PERCENTAGE">Percentual sobre o valor da venda (%)</option>
                <option value="FIXED">Valor Fixo por unidade vendida (R$)</option>
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
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-emerald-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">
                    {commissionType === 'PERCENTAGE' ? '%' : 'R$'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bloco 5: Estoque */}
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
            <span>Salvar Alterações</span>
          </button>
        </div>
      </form>
    </div>
  );
}
