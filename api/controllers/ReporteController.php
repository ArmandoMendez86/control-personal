<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../models/ReporteModel.php';

class ReporteController {
    private $db;
    private $reporteModel;

    public function __construct() {
        $database = new Database();
        $this->db = $database->connect();
        $this->reporteModel = new ReporteModel($this->db);
    }

    public function handleRequest() {
        header('Content-Type: application/json');
        header('Access-Control-Allow-Origin: *');

        $periodo = $_GET['periodo'] ?? null;
        if (!$periodo) {
            http_response_code(400);
            echo json_encode(['message' => 'El parámetro "periodo" es requerido.']);
            return;
        }

        // Función para obtener las fechas de la semana (similar a la de JS)
        list($year, $week) = sscanf($periodo, '%d-W%d');
        $date = new DateTime();
        $date->setISODate($year, $week);
        $fechasSemana = [];
        for ($i = 0; $i < 7; $i++) {
            $fechasSemana[] = $date->format('Y-m-d');
            $date->modify('+1 day');
        }

        $result = $this->reporteModel->generarReporte($periodo, $fechasSemana);
        $reporte_arr = [];
        while($row = $result->fetch(PDO::FETCH_ASSOC)) {
            // Decodificar los strings JSON de la base de datos a arrays/objetos PHP
            $row['faltas'] = json_decode($row['faltas']);
            $row['transacciones'] = json_decode($row['transacciones']);
            $reporte_arr[] = $row;
        }
        echo json_encode($reporte_arr);
    }
}
?>
