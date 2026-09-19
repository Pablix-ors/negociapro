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

    // Função de normalização para resposta unificada
    const normalizeResponse = (parsed: any) => {
      return NextResponse.json({
        success: true,
        data: {
          cnpj: maskCNPJ(cleanCnpj),
          cnpjRaw: cleanCnpj,
          name: parsed.name || '',
          tradeName: parsed.tradeName || parsed.name || '',
          zipCode: parsed.zipCode ? maskCEP(parsed.zipCode) : '',
          street: parsed.street || '',
          number: parsed.number || '',
          complement: parsed.complement || '',
          neighborhood: parsed.neighborhood || '',
          city: parsed.city || '',
          state: parsed.state || '',
          phone: parsed.phone ? maskPhone(parsed.phone) : '',
          email: parsed.email ? String(parsed.email).trim().toLowerCase() : '',
          registrationStatus: parsed.registrationStatus || null,
          cnae: parsed.cnae || null,
          cnaeCode: parsed.cnaeCode || '',
          cnaeDescription: parsed.cnaeDescription || '',
        },
      });
    };

    // PROVEDOR 1: CNPJAPI (oficial pago/tokenizado)
    if (apiKey) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 6000);

        const url = `https://api.cnpjapi.com.br/${cleanCnpj}`;
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Accept': 'application/json',
          },
          cache: 'no-store',
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (response.status === 404) {
          return NextResponse.json(
            {
              success: false,
              errorType: 'NOT_FOUND',
              message: 'Não foi possível encontrar uma empresa para este CNPJ na Receita Federal.',
            },
            { status: 404 }
          );
        }

        if (response.ok) {
          const data = await response.json();
          const razaoSocial = data.RazaoSocial || '';
          const nomeFantasia = data.NomeFantasia || razaoSocial;
          const situacaoCadastral = data.SituacaoCadastral?.Descricao || null;
          const cnaeCodigo = data.AtividadePrincipal?.Codigo || '';
          const cnaeDescricao = data.AtividadePrincipal?.Descricao || '';
          const cnaeCompleto = cnaeDescricao ? `${cnaeDescricao}${cnaeCodigo ? ` (CNAE: ${cnaeCodigo})` : ''}` : null;

          const endereco = data.Endereco || {};
          const tipoLogr = endereco.TipoLogradouro ? `${endereco.TipoLogradouro.trim()} ` : '';
          const nomeLogr = endereco.Logradouro ? endereco.Logradouro.trim() : '';
          const logradouroCompleto = `${tipoLogr}${nomeLogr}`.trim();

          const contato = data.Contato || {};
          let telefone = '';
          if (contato.DDD1 && contato.Telefone1) {
            telefone = `${contato.DDD1}${contato.Telefone1}`;
          } else if (contato.Telefone1) {
            telefone = String(contato.Telefone1);
          }

          return normalizeResponse({
            name: razaoSocial,
            tradeName: nomeFantasia,
            zipCode: endereco.CEP,
            street: logradouroCompleto,
            number: endereco.Numero ? String(endereco.Numero).trim() : '',
            complement: endereco.Complemento ? String(endereco.Complemento).trim() : '',
            neighborhood: endereco.Bairro ? String(endereco.Bairro).trim() : '',
            city: endereco.Municipio?.Nome ? String(endereco.Municipio.Nome).trim() : '',
            state: endereco.UF ? String(endereco.UF).trim().toUpperCase() : '',
            phone: telefone,
            email: contato.Email || '',
            registrationStatus: situacaoCadastral,
            cnae: cnaeCompleto,
            cnaeCode: cnaeCodigo,
            cnaeDescription: cnaeDescricao,
          });
        }
      } catch (errApi: any) {
        console.warn('[CNPJ Route] CNPJAPI falhou ou deu timeout, tentando provedor alternativo:', errApi?.message);
      }
    }

    // PROVEDOR 2 (Fallback): ReceitaWS
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);

      const rwsRes = await fetch(`https://receitaws.com.br/v1/cnpj/${cleanCnpj}`, {
        headers: { 'Accept': 'application/json' },
        cache: 'no-store',
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (rwsRes.ok) {
        const rws = await rwsRes.json();
        if (rws.status === 'ERROR') {
          return NextResponse.json(
            {
              success: false,
              errorType: 'NOT_FOUND',
              message: rws.message || 'CNPJ não localizado na base da Receita Federal.',
            },
            { status: 404 }
          );
        }

        const primaryAtv = rws.atividade_principal?.[0];
        const cnaeCompleto = primaryAtv ? `${primaryAtv.text} (CNAE: ${primaryAtv.code})` : null;

        return normalizeResponse({
          name: rws.nome || '',
          tradeName: rws.fantasia || rws.nome || '',
          zipCode: rws.cep ? rws.cep.replace(/\D/g, '') : '',
          street: rws.logradouro || '',
          number: rws.numero || '',
          complement: rws.complemento || '',
          neighborhood: rws.bairro || '',
          city: rws.municipio || '',
          state: rws.uf || '',
          phone: rws.telefone || '',
          email: rws.email || '',
          registrationStatus: rws.situacao || null,
          cnae: cnaeCompleto,
          cnaeCode: primaryAtv?.code || '',
          cnaeDescription: primaryAtv?.text || '',
        });
      }
    } catch (errRws: any) {
      console.warn('[CNPJ Route] ReceitaWS falhou, tentando BrasilAPI:', errRws?.message);
    }

    // PROVEDOR 3 (Fallback): BrasilAPI
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);

      const brRes = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`, {
        headers: { 'Accept': 'application/json' },
        cache: 'no-store',
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (brRes.ok) {
        const br = await brRes.json();
        const primaryAtvDesc = br.cnae_fiscal_descricao || '';
        const primaryAtvCod = br.cnae_fiscal ? String(br.cnae_fiscal) : '';
        const cnaeCompleto = primaryAtvDesc ? `${primaryAtvDesc}${primaryAtvCod ? ` (CNAE: ${primaryAtvCod})` : ''}` : null;

        return normalizeResponse({
          name: br.razao_social || '',
          tradeName: br.nome_fantasia || br.razao_social || '',
          zipCode: br.cep ? String(br.cep).replace(/\D/g, '') : '',
          street: br.logradouro || '',
          number: br.numero || '',
          complement: br.complemento || '',
          neighborhood: br.bairro || '',
          city: br.municipio || '',
          state: br.uf || '',
          phone: br.ddd_telefone_1 ? `${br.ddd_telefone_1}` : '',
          email: br.email || '',
          registrationStatus: br.descricao_situacao_cadastral || null,
          cnae: cnaeCompleto,
          cnaeCode: primaryAtvCod,
          cnaeDescription: primaryAtvDesc,
        });
      }
    } catch (errBr: any) {
      console.warn('[CNPJ Route] BrasilAPI também falhou:', errBr?.message);
    }

    return NextResponse.json(
      {
        success: false,
        errorType: 'API_ERROR',
        message: 'Serviço da Receita Federal temporariamente instável. Tente novamente em instantes ou preencha os dados manualmente.',
      },
      { status: 502 }
    );
  } catch (err: any) {
    console.error('Erro interno na rota /api/cnpj:', err);
    return NextResponse.json(
      {
        success: false,
        errorType: 'API_ERROR',
        message: 'Erro inesperado ao consultar o CNPJ. Tente novamente.',
      },
      { status: 500 }
    );
  }
}
