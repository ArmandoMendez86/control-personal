<?php
class EmpleadoModel
{
    private $conn;
    private $table = 'empleados';

    public function __construct($db)
    {
        $this->conn = $db;
    }

    /**
     * Obtiene todos los empleados.
     */
    public function getAll()
    {
        $query = 'SELECT * FROM ' . $this->table . ' ORDER BY nombre_completo ASC';
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }

    /**
     * Obtiene un solo empleado por su ID.
     */
    public function getById($id)
    {
        $query = 'SELECT * FROM ' . $this->table . ' WHERE id = :id LIMIT 1';
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * Crea un nuevo empleado.
     */
    public function create($data)
    {
        $query = 'INSERT INTO ' . $this->table . ' (nombre_completo, sueldo_semanal, pin, horario_entrada, horario_salida, dias_laborales, pago_por_hora_extra, uuid) VALUES (:nombre_completo, :sueldo_semanal, :pin, :horario_entrada, :horario_salida, :dias_laborales, :pago_por_hora_extra, gen_random_uuid())';

        $stmt = $this->conn->prepare($query);

        // Limpiar datos
        $data->nombre_completo = htmlspecialchars(strip_tags($data->nombre_completo));
        // ... (limpiar los demás campos)

        // Vincular datos
        $stmt->bindParam(':nombre_completo', $data->nombre_completo);
        $stmt->bindParam(':sueldo_semanal', $data->sueldo_semanal);
        $stmt->bindParam(':pin', $data->pin);
        $stmt->bindParam(':horario_entrada', $data->horario_entrada);
        $stmt->bindParam(':horario_salida', $data->horario_salida);
        $stmt->bindParam(':dias_laborales', $data->dias_laborales);
        $stmt->bindParam(':pago_por_hora_extra', $data->pago_por_hora_extra);

        if ($stmt->execute()) {
            return true;
        }
        printf("Error: %s.\n", $stmt->error);
        return false;
    }

    /**
     * Actualiza un empleado existente.
     */
    public function update($id, $data)
    {
        $query = 'UPDATE ' . $this->table . ' SET nombre_completo = :nombre_completo, sueldo_semanal = :sueldo_semanal, horario_entrada = :horario_entrada, horario_salida = :horario_salida, dias_laborales = :dias_laborales, pago_por_hora_extra = :pago_por_hora_extra WHERE id = :id';

        $stmt = $this->conn->prepare($query);

        // Vincular datos
        $stmt->bindParam(':id', $id);
        $stmt->bindParam(':nombre_completo', $data->nombre_completo);
        $stmt->bindParam(':sueldo_semanal', $data->sueldo_semanal);
        $stmt->bindParam(':horario_entrada', $data->horario_entrada);
        $stmt->bindParam(':horario_salida', $data->horario_salida);
        $stmt->bindParam(':dias_laborales', $data->dias_laborales);
        $stmt->bindParam(':pago_por_hora_extra', $data->pago_por_hora_extra);

        if ($stmt->execute()) {
            return true;
        }
        return false;
    }

    /**
     * Elimina un empleado.
     */
    public function delete($id)
    {
        $query = 'DELETE FROM ' . $this->table . ' WHERE id = :id';
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);

        if ($stmt->execute()) {
            return true;
        }
        return false;
    }


    public function getByToken($token)
    {
        $query = 'SELECT * FROM empleados 
              WHERE token = :token AND token_expiry > NOW() 
              LIMIT 1';

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':token', $token);
        $stmt->execute();

        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function updateToken($id, $token, $expiry)
    {
        $query = 'UPDATE empleados 
              SET token = :token, token_expiry = :expiry 
              WHERE id = :id';

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':token', $token);
        $stmt->bindParam(':expiry', $expiry);
        $stmt->bindParam(':id', $id);

        return $stmt->execute();
    }


}
?>