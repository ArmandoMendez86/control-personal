<?php
class ReporteModel {
    private $conn;

    public function __construct($db) {
        $this->conn = $db;
    }

    /**
     * Genera los datos completos para el reporte de pre-nómina de un periodo.
     */
    public function generarReporte($periodo, $fechasSemana) {
        // Esta es una consulta compleja que une varias tablas para obtener todos los datos necesarios.
        $query = "
            SELECT
                e.id AS empleado_id,
                e.nombre_completo,
                e.sueldo_semanal,
                e.dias_laborales,
                e.pago_por_hora_extra,
                e.horario_salida,
                
                -- Calcular horas extra
                COALESCE(SUM(
                    CASE
                        WHEN ra.hora_salida > (ra.fecha || ' ' || e.horario_salida)::timestamp
                        THEN EXTRACT(EPOCH FROM (ra.hora_salida - (ra.fecha || ' ' || e.horario_salida)::timestamp)) / 3600
                        ELSE 0
                    END
                ), 0) AS horas_extras_totales,

                -- Obtener un JSON con las faltas y si están justificadas
                (
                    SELECT COALESCE(json_agg(f), '[]'::json)
                    FROM (
                        SELECT
                            d.dia AS fecha,
                            (j.id IS NOT NULL) AS justificada,
                            j.motivo
                        FROM generate_series(
                            :fecha_inicio::date,
                            :fecha_fin::date,
                            '1 day'::interval
                        ) d(dia)
                        LEFT JOIN registros_asistencia ra_faltas ON ra_faltas.empleado_id = e.id AND ra_faltas.fecha = d.dia
                        LEFT JOIN justificaciones j ON j.empleado_id = e.id AND j.fecha = d.dia
                        WHERE ra_faltas.id IS NULL AND EXTRACT(ISODOW FROM d.dia) <= e.dias_laborales
                    ) f
                ) AS faltas,

                -- Obtener un JSON con las transacciones de nómina
                (
                    SELECT COALESCE(json_object_agg(tn.concepto_id, tn.monto), '{}'::json)
                    FROM transacciones_nomina tn
                    WHERE tn.empleado_id = e.id AND tn.periodo = :periodo
                ) AS transacciones

            FROM empleados e
            LEFT JOIN registros_asistencia ra ON ra.empleado_id = e.id AND ra.fecha BETWEEN :fecha_inicio AND :fecha_fin
            WHERE e.activo = TRUE
            GROUP BY e.id
            ORDER BY e.nombre_completo;
        ";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':periodo', $periodo);
        $stmt->bindParam(':fecha_inicio', $fechasSemana[0]);
        $stmt->bindParam(':fecha_fin', $fechasSemana[6]);
        
        $stmt->execute();
        return $stmt;
    }
}
?>
