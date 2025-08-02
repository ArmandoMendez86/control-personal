<?php
// Incluimos los archivos necesarios una sola vez
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../models/EmpleadoModel.php';

class EmpleadoController {
    private $db;
    private $empleadoModel;

    public function __construct() {
        $database = new Database();
        $this->db = $database->connect();
        $this->empleadoModel = new EmpleadoModel($this->db);
    }

    /**
     * Maneja la petición HTTP y la enruta a la función adecuada.
     */
    public function handleRequest($id = null) {
        // Configuramos las cabeceras para que la respuesta sea JSON
        header('Content-Type: application/json');
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With');

        // El método OPTIONS es para una petición "pre-flight" de CORS
        if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
            http_response_code(200);
            exit();
        }

        $method = $_SERVER['REQUEST_METHOD'];

        switch ($method) {
            case 'GET':
                if ($id) {
                    $this->getEmpleadoById($id);
                } else {
                    $this->getEmpleados();
                }
                break;
            case 'POST':
                $this->createEmpleado();
                break;
            case 'PUT':
                $this->updateEmpleado($id);
                break;
            case 'DELETE':
                $this->deleteEmpleado($id);
                break;
            default:
                http_response_code(405); // Method Not Allowed
                echo json_encode(['message' => 'Método no permitido']);
                break;
        }
    }

    private function getEmpleados() {
        $result = $this->empleadoModel->getAll();
        $empleados_arr = [];
        while($row = $result->fetch(PDO::FETCH_ASSOC)) {
            $empleados_arr[] = $row;
        }
        echo json_encode($empleados_arr);
    }

    private function getEmpleadoById($id) {
        $result = $this->empleadoModel->getById($id);
        if ($result) {
            echo json_encode($result);
        } else {
            http_response_code(404); // Not Found
            echo json_encode(['message' => 'Empleado no encontrado']);
        }
    }

    private function createEmpleado() {
        $data = json_decode(file_get_contents("php://input"));

        // Aquí iría la validación de los datos...

        if ($this->empleadoModel->create($data)) {
            http_response_code(201); // Created
            echo json_encode(['message' => 'Empleado creado exitosamente']);
        } else {
            http_response_code(503); // Service Unavailable
            echo json_encode(['message' => 'No se pudo crear el empleado']);
        }
    }

    private function updateEmpleado($id) {
        if (!$id) {
            http_response_code(400); // Bad Request
            echo json_encode(['message' => 'ID de empleado no proporcionado']);
            return;
        }
        $data = json_decode(file_get_contents("php://input"));

        if ($this->empleadoModel->update($id, $data)) {
            echo json_encode(['message' => 'Empleado actualizado exitosamente']);
        } else {
            http_response_code(503);
            echo json_encode(['message' => 'No se pudo actualizar el empleado']);
        }
    }

    private function deleteEmpleado($id) {
        if (!$id) {
            http_response_code(400);
            echo json_encode(['message' => 'ID de empleado no proporcionado']);
            return;
        }

        if ($this->empleadoModel->delete($id)) {
            echo json_encode(['message' => 'Empleado eliminado exitosamente']);
        } else {
            http_response_code(503);
            echo json_encode(['message' => 'No se pudo eliminar el empleado']);
        }
    }
}
?>
