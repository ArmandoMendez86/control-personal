<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../models/JustificacionModel.php';

class JustificacionController {
    private $db;
    private $justificacionModel;

    public function __construct() {
        $database = new Database();
        // ===== CORRECCIÓN AQUÍ =====
        $this->db = $database->connect(); // Se corrigió el punto (.) por una flecha (->)
        $this->justificacionModel = new JustificacionModel($this->db);
    }

    public function handleRequest() {
        header('Content-Type: application/json');
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With');

        if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
            http_response_code(200);
            exit();
        }

        $method = $_SERVER['REQUEST_METHOD'];

        if ($method === 'POST') {
            $this->saveJustificaciones();
        } else {
            http_response_code(405);
            echo json_encode(['message' => 'Método no permitido']);
        }
    }

    private function saveJustificaciones() {
        $data = json_decode(file_get_contents("php://input"));

        // Se espera que el frontend envíe un objeto con el ID del empleado
        // y un array de justificaciones.
        if (empty($data->empleado_id) || !isset($data->faltas)) {
            http_response_code(400);
            echo json_encode(['message' => 'Datos incompletos.']);
            return;
        }

        if ($this->justificacionModel->saveMultiple($data->empleado_id, $data->faltas)) {
            echo json_encode(['message' => 'Justificaciones guardadas exitosamente']);
        } else {
            http_response_code(503);
            echo json_encode(['message' => 'No se pudieron guardar las justificaciones']);
        }
    }
}
?>
