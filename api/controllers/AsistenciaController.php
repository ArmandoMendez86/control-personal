<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../models/AsistenciaModel.php';

class AsistenciaController {
    private $db;
    private $asistenciaModel;

    public function __construct() {
        $database = new Database();
        $this->db = $database->connect();
        $this->asistenciaModel = new AsistenciaModel($this->db);
    }

    public function handleRequest() {
        header('Content-Type: application/json');
        header('Access-Control-Allow-Origin: *');
        // ... (resto de las cabeceras CORS)

        $method = $_SERVER['REQUEST_METHOD'];

        if ($method === 'GET') {
            // Ejemplo: Obtener asistencias por fecha
            $fecha = $_GET['fecha'] ?? null;
            $empleado_id = $_GET['empleado_id'] ?? null;
            $this->getAsistencias($fecha, $empleado_id);
        }
        
        if ($method === 'POST') {
            // Lógica para crear un nuevo registro de asistencia
        }
    }

    private function getAsistencias($fecha, $empleado_id) {
        $result = $this->asistenciaModel->getByFilters($fecha, $empleado_id);
        $asistencias_arr = [];
        while($row = $result->fetch(PDO::FETCH_ASSOC)) {
            $asistencias_arr[] = $row;
        }
        echo json_encode($asistencias_arr);
    }
}
?>
