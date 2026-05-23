<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class AnalysisController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $analyses = \App\Models\Analysis::with(['sample', 'technician', 'results'])->orderBy('created_at', 'desc')->get();
        return response()->json($analyses);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'sample_id' => 'required|exists:samples,id',
            'user_id' => 'nullable|exists:users,id',
            'parameters' => 'nullable|array',
            'status' => 'nullable|string'
        ]);

        $analysis = \App\Models\Analysis::create([
            'sample_id' => $validated['sample_id'],
            'user_id' => $validated['user_id'] ?? null,
            'parameters' => $validated['parameters'] ?? ['pH', 'Turbidity', 'Conductivity'],
            'status' => $validated['status'] ?? 'En attente',
        ]);

        return response()->json($analysis->load(['sample', 'technician']), 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    public function validateAnalysis(Request $request, string $id)
    {
        $analysis = \App\Models\Analysis::findOrFail($id);
        
        $validated = $request->validate([
            'results' => 'required|array',
            'results.*.parameter' => 'required|string',
            'results.*.value' => 'required|string',
            'results.*.unit' => 'nullable|string',
            'results.*.reference_min' => 'nullable|numeric',
            'results.*.reference_max' => 'nullable|numeric',
        ]);

        $hasAnomaly = false;
        $riskScore = 0;
        $anomalyDetails = [];

        // Technical Analysis Engine (Local rule-based validation)
        foreach ($validated['results'] as $res) {
            $value = floatval($res['value']);
            $is_anomaly = false;
            
            if (isset($res['reference_min']) && is_numeric($res['reference_min']) && $value < $res['reference_min']) {
                $is_anomaly = true;
            }
            if (isset($res['reference_max']) && is_numeric($res['reference_max']) && $value > $res['reference_max']) {
                $is_anomaly = true;
            }

            if ($is_anomaly) {
                $hasAnomaly = true;
                $paramName = strtolower($res['parameter']);
                
                if (str_contains($paramName, 'ph')) {
                    if ($value < 4.0 || $value > 10.0) {
                        $riskScore += 50;
                    } else {
                        $riskScore += 30;
                    }
                    $anomalyDetails[] = "pH anormal ({$value})";
                } elseif (str_contains($paramName, 'zinc') || str_contains($paramName, 'zn')) {
                    $riskScore += 40;
                    $anomalyDetails[] = "Zinc lourd ({$value} mg/L)";
                } elseif (str_contains($paramName, 'turbid')) {
                    $riskScore += 20;
                    $anomalyDetails[] = "Turbidité élevée ({$value} NTU)";
                } elseif (str_contains($paramName, 'nitrate') || str_contains($paramName, 'no3')) {
                    $riskScore += 35;
                    $anomalyDetails[] = "Taux de Nitrates critique ({$value} mg/L)";
                } elseif (str_contains($paramName, 'temp')) {
                    $riskScore += 10;
                    $anomalyDetails[] = "Température déviante ({$value} °C)";
                } elseif (str_contains($paramName, 'conductiv')) {
                    $riskScore += 15;
                    $anomalyDetails[] = "Conductivité élevée ({$value} µS/cm)";
                } else {
                    $riskScore += 15;
                    $anomalyDetails[] = "{$res['parameter']} hors-norme ({$value})";
                }
            }
        }

        $riskScore = min($riskScore, 100);

        if ($riskScore === 0) {
            $aiRec = "Qualité de l'eau excellente. Tous les paramètres analysés respectent strictement les normes de potabilité et de salubrité de l'OMS. Aucune intervention corrective n'est nécessaire.";
        } elseif ($riskScore <= 35) {
            $anoms = implode(', ', $anomalyDetails);
            $aiRec = "Risque sanitaire global FAIBLE ({$riskScore}%). Altération légère observée sur : {$anoms}. Surveillance renforcée conseillée. Un simple ajustement ou filtration standard devrait suffire à rétablir l'équilibre.";
        } elseif ($riskScore <= 70) {
            $anoms = implode(', ', $anomalyDetails);
            $aiRec = "Risque sanitaire MODÉRÉ ({$riskScore}%). Déviations majeures détectées sur : {$anoms}. Recommandation : Suspendre la consommation directe de cette eau. Planifier un traitement correctif de neutralisation ou de précipitation chimique, suivi d'un contrôle de validation sous 48 heures.";
        } else {
            $anoms = implode(', ', $anomalyDetails);
            $aiRec = "RISQUE SANITAIRE CRITIQUE ({$riskScore}%) ! Présence de polluants majeurs ou toxiques : {$anoms}. Danger d'intoxication élevé. Recommandation urgente : Interdiction totale de consommation ou d'usage industriel. Purge complète du circuit, traitement d'urgence et signalement obligatoire aux autorités sanitaires.";
        }

        // Always save the individual result rows into DB
        foreach ($validated['results'] as $res) {
            $value = floatval($res['value']);
            $is_anomaly = false;
            if (isset($res['reference_min']) && is_numeric($res['reference_min']) && $value < $res['reference_min']) {
                $is_anomaly = true;
            }
            if (isset($res['reference_max']) && is_numeric($res['reference_max']) && $value > $res['reference_max']) {
                $is_anomaly = true;
            }

            \App\Models\AnalysisResult::create([
                'analysis_id' => $analysis->id,
                'parameter' => $res['parameter'],
                'value' => $res['value'],
                'unit' => $res['unit'] ?? '',
                'is_anomaly' => $is_anomaly,
                'reference_min' => $res['reference_min'] ?? null,
                'reference_max' => $res['reference_max'] ?? null,
            ]);

            if (strtolower($res['parameter']) === 'ph') {
                if ($value < 6.0 || $value > 9.0) {
                    \App\Models\Notification::create([
                        'user_id' => null,
                        'type' => 'pH_critique',
                        'message' => "Alerte : Le pH de l'échantillon " . ($analysis->sample->code ?? 'N/D') . " est critique ({$value}).",
                    ]);
                }
            }

            if (in_array(strtolower($res['parameter']), ['zinc', 'zn'])) {
                if ($value > 3.0) {
                    \App\Models\Notification::create([
                        'user_id' => null,
                        'type' => 'zinc_eleve',
                        'message' => "Alerte : Niveau de Zinc anormalement élevé ({$value} mg/L) détecté dans l'échantillon " . ($analysis->sample->code ?? 'N/D') . ".",
                    ]);
                }
            }
        }

        $analysis->update([
            'status' => 'Validé',
            'validated_at' => now(),
            'risk_score' => $riskScore,
            'ai_recommendation' => $aiRec,
        ]);

        // General "Report Ready" Notification
        \App\Models\Notification::create([
            'user_id' => null,
            'type' => 'rapport_pret',
            'message' => "Le rapport d'analyse pour l'échantillon " . ($analysis->sample->code ?? 'N/D') . " a été validé avec un Score de Risque de {$riskScore}%.",
        ]);

        // Auto deduct stock items
        $hcl = \App\Models\StockItem::where('name', 'like', '%Acide%')->first();
        if ($hcl) {
            $hcl->decrement('quantity', 0.1);
            if ($hcl->quantity <= $hcl->threshold) {
                \App\Models\Notification::create([
                    'user_id' => null,
                    'type' => 'stock_faible',
                    'message' => "Alerte de stock : La quantité de {$hcl->name} ({$hcl->quantity} {$hcl->unit}) est inférieure ou égale au seuil de sécurité.",
                ]);
            }
        }
        
        $buf7 = \App\Models\StockItem::where('name', 'like', '%Buffer pH 7.00%')->first();
        if ($buf7) {
            $buf7->decrement('quantity', 0.05);
            if ($buf7->quantity <= $buf7->threshold) {
                \App\Models\Notification::create([
                    'user_id' => null,
                    'type' => 'stock_faible',
                    'message' => "Alerte de stock : La quantité de {$buf7->name} ({$buf7->quantity} {$buf7->unit}) est inférieure ou égale au seuil de sécurité.",
                ]);
            }
        }

        $distilled = \App\Models\StockItem::where('name', 'like', '%Eau Distillée%')->first();
        if ($distilled) {
            $distilled->decrement('quantity', 0.5);
            if ($distilled->quantity <= $distilled->threshold) {
                \App\Models\Notification::create([
                    'user_id' => null,
                    'type' => 'stock_faible',
                    'message' => "Alerte de stock : La quantité de {$distilled->name} ({$distilled->quantity} {$distilled->unit}) est inférieure ou égale au seuil de sécurité.",
                ]);
            }
        }

        // Audit Trail log
        \App\Models\AuditLog::log(
            auth()->id(),
            'VALIDATION_ANALYSE',
            'Analysis',
            $analysis->id,
            [
                'code' => $analysis->sample->code ?? 'N/D',
                'risk_score' => $riskScore,
                'has_anomaly' => $hasAnomaly,
                'anomalies' => $anomalyDetails
            ]
        );

        // Send email to client if exists
        if ($analysis->sample && $analysis->sample->client && $analysis->sample->client->email) {
            try {
                \Illuminate\Support\Facades\Mail::to($analysis->sample->client->email)
                    ->send(new \App\Mail\ReportReadyMail($analysis));
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::warning("Failed to send report ready email: " . $e->getMessage());
            }
        }
        
        // Update Sample status if necessary
        if ($analysis->sample) {
            $analysis->sample->update(['status' => 'Terminé']);
        }

        return response()->json([
            'message' => 'Analysis validated successfully', 
            'analysis' => $analysis->load('results')
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $analysis = \App\Models\Analysis::findOrFail($id);
        $analysis->delete();
        return response()->json(['message' => 'Analysis deleted successfully']);
    }
}
