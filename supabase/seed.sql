-- ==============================================================================
-- NEGOCIAPRO - SEED DE DESENVOLVIMENTO
-- Cria Empresa Modelo, Usuário Admin Demo, 10 Clientes (5 PF / 5 PJ),
-- 15 Produtos com categorias, 20 Vendas e Histórico de Negociações
-- ==============================================================================

DO $$
DECLARE
    v_company_id UUID := 'a0000000-0000-0000-0000-000000000001'::uuid;
    v_user_id UUID := 'b0000000-0000-0000-0000-000000000001'::uuid;
    v_cat_materiais UUID := 'c0000000-0000-0000-0000-000000000001'::uuid;
    v_cat_ferramentas UUID := 'c0000000-0000-0000-0000-000000000002'::uuid;
    v_cat_eletrica UUID := 'c0000000-0000-0000-0000-000000000003'::uuid;
    v_cat_hidraulica UUID := 'c0000000-0000-0000-0000-000000000004'::uuid;

    v_c1 UUID; v_c2 UUID; v_c3 UUID; v_c4 UUID; v_c5 UUID;
    v_c6 UUID; v_c7 UUID; v_c8 UUID; v_c9 UUID; v_c10 UUID;

    v_p1 UUID; v_p2 UUID; v_p3 UUID; v_p4 UUID; v_p5 UUID;
    v_p6 UUID; v_p7 UUID; v_p8 UUID; v_p9 UUID; v_p10 UUID;
    v_p11 UUID; v_p12 UUID; v_p13 UUID; v_p14 UUID; v_p15 UUID;

    v_pay_pix UUID; v_pay_cartao UUID; v_pay_boleto UUID;
