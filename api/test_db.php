<?php
// Habilitar la visualización de todos los errores
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

echo "<h1>Prueba de Conexión a PostgreSQL</h1>";

// --- CONFIGURACIÓN ---
$host = 'localhost';
$port = '5432';
$db_name = 'personal'; // El nombre de tu base de datos
$username = 'postgres';
$password = 'linux'; // <-- ¡IMPORTANTE! Reemplaza con tu contraseña

// --- INTENTO DE CONEXIÓN ---
try {
    $dsn = "pgsql:host={$host};port={$port};dbname={$db_name}";
    $pdo = new PDO($dsn, $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    echo "<p style='color:green; font-weight:bold;'>¡CONEXIÓN EXITOSA a la base de datos '{$db_name}'!</p>";

    // --- VERIFICACIÓN DE TABLAS ---
    echo "<h2>Verificando tablas en el esquema 'public'...</h2>";

    $query = "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name";
    $stmt = $pdo->prepare($query);
    $stmt->execute();

    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);

    if (count($tables) > 0) {
        echo "<p>Se encontraron las siguientes tablas:</p>";
        echo "<ul>";
        foreach ($tables as $table) {
            echo "<li>" . htmlspecialchars($table) . "</li>";
        }
        echo "</ul>";

        if (in_array('empleados', $tables)) {
            echo "<p style='color:green; font-weight:bold;'>¡ÉXITO! La tabla 'empleados' fue encontrada.</p>";
        } else {
            echo "<p style='color:red; font-weight:bold;'>¡ERROR! La tabla 'empleados' NO fue encontrada en esta base de datos.</p>";
        }

    } else {
        echo "<p style='color:red; font-weight:bold;'>¡ERROR! No se encontró ninguna tabla en el esquema 'public' de la base de datos '{$db_name}'.</p>";
    }

} catch (PDOException $e) {
    echo "<p style='color:red; font-weight:bold;'>FALLÓ LA CONEXIÓN:</p>";
    echo "<pre>" . $e->getMessage() . "</pre>";
}
?>
