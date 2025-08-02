<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../models/TransaccionNominaModel.php';

class TransaccionNominaController {
    private $db;
    private $transaccionModel;

    public function __construct() {
        $database = new Database();
        $this->db = $database->connect();
        $this->transaccionModel = new TransaccionNominaModel($this->db);
    }

    public function handleRequest() {
        header('Content-Type: application/json');
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With');

        if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
            http_response_code(200);
            exit();
        }

        $method = $_SERVER['REQUEST_METHOD'];

        if ($method === 'POST') {
            $this->saveTransacciones();
        } else {
            http_response_code(405);
            echo json_encode(['message' => 'Método no permitido']);
        }
    }

    private function saveTransacciones() {
        $data = json_decode(file_get_contents("php://input"));

        // Se espera un objeto con el periodo y un array de transacciones.
        if (empty($data->periodo) || !isset($data->transacciones)) {
            http_response_code(400);
            echo json_encode(['message' => 'Datos incompletos.']);
            return;
        }

        if ($this->transaccionModel->saveMultiple($data->periodo, $data->transacciones)) {
            echo json_encode(['message' => 'Cambios en la nómina guardados exitosamente']);
        } else {
            http_response_code(503);
            echo json_encode(['message' => 'No se pudieron guardar los cambios en la nómina']);
        }
    }
}
?>
