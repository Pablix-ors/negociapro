import { NextResponse } from 'next/server';
import { validateCNPJ } from '@/lib/validators';
import { maskCNPJ, maskPhone, maskCEP } from '@/lib/formatters';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawCnpj = searchParams.get('cnpj') || '';

    // Sanitizar apenas números
    const cleanCnpj = rawCnpj.replace(/\D/g, '');

    // Validação inicial de formato e dígitos verificadores
    if (!cleanCnpj || cleanCnpj.length !== 14 || !validateCNPJ(cleanCnpj)) {
      return NextResponse.json(
        {
          success: false,
          errorType: 'INVALID_CNPJ',
          message: 'CNPJ inválido. Verifique o número informado.',
        },
        { status: 400 }
      );
    }

    const apiKey = process.env.CNPJAPI_KEY;
    if (!apiKey) {
      console.error('ERRO DE CONFIGURAÇÃO: CNPJAPI_KEY não definida no ambiente.');
      return NextResponse.json(
        {
          success: false,
          errorType: 'API_ERROR',
          message: 'Não foi possível consultar o CNPJ no momento. Tente novamente.',
        },
        { status: 500 }
      );
    }

    // Chamada server-side segura à CNPJAPI oficial
    const url = `https://api.cnpjapi.com.br/${cleanCnpj}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
      },
      cache: 'no-store',
    });

    if (response.status === 404) {
      return NextResponse.json(
        {
          success: false,
          errorType: 'NOT_FOUND',
          message: 'Não foi possível encontrar uma empresa para este CNPJ.',
        },
        { status: 404 }
      );
    }

    if (response.status === 429) {
      return NextResponse.json(
        {
          success: false,
          errorType: 'RATE_LIMIT',
          message: 'Limite de consultas atingido. Aguarde alguns instantes e tente novamente.',
        },
        { status: 429 }
      );
    }

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      console.warn(`CNPJAPI retornou status ${response.status}:`, errText);
      return NextResponse.json(
        {
          success: false,
          errorType: 'API_ERROR',
          message: 'Não foi possível consultar o CNPJ no momento. Tente novamente.',
        },
        { status: response.status >= 500 ? 502 : 400 }
      );
    }

    const data = await response.json();

    // Mapeamento normalizado dos campos retornados
    const razaoSocial = data.RazaoSocial || '';
    const nomeFantasia = data.NomeFantasia || razaoSocial;
    const situacaoCadastral = data.SituacaoCadastral?.Descricao || null;
    const cnaeCodigo = data.AtividadePrincipal?.Codigo || '';
    const cnaeDescricao = data.AtividadePrincipal?.Descricao || '';
    const cnaeCompleto = cnaeDescricao ? `${cnaeDescricao}${cnaeCodigo ? ` (CNAE: ${cnaeCodigo})` : ''}` : null;

    // Endereço
    const endereco = data.Endereco || {};
    const tipoLogr = endereco.TipoLogradouro ? `${endereco.TipoLogradouro.trim()} ` : '';
    const nomeLogr = endereco.Logradouro ? endereco.Logradouro.trim() : '';
    const logradouroCompleto = `${tipoLogr}${nomeLogr}`.trim();
    const numero = endereco.Numero ? String(endereco.Numero).trim() : '';
    const complemento = endereco.Complemento ? String(endereco.Complemento).trim() : '';
    const bairro = endereco.Bairro ? String(endereco.Bairro).trim() : '';
    const cep = endereco.CEP ? maskCEP(String(endereco.CEP)) : '';
    const cidade = endereco.Municipio?.Nome ? String(endereco.Municipio.Nome).trim() : '';
    const uf = endereco.UF ? String(endereco.UF).trim().toUpperCase() : '';

    // Contato
    const contato = data.Contato || {};
    let telefone = '';
    if (contato.DDD1 && contato.Telefone1) {
      telefone = maskPhone(`${contato.DDD1}${contato.Telefone1}`);
    } else if (contato.Telefone1) {
      telefone = maskPhone(String(contato.Telefone1));
    }
    const email = contato.Email ? String(contato.Email).trim().toLowerCase() : '';

    return NextResponse.json({
      success: true,
      data: {
        cnpj: maskCNPJ(cleanCnpj),
        cnpjRaw: cleanCnpj,
        name: razaoSocial,
        tradeName: nomeFantasia,
        zipCode: cep,
        street: logradouroCompleto,
        number: numero,
        complement: complemento,
        neighborhood: bairro,
        city: cidade,
        state: uf,
        phone: telefone,
        email: email,
        registrationStatus: situacaoCadastral,
        cnae: cnaeCompleto,
        cnaeCode: cnaeCodigo,
        cnaeDescription: cnaeDescricao,
      },
    });
  } catch (err: any) {
    console.error('Erro interno na rota /api/cnpj:', err);
    return NextResponse.json(
      {
        success: false,
        errorType: 'API_ERROR',
        message: 'Não foi possível consultar o CNPJ no momento. Tente novamente.',
      },
      { status: 500 }
    );
  }
}
