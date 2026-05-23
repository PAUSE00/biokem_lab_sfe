<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class SampleController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $samples = \App\Models\Sample::with(['client', 'technician', 'aliquots', 'parent', 'deviations'])->orderBy('created_at', 'desc')->get();
        return response()->json($samples);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'client_id' => 'nullable|exists:users,id',
            'technician_id' => 'nullable|exists:users,id',
            'type' => 'nullable|string',
            'priority' => 'nullable|string',
            'storage_location' => 'nullable|string',
            'volume' => 'nullable|string',
            'temp_condition' => 'nullable|string',
            'temp_value' => 'nullable|numeric',
            'sampled_at' => 'nullable|date',
            'description' => 'nullable|string',
            'metadata' => 'nullable|array',
        ]);

        $status = 'Reçu';
        $description = $validated['description'] ?? null;
        $warnings = [];

        // Check checklist compliance
        $containerOk = $request->input('container_ok', true);
        $labelOk = $request->input('label_ok', true);
        $volumeOk = $request->input('volume_ok', true);
        $sealOk = $request->input('seal_ok', true);

        $hasChecklistDeviation = !$containerOk || !$labelOk || !$volumeOk || !$sealOk;
        $failedChecklistItems = [];
        if (!$containerOk) $failedChecklistItems[] = "Récipient non-conforme";
        if (!$labelOk) $failedChecklistItems[] = "Étiquette illisible/incomplète";
        if (!$volumeOk) $failedChecklistItems[] = "Volume insuffisant";
        if (!$sealOk) $failedChecklistItems[] = "Sceau de sécurité non-conforme";

        if ($hasChecklistDeviation) {
            $status = 'Anomalie';
            $warnings[] = "Non-conformité de réception : " . implode(", ", $failedChecklistItems);
        }

        // Check volume anomaly (volume < 50 ml)
        if (!empty($validated['volume'])) {
            preg_match('/(\d+)/', $validated['volume'], $matches);
            if (!empty($matches) && intval($matches[1]) < 50) {
                $status = 'Anomalie';
                $warnings[] = "Volume d'échantillon faible (" . $validated['volume'] . " < 50 mL)";
            }
        }

        // Check sampled_at to received_at delay (> 24 hours)
        $sampledAt = !empty($validated['sampled_at']) ? \Carbon\Carbon::parse($validated['sampled_at']) : null;
        $receivedAt = now();
        if ($sampledAt && $receivedAt->diffInHours($sampledAt) > 24) {
            $status = 'Anomalie';
            $warnings[] = "Délai de conservation dépassé (" . $receivedAt->diffInHours($sampledAt) . "h > 24h)";
        }

        // Check temperature compliance
        $hasTempDeviation = false;
        $expectedLimit = '';
        $actualTemp = $validated['temp_value'] ?? null;
        if (!empty($validated['temp_condition']) && $actualTemp !== null) {
            $cond = $validated['temp_condition'];
            if ($cond === 'Congelé' && $actualTemp > -15) {
                $hasTempDeviation = true;
                $expectedLimit = '≤ -15°C';
                $warnings[] = "Excursion de température congelé (" . $actualTemp . "°C > -15°C)";
            } else if ($cond === 'Réfrigéré' && ($actualTemp < 2 || $actualTemp > 8)) {
                $hasTempDeviation = true;
                $expectedLimit = '[2°C, 8°C]';
                $warnings[] = "Excursion de température réfrigéré (" . $actualTemp . "°C hors limites)";
            }
        }

        if ($hasTempDeviation) {
            $status = 'Anomalie';
        }

        // Add checklist meta to description
        $checklistMeta = "[Checklist Réception: conteneur=" . ($containerOk ? "OK" : "KO") . 
                         ", étiquette=" . ($labelOk ? "OK" : "KO") . 
                         ", volume=" . ($volumeOk ? "OK" : "KO") . 
                         ", scellé=" . ($sealOk ? "OK" : "KO") . "]";
        $description = (!empty($description) ? $description . "\n" : "") . $checklistMeta;

        if (!empty($warnings)) {
            $description = $description . "\n[ALERTE RÉCEPTION] " . implode(" ; ", $warnings);
        }

        $sample = \App\Models\Sample::create([
            'code' => 'SMP-' . strtoupper(substr(uniqid(), -6)),
            'qr_code' => 'QR-' . strtoupper(uniqid()),
            'client_id' => $validated['client_id'] ?? null,
            'technician_id' => $validated['technician_id'] ?? null,
            'status' => $status,
            'type' => $validated['type'] ?? 'Eau Potable',
            'priority' => $validated['priority'] ?? 'Normale',
            'storage_location' => $validated['storage_location'] ?? null,
            'volume' => $validated['volume'] ?? null,
            'temp_condition' => $validated['temp_condition'] ?? 'Température Ambiante',
            'temp_value' => $validated['temp_value'] ?? null,
            'sampled_at' => $sampledAt,
            'description' => $description,
            'received_at' => $receivedAt,
            'metadata' => $validated['metadata'] ?? null,
        ]);

        if ($hasChecklistDeviation) {
            \App\Models\Deviation::create([
                'sample_id' => $sample->id,
                'type' => 'COMPLIANCE_VIOLATION',
                'parameter' => 'reception_checklist',
                'expected_limit' => 'Tout Conforme',
                'actual_value' => implode(' ; ', $failedChecklistItems),
                'status' => 'OPEN',
                'logged_by' => auth()->id() ?? 1,
            ]);
        }

        if ($hasTempDeviation) {
            \App\Models\Deviation::create([
                'sample_id' => $sample->id,
                'type' => 'TEMPERATURE_EXCURSION',
                'parameter' => 'temp_value',
                'expected_limit' => $expectedLimit,
                'actual_value' => $actualTemp . '°C',
                'status' => 'OPEN',
                'logged_by' => auth()->id() ?? 1,
            ]);
        }

        // Audit Trail log
        \App\Models\AuditLog::log(
            auth()->id() ?? 1,
            'CREATION_ECHANTILLON',
            'Sample',
            $sample->id,
            [
                'code' => $sample->code,
                'type' => $sample->type,
                'priority' => $sample->priority,
                'volume' => $sample->volume,
                'storage_location' => $sample->storage_location,
                'temp_condition' => $sample->temp_condition,
                'temp_value' => $sample->temp_value,
                'sampled_at' => $sample->sampled_at ? $sample->sampled_at->toDateTimeString() : null,
                'warnings' => $warnings
            ]
        );

        return response()->json($sample->load(['client', 'technician', 'aliquots', 'parent', 'deviations']), 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $sample = \App\Models\Sample::with(['client', 'technician', 'analyses', 'aliquots', 'parent', 'deviations'])->findOrFail($id);
        $sample->custody_timeline = $sample->getCustodyTimeline();
        return response()->json($sample);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $sample = \App\Models\Sample::findOrFail($id);

        $validated = $request->validate([
            'client_id' => 'nullable|exists:users,id',
            'technician_id' => 'nullable|exists:users,id',
            'status' => 'required|in:Reçu,En cours,Terminé,Anomalie',
            'type' => 'nullable|string',
            'priority' => 'nullable|string',
            'storage_location' => 'nullable|string',
            'volume' => 'nullable|string',
            'temp_condition' => 'nullable|string',
            'temp_value' => 'nullable|numeric',
            'sampled_at' => 'nullable|date',
            'description' => 'nullable|string',
            'metadata' => 'nullable|array',
        ]);

        $oldStatus = $sample->status;
        $oldTechId = $sample->technician_id;
        $oldStorage = $sample->storage_location;
        $oldTempCond = $sample->temp_condition;
        $oldTempValue = $sample->temp_value;

        // Check checklist compliance
        $containerOk = $request->input('container_ok');
        $labelOk = $request->input('label_ok');
        $volumeOk = $request->input('volume_ok');
        $sealOk = $request->input('seal_ok');

        $hasChecklistDeviation = ($containerOk !== null && !$containerOk) || 
                                 ($labelOk !== null && !$labelOk) || 
                                 ($volumeOk !== null && !$volumeOk) || 
                                 ($sealOk !== null && !$sealOk);

        if ($hasChecklistDeviation) {
            $validated['status'] = 'Anomalie';
        }

        // Check if temperature gets changed to violate rules
        $hasTempDeviation = false;
        $expectedLimit = '';
        $actualTemp = $validated['temp_value'] ?? $sample->temp_value;
        $cond = $validated['temp_condition'] ?? $sample->temp_condition;
        
        if ($actualTemp !== null && ($oldTempValue != $actualTemp || $oldTempCond != $cond)) {
            if ($cond === 'Congelé' && $actualTemp > -15) {
                $hasTempDeviation = true;
                $expectedLimit = '≤ -15°C';
                $warnings[] = "Excursion de température congelé (" . $actualTemp . "°C > -15°C)";
            } else if ($cond === 'Réfrigéré' && ($actualTemp < 2 || $actualTemp > 8)) {
                $hasTempDeviation = true;
                $expectedLimit = '[2°C, 8°C]';
                $warnings[] = "Excursion de température réfrigéré (" . $actualTemp . "°C hors limites)";
            }
        }

        if ($hasTempDeviation && $sample->status !== 'Anomalie') {
            $validated['status'] = 'Anomalie';
        }

        // Process description checklist metadata
        if ($containerOk !== null || $labelOk !== null || $volumeOk !== null || $sealOk !== null) {
            $cOk = $containerOk !== null ? $containerOk : true;
            $lOk = $labelOk !== null ? $labelOk : true;
            $vOk = $volumeOk !== null ? $volumeOk : true;
            $sOk = $sealOk !== null ? $sealOk : true;
            
            $checklistMeta = "[Checklist Réception: conteneur=" . ($cOk ? "OK" : "KO") . 
                             ", étiquette=" . ($lOk ? "OK" : "KO") . 
                             ", volume=" . ($vOk ? "OK" : "KO") . 
                             ", scellé=" . ($sOk ? "OK" : "KO") . "]";
                             
            $desc = $validated['description'] ?? $sample->description ?? '';
            // Remove previous checklist meta if any
            $desc = preg_replace('/\[Checklist Réception: [^\]]+\]/', '', $desc);
            $desc = trim($desc) . "\n" . $checklistMeta;
            
            if ($hasChecklistDeviation) {
                $failedChecklistItems = [];
                if ($containerOk !== null && !$containerOk) $failedChecklistItems[] = "Récipient non-conforme";
                if ($labelOk !== null && !$labelOk) $failedChecklistItems[] = "Étiquette illisible/incomplète";
                if ($volumeOk !== null && !$volumeOk) $failedChecklistItems[] = "Volume insuffisant";
                if ($sealOk !== null && !$sealOk) $failedChecklistItems[] = "Sceau de sécurité non-conforme";
                
                $desc = preg_replace('/\[ALERTE RÉCEPTION\] [^\n]+/', '', $desc);
                $desc = trim($desc) . "\n[ALERTE RÉCEPTION] Non-conformité de réception : " . implode(", ", $failedChecklistItems);
            }
            $validated['description'] = trim($desc);
        }

        $sample->update($validated);

        if ($hasChecklistDeviation) {
            $failedChecklistItems = [];
            if ($containerOk !== null && !$containerOk) $failedChecklistItems[] = "Récipient non-conforme";
            if ($labelOk !== null && !$labelOk) $failedChecklistItems[] = "Étiquette illisible/incomplète";
            if ($volumeOk !== null && !$volumeOk) $failedChecklistItems[] = "Volume insuffisant";
            if ($sealOk !== null && !$sealOk) $failedChecklistItems[] = "Sceau de sécurité non-conforme";

            // Check if deviation already exists for compliance violation
            $exists = $sample->deviations()->where('type', 'COMPLIANCE_VIOLATION')->where('status', 'OPEN')->exists();
            if (!$exists) {
                \App\Models\Deviation::create([
                    'sample_id' => $sample->id,
                    'type' => 'COMPLIANCE_VIOLATION',
                    'parameter' => 'reception_checklist',
                    'expected_limit' => 'Tout Conforme',
                    'actual_value' => implode(' ; ', $failedChecklistItems),
                    'status' => 'OPEN',
                    'logged_by' => auth()->id() ?? 1,
                ]);
            }
        }

        if ($hasTempDeviation) {
            // Check if deviation already exists for temperature excursion
            $exists = $sample->deviations()->where('type', 'TEMPERATURE_EXCURSION')->where('status', 'OPEN')->exists();
            if (!$exists) {
                \App\Models\Deviation::create([
                    'sample_id' => $sample->id,
                    'type' => 'TEMPERATURE_EXCURSION',
                    'parameter' => 'temp_value',
                    'expected_limit' => $expectedLimit,
                    'actual_value' => $actualTemp . '°C',
                    'status' => 'OPEN',
                    'logged_by' => auth()->id() ?? 1,
                ]);
            }
        }

        // Detect specific changes for custody audit log
        $changes = [];
        if ($oldStatus !== $sample->status) {
            $changes['status'] = ['from' => $oldStatus, 'to' => $sample->status];
        }
        if ($oldTechId !== $sample->technician_id) {
            $oldTechName = $oldTechId ? \App\Models\User::find($oldTechId)?->name : 'Non assigné';
            $newTechName = $sample->technician_id ? \App\Models\User::find($sample->technician_id)?->name : 'Non assigné';
            $changes['technician'] = ['from' => $oldTechName, 'to' => $newTechName];
        }
        if ($oldStorage !== $sample->storage_location) {
            $changes['storage_location'] = ['from' => $oldStorage ?? 'Non spécifié', 'to' => $sample->storage_location ?? 'Non spécifié'];
        }
        if ($oldTempCond !== $sample->temp_condition) {
            $changes['temp_condition'] = ['from' => $oldTempCond ?? 'Non spécifié', 'to' => $sample->temp_condition ?? 'Non spécifié'];
        }
        if ($oldTempValue != $sample->temp_value) {
            $changes['temp_value'] = ['from' => $oldTempValue ?? 'Non spécifié', 'to' => $sample->temp_value ?? 'Non spécifié'];
        }

        if (!empty($changes)) {
            \App\Models\AuditLog::log(
                auth()->id() ?? 1,
                'MODIFICATION_ECHANTILLON',
                'Sample',
                $sample->id,
                $changes
            );
        }

        return response()->json($sample->load(['client', 'technician', 'aliquots', 'parent', 'deviations']));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $sample = \App\Models\Sample::findOrFail($id);
        
        \App\Models\AuditLog::log(
            auth()->id() ?? 1,
            'SUPPRESSION_ECHANTILLON',
            'Sample',
            $sample->id,
            ['code' => $sample->code]
        );

        // Delete related analyses
        $sample->analyses()->delete();
        
        $sample->delete();

        return response()->json(['success' => true]);
    }

    public function publicTrack($code)
    {
        $sample = \App\Models\Sample::with(['technician', 'analyses.results', 'analyses.technician', 'aliquots', 'parent', 'deviations'])->where('code', $code)->firstOrFail();
        $sample->custody_timeline = $sample->getCustodyTimeline();
        return response()->json($sample);
    }

    /**
     * Split a sample into multiple aliquots.
     */
    public function createAliquots(Request $request, string $id)
    {
        $sample = \App\Models\Sample::findOrFail($id);

        $validated = $request->validate([
            'aliquots' => 'required|array|min:1',
            'aliquots.*.volume' => 'required|string',
            'aliquots.*.storage_location' => 'required|string',
            'aliquots.*.description' => 'nullable|string',
        ]);

        $createdAliquots = [];
        $alphabet = range('A', 'Z');

        foreach ($validated['aliquots'] as $index => $aliquotData) {
            $suffix = $alphabet[$index] ?? strtoupper(substr(uniqid(), -1));
            $aliquotCode = $sample->code . '-' . $suffix;
            
            $aliquot = \App\Models\Sample::create([
                'code' => $aliquotCode,
                'qr_code' => 'QR-' . strtoupper(uniqid()) . '-' . $suffix,
                'client_id' => $sample->client_id,
                'technician_id' => $sample->technician_id,
                'parent_id' => $sample->id,
                'status' => 'Reçu',
                'type' => $sample->type,
                'priority' => $sample->priority,
                'volume' => $aliquotData['volume'],
                'storage_location' => $aliquotData['storage_location'],
                'temp_condition' => $sample->temp_condition,
                'temp_value' => $sample->temp_value,
                'sampled_at' => $sample->sampled_at,
                'description' => $aliquotData['description'] ?? "Aliquote {$suffix} de l'échantillon parent {$sample->code}.",
                'received_at' => now(),
            ]);

            $createdAliquots[] = $aliquot;

            // Audit log for each aliquot
            \App\Models\AuditLog::log(
                auth()->id() ?? 1,
                'CREATION_ALIQUOTE',
                'Sample',
                $aliquot->id,
                [
                    'code' => $aliquot->code,
                    'parent_code' => $sample->code,
                    'volume' => $aliquot->volume,
                    'storage_location' => $aliquot->storage_location
                ]
            );
        }

        // Audit log on the parent
        \App\Models\AuditLog::log(
            auth()->id() ?? 1,
            'DIVISION_ECHANTILLON',
            'Sample',
            $sample->id,
            [
                'parent_code' => $sample->code,
                'aliquots_count' => count($createdAliquots),
                'aliquots_codes' => collect($createdAliquots)->pluck('code')->toArray()
            ]
        );

        return response()->json([
            'parent' => $sample->load(['aliquots', 'deviations']),
            'aliquots' => $createdAliquots
        ], 201);
    }

    /**
     * CSV/Excel Bulk Import
     */
    public function bulkImport(Request $request)
    {
        $validated = $request->validate([
            'samples' => 'required|array|min:1',
            'samples.*.client_id' => 'nullable|exists:users,id',
            'samples.*.technician_id' => 'nullable|exists:users,id',
            'samples.*.type' => 'required|string',
            'samples.*.priority' => 'required|string',
            'samples.*.storage_location' => 'nullable|string',
            'samples.*.volume' => 'nullable|string',
            'samples.*.temp_condition' => 'required|string',
            'samples.*.temp_value' => 'nullable|numeric',
            'samples.*.sampled_at' => 'nullable|date',
            'samples.*.description' => 'nullable|string',
        ]);

        $imported = [];
        
        \DB::transaction(function () use ($validated, &$imported) {
            foreach ($validated['samples'] as $item) {
                $status = 'Reçu';
                $description = $item['description'] ?? null;
                $warnings = [];

                // Volume check
                if (!empty($item['volume'])) {
                    preg_match('/(\d+)/', $item['volume'], $matches);
                    if (!empty($matches) && intval($matches[1]) < 50) {
                        $status = 'Anomalie';
                        $warnings[] = "Volume d'échantillon faible (" . $item['volume'] . " < 50 mL)";
                    }
                }

                // Delay check
                $sampledAt = !empty($item['sampled_at']) ? \Carbon\Carbon::parse($item['sampled_at']) : null;
                $receivedAt = now();
                if ($sampledAt && $receivedAt->diffInHours($sampledAt) > 24) {
                    $status = 'Anomalie';
                    $warnings[] = "Délai de conservation dépassé (" . $receivedAt->diffInHours($sampledAt) . "h > 24h)";
                }

                // Temp check
                $hasTempDeviation = false;
                $expectedLimit = '';
                $actualTemp = $item['temp_value'] ?? null;
                if (!empty($item['temp_condition']) && $actualTemp !== null) {
                    $cond = $item['temp_condition'];
                    if ($cond === 'Congelé' && $actualTemp > -15) {
                        $hasTempDeviation = true;
                        $expectedLimit = '≤ -15°C';
                        $warnings[] = "Excursion de température congelé (" . $actualTemp . "°C > -15°C)";
                    } else if ($cond === 'Réfrigéré' && ($actualTemp < 2 || $actualTemp > 8)) {
                        $hasTempDeviation = true;
                        $expectedLimit = '[2°C, 8°C]';
                        $warnings[] = "Excursion de température réfrigéré (" . $actualTemp . "°C hors limites)";
                    }
                }

                if ($hasTempDeviation) {
                    $status = 'Anomalie';
                }

                if (!empty($warnings)) {
                    $description = (!empty($description) ? $description . "\n" : "") . "[ALERTE RÉCEPTION] " . implode(" ; ", $warnings);
                }

                $sample = \App\Models\Sample::create([
                    'code' => 'SMP-' . strtoupper(substr(uniqid(), -6)),
                    'qr_code' => 'QR-' . strtoupper(uniqid()),
                    'client_id' => $item['client_id'] ?? null,
                    'technician_id' => $item['technician_id'] ?? null,
                    'status' => $status,
                    'type' => $item['type'] ?? 'Eau Potable',
                    'priority' => $item['priority'] ?? 'Normale',
                    'storage_location' => $item['storage_location'] ?? null,
                    'volume' => $item['volume'] ?? null,
                    'temp_condition' => $item['temp_condition'] ?? 'Température Ambiante',
                    'temp_value' => $actualTemp,
                    'sampled_at' => $sampledAt,
                    'description' => $description,
                    'received_at' => $receivedAt,
                ]);

                if ($hasTempDeviation) {
                    \App\Models\Deviation::create([
                        'sample_id' => $sample->id,
                        'type' => 'TEMPERATURE_EXCURSION',
                        'parameter' => 'temp_value',
                        'expected_limit' => $expectedLimit,
                        'actual_value' => $actualTemp . '°C',
                        'status' => 'OPEN',
                        'logged_by' => auth()->id() ?? 1,
                    ]);
                }

                // Log audit
                \App\Models\AuditLog::log(
                    auth()->id() ?? 1,
                    'CREATION_ECHANTILLON',
                    'Sample',
                    $sample->id,
                    [
                        'code' => $sample->code,
                        'type' => $sample->type,
                        'priority' => $sample->priority,
                        'volume' => $sample->volume,
                        'storage_location' => $sample->storage_location,
                        'temp_condition' => $sample->temp_condition,
                        'temp_value' => $sample->temp_value,
                        'sampled_at' => $sample->sampled_at ? $sample->sampled_at->toDateTimeString() : null,
                        'warnings' => $warnings,
                        'imported_bulk' => true
                    ]
                );

                $imported[] = $sample->load(['client', 'technician', 'deviations']);
            }
        });

        return response()->json($imported, 201);
    }

    /**
     * Storage Occupancy Analysis
     */
    public function getStorageOccupancy()
    {
        $storageUnits = [
            'Congélateur Cryogénique A' => ['temp' => '-80°C', 'capacity' => 48],
            'Réfrigérateur Labo B' => ['temp' => '+4°C', 'capacity' => 48],
            'Étuve Incubation C' => ['temp' => '+37°C', 'capacity' => 48],
            'Armoire Solvants D' => ['temp' => 'Temp. Ambiante', 'capacity' => 48],
        ];

        $samples = \App\Models\Sample::whereNotNull('storage_location')->get();
        $response = [];

        foreach ($storageUnits as $name => $meta) {
            $count = $samples->filter(function ($s) use ($name) {
                return str_starts_with($s->storage_location, $name);
            })->count();

            $response[] = [
                'name' => $name,
                'temp' => $meta['temp'],
                'capacity' => $meta['capacity'],
                'occupied' => $count,
                'occupancy_rate' => round(($count / $meta['capacity']) * 100),
            ];
        }

        return response()->json($response);
    }

    /**
     * Resolve Compliance Deviation
     */
    public function resolveDeviation(Request $request, string $id)
    {
        $deviation = \App\Models\Deviation::findOrFail($id);
        $validated = $request->validate([
            'comments' => 'required|string',
            'signature_data' => 'required|string', // Base64 png signature
        ]);

        $deviation->update([
            'status' => 'RESOLVED',
            'comments' => $validated['comments'],
            'closed_by' => auth()->id() ?? 1,
            'signature_data' => $validated['signature_data'],
        ]);

        // Update parent sample status to Reçu if no other open deviations exist
        $sample = $deviation->sample;
        $hasOtherOpen = $sample->deviations()->where('status', 'OPEN')->exists();
        if (!$hasOtherOpen) {
            $sample->update(['status' => 'Reçu']);
        }

        // Log audit trail
        \App\Models\AuditLog::log(
            auth()->id() ?? 1,
            'RESOLUTION_DEVIATION',
            'Sample',
            $sample->id,
            [
                'deviation_id' => $deviation->id,
                'type' => $deviation->type,
                'comments' => $validated['comments'],
                'signature_data' => $validated['signature_data']
            ]
        );

        return response()->json($deviation->load(['closedBy', 'loggedBy']));
    }

    /**
     * Log Custody Transfer Signature
     */
    public function logTransfer(Request $request, string $id)
    {
        $sample = \App\Models\Sample::findOrFail($id);
        $validated = $request->validate([
            'from_person' => 'required|string',
            'to_person' => 'required|string',
            'signature_data' => 'required|string', // Base64 signature
            'notes' => 'nullable|string',
        ]);

        // Log custody transfer in AuditLog changes object
        \App\Models\AuditLog::log(
            auth()->id() ?? 1,
            'TRANSFERT_RESPONSABILITE',
            'Sample',
            $sample->id,
            [
                'from_person' => $validated['from_person'],
                'to_person' => $validated['to_person'],
                'signature_data' => $validated['signature_data'],
                'notes' => $validated['notes'] ?? 'Transfert réglementaire chaine de garde'
            ]
        );

        return response()->json(['success' => true]);
    }
}
