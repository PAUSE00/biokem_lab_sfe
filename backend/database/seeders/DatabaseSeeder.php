<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        User::factory()->create([
            'name' => 'Admin User',
            'email' => 'admin@chemlab.com',
            'role' => 'Admin',
        ]);

        User::factory()->create([
            'name' => 'Manager (Responsable)',
            'email' => 'manager@chemlab.com',
            'role' => 'Responsable',
        ]);

        $tech = User::factory()->create([
            'name' => 'Lab Technician',
            'email' => 'tech@chemlab.com',
            'role' => 'Technicien',
        ]);

        // Seed Samples
        $sample1 = \App\Models\Sample::create([
            'code' => 'SMP-4481',
            'qr_code' => 'QR-4481-X',
            'client_id' => null,
            'technician_id' => $tech->id,
            'status' => 'Reçu',
            'type' => 'Eau Potable',
            'priority' => 'Normale',
            'volume' => '250 ml',
            'storage_location' => 'Réfrigérateur A > Étagère 1 > Bac 1',
            'temp_condition' => 'Réfrigéré',
            'temp_value' => 4.20,
            'sampled_at' => now()->subDays(3)->subHours(2),
            'description' => 'Prélèvement d\'eau potable de la fontaine publique.',
            'received_at' => now()->subDays(3),
        ]);

        // Aliquots for SMP-4481
        \App\Models\Sample::create([
            'code' => 'SMP-4481-A',
            'qr_code' => 'QR-4481-A-STK',
            'client_id' => null,
            'technician_id' => $tech->id,
            'parent_id' => $sample1->id,
            'status' => 'Reçu',
            'type' => 'Eau Potable',
            'priority' => 'Normale',
            'volume' => '100 ml',
            'storage_location' => 'Réfrigérateur A > Étagère 1 > Bac 1',
            'temp_condition' => 'Réfrigéré',
            'temp_value' => 4.20,
            'sampled_at' => now()->subDays(3)->subHours(2),
            'description' => 'Aliquote A pour tests microbiologiques.',
            'received_at' => now()->subDays(3),
        ]);

        \App\Models\Sample::create([
            'code' => 'SMP-4481-B',
            'qr_code' => 'QR-4481-B-STK',
            'client_id' => null,
            'technician_id' => $tech->id,
            'parent_id' => $sample1->id,
            'status' => 'Reçu',
            'type' => 'Eau Potable',
            'priority' => 'Normale',
            'volume' => '150 ml',
            'storage_location' => 'Réfrigérateur A > Étagère 1 > Bac 2',
            'temp_condition' => 'Réfrigéré',
            'temp_value' => 4.20,
            'sampled_at' => now()->subDays(3)->subHours(2),
            'description' => 'Aliquote B pour analyses chimiques de métaux lourds.',
            'received_at' => now()->subDays(3),
        ]);

        $sample2 = \App\Models\Sample::create([
            'code' => 'SMP-4482',
            'qr_code' => 'QR-4482-Y',
            'client_id' => null,
            'technician_id' => $tech->id,
            'status' => 'En cours',
            'type' => 'Eau Résiduaire',
            'priority' => 'Urgente',
            'volume' => '1 L',
            'storage_location' => 'Salle d\'Incubation > Étagère B > Case 4',
            'temp_condition' => 'Congelé',
            'temp_value' => -18.50,
            'sampled_at' => now()->subDays(2)->subHours(1),
            'description' => 'Eau usée industrielle prélevée à la sortie du collecteur principal.',
            'received_at' => now()->subDays(2),
        ]);

        $sample3 = \App\Models\Sample::create([
            'code' => 'SMP-4483',
            'qr_code' => 'QR-4483-Z',
            'client_id' => null,
            'technician_id' => $tech->id,
            'status' => 'Terminé',
            'type' => 'Sol / Terre',
            'priority' => 'Critique',
            'volume' => '500 g',
            'storage_location' => 'Zone de Stockage Température Ambiante > Étagère 3 > Bac A',
            'temp_condition' => 'Température Ambiante',
            'temp_value' => 22.40,
            'sampled_at' => now()->subDays(5)->subHours(3),
            'description' => 'Échantillon de sol agricole prélevé pour la détection de métaux lourds.',
            'received_at' => now()->subDays(5),
        ]);

        $sample4 = \App\Models\Sample::create([
            'code' => 'SMP-4484',
            'qr_code' => 'QR-4484-W',
            'client_id' => null,
            'technician_id' => null,
            'status' => 'Anomalie',
            'type' => 'Eau Potable',
            'priority' => 'Normale',
            'volume' => '500 ml',
            'storage_location' => 'Réfrigérateur A > Étagère 2 > Bac 1',
            'temp_condition' => 'Réfrigéré',
            'temp_value' => 11.80, // Temperature warning! (>8°C)
            'sampled_at' => now()->subDays(4), // Over 24h delay!
            'description' => 'Prélèvement d\'eau potable avec température de transport élevée et délai de garde dépassé.',
            'received_at' => now()->subDays(1),
        ]);

        $sample5 = \App\Models\Sample::create([
            'code' => 'SMP-4485',
            'qr_code' => 'QR-4485-V',
            'client_id' => null,
            'technician_id' => null,
            'status' => 'Anomalie',
            'type' => 'Eau Potable',
            'priority' => 'Normale',
            'volume' => '30 ml', // Volume warning! (<50ml)
            'storage_location' => 'Réfrigérateur B > Étagère 1 > Bac 1',
            'temp_condition' => 'Réfrigéré',
            'temp_value' => 5.00,
            'sampled_at' => now()->subHours(6),
            'description' => 'Échantillon d\'eau avec volume insuffisant reçu pour contrôle rapide.',
            'received_at' => now()->subHours(2),
        ]);

        // Seed Deviation for sample4 (excursion)
        \App\Models\Deviation::create([
            'sample_id' => $sample4->id,
            'type' => 'TEMPERATURE_EXCURSION',
            'parameter' => 'temp_value',
            'expected_limit' => '[2°C, 8°C]',
            'actual_value' => '11.8°C',
            'status' => 'OPEN',
            'logged_by' => 2, // Manager
        ]);

        // Seed Analyses
        $analysisPending = \App\Models\Analysis::create([
            'sample_id' => $sample2->id,
            'user_id' => $tech->id,
            'parameters' => ['pH', 'Turbidity', 'Conductivity'],
            'status' => 'En attente',
        ]);

        $analysisValidated = \App\Models\Analysis::create([
            'sample_id' => $sample3->id,
            'user_id' => $tech->id,
            'parameters' => ['pH', 'Conductivity', 'Nitrates', 'Zinc'],
            'status' => 'Validé',
            'validated_at' => now()->subDays(1),
            'risk_score' => 35,
            'ai_recommendation' => 'Risque sanitaire global FAIBLE (35%). Altération légère observée sur : Taux de Nitrates critique (62.5 mg/L). Surveillance renforcée conseillée. Un simple ajustement ou filtration standard devrait suffire à rétablir l\'équilibre.',
        ]);

        // Seed Analysis Results
        \App\Models\AnalysisResult::create([
            'analysis_id' => $analysisValidated->id,
            'parameter' => 'pH',
            'value' => '8.2',
            'unit' => '',
            'is_anomaly' => false,
            'reference_min' => 6.5,
            'reference_max' => 8.5,
        ]);

        \App\Models\AnalysisResult::create([
            'analysis_id' => $analysisValidated->id,
            'parameter' => 'Conductivity',
            'value' => '450',
            'unit' => 'µS/cm',
            'is_anomaly' => false,
            'reference_min' => 0,
            'reference_max' => 1000,
        ]);

        \App\Models\AnalysisResult::create([
            'analysis_id' => $analysisValidated->id,
            'parameter' => 'Nitrates',
            'value' => '62.5',
            'unit' => 'mg/L',
            'is_anomaly' => true,
            'reference_min' => 0,
            'reference_max' => 50,
        ]);

        \App\Models\AnalysisResult::create([
            'analysis_id' => $analysisValidated->id,
            'parameter' => 'Zinc',
            'value' => '1.2',
            'unit' => 'mg/L',
            'is_anomaly' => false,
            'reference_min' => 0,
            'reference_max' => 3.0,
        ]);

        \App\Models\Notification::create([
            'user_id' => null,
            'type' => 'pH_critique',
            'message' => 'Alerte : Le pH de l\'échantillon SMP-0042 est critique (5.2).',
        ]);
        \App\Models\Notification::create([
            'user_id' => null,
            'type' => 'zinc_eleve',
            'message' => 'Alerte : Niveau de Zinc anormalement élevé (4.8 mg/L) détecté dans l\'échantillon SMP-0043.',
        ]);
        \App\Models\Notification::create([
            'user_id' => null,
            'type' => 'rapport_pret',
            'message' => 'Le rapport d\'analyse pour l\'échantillon SMP-0041 a été validé et est prêt à être téléchargé.',
        ]);

        // Seed Equipments
        $phMeter = \App\Models\Equipment::create([
            'name' => 'pH-mètre de paillasse',
            'model' => 'InnoLab pH100',
            'serial_number' => 'PH-2024-9982',
            'status' => 'Actif',
            'last_calibration_at' => '2026-04-10',
            'next_calibration_at' => '2026-10-10',
            'last_maintenance_at' => '2025-10-15',
            'next_maintenance_at' => '2026-10-15',
        ]);

        $spectro = \App\Models\Equipment::create([
            'name' => 'Spectrophotomètre UV-Visible',
            'model' => 'Shimadzu UV-1900i',
            'serial_number' => 'SP-1900-5541',
            'status' => 'Actif',
            'last_calibration_at' => '2026-03-15',
            'next_calibration_at' => '2026-09-15',
            'last_maintenance_at' => '2026-03-15',
            'next_maintenance_at' => '2027-03-15',
        ]);

        $balance = \App\Models\Equipment::create([
            'name' => 'Balance d\'analyse de précision',
            'model' => 'Sartorius Entris II',
            'serial_number' => 'BAL-5412-A',
            'status' => 'En maintenance',
            'last_calibration_at' => '2026-01-20',
            'next_calibration_at' => '2026-07-20',
            'last_maintenance_at' => '2026-05-17',
            'next_maintenance_at' => '2026-11-17',
        ]);

        $incubator = \App\Models\Equipment::create([
            'name' => 'Incubateur microbiologique',
            'model' => 'Memmert IN30',
            'serial_number' => 'INC-30-7782',
            'status' => 'Actif',
            'last_calibration_at' => null,
            'next_calibration_at' => null,
            'last_maintenance_at' => '2025-12-05',
            'next_maintenance_at' => '2026-06-05',
        ]);

        // Seed Maintenance Tasks
        \App\Models\MaintenanceTask::create([
            'equipment_id' => $phMeter->id,
            'type' => 'Étalonnage / Calibration',
            'description' => 'Étalonnage périodique avec solutions tampons certifiées pH 4.01, 7.00, et 10.01.',
            'scheduled_at' => '2026-04-10',
            'completed_at' => '2026-04-10',
            'status' => 'Terminé',
            'technician_name' => 'Dr. Ahmed Bensalah (Interne)',
            'cost' => 50.00,
            'notes' => 'Électrode nettoyée et rincée. Pente de calibration à 98.7% (Conforme).',
        ]);

        \App\Models\MaintenanceTask::create([
            'equipment_id' => $spectro->id,
            'type' => 'Maintenance préventive',
            'description' => 'Nettoyage des optiques, vérification de la lampe Deutérium et calibration de longueur d\'onde.',
            'scheduled_at' => '2026-03-15',
            'completed_at' => '2026-03-15',
            'status' => 'Terminé',
            'technician_name' => 'Service Shimadzu (Externe)',
            'cost' => 450.00,
            'notes' => 'Lampe UV changée par anticipation. Alignement optique parfait.',
        ]);

        \App\Models\MaintenanceTask::create([
            'equipment_id' => $balance->id,
            'type' => 'Maintenance corrective',
            'description' => 'Réparation du bouton de tare défectueux et recalibrage complet.',
            'scheduled_at' => '2026-05-17',
            'completed_at' => null,
            'status' => 'En cours',
            'technician_name' => 'Sartorius Support (Externe)',
            'cost' => 120.00,
            'notes' => 'Pièce de rechange commandée. Intervention planifiée pour finalisation aujourd\'hui.',
        ]);

        \App\Models\MaintenanceTask::create([
            'equipment_id' => $incubator->id,
            'type' => 'Maintenance préventive',
            'description' => 'Nettoyage intérieur complet et vérification de la stabilité thermique à 37°C.',
            'scheduled_at' => '2026-06-05',
            'completed_at' => null,
            'status' => 'Planifié',
            'technician_name' => 'Yassine Touimi (Interne)',
            'cost' => 0.00,
            'notes' => 'Rappel automatique configuré.',
        ]);

        // Seed Stock Items (Reagents & Supplies)
        \App\Models\StockItem::create([
            'name' => 'Acide Chlorhydrique (HCl) 1M',
            'quantity' => 15.50,
            'unit' => 'L',
            'threshold' => 5.00,
            'expiry_date' => '2027-02-15',
            'supplier_name' => 'Sigma-Aldrich Maroc',
        ]);

        \App\Models\StockItem::create([
            'name' => 'Buffer pH 7.00',
            'quantity' => 2.20,
            'unit' => 'L',
            'threshold' => 3.00, // Trigger low stock alert!
            'expiry_date' => '2026-08-30',
            'supplier_name' => 'Sigma-Aldrich Maroc',
        ]);

        \App\Models\StockItem::create([
            'name' => 'Buffer pH 4.01',
            'quantity' => 4.50,
            'unit' => 'L',
            'threshold' => 3.00,
            'expiry_date' => '2026-09-15',
            'supplier_name' => 'Sigma-Aldrich Maroc',
        ]);

        \App\Models\StockItem::create([
            'name' => 'Sulfate de Zinc Monohydraté',
            'quantity' => 500.00,
            'unit' => 'g',
            'threshold' => 100.00,
            'expiry_date' => '2028-11-20',
            'supplier_name' => 'Merck Life Science',
        ]);

        \App\Models\StockItem::create([
            'name' => 'Eau Distillée stérile',
            'quantity' => 120.00,
            'unit' => 'L',
            'threshold' => 20.00,
            'expiry_date' => '2026-12-01',
            'supplier_name' => 'Production Interne',
        ]);

        // Seed Audit Logs for Chain of Custody
        // SMP-4481 (ID 1)
        \App\Models\AuditLog::create([
            'user_id' => 2, // Manager
            'action' => 'CREATION_ECHANTILLON',
            'model' => 'Sample',
            'model_id' => 1,
            'changes' => [
                'code' => 'SMP-4481',
                'type' => 'Eau Potable',
                'priority' => 'Normale',
                'volume' => '250 ml',
                'storage_location' => 'Réfrigérateur A'
            ],
            'created_at' => now()->subDays(3),
        ]);

        // SMP-4482 (ID 2)
        \App\Models\AuditLog::create([
            'user_id' => 2, // Manager
            'action' => 'CREATION_ECHANTILLON',
            'model' => 'Sample',
            'model_id' => 2,
            'changes' => [
                'code' => 'SMP-4482',
                'type' => 'Eau Résiduaire',
                'priority' => 'Urgente',
                'volume' => '1 L',
                'storage_location' => 'Salle d\'Incubation'
            ],
            'created_at' => now()->subDays(2),
        ]);

        \App\Models\AuditLog::create([
            'user_id' => 2, // Manager
            'action' => 'MODIFICATION_ECHANTILLON',
            'model' => 'Sample',
            'model_id' => 2,
            'changes' => [
                'status' => ['from' => 'Reçu', 'to' => 'En cours'],
                'technician' => ['from' => 'Non assigné', 'to' => 'Lab Technician']
            ],
            'created_at' => now()->subDays(2)->addHours(2),
        ]);

        // SMP-4483 (ID 3)
        \App\Models\AuditLog::create([
            'user_id' => 2, // Manager
            'action' => 'CREATION_ECHANTILLON',
            'model' => 'Sample',
            'model_id' => 3,
            'changes' => [
                'code' => 'SMP-4483',
                'type' => 'Sol / Terre',
                'priority' => 'Critique',
                'volume' => '500 g',
                'storage_location' => 'Zone de Stockage Température Ambiante'
            ],
            'created_at' => now()->subDays(5),
        ]);

        \App\Models\AuditLog::create([
            'user_id' => 2, // Manager
            'action' => 'MODIFICATION_ECHANTILLON',
            'model' => 'Sample',
            'model_id' => 3,
            'changes' => [
                'status' => ['from' => 'Reçu', 'to' => 'En cours'],
                'technician' => ['from' => 'Non assigné', 'to' => 'Lab Technician']
            ],
            'created_at' => now()->subDays(4),
        ]);

        \App\Models\AuditLog::create([
            'user_id' => 3, // Tech
            'action' => 'PLANIFICATION_ANALYSE',
            'model' => 'Analysis',
            'model_id' => 2,
            'changes' => [
                'sample_code' => 'SMP-4483',
                'parameters' => ['pH', 'Conductivity', 'Nitrates', 'Zinc']
            ],
            'created_at' => now()->subDays(3),
        ]);

        \App\Models\AuditLog::create([
            'user_id' => 3, // Tech
            'action' => 'VALIDATION_ANALYSE',
            'model' => 'Analysis',
            'model_id' => 2,
            'changes' => [
                'code' => 'SMP-4483',
                'risk_score' => 35,
                'has_anomaly' => true,
                'anomalies' => ['Taux de Nitrates critique (62.5 mg/L)']
            ],
            'created_at' => now()->subDays(1),
        ]);

        // General connexion & stock logs
        \App\Models\AuditLog::create([
            'user_id' => 1,
            'action' => 'CONNEXION',
            'model' => 'User',
            'model_id' => 1,
            'changes' => ['ip' => '127.0.0.1', 'user_agent' => 'Mozilla/5.0 Chrome/124.0.0'],
            'created_at' => now()->subHours(5),
        ]);

        \App\Models\AuditLog::create([
            'user_id' => 1,
            'action' => 'MODIFICATION_STOCK',
            'model' => 'StockItem',
            'model_id' => 2,
            'changes' => ['quantity_before' => 5.20, 'quantity_after' => 2.20],
            'created_at' => now()->subHour(),
        ]);
    }
}

