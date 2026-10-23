<?php
require_once 'conexao.php';
header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = $pdo->query("SELECT * FROM proprietarios ORDER BY nome ASC");
    echo json_encode($stmt->fetchAll());
}
elseif ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);

    try {
        $pdo->beginTransaction();

        $stmt = $pdo->prepare("INSERT INTO proprietarios (nome, tipo_doc, numero_doc, data_nascimento, rua, casa) VALUES (:nome, :tipo_doc, :num_doc, :dt_nasc, :rua, :casa)");
        $stmt->execute([
            'nome' => $data['nome'],
            'tipo_doc' => $data['tipo_doc'],
            'num_doc' => $data['numero_doc'],
            'dt_nasc' => $data['data_nascimento'],
            'rua' => $data['rua'],
            'casa' => $data['casa']
        ]);
        $proprietario_id = $pdo->lastInsertId();

        // Inserir veículos se houver
        if (!empty($data['veiculos'])) {
            foreach ($data['veiculos'] as $veic) {
                if(empty($veic['placa']) || empty($veic['modelo'])) continue;

                $stmtV = $pdo->prepare("SELECT id FROM veiculos WHERE placa = :placa");
                $stmtV->execute(['placa' => $veic['placa']]);
                $vObj = $stmtV->fetch();

                if ($vObj) {
                    $veiculo_id = $vObj['id'];
                } else {
                    $stmtInsV = $pdo->prepare("INSERT INTO veiculos (modelo, cor, tipo_placa, placa) VALUES (:modelo, :cor, :tipo_placa, :placa)");
                    $stmtInsV->execute([
                        'modelo' => $veic['modelo'],
                        'cor' => $veic['cor'] ?? 'Não informada',
                        'tipo_placa' => $veic['tipo_placa'] ?? 'ANTIGA',
                        'placa' => $veic['placa']
                    ]);
                    $veiculo_id = $pdo->lastInsertId();
                }

                $stmtAssoc = $pdo->prepare("INSERT INTO pessoa_veiculos (proprietario_id, veiculo_id) VALUES (:prop_id, :veic_id)");
                $stmtAssoc->execute([
                    'prop_id' => $proprietario_id,
                    'veic_id' => $veiculo_id
                ]);
            }
        }

        // Inserir moradores/dependentes adicionais se houver
        if (!empty($data['moradores'])) {
            foreach ($data['moradores'] as $m) {
                if(empty($m['nome']) || empty($m['numero_doc'])) continue;

                $stmtM = $pdo->prepare("INSERT INTO moradores (proprietario_id, nome, tipo_doc, numero_doc, data_nascimento, parentesco, rua, casa) VALUES (:prop_id, :nome, :tipo_doc, :num_doc, :dt_nasc, :parentesco, :rua, :casa)");
                $stmtM->execute([
                    'prop_id' => $proprietario_id,
                    'nome' => $m['nome'],
                    'tipo_doc' => $m['tipo_doc'],
                    'num_doc' => $m['numero_doc'],
                    'dt_nasc' => !empty($m['data_nascimento']) ? $m['data_nascimento'] : date('Y-m-d'),
                    'parentesco' => $m['parentesco'] ?? 'Parente',
                    'rua' => $data['rua'],
                    'casa' => $data['casa']
                ]);
            }
        }

        $pdo->commit();
        echo json_encode(['sucesso' => true, 'mensagem' => 'Proprietário, dependentes e veículos cadastrados com sucesso!']);
    } catch (Exception $e) {
        $pdo->rollBack();
        http_response_code(500);
        echo json_encode(['sucesso' => false, 'erro' => $e->getMessage()]);
    }
}
?>