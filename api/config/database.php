<?php
date_default_timezone_set('America/Mexico_City');

class Database {
    private $host = 'localhost';
    private $db_name = 'personal';
    private $username = 'postgres';
    private $password = 'linux'; // <-- ¡LA MISMA CONTRASEÑA QUE FUNCIONÓ EN test_db.php!
    private $port = '5432';
    private $conn;

    public function connect() {
        $this->conn = null;
        $dsn = "pgsql:host={$this->host};port={$this->port};dbname={$this->db_name}";
        try {
            $this->conn = new PDO($dsn, $this->username, $this->password);
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        } catch(PDOException $e) {
            echo 'Error de Conexión: ' . $e->getMessage();
        }
        return $this->conn;
    }
}
?>
