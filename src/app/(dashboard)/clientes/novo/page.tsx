'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useData } from '@/context/DataContext';
import { maskCPF, maskCNPJ, maskPhone, maskCEP } from '@/lib/formatters';
import { validateCPF, validateCNPJ, validateEmail } from '@/lib/validators';
import { Users, Building2, User, ArrowLeft, Check, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function NovoClientePage() {
  const router = useRouter();
  const { addCustomer, customers } = useData();

  const [type, setType] = useState<'PF' | 'PJ'>('PF');
  const [name, setName] = useState('');
  const [tradeName, setTradeName] = useState('');
  const [document, setDocument] = useState('');
  const [stateRegistration, setStateRegistration] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('SP');
  const [notes, setNotes] = useState('');

  const [error, setError] = useState<string | null>(null);

  const handleDocumentChange = (val: string) => {
    if (type === 'PF') {
      setDocument(maskCPF(val));
    } else {
      setDocument(maskCNPJ(val));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validação de documento
    if (type === 'PF' && !validateCPF(document)) {
      setError('CPF inválido. Por favor, verifique os dígitos digitados.');
      return;
    }
    if (type === 'PJ' && !validateCNPJ(document)) {
      setError('CNPJ inválido. Por favor, verifique os dígitos digitados.');
      return;
    }

    // Checar duplicidade de documento no tenant
    const duplicate = customers.find((c) => c.document.replace(/\D/g, '') === document.replace(/\D/g, ''));
    if (duplicate) {
      setError(`Já existe um cliente cadastrado com este documento: ${duplicate.name}`);
      return;
    }

    if (email && !validateEmail(email)) {
      setError('Formato de e-mail inválido.');
      return;
    }

    addCustomer({
      type,
      name,
      trade_name: type === 'PJ' ? tradeName : undefined,
      document,
      state_registration: stateRegistration,
      email,
      phone,
      whatsapp,
      contact_person: type === 'PJ' ? contactPerson : undefined,
      zip_code: zipCode,
      street,
      number,
      complement,
      neighborhood,
      city,
      state,
      notes,
      active: true,
    });

    router.push('/clientes');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link
            href="/clientes"
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              Cadastrar Novo Cliente
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Escolha entre Pessoa Física ou Pessoa Jurídica para preencher os dados comerciais.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-center space-x-3 text-xs text-red-800 font-semibold">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Seleção do Tipo de Cliente */}
      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => {
            setType('PF');
            setDocument('');
          }}
          className={`p-4 rounded-2xl border text-left transition-all flex items-center space-x-3 ${
            type === 'PF'
              ? 'bg-blue-50/70 border-blue-500 ring-2 ring-blue-500/20 shadow-xs'
              : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className={`p-2 rounded-xl ${type === 'PF' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
            <User className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900">PESSOA FÍSICA</h4>
            <p className="text-[11px] text-slate-500">Cliente individual, profissionais e CPF</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            setType('PJ');
            setDocument('');
          }}
          className={`p-4 rounded-2xl border text-left transition-all flex items-center space-x-3 ${
            type === 'PJ'
              ? 'bg-indigo-50/70 border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs'
              : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className={`p-2 rounded-xl ${type === 'PJ' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900">PESSOA JURÍDICA</h4>
            <p className="text-[11px] text-slate-500">Empresas, construtoras e CNPJ</p>
          </div>
        </button>
      </div>

      {/* Formulário Principal */}
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
            Dados Principais ({type === 'PF' ? 'Pessoa Física' : 'Pessoa Jurídica'})
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {type === 'PF' ? 'Nome Completo *' : 'Razão Social *'}
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={type === 'PF' ? 'Ex: João da Silva Santos' : 'Ex: ABC Empreendimentos LTDA'}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {type === 'PJ' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nome Fantasia
                </label>
                <input
                  type="text"
                  value={tradeName}
                  onChange={(e) => setTradeName(e.target.value)}
                  placeholder="Ex: ABC Construções"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {type === 'PF' ? 'CPF *' : 'CNPJ *'}
              </label>
              <input
                type="text"
                required
                value={document}
                onChange={(e) => handleDocumentChange(e.target.value)}
                placeholder={type === 'PF' ? '000.000.000-00' : '00.000.000/0000-00'}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {type === 'PJ' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Inscrição Estadual
                </label>
                <input
                  type="text"
                  value={stateRegistration}
                  onChange={(e) => setStateRegistration(e.target.value)}
                  placeholder="Ex: 123.456.789.000"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {type === 'PJ' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pessoa de Contato
                </label>
                <input
                  type="text"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  placeholder="Ex: Eng. Roberto ou Sra. Mariana"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          </div>
        </div>

        {/* Contato */}
        <div className="pt-4 border-t border-slate-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
            Informações de Contato
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contato@cliente.com.br"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Telefone Fixo</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(maskPhone(e.target.value))}
                placeholder="(11) 3333-4444"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">WhatsApp</label>
              <input
                type="text"
                value={whatsapp}
                onChange={(e) => setWhatsapp(maskPhone(e.target.value))}
                placeholder="(11) 99999-8888"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Endereço */}
        <div className="pt-4 border-t border-slate-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
            Endereço
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">CEP</label>
              <input
                type="text"
                value={zipCode}
                onChange={(e) => setZipCode(maskCEP(e.target.value))}
                placeholder="00000-000"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">Logradouro / Rua</label>
              <input
                type="text"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                placeholder="Ex: Av. Brasil"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Número</label>
              <input
                type="text"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                placeholder="100"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Bairro</label>
              <input
                type="text"
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
                placeholder="Centro"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">Cidade</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="São Paulo"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Estado</label>
              <input
                type="text"
                maxLength={2}
                value={state}
                onChange={(e) => setState(e.target.value.toUpperCase())}
                placeholder="SP"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 uppercase"
              />
            </div>
          </div>
        </div>

        {/* Observações */}
        <div className="pt-4 border-t border-slate-100">
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Observações Comerciais
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ex: Condições de pagamento preferenciais, horários de entrega ou histórico do cliente..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Botão de Salvar */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
          <Link
            href="/clientes"
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            className="inline-flex items-center space-x-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20 active:scale-95"
          >
            <Check className="w-4 h-4" />
            <span>Salvar Cliente</span>
          </button>
        </div>
      </form>
    </div>
  );
}
