<?php
class TransaccionNominaModel {
    private $conn;
    private $table = 'transacciones_nomina';

    public function __construct($db) {
        $this->conn = $db;
    }

    /**
     * Guarda múltiples transacciones para un periodo, usando INSERT ... ON CONFLICT
     * para crear o actualizar según sea necesario.
     */
    public function saveMultiple($periodo, $transacciones) {
        // Esta consulta es específica de PostgreSQL.
        // Inserta una nueva fila. Si ya existe una fila con el mismo (empleado_id, concepto_id, periodo),
        // en lugar de fallar, actualiza el monto de la fila existente.
        $query = 'INSERT INTO ' . $this->table . ' (empleado_id, concepto_id, periodo, monto) VALUES (:empleado_id, :concepto_id, :periodo, :monto) ON CONFLICT (empleado_id, concepto_id, periodo) DO UPDATE SET monto = EXCLUDED.monto';

        $stmt = $this->conn->prepare($query);

        $this->conn->beginTransaction();
        try {
            foreach ($transacciones as $trans) {
                // Si el monto es 0, podríamos optar por eliminar el registro en lugar de insertar/actualizar.
                // Por simplicidad, aquí actualizamos a 0.
                $stmt->bindParam(':empleado_id', $trans->empleado_id);
                $stmt->bindParam(':concepto_id', $trans->concepto_id);
                $stmt->bindParam(':periodo', $periodo);
                $stmt->bindParam(':monto', $trans->monto);
                $stmt->execute();
            }
            $this->conn->commit();
            return true;
        } catch (Exception $e) {
            $this->conn->rollBack();
            return false;
        }
    }
}
?>
