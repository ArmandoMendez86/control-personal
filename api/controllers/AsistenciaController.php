<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../models/AsistenciaModel.php';
require_once __DIR__ . '/../models/EmpleadoModel.php';

class AsistenciaController {
    private $db;
    private $asistenciaModel;
    private $empleadoModel;

    public function __construct() {
        $database = new Database();
        $this->db = $database->connect();
        $this->asistenciaModel = new AsistenciaModel($this->db);
        $this->empleadoModel = new EmpleadoModel($this->db);
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

        if ($method === 'GET') {
            $fecha = $_GET['fecha'] ?? null;
            $empleado_id = $_GET['empleado_id'] ?? null;
            $this->getAsistencias($fecha, $empleado_id);
        } else if ($method === 'POST') {
            $data = json_decode(file_get_contents("php://input"));
            
            if (isset($data->action)) {
                switch ($data->action) {
                    case 'validate-token':
                        $this->validateToken($data->token);
                        break;
                    case 'check-in':
                        $this->registrarEntrada($data->empleadoId);
                        break;
                    case 'check-out':
                        $this->registrarSalida($data->empleadoId);
                        break;
                    default:
                        http_response_code(400);
                        echo json_encode(['success' => false, 'message' => 'Acción no válida']);
                        break;
                }
            } else {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Acción no especificada']);
            }
        } else {
            http_response_code(405);
            echo json_encode(['message' => 'Método no permitido']);
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

    private function validateToken($token) {
        try {
            $empleado = $this->empleadoModel->getByToken($token);
            
            if (!$empleado) {
                echo json_encode(['success' => false, 'message' => 'Token no válido']);
                return;
            }

            $now = new DateTime();
            $tokenExpiry = new DateTime($empleado['token_expiry']);
            
            if ($now > $tokenExpiry) {
                echo json_encode(['success' => false, 'message' => 'Token expirado']);
                return;
            }

            echo json_encode([
                'success' => true,
                'employee' => [
                    'id' => $empleado['id'],
                    'nombreCompleto' => $empleado['nombre_completo']
                ]
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error al validar token']);
        }
    }

    private function registrarEntrada($empleadoId) {
        try {
            $fecha = date('Y-m-d');
            $hora = date('H:i:s');
            
            $registro = $this->asistenciaModel->getRegistroHoy($empleadoId, $fecha);
            
            if ($registro && $registro['hora_entrada'] && !$registro['hora_salida']) {
                echo json_encode([
                    'success' => false,
                    'message' => 'Ya tienes una entrada registrada sin salida'
                ]);
                return;
            }
            
            $this->asistenciaModel->crearRegistro($empleadoId, $fecha, $hora, null);
            
            echo json_encode([
                'success' => true,
                'message' => "Entrada registrada a las $hora. ¡Que tengas un buen día!"
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error al registrar entrada']);
        }
    }

    private function registrarSalida($empleadoId) {
        try {
            $fecha = date('Y-m-d');
            $hora = date('H:i:s');
            
            $registro = $this->asistenciaModel->getRegistroHoy($empleadoId, $fecha);
            
            if (!$registro || !$registro['hora_entrada'] || $registro['hora_salida']) {
                echo json_encode([
                    'success' => false,
                    'message' => 'Debes registrar tu entrada primero o ya registraste tu salida'
                ]);
                return;
            }
            
            $this->asistenciaModel->actualizarSalida($registro['id'], $hora);
            
            echo json_encode([
                'success' => true,
                'message' => "Salida registrada a las $hora. ¡Hasta mañana!"
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error al registrar salida']);
        }
    }
}