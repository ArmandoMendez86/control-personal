<?php
class AsistenciaModel {
    private $conn;
    private $table = 'registros_asistencia';

    public function __construct($db) {
        $this->conn = $db;
    }

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

    public function getRegistroHoy($empleadoId, $fecha) {
        $query = 'SELECT * FROM ' . $this->table . ' 
                  WHERE empleado_id = :empleado_id AND fecha = :fecha
                  ORDER BY hora_entrada DESC LIMIT 1';
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':empleado_id', $empleadoId);
        $stmt->bindParam(':fecha', $fecha);
        $stmt->execute();
        
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function crearRegistro($empleadoId, $fecha, $horaEntrada, $horaSalida) {
        $query = 'INSERT INTO ' . $this->table . ' 
                  (empleado_id, fecha, hora_entrada, hora_salida) 
                  VALUES (:empleado_id, :fecha, :hora_entrada, :hora_salida)';
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':empleado_id', $empleadoId);
        $stmt->bindParam(':fecha', $fecha);
        $stmt->bindParam(':hora_entrada', $horaEntrada);
        $stmt->bindParam(':hora_salida', $horaSalida);
        
        return $stmt->execute();
    }

    public function actualizarSalida($registroId, $horaSalida) {
        $query = 'UPDATE ' . $this->table . ' 
                  SET hora_salida = :hora_salida 
                  WHERE id = :id';
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':hora_salida', $horaSalida);
        $stmt->bindParam(':id', $registroId);
        
        return $stmt->execute();
    }
}