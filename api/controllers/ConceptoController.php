<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../models/ConceptoModel.php';

class ConceptoController {
    private $db;
    private $conceptoModel;

    public function __construct() {
        $database = new Database();
        $this->db = $database->connect();
        $this->conceptoModel = new ConceptoModel($this->db);
    }

    public function handleRequest($id = null) {
        header('Content-Type: application/json');
        header('Access-Control-Allow-Origin: *');
        // ... (resto de las cabeceras CORS como en EmpleadoController)

        $method = $_SERVER['REQUEST_METHOD'];

        if ($method === 'GET') {
            if ($id) {
                // Lógica para obtener un concepto por ID
            } else {
                $this->getConceptos();
            }
        }
        // ... (lógica para POST, PUT, DELETE)
    }

    private function getConceptos() {
        $result = $this->conceptoModel->getAll();
        $conceptos_arr = [];
        while($row = $result->fetch(PDO::FETCH_ASSOC)) {
            $conceptos_arr[] = $row;
        }
        echo json_encode($conceptos_arr);
    }
}
?>
