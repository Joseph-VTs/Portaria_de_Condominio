<?php
require_once 'conexao.php';
header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    if (isset($_GET['buscar_placa'])) {
        $placa = trim($_GET['buscar_placa']);
        $sql = "SELECT a.*, v.nome as v_nome, v.tipo_doc as v_tipo_doc, v.numero_doc as v_numero_doc, v.data_nascimento as v_data_nascimento, ve.modelo, ve.cor, ve.tipo_placa, ve.placa
                FROM registos_acesso a
                JOIN visitantes v ON a.visitante_id = v.id
                LEFT JOIN veiculos ve ON a.veiculo_id = ve.id
                WHERE ve.placa = :placa
                  AND a.data_hora_entrada >= DATE_SUB(NOW(), INTERVAL 15 DAY)
                ORDER BY a.id DESC LIMIT 1";
        $stmt = $pdo->prepare($sql);
        $stmt->execute(['placa' => $placa]);
        $dados = $stmt->fetch();
        echo json_encode($dados ? $dados : ['encontrado' => false]);
        exit;
    }

    $stmt = $pdo->query("SELECT * FROM visitantes WHERE frequente = 1 ORDER BY nome ASC");
    echo json_encode($stmt->fetchAll());
}
elseif ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $frequente = isset($data['frequente']) && $data['frequente'] ? 1 : 0;
    $apenas_cadastro = isset($data['apenas_cadastro']) && $data['apenas_cadastro'] ? 1 : 0;

    try {
        $pdo->beginTransaction();

        $veiculo_id = null;
        if (!empty($data['placa'])) {
            $stmtV = $pdo->prepare("SELECT id FROM veiculos WHERE placa = :placa");
            $stmtV->execute(['placa' => $data['placa']]);
            $veic = $stmtV->fetch();
            if ($veic) {
                $veiculo_id = $veic['id'];
                $stmtUpdV = $pdo->prepare("UPDATE veiculos SET modelo = :modelo, cor = :cor, tipo_placa = :tipo_placa WHERE id = :id");
                $stmtUpdV->execute([
                    'modelo' => $data['modelo'] ?? 'Não informado',
                    'cor' => $data['cor'] ?? 'Não informada',
                    'tipo_placa' => $data['tipo_placa'] ?? 'ANTIGA',
                    'id' => $veic['id']
                ]);
            } else {
                $stmtInsV = $pdo->prepare("INSERT INTO veiculos (modelo, cor, tipo_placa, placa) VALUES (:modelo, :cor, :tipo_placa, :placa)");
                $stmtInsV->execute([
                    'modelo' => $data['modelo'] ?? 'Não informado',
                    'cor' => $data['cor'] ?? 'Não informada',
                    'tipo_placa' => $data['tipo_placa'] ?? 'ANTIGA',
                    'placa' => $data['placa']
                ]);
                $veiculo_id = $pdo->lastInsertId();
            }
        }

        $stmtVis = $pdo->prepare("SELECT id FROM visitantes WHERE numero_doc = :doc");
        $stmtVis->execute(['doc' => $data['numero_doc']]);
        $visitante = $stmtVis->fetch();

        if ($visitante) {
            $visitante_id = $visitante['id'];
            $stmtUpdVis = $pdo->prepare("UPDATE visitantes SET veiculo_id = :veic_id, nome = :nome, tipo_doc = :tipo_doc, data_nascimento = :data_nasc, frequente = CASE WHEN :frequ = 1 THEN 1 else frequente END WHERE id = :id");
            $stmtUpdVis->execute([
                'veic_id' => $veiculo_id,
                'nome' => $data['nome'],
                'tipo_doc' => $data['tipo_doc'],
                'data_nasc' => !empty($data['data_nascimento']) ? $data['data_nascimento'] : null,
                'frequ' => $frequente,
                'id' => $visitante_id
            ]);
        } else {
            $stmtIns = $pdo->prepare("INSERT INTO visitantes (veiculo_id, nome, tipo_doc, numero_doc, data_nascimento, frequente) VALUES (:veic_id, :nome, :tipo_doc, :numero_doc, :data_nascimento, :frequente)");
            $stmtIns->execute([
                'veic_id' => $veiculo_id,
                'nome' => $data['nome'] ?? 'Visitante',
                'tipo_doc' => $data['tipo_doc'] ?? 'CPF',
                'numero_doc' => $data['numero_doc'] ?? '000',
                'data_nascimento' => !empty($data['data_nascimento']) ? $data['data_nascimento'] : null,
                'frequente' => $frequente
            ]);
            $visitante_id = $pdo->lastInsertId();
        }

        if ($apenas_cadastro) {
            $pdo->commit();
            echo json_encode(['sucesso' => true, 'mensagem' => 'Visitante cadastrado como Frequente com sucesso!']);
            exit;
        }

        $destinoStr = $data['casa_destino'] ?? 'Geral';
        $stmtAcc = $pdo->prepare("INSERT INTO registos_acesso (tipo_pessoa, visitante_id, veiculo_id, liberacao, tipo_movimento, status_visitante, rua_destino, casa_destino, observacao, data_hora_entrada) 
                                  VALUES ('VISITANTE', :visitante_id, :veiculo_id, 'CANCELA_MANUAL', 'ENTRADA', 'PENDENTE', 'Rua Principal', :casa, :obs, :data_hora)");
        $stmtAcc->execute([
            'visitante_id' => $visitante_id,
            'veiculo_id' => $veiculo_id,
            'casa' => $destinoStr,
            'obs' => $data['observacao'] ?? '',
            'data_hora' => !empty($data['data_hora']) ? str_replace('T', ' ', $data['data_hora']) . ':00' : date('Y-m-d H:i:s')
        ]);

        $pdo->commit();
        echo json_encode(['sucesso' => true, 'mensagem' => 'Acesso de visitante registado com sucesso em Cancela Manual!']);
    } catch (Exception $e) {
        $pdo->rollBack();
        http_response_code(500);
        echo json_encode(['erro' => $e->getMessage()]);
    }
}
?>