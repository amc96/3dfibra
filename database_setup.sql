-- Script de criação do banco de dados para 3D FIBRA
-- Compatível com PostgreSQL

-- Tabela de Planos (Internet e Combos)
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

-- Dados iniciais (Seed)
INSERT INTO plans (name, speed, price, features, is_highlighted, category) VALUES
('PLANO 300 MEGA', '300 MEGA', '79,90', '["Wi-Fi Grátis", "Instalação Grátis", "Suporte 24h", "Fibra Óptica"]', false, 'internet'),
('PLANO 500 MEGA', '500 MEGA', '99,90', '["Wi-Fi Grátis", "Instalação Grátis", "Suporte 24h", "Fibra Óptica"]', true, 'internet'),
('PLANO 700 MEGA', '700 MEGA', '119,90', '["Wi-Fi Grátis", "Instalação Grátis", "Suporte 24h", "Fibra Óptica"]', false, 'internet'),
('PLANO 900 MEGA', '900 MEGA', '149,90', '["Wi-Fi Grátis", "Instalação Grátis", "Suporte 24h", "Fibra Óptica"]', false, 'internet');

-- Instruções para Locaweb:
-- 1. Acesse o painel do PostgreSQL na Locaweb.
-- 2. Abra a ferramenta de Query (ou use um cliente como pgAdmin conectado ao host da Locaweb).
-- 3. Execute este script para criar a estrutura e carregar os planos iniciais.
