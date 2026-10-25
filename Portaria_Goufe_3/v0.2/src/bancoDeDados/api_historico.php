<?php
header('Content-Type: application/json; charset=utf-8');
require_once 'conexao.php';

$tipo = $_GET['tipo'] ?? '';
$id = intval($_GET['id'] ?? 0);

if (!$tipo || !$id) {
    echo json_encode([]);
    exit;
}

try {
    if ($tipo === 'VISITANTE') {
        $sql = "SELECT r.*, v.nome as visitante_nome, ve.modelo, ve.cor, ve.placa as v_placa 
                FROM registos_acesso r
                JOIN visitantes v ON r.visitante_id = v.id
                LEFT JOIN veiculos ve ON r.veiculo_id = ve.id
                WHERE r.visitante_id = ?
                ORDER BY r.data_hora_entrada DESC";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$id]);
    } else {
        // Para Proprietário ou Morador, buscamos pelo nome ou casa correspondente nos registos de destino
        $tabelaPessoa = ($tipo === 'PROPRIETARIO') ? 'proprietarios' : 'moradores';
        $sqlPessoa = "SELECT nome, rua, casa FROM $TabelaPessoa WHERE id = ?";
        $stmtPessoa = $pdo->prepare($sqlPessoa);
        $stmtPessoa->execute([$id]);
        $pessoa = $stmtPessoa->fetch(PDO::FETCH_ASSOC);

        if (!$pessoa) {
            echo json_encode([]);
            exit;
        }

        $termoBusca = '%' . $pessoa['nome'] . '%';
        
        $sql = "SELECT r.*, ve.modelo, ve.cor, ve.placa as v_placa 
                FROM registos_acesso r
                LEFT JOIN veiculos ve ON r.veiculo_id = ve.id
                WHERE r.casa_destino LIKE ?
                ORDER BY r.data_hora_entrada DESC";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$termoBusca]);
    }

    $historico = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($historico);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['erro' => $e->getMessage()]);
}