<?php
$host = 'localhost';
$dbname = 'estacionamento_db';
$usuario = 'root';
$senha = ''; // Ajuste caso seu MySQL tenha senha

try {
    // Inicializa a conexão PDO com o MySQL
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $usuario, $senha);
    
    // Configura para disparar erros caso algo falhe no SQL
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

} catch (PDOException $erro) {
    // Se a conexão falhar, interrompe e mostra o erro
    die("Erro na conexão com o banco de dados: " . $erro->getMessage());
}
?>