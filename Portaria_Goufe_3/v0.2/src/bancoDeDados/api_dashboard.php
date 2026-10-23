<?php
require_once 'conexao.php';
header('Content-Type: application/json');

$periodo = $_GET['periodo'] ?? 'dia';
$condicaoTempo = "DATE(data_hora_entrada) = CURDATE()";
if ($periodo === '7dias') {
    $condicaoTempo = "data_hora_entrada >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
} elseif ($periodo === '15dias') {
    $condicaoTempo = "data_hora_entrada >= DATE_SUB(NOW(), INTERVAL 15 DAY)";
} elseif ($periodo === '30dias') {
    $condicaoTempo = "data_hora_entrada >= DATE_SUB(NOW(), INTERVAL 30 DAY)";
}

// Contar apenas entradas ativas/pendentes para refletir quem está dentro do condomínio[cite: 57]
$stmtEntradas = $pdo->prepare("SELECT tipo_pessoa, COUNT(*) as total FROM registos_acesso WHERE status_visitante = 'PENDENTE' AND $condicaoTempo GROUP BY tipo_pessoa");
$stmtEntradas->execute();
$entradas = $stmtEntradas->fetchAll(PDO::FETCH_KEY_PAIR);

// Contar saídas concluídas no período[cite: 57]
$stmtSaidas = $pdo->prepare("SELECT tipo_pessoa, COUNT(*) as total FROM registos_acesso WHERE status_visitante = 'CONCLUIDO' AND $condicaoTempo GROUP BY tipo_pessoa");
$stmtSaidas->execute();
$saidas = $stmtSaidas->fetchAll(PDO::FETCH_KEY_PAIR);

echo json_encode([
    'proprietarios' => [
        'entradas' => (int)($entradas['PROPRIETARIO'] ?? 0), 
        'saidas' => (int)($saidas['PROPRIETARIO'] ?? 0)
    ],
    'moradores' => [
        'entradas' => (int)($entradas['MORADOR'] ?? 0), 
        'saidas' => (int)($saidas['MORADOR'] ?? 0)
    ],
    'visitantes' => [
        'entradas' => (int)($entradas['VISITANTE'] ?? 0), 
        'saidas' => (int)($saidas['VISITANTE'] ?? 0)
    ]
]);
?>