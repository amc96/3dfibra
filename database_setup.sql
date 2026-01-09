-- Script de criação do banco de dados para 3D FIBRA
-- Compatível com PostgreSQL

-- Tabela de Planos (Internet, TV e Adicionais)
CREATE TABLE IF NOT EXISTS plans (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    speed TEXT NOT NULL,
    price TEXT NOT NULL,
    description TEXT,
    features JSONB NOT NULL,
    is_highlighted BOOLEAN DEFAULT FALSE,
    category TEXT DEFAULT 'internet'
);

-- Limpar dados existentes antes de inserir (opcional, remova se não desejar)
TRUNCATE TABLE plans;

-- Dados iniciais (Seed)
INSERT INTO plans (name, speed, price, features, is_highlighted, category) VALUES
-- Planos de Internet
('Básico', '300 MEGA', '79,90', '["Wi-Fi Grátis", "Instalação Grátis", "Suporte 24h", "Fibra Óptica"]', false, 'internet'),
('Essencial', '400 MEGA', '89,90', '["Wi-Fi Grátis", "Instalação Grátis", "Suporte 24h", "Fibra Óptica"]', false, 'internet'),
('Intermediário', '500 MEGA', '99,90', '["Wi-Fi Grátis", "Instalação Grátis", "Suporte 24h", "Fibra Óptica"]', true, 'internet'),
('Avançado', '600 MEGA', '109,90', '["Wi-Fi Grátis", "Instalação Grátis", "Suporte 24h", "Fibra Óptica"]', false, 'internet'),
('Ultra', '700 MEGA', '119,90', '["Wi-Fi Grátis", "Instalação Grátis", "Suporte 24h", "Fibra Óptica"]', false, 'internet'),
('Gamer', '800 MEGA', '129,90', '["Wi-Fi Grátis", "Instalação Grátis", "Suporte 24h", "Fibra Óptica"]', false, 'internet'),
('Premium', '900 MEGA', '139,90', '["Wi-Fi Grátis", "Instalação Grátis", "Suporte 24h", "Fibra Óptica"]', false, 'internet'),

-- Planos de TV
('Canais Light', '100+ Canais', '17,90', '["Canais abertos entre outros", "Qualidade HD", "Suporte para TV, iOS, Android e Web", "Lista de canais"]', false, 'tv'),
('Canais Plus', '150+ Canais', '39,90', '["Canais abertos entre outros", "Qualidade HD", "Suporte para TV, iOS, Android e Web", "Lista de canais"]', false, 'tv'),
('Canais Ultra', '200+ Canais', '53,90', '["Canais abertos entre outros", "Qualidade HD", "Suporte para TV, iOS, Android e Web", "Lista de canais"]', true, 'tv'),
('Canais Ultra 1P + HBO', '200+ Canais + HBO', '70,90', '["Canais abertos entre outros", "Qualidade HD", "Suporte para TV, iOS, Android e Web", "Lista de canais"]', false, 'tv'),

-- Adicionais
('Câmera de Segurança', 'Câmera', '25,00', '["Acesse de onde estiver", "Aplicativo para Android e iOS", "Visão Noturna", "Câmera Full HD"]', false, 'adicionais'),
('Roteador Extra', 'WIFI 6', '25,00', '["Maior Alcance", "Tecnologia Mesh", "Fácil Configuração", "Gigabit"]', false, 'adicionais'),
('TV Box', 'Android TV', '25,00', '["Transforma sua TV", "Acesso a Apps", "Resolução Full HD", "Controle Remoto"]', false, 'adicionais');

-- Instruções para Locaweb:
-- 1. Acesse o painel do PostgreSQL na Locaweb.
-- 2. Abra a ferramenta de Query (ou use um cliente como pgAdmin conectado ao host da Locaweb).
-- 3. Execute este script para criar a estrutura e carregar todos os dados (Internet, TV e Adicionais).
