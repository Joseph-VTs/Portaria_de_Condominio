<?php
require_once 'conexao.php';
header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $status = $_GET['status'] ?? null;
    $liberacao = $_GET['liberacao'] ?? null;
    $apenas_hoje = isset($_GET['hoje']) ? true : false;

    $sql = "SELECT a.*, v.modelo as veiculo_modelo, v.cor as veiculo_cor, v.placa as v_placa 
            FROM registos_acesso a 
            LEFT JOIN veiculos v ON a.veiculo_id = v.id WHERE 1=1";
    
    $params = [];
    if ($status) {
        $sql .= " AND a.status_visitante = :status";
        $params['status'] = strtoupper($status);
    }
    if ($liberacao) {
        $sql .= " AND a.liberacao = :liberacao";
        $params['liberacao'] = strtoupper($liberacao);
    }
    
    // Filtro para focar nas ocorrências do dia por padrão
    if ($apenas_hoje) {
        $sql .= " AND DATE(a.data_hora_entrada) = CURDATE()";
    }

    $sql .= " ORDER BY a.id DESC";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    echo json_encode($stmt->fetchAll());
} 
elseif ($method === 'PUT') {
    $data = json_decode(file_get_contents('php://input'), true);
    if (isset($data['id'])) {
        $stmt = $pdo->prepare("UPDATE registos_acesso SET status_visitante = 'CONCLUIDO', data_hora_saida = NOW() WHERE id = :id");
        $stmt->execute(['id' => $data['id']]);
        echo json_encode(['sucesso' => true, 'mensagem' => 'Saída registada com sucesso!']);
    }
}
?>