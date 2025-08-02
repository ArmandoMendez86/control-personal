<?php
class AsistenciaModel {
    private $conn;
    private $table = 'registros_asistencia';

    public function __construct($db) {
        $this->conn = $db;
    }

    /**
     * Obtiene registros de asistencia filtrados por fecha y/o empleado.
     */
    public function getByFilters($fecha, $empleado_id) {
        $query = 'SELECT a.*, e.nombre_completo FROM ' . $this->table . ' a JOIN empleados e ON a.empleado_id = e.id WHERE 1=1';

        if ($fecha) {
            $query .= ' AND a.fecha = :fecha';
        }
        if ($empleado_id) {
            $query .= ' AND a.empleado_id = :empleado_id';
        }
        $query .= ' ORDER BY a.hora_entrada DESC';

        $stmt = $this->conn->prepare($query);

        if ($fecha) {
            $stmt->bindParam(':fecha', $fecha);
        }
        if ($empleado_id) {
            $stmt->bindParam(':empleado_id', $empleado_id);
        }

        $stmt->execute();
        return $stmt;
    }

    // Aquí irían las funciones para crear, actualizar y eliminar registros de asistencia.
}
?>
