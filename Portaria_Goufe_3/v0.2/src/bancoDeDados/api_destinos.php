<?php
require_once 'conexao.php';
header('Content-Type: application/json');

// Buscar ruas e suas respetivas casas para os optgroups
$ruasStmt = $pdo->query("SELECT * FROM ruas ORDER BY nome ASC");
$ruas = $ruasStmt->fetchAll();

$casasStmt = $pdo->query("SELECT * FROM casas ORDER BY numero_casa ASC");
$casas = $casasStmt->fetchAll();

$proprietarios = $pdo->query("SELECT * FROM proprietarios ORDER BY nome ASC")->fetchAll();
$moradores = $pdo->query("SELECT m.*, p.nome as proprietario_nome FROM moradores m LEFT JOIN proprietarios p ON m.proprietario_id = p.id ORDER BY m.nome ASC")->fetchAll();

echo json_encode([
    'ruas' => $ruas,
    'casas' => $casas,
    'proprietarios' => $proprietarios,
    'moradores' => $moradores
]);
?>