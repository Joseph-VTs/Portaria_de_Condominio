CREATE DATABASE IF NOT EXISTS sistema_portaria CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE sistema_portaria;

-- Tabela de Ruas do Condomínio
CREATE TABLE ruas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Casas/Lotes (Garante que o número da casa seja único dentro da mesma rua)
CREATE TABLE casas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rua_id INT NOT NULL,
    numero_casa VARCHAR(20) NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (rua_id) REFERENCES ruas(id) ON DELETE CASCADE,
    UNIQUE KEY unique_casa_por_rua (rua_id, numero_casa)
);

-- Tabela de Configuração do Condomínio (Mapa e Dados Globais)
CREATE TABLE condominio_config (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome_condominio VARCHAR(150) DEFAULT 'Condomínio Principal',
    mapa_imagem VARCHAR(255) NULL
);

-- Tabela de Veículos
CREATE TABLE veiculos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    modelo VARCHAR(50) NOT NULL,
    cor VARCHAR(30) NOT NULL,
    tipo_placa ENUM('ANTIGA', 'MERCOSUL') NOT NULL,
    placa VARCHAR(10) NOT NULL UNIQUE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_placa (placa)
);

-- Tabela de Proprietários (Normalizada com relação direta à tabela casas)
CREATE TABLE proprietarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    tipo_doc ENUM('CPF', 'RG') NOT NULL,
    numero_doc VARCHAR(20) NOT NULL UNIQUE,
    data_nascimento DATE NOT NULL,
    casa_id INT NOT NULL,
    ativo BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (casa_id) REFERENCES casas(id) ON DELETE RESTRICT,
    INDEX idx_proprietario_casa (casa_id)
);

-- Tabela de Moradores / Inquilinos (Normalizada com relação direta à tabela casas)
CREATE TABLE moradores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    proprietario_id INT NULL, 
    nome VARCHAR(100) NOT NULL,
    tipo_doc ENUM('CPF', 'RG') NOT NULL,
    numero_doc VARCHAR(20) NOT NULL UNIQUE,
    data_nascimento DATE NOT NULL,
    parentesco VARCHAR(50) DEFAULT 'Titular',
    casa_id INT NOT NULL,
    ativo BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (proprietario_id) REFERENCES proprietarios(id) ON DELETE SET NULL,
    FOREIGN KEY (casa_id) REFERENCES casas(id) ON DELETE RESTRICT,
    INDEX idx_morador_casa (casa_id)
);

-- Tabela Associativa de Veículos para Proprietários e Moradores
CREATE TABLE pessoa_veiculos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    proprietario_id INT NULL,
    morador_id INT NULL,
    veiculo_id INT NOT NULL,
    FOREIGN KEY (proprietario_id) REFERENCES proprietarios(id) ON DELETE CASCADE,
    FOREIGN KEY (morador_id) REFERENCES moradores(id) ON DELETE CASCADE,
    FOREIGN KEY (veiculo_id) REFERENCES veiculos(id) ON DELETE CASCADE
);

-- Tabela de Visitantes
CREATE TABLE visitantes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    veiculo_id INT NULL,
    nome VARCHAR(100) NOT NULL,
    tipo_doc ENUM('CPF', 'RG') NOT NULL,
    numero_doc VARCHAR(20) NOT NULL,
    data_nascimento DATE NULL,
    frequente BOOLEAN DEFAULT FALSE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (veiculo_id) REFERENCES veiculos(id) ON DELETE SET NULL,
    INDEX idx_doc (numero_doc)
);

-- Tabela de Registos de Acesso (Com rastreabilidade completa para Proprietários, Moradores e Visitantes)
CREATE TABLE registos_acesso (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tipo_pessoa ENUM('PROPRIETARIO', 'MORADOR', 'VISITANTE') NOT NULL,
    proprietario_id INT NULL,
    morador_id INT NULL,
    visitante_id INT NULL,
    veiculo_id INT NULL,
    porteiro_nome VARCHAR(100) DEFAULT 'Celso Padilha',
    liberacao ENUM('PORTAO_AUTOMATICO', 'CANCELA_MANUAL') NOT NULL,
    tipo_movimento ENUM('ENTRADA', 'SAIDA') NOT NULL,
    status_visitante ENUM('PENDENTE', 'CONCLUIDO') DEFAULT 'PENDENTE',
    rua_destino VARCHAR(100),
    casa_destino VARCHAR(20),
    observacao TEXT,
    data_hora_entrada DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data_hora_saida DATETIME NULL,
    FOREIGN KEY (proprietario_id) REFERENCES proprietarios(id) ON DELETE SET NULL,
    FOREIGN KEY (morador_id) REFERENCES moradores(id) ON DELETE SET NULL,
    FOREIGN KEY (visitante_id) REFERENCES visitantes(id) ON DELETE SET NULL,
    FOREIGN KEY (veiculo_id) REFERENCES veiculos(id) ON DELETE SET NULL,
    INDEX idx_data_entrada (data_hora_entrada),
    INDEX idx_status (status_visitante)
);