BEGIN
    -- 1. EMPRESA MODELO
    INSERT INTO public.companies (
        id, name, trade_name, cnpj, email, phone, whatsapp, zip_code, street, number, neighborhood, city, state
    ) VALUES (
        v_company_id,
        'NegociaPro Distribuidora Comercial LTDA',
        'NegociaPro Distribuidora',
        '12.345.678/0001-90',
        'contato@negociapro.com.br',
        '(11) 3456-7890',
        '(11) 98765-4321',
        '01310-100',
        'Av. Paulista',
        '1000',
        'Bela Vista',
        'São Paulo',
        'SP'
    ) ON CONFLICT (id) DO NOTHING;

    -- 2. PREFERÊNCIAS DA EMPRESA
    INSERT INTO public.company_settings (
        company_id, currency, decimal_places, date_format, allow_sale_below_last_price, show_price_history_in_sale, price_history_limit
    ) VALUES (
        v_company_id, 'BRL', 2, 'DD/MM/YYYY', true, true, 5
    ) ON CONFLICT (company_id) DO NOTHING;

    -- 3. PERFIL DO USUÁRIO ADMIN DEMO
    -- (Nota: Em produção auth.users é gerenciado pelo Supabase Auth)
    INSERT INTO public.profiles (
        id, company_id, name, email, role, phone, active
    ) VALUES (
        v_user_id,
        v_company_id,
        'Carlos Vendedor Master',
        'admin@negociapro.com.br',
        'ADMIN',
        '(11) 99999-8888',
        true
    ) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

    -- 4. FORMAS DE PAGAMENTO
    INSERT INTO public.payment_methods (id, company_id, name) VALUES
    (gen_random_uuid(), v_company_id, 'PIX') RETURNING id INTO v_pay_pix;
    INSERT INTO public.payment_methods (id, company_id, name) VALUES
    (gen_random_uuid(), v_company_id, 'Cartão de Débito');
    INSERT INTO public.payment_methods (id, company_id, name) VALUES
    (gen_random_uuid(), v_company_id, 'Cartão de Crédito') RETURNING id INTO v_pay_cartao;
    INSERT INTO public.payment_methods (id, company_id, name) VALUES
    (gen_random_uuid(), v_company_id, 'Boleto Bancário 30 Dias') RETURNING id INTO v_pay_boleto;
    INSERT INTO public.payment_methods (id, company_id, name) VALUES
    (gen_random_uuid(), v_company_id, 'Dinheiro');

    -- 5. CATEGORIAS DE PRODUTOS
    INSERT INTO public.product_categories (id, company_id, name, description) VALUES
    (v_cat_materiais, v_company_id, 'Materiais Básicos', 'Cimento, areia, blocos e argamassas') ON CONFLICT DO NOTHING;
    INSERT INTO public.product_categories (id, company_id, name, description) VALUES
    (v_cat_ferramentas, v_company_id, 'Ferramentas', 'Ferramentas elétricas e manuais') ON CONFLICT DO NOTHING;
    INSERT INTO public.product_categories (id, company_id, name, description) VALUES
    (v_cat_eletrica, v_company_id, 'Elétrica', 'Fios, cabos, disjuntores e tomadas') ON CONFLICT DO NOTHING;
    INSERT INTO public.product_categories (id, company_id, name, description) VALUES
    (v_cat_hidraulica, v_company_id, 'Hidráulica', 'Tubos PVC, conexões e registros') ON CONFLICT DO NOTHING;

    -- 6. PRODUTOS (15 Produtos Comerciais)
    INSERT INTO public.products (company_id, category_id, name, sku, unit, brand, cost_price, selling_price, min_price, current_stock, min_stock)
    VALUES (v_company_id, v_cat_materiais, 'Cimento CP II 50kg', 'MAT-CIM-50', 'SC', 'Votoran', 24.00, 36.90, 31.00, 450, 100) RETURNING id INTO v_p1;

    INSERT INTO public.products (company_id, category_id, name, sku, unit, brand, cost_price, selling_price, min_price, current_stock, min_stock)
    VALUES (v_company_id, v_cat_materiais, 'Argamassa AC-II 20kg', 'MAT-ARG-20', 'SC', 'Quartzolit', 11.50, 19.90, 16.50, 300, 50) RETURNING id INTO v_p2;

    INSERT INTO public.products (company_id, category_id, name, sku, unit, brand, cost_price, selling_price, min_price, current_stock, min_stock)
    VALUES (v_company_id, v_cat_materiais, 'Tijolo Cerâmico 8 Furos', 'MAT-TIJ-08', 'MIL', 'Cerâmica Real', 580.00, 890.00, 780.00, 25, 5) RETURNING id INTO v_p3;

    INSERT INTO public.products (company_id, category_id, name, sku, unit, brand, cost_price, selling_price, min_price, current_stock, min_stock)
    VALUES (v_company_id, v_cat_materiais, 'Areia Média Lavada m³', 'MAT-ARE-01', 'M³', 'Mineração Sol', 75.00, 130.00, 110.00, 80, 20) RETURNING id INTO v_p4;

    INSERT INTO public.products (company_id, category_id, name, sku, unit, brand, cost_price, selling_price, min_price, current_stock, min_stock)
    VALUES (v_company_id, v_cat_ferramentas, 'Furadeira de Impacto 1/2 750W', 'FER-FUR-750', 'UN', 'Bosch', 210.00, 389.00, 320.00, 45, 10) RETURNING id INTO v_p5;

    INSERT INTO public.products (company_id, category_id, name, sku, unit, brand, cost_price, selling_price, min_price, current_stock, min_stock)
    VALUES (v_company_id, v_cat_ferramentas, 'Serra Mármore 1400W 110V', 'FER-SER-140', 'UN', 'Makita', 260.00, 449.90, 380.00, 30, 8) RETURNING id INTO v_p6;

    INSERT INTO public.products (company_id, category_id, name, sku, unit, brand, cost_price, selling_price, min_price, current_stock, min_stock)
    VALUES (v_company_id, v_cat_ferramentas, 'Disco de Corte Inox 4.1/2', 'FER-DIS-412', 'UN', 'Norton', 3.20, 6.50, 5.00, 800, 150) RETURNING id INTO v_p7;

    INSERT INTO public.products (company_id, category_id, name, sku, unit, brand, cost_price, selling_price, min_price, current_stock, min_stock)
    VALUES (v_company_id, v_cat_eletrica, 'Cabo Flexível 2,5mm 100m Azul', 'ELE-CAB-25A', 'RL', 'Sil Fios', 140.00, 229.00, 195.00, 60, 15) RETURNING id INTO v_p8;

    INSERT INTO public.products (company_id, category_id, name, sku, unit, brand, cost_price, selling_price, min_price, current_stock, min_stock)
    VALUES (v_company_id, v_cat_eletrica, 'Cabo Flexível 4,0mm 100m Preto', 'ELE-CAB-40P', 'RL', 'Sil Fios', 215.00, 349.00, 298.00, 40, 10) RETURNING id INTO v_p9;

    INSERT INTO public.products (company_id, category_id, name, sku, unit, brand, cost_price, selling_price, min_price, current_stock, min_stock)
    VALUES (v_company_id, v_cat_eletrica, 'Disjuntor Bipolar Din 32A', 'ELE-DIS-32B', 'UN', 'Schneider', 32.00, 58.90, 48.00, 120, 25) RETURNING id INTO v_p10;

    INSERT INTO public.products (company_id, category_id, name, sku, unit, brand, cost_price, selling_price, min_price, current_stock, min_stock)
    VALUES (v_company_id, v_cat_hidraulica, 'Tubo Soldável 25mm 6m', 'HID-TUB-25', 'BR', 'Tigre', 18.00, 31.90, 26.50, 180, 40) RETURNING id INTO v_p11;

    INSERT INTO public.products (company_id, category_id, name, sku, unit, brand, cost_price, selling_price, min_price, current_stock, min_stock)
    VALUES (v_company_id, v_cat_hidraulica, 'Tubo de Esgoto 100mm 6m', 'HID-TUB-100', 'BR', 'Tigre', 42.00, 72.00, 62.00, 95, 20) RETURNING id INTO v_p12;

    INSERT INTO public.products (company_id, category_id, name, sku, unit, brand, cost_price, selling_price, min_price, current_stock, min_stock)
    VALUES (v_company_id, v_cat_hidraulica, 'Registro de Esfera PVC 25mm', 'HID-REG-25', 'UN', 'Amanco', 9.80, 18.50, 14.90, 150, 30) RETURNING id INTO v_p13;

    INSERT INTO public.products (company_id, category_id, name, sku, unit, brand, cost_price, selling_price, min_price, current_stock, min_stock)
    VALUES (v_company_id, v_cat_materiais, 'Tinta Acrílica Fosca Premium 18L', 'TIN-ACR-18L', 'LATA', 'Suvinil', 195.00, 389.00, 335.00, 50, 12) RETURNING id INTO v_p14;

    INSERT INTO public.products (company_id, category_id, name, sku, unit, brand, cost_price, selling_price, min_price, current_stock, min_stock)
    VALUES (v_company_id, v_cat_materiais, 'Massa Corrida PVA 25kg', 'TIN-MAS-25K', 'CX', 'Coral', 35.00, 68.00, 56.00, 70, 15) RETURNING id INTO v_p15;

    -- 7. CLIENTES (5 Pessoa Física / 5 Pessoa Jurídica)
    -- PF
    INSERT INTO public.customers (company_id, type, name, document, phone, whatsapp, email, city, state)
    VALUES (v_company_id, 'PF', 'João da Silva Santos', '123.456.789-01', '(11) 98111-2222', '(11) 98111-2222', 'joao.silva@email.com', 'São Paulo', 'SP') RETURNING id INTO v_c1;

    INSERT INTO public.customers (company_id, type, name, document, phone, whatsapp, email, city, state)
    VALUES (v_company_id, 'PF', 'Mariana Oliveira Lima', '234.567.890-12', '(11) 98222-3333', '(11) 98222-3333', 'mariana.oliveira@email.com', 'Campinas', 'SP') RETURNING id INTO v_c2;

    INSERT INTO public.customers (company_id, type, name, document, phone, whatsapp, email, city, state)
    VALUES (v_company_id, 'PF', 'Roberto Carlos Ferreira', '345.678.901-23', '(11) 98333-4444', '(11) 98333-4444', 'roberto.ferreira@email.com', 'Guarulhos', 'SP') RETURNING id INTO v_c3;

    INSERT INTO public.customers (company_id, type, name, document, phone, whatsapp, email, city, state)
    VALUES (v_company_id, 'PF', 'Ana Paula Souza', '456.789.012-34', '(11) 98444-5555', '(11) 98444-5555', 'anapaula.souza@email.com', 'Santo André', 'SP') RETURNING id INTO v_c4;

    INSERT INTO public.customers (company_id, type, name, document, phone, whatsapp, email, city, state)
    VALUES (v_company_id, 'PF', 'Marcos Antônio Ribeiro', '567.890.123-45', '(11) 98555-6666', '(11) 98555-6666', 'marcos.ribeiro@email.com', 'Osasco', 'SP') RETURNING id INTO v_c5;

    -- PJ
    INSERT INTO public.customers (company_id, type, name, trade_name, document, phone, whatsapp, email, contact_person, city, state)
    VALUES (v_company_id, 'PJ', 'Construtora Alfa Engenharia LTDA', 'Alfa Engenharia', '11.222.333/0001-44', '(11) 3211-1000', '(11) 97111-0000', 'compras@alfaengenharia.com.br', 'Eng. Marcelo', 'São Paulo', 'SP') RETURNING id INTO v_c6;

    INSERT INTO public.customers (company_id, type, name, trade_name, document, phone, whatsapp, email, contact_person, city, state)
    VALUES (v_company_id, 'PJ', 'Empresa ABC Manutenções Prediais LTDA', 'ABC Manutenções', '22.333.444/0001-55', '(11) 3222-2000', '(11) 97222-0000', 'financeiro@abcmanutencao.com.br', 'Sr. Ricardo', 'Barueri', 'SP') RETURNING id INTO v_c7;

    INSERT INTO public.customers (company_id, type, name, trade_name, document, phone, whatsapp, email, contact_person, city, state)
    VALUES (v_company_id, 'PJ', 'Delta Reformas e Instalações EIRELI', 'Delta Reformas', '33.444.555/0001-66', '(11) 3233-3000', '(11) 97333-0000', 'contato@deltareformas.com.br', 'Amanda Salles', 'São Bernardo do Campo', 'SP') RETURNING id INTO v_c8;

    INSERT INTO public.customers (company_id, type, name, trade_name, document, phone, whatsapp, email, contact_person, city, state)
    VALUES (v_company_id, 'PJ', 'Metrópole Empreendimentos Imobiliários S/A', 'Metrópole Empreendimentos', '44.555.666/0001-77', '(11) 3244-4000', '(11) 97444-0000', 'suprimentos@metropole.com.br', 'Dr. Henrique', 'São Paulo', 'SP') RETURNING id INTO v_c9;

    INSERT INTO public.customers (company_id, type, name, trade_name, document, phone, whatsapp, email, contact_person, city, state)
    VALUES (v_company_id, 'PJ', 'Nova Era Elétrica e Hidráulica ME', 'Nova Era Serviços', '55.666.777/0001-88', '(11) 3255-5000', '(11) 97555-0000', 'novaera@servicos.com.br', 'Cláudio Martins', 'Jundiaí', 'SP') RETURNING id INTO v_c10;

    -- 8. HISTÓRICO DE NEGOCIAÇÕES ANTERIORES (Para testes instantâneos na tela de venda)
    -- Exemplo clássico do João da Silva comprando Cimento:
    INSERT INTO public.price_history (company_id, customer_id, product_id, seller_id, quantity, unit_price, discount, final_unit_price, total_price, negotiation_date, notes) VALUES
    (v_company_id, v_c1, v_p1, v_user_id, 40, 36.90, 4.00, 32.90, 1316.00, '2026-09-12 14:30:00+00', 'Negociação especial lote reforma'),
    (v_company_id, v_c1, v_p1, v_user_id, 30, 36.90, 2.40, 34.50, 1035.00, '2026-08-28 10:15:00+00', 'Pagamento à vista'),
    (v_company_id, v_c1, v_p1, v_user_id, 20, 36.90, 1.90, 35.00, 700.00, '2026-08-10 16:45:00+00', 'Primeira negociação cliente'),
    (v_company_id, v_c1, v_p1, v_user_id, 50, 36.90, 3.00, 33.90, 1695.00, '2026-07-22 09:20:00+00', 'Promoção de inverno');

    -- Exemplo Empresa ABC comprando Furadeira e Argamassa:
    INSERT INTO public.price_history (company_id, customer_id, product_id, seller_id, quantity, unit_price, discount, final_unit_price, total_price, negotiation_date, notes) VALUES
    (v_company_id, v_c7, v_p5, v_user_id, 5, 389.00, 39.00, 350.00, 1750.00, '2026-09-05 11:00:00+00', 'Compra para equipe nova'),
    (v_company_id, v_c7, v_p5, v_user_id, 2, 389.00, 29.00, 360.00, 720.00, '2026-07-15 15:30:00+00', 'Reposição emergencial'),
    (v_company_id, v_c7, v_p2, v_user_id, 100, 19.90, 2.90, 17.00, 1700.00, '2026-09-02 08:30:00+00', 'Lote fechado palete');

    -- Construtora Alfa comprando Tubos e Cabos:
    INSERT INTO public.price_history (company_id, customer_id, product_id, seller_id, quantity, unit_price, discount, final_unit_price, total_price, negotiation_date, notes) VALUES
    (v_company_id, v_c6, v_p8, v_user_id, 20, 229.00, 24.00, 205.00, 4100.00, '2026-09-10 17:00:00+00', 'Obra Residencial Morumbi'),
    (v_company_id, v_c6, v_p11, v_user_id, 50, 31.90, 4.40, 27.50, 1375.00, '2026-09-10 17:00:00+00', 'Obra Residencial Morumbi');

END $$;
