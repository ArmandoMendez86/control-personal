<?php
class ConceptoModel {
    private $conn;
    private $table = 'conceptos';

    public function __construct($db) {
        $this->conn = $db;
    }

    /**
     * Obtiene todos los conceptos.
     */
    public function getAll() {
        $query = 'SELECT * FROM ' . $this->table . ' ORDER BY nombre ASC';
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }

    // Aquí irían las funciones para crear, actualizar y eliminar conceptos si las necesitas.
}
?>
