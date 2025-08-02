<?php
class JustificacionModel {
    private $conn;
    private $table = 'justificaciones';

    public function __construct($db) {
        $this->conn = $db;
    }

    /**
     * Guarda múltiples justificaciones, borrando las anteriores para ese empleado.
     */
    public function saveMultiple($empleado_id, $faltas) {
        // Iniciar una transacción para asegurar la integridad de los datos
        $this->conn->beginTransaction();

        try {
            // 1. Borrar todas las justificaciones existentes para este empleado y fechas
            $fechas = array_column($faltas, 'fecha');
            if (!empty($fechas)) {
                $placeholders = implode(',', array_fill(0, count($fechas), '?'));
                $deleteQuery = 'DELETE FROM ' . $this->table . ' WHERE empleado_id = ? AND fecha IN (' . $placeholders . ')';
                $stmt = $this->conn->prepare($deleteQuery);
                $params = array_merge([$empleado_id], $fechas);
                $stmt->execute($params);
            }

            // 2. Insertar las nuevas justificaciones (solo las que están marcadas)
            $insertQuery = 'INSERT INTO ' . $this->table . ' (empleado_id, fecha, motivo) VALUES (?, ?, ?)';
            $stmt = $this->conn->prepare($insertQuery);

            foreach ($faltas as $falta) {
                if ($falta->justificada) {
                    $stmt->execute([$empleado_id, $falta->fecha, $falta->motivo]);
                }
            }

            // Si todo fue bien, confirmar la transacción
            $this->conn->commit();
            return true;

        } catch (Exception $e) {
            // Si algo falla, revertir la transacción
            $this->conn->rollBack();
            return false;
        }
    }
}
?>
