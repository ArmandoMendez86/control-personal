<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Corregimos los nombres de los archivos para que coincidan con tu estructura
require_once __DIR__ . '/controllers/EmpleadoController.php';
require_once __DIR__ . '/controllers/ConceptoController.php';
require_once __DIR__ . '/controllers/AsistenciaController.php';
require_once __DIR__ . '/controllers/JustificacionController.php';
require_once __DIR__ . '/controllers/TransaccionNominaController.php';
require_once __DIR__ . '/controllers/ReporteController.php'; // <-- AÑADIR ESTA LÍNEA

$request_uri = explode('?', $_SERVER['REQUEST_URI'], 2);
$path = trim($request_uri[0], '/');
$segments = explode('/', $path);
$api_segment_index = array_search('api', $segments);

if ($api_segment_index === false) {
    header("HTTP/1.0 400 Bad Request");
    echo json_encode(['message' => 'Ruta de API no válida.']);
    exit;
}

$resource = $segments[$api_segment_index + 1] ?? null;
$id = $segments[$api_segment_index + 2] ?? null;

switch ($resource) {
    case 'empleados':
        $controller = new EmpleadoController();
        $controller->handleRequest($id);
        break;
    
    case 'conceptos':
        $controller = new ConceptoController();
        $controller->handleRequest($id);
        break;

    case 'asistencias':
        $controller = new AsistenciaController();
        $controller->handleRequest();
        break;

    case 'justificaciones':
        $controller = new JustificacionController();
        $controller->handleRequest();
        break;

    case 'transacciones':
        $controller = new TransaccionNominaController();
        $controller->handleRequest();
        break;
    
    case 'reportes': // <-- AÑADIR ESTE CASO
        $controller = new ReporteController();
        $controller->handleRequest();
        break;

    default:
        header("HTTP/1.0 404 Not Found");
        echo json_encode(['message' => 'Recurso no encontrado']);
        break;
}
?>
