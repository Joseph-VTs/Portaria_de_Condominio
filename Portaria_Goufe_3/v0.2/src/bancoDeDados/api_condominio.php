<?php
require_once 'conexao.php';
header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    try {
        $stmtRuas = $pdo->query("SELECT * FROM ruas ORDER BY nome ASC");
        $ruas = $stmtRuas->fetchAll(PDO::FETCH_ASSOC);

        $stmtCasas = $pdo->query("SELECT * FROM casas ORDER BY numero_casa ASC");
        $casas = $stmtCasas->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            'ruas' => $ruas,
            'casas' => $casas
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['erro' => $e->getMessage()]);
    }
} elseif ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $acao = $data['acao'] ?? '';

    try {
        if ($acao === 'salvar_rua') {
            if (empty($data['nome'])) {
                echo json_encode(['sucesso' => false, 'erro' => 'Informe o nome da rua.']);
                exit;
            }
            $stmt = $pdo->prepare("INSERT INTO ruas (nome) VALUES (:nome)");
            $stmt->execute(['nome' => $data['nome']]);
            echo json_encode(['sucesso' => true, 'mensagem' => 'Rua salva com sucesso!']);
        } elseif ($acao === 'salvar_casa') {
            if (empty($data['rua_id']) || empty($data['numero_casa'])) {
                echo json_encode(['sucesso' => false, 'erro' => 'Selecione a rua e informe o número da casa.']);
                exit;
            }
            $stmt = $pdo->prepare("INSERT INTO casas (rua_id, numero_casa) VALUES (:rua_id, :numero_casa)");
            $stmt->execute([
                'rua_id' => $data['rua_id'],
                'numero_casa' => $data['numero_casa']
            ]);
            echo json_encode(['sucesso' => true, 'mensagem' => 'Casa/Lote salvo com sucesso!']);
        } else {
            echo json_encode(['sucesso' => false, 'erro' => 'Ação não especificada.']);
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['sucesso' => false, 'erro' => 'Erro ao salvar no banco: ' . $e->getMessage()]);
    }
}
?>