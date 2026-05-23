<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Rapport d'Analyse Chimique</title>
    <style>
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            color: #334155;
            margin: 0;
            padding: 20px;
            font-size: 14px;
            line-height: 1.5;
        }
        .header {
            border-bottom: 2px solid #3b82f6;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header-title {
            font-size: 24px;
            font-weight: bold;
            color: #1e3a8a;
            margin: 0;
        }
        .header-subtitle {
            font-size: 12px;
            color: #64748b;
            margin: 5px 0 0 0;
        }
        .meta-section {
            width: 100%;
            margin-bottom: 30px;
            border-collapse: collapse;
        }
        .meta-section td {
            padding: 8px;
            vertical-align: top;
        }
        .meta-label {
            font-weight: bold;
            color: #475569;
            width: 150px;
        }
        .meta-value {
            color: #0f172a;
        }
        .title {
            font-size: 18px;
            font-weight: bold;
            color: #1e3a8a;
            margin-bottom: 15px;
            border-left: 4px solid #3b82f6;
            padding-left: 10px;
        }
        .results-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 40px;
        }
        .results-table th {
            background-color: #f8fafc;
            color: #475569;
            text-align: left;
            padding: 12px;
            font-weight: 600;
            border-bottom: 2px solid #e2e8f0;
        }
        .results-table td {
            padding: 12px;
            border-bottom: 1px solid #e2e8f0;
        }
        .badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 9999px;
            font-size: 11px;
            font-weight: 500;
        }
        .badge-success {
            background-color: #dcfce7;
            color: #15803d;
        }
        .badge-danger {
            background-color: #fee2e2;
            color: #b91c1c;
        }
        .footer {
            margin-top: 50px;
            border-top: 1px solid #e2e8f0;
            padding-top: 20px;
            text-align: center;
            font-size: 11px;
            color: #64748b;
        }
        .signature-section {
            margin-top: 60px;
            width: 100%;
        }
        .signature-box {
            text-align: right;
            padding-right: 50px;
        }
        .signature-title {
            font-weight: bold;
            color: #475569;
            margin-bottom: 60px;
        }
    </style>
</head>
<body>

    <div class="header">
        <table style="width: 100%;">
            <tr>
                <td>
                    <h1 class="header-title">CHEMLAB LIMS</h1>
                    <p class="header-subtitle">Plateforme d'analyses chimiques et de traçabilité</p>
                </td>
                <td style="text-align: right;">
                    <div style="font-weight: bold; color: #1e3a8a; font-size: 16px;">RAPPORT D'ANALYSE</div>
                    <div style="font-size: 12px; color: #64748b; margin-top: 5px;">Rapport N° : AN-{{ str_pad($analysis->id, 4, '0', STR_PAD_LEFT) }}</div>
                </td>
            </tr>
        </table>
    </div>

    <table class="meta-section">
        <tr>
            <td class="meta-label">Code Échantillon :</td>
            <td class="meta-value">{{ $analysis->sample->code ?? 'N/D' }}</td>
            <td class="meta-label">Date d'Enregistrement :</td>
            <td class="meta-value">{{ $analysis->created_at->format('d/m/Y H:i') }}</td>
        </tr>
        <tr>
            <td class="meta-label">Client :</td>
            <td class="meta-value">{{ $analysis->sample && $analysis->sample->client ? $analysis->sample->client->name : ('Client #' . ($analysis->sample->client_id ?? 'N/D')) }}</td>
            <td class="meta-label">Date de Validation :</td>
            <td class="meta-value">{{ $analysis->validated_at ? \Carbon\Carbon::parse($analysis->validated_at)->format('d/m/Y H:i') : 'N/D' }}</td>
        </tr>
        <tr>
            <td class="meta-label">Technicien :</td>
            <td class="meta-value">{{ $analysis->technician->name ?? 'Non assigné' }}</td>
            <td class="meta-label">Statut :</td>
            <td class="meta-value" style="font-weight: bold; color: #16803d;">Validé</td>
        </tr>
    </table>

    @if(isset($analysis->metadata) && is_array($analysis->metadata))
        @php $meta = $analysis->metadata; @endphp
        @if(isset($meta['module']) && $meta['module'] === 'sol')
            <div class="title">Informations de la Parcelle & Réception</div>
            <table class="meta-section">
                <tr>
                    <td class="meta-label">Nom du Client :</td>
                    <td class="meta-value">{{ $meta['client_name'] ?? 'N/D' }}</td>
                    <td class="meta-label">Région / Commune :</td>
                    <td class="meta-value">{{ $meta['region'] ?? 'N/D' }} / {{ $meta['commune'] ?? 'N/D' }}</td>
                </tr>
                <tr>
                    <td class="meta-label">Téléphone :</td>
                    <td class="meta-value">{{ $meta['client_phone'] ?? 'N/D' }}</td>
                    <td class="meta-label">GPS Coords :</td>
                    <td class="meta-value">{{ $meta['gps'] ?? 'N/D' }}</td>
                </tr>
                <tr>
                    <td class="meta-label">Culture Actuelle :</td>
                    <td class="meta-value">{{ $meta['current_culture'] ?? 'N/D' }}</td>
                    <td class="meta-label">Surface :</td>
                    <td class="meta-value">{{ $meta['surface'] ?? 'N/D' }} ha</td>
                </tr>
                <tr>
                    <td class="meta-label">Culture Prévue :</td>
                    <td class="meta-value">{{ $meta['planned_culture'] ?? 'N/D' }}</td>
                    <td class="meta-label">Date Prélèvement :</td>
                    <td class="meta-value">{{ $meta['date_sample'] ?? 'N/D' }}</td>
                </tr>
            </table>

            <div class="title">Contrôle Qualité & Préparation</div>
            <table class="meta-section">
                <tr>
                    <td class="meta-label">QC Critères :</td>
                    <td class="meta-value">
                        Quantité ({{ ($meta['qc_qty'] ?? false) ? '✓ OK' : '✗ Insuffisant' }}),
                        Contamination ({{ ($meta['qc_contamination'] ?? false) ? '✓ Propre' : '✗ Contaminé' }}),
                        Humidité ({{ ($meta['qc_humidity'] ?? false) ? '✓ OK' : '✗ Humide' }})
                    </td>
                    <td class="meta-label">QC Décision :</td>
                    <td class="meta-value" style="font-weight: bold; color: {{ ($meta['qc_decision'] ?? '') === 'Accepte' ? '#16803d' : '#b91c1c' }};">
                        {{ $meta['qc_decision'] ?? 'N/D' }}
                    </td>
                </tr>
                <tr>
                    <td class="meta-label">Préparation :</td>
                    <td class="meta-value" colspan="3">
                        Séchage : {{ $meta['prep_drying_temp'] ?? '—' }}°C ({{ $meta['prep_drying_start'] ?? '—' }} au {{ $meta['prep_drying_end'] ?? '—' }}),
                        Broyage : {{ $meta['prep_grinding_type'] ?? '—' }} (Maille: {{ $meta['prep_sieving_mesh'] ?? '—' }} mm),
                        Stockage : Armoire {{ $meta['prep_storage_cab'] ?? '—' }} / Étagère {{ $meta['prep_storage_shelf'] ?? '—' }} / Bac {{ $meta['prep_storage_bin'] ?? '—' }}
                    </td>
                </tr>
            </table>
        @elseif(isset($meta['module']) && $meta['module'] === 'eau')
            <div class="title">Provenance de l'Eau & Réception</div>
            <table class="meta-section">
                <tr>
                    <td class="meta-label">Nom du Client :</td>
                    <td class="meta-value">{{ $meta['client_name'] ?? 'N/D' }}</td>
                    <td class="meta-label">Source de l'Eau :</td>
                    <td class="meta-value" style="font-weight: bold; color: #1e3a8a;">{{ $meta['water_source'] ?? 'N/D' }}</td>
                </tr>
                <tr>
                    <td class="meta-label">Téléphone :</td>
                    <td class="meta-value">{{ $meta['client_phone'] ?? 'N/D' }}</td>
                    <td class="meta-label">Préleveur :</td>
                    <td class="meta-value">{{ $meta['water_sampler'] ?? 'N/D' }}</td>
                </tr>
                <tr>
                    <td class="meta-label">Date/Heure Prélèvement :</td>
                    <td class="meta-value">{{ $meta['water_sample_time'] ?? 'N/D' }}</td>
                    <td class="meta-label">Température Eau :</td>
                    <td class="meta-value">{{ $meta['water_temp'] ?? 'N/D' }} °C</td>
                </tr>
            </table>

            <div class="title">Contrôle Qualité & Calculs d'Irrigation</div>
            <table class="meta-section">
                <tr>
                    <td class="meta-label">QC Critères :</td>
                    <td class="meta-value">
                        Bouteille ({{ ($meta['qc_bottle'] ?? false) ? '✓ Propre' : '✗ Sale' }}),
                        Volume ({{ ($meta['qc_volume'] ?? false) ? '✓ OK' : '✗ Insuffisant' }}),
                        Délai ({{ ($meta['qc_delay'] ?? false) ? '✓ OK' : '✗ Dépassé' }})
                    </td>
                    <td class="meta-label">QC Décision :</td>
                    <td class="meta-value" style="font-weight: bold; color: {{ ($meta['qc_decision'] ?? '') === 'Accepte' ? '#16803d' : '#b91c1c' }};">
                        {{ $meta['qc_decision'] ?? 'N/D' }}
                    </td>
                </tr>
                <tr>
                    <td class="meta-label">Indice SAR :</td>
                    <td class="meta-value" style="font-weight: bold; color: #0284c7;">{{ $meta['water_sar'] ?? 'N/D' }}</td>
                    <td class="meta-label">Indice RSC :</td>
                    <td class="meta-value" style="font-weight: bold; color: #0284c7;">{{ $meta['water_rsc'] ?? 'N/D' }} meq/L</td>
                </tr>
                <tr>
                    <td class="meta-label">Dureté Totale :</td>
                    <td class="meta-value">{{ $meta['water_hardness'] ?? 'N/D' }} °fH</td>
                    <td class="meta-label">Classification :</td>
                    <td class="meta-value" style="font-weight: bold; color: #b45309; font-size: 13px;">{{ $meta['water_irrigation_class'] ?? 'N/D' }}</td>
                </tr>
            </table>
        @endif
    @endif

    <div class="title">Résultats des Mesures Physico-Chimiques</div>

    <table class="results-table">
        <thead>
            <tr>
                <th>Paramètre</th>
                <th>Valeur Mesurée</th>
                <th>Unité</th>
                <th>Plage de Référence</th>
                <th>Statut</th>
            </tr>
        </thead>
        <tbody>
            @foreach($analysis->results as $result)
                <tr>
                    <td style="font-weight: bold; color: #334155;">{{ $result->parameter }}</td>
                    <td>{{ $result->value }}</td>
                    <td>{{ $result->unit ?: '—' }}</td>
                    <td>
                        @if($result->reference_min !== null || $result->reference_max !== null)
                            {{ $result->reference_min ?? '0' }} - {{ $result->reference_max ?? '∞' }}
                        @else
                            —
                        @endif
                    </td>
                    <td>
                        @if($result->is_anomaly)
                            <span class="badge badge-danger">ANOMALIE</span>
                        @else
                            <span class="badge badge-success">CONFORME</span>
                        @endif
                    </td>
                </tr>
            @endforeach
        </tbody>
    </table>

    @if($analysis->risk_score !== null)
    <div style="margin-top: 20px; margin-bottom: 30px; padding: 15px; border-radius: 8px; background-color: {{ $analysis->risk_score > 70 ? '#fef2f2' : ($analysis->risk_score > 35 ? '#fffbeb' : '#f0fdf4') }}; border-left: 5px solid {{ $analysis->risk_score > 70 ? '#ef4444' : ($analysis->risk_score > 35 ? '#f59e0b' : '#22c55e') }};">
        <h3 style="margin-top: 0; color: {{ $analysis->risk_score > 70 ? '#991b1b' : ($analysis->risk_score > 35 ? '#92400e' : '#166534') }}; font-size: 14px; margin-bottom: 8px;">Synthèse de Conformité Technique (Norme ISO 17025)</h3>
        <p style="margin: 0 0 8px 0; font-size: 13px;"><strong>Score Global de Risque :</strong> <span style="font-size: 15px; font-weight: bold; color: {{ $analysis->risk_score > 70 ? '#ef4444' : ($analysis->risk_score > 35 ? '#f59e0b' : '#22c55e') }};">{{ $analysis->risk_score }}%</span></p>
        <p style="margin: 0; font-size: 12px; color: #475569; line-height: 1.5;"><strong>Recommandation :</strong> {{ $analysis->ai_recommendation }}</p>
    </div>
    @endif

    <div class="signature-section">
        <table style="width: 100%;">
            <tr>
                <td></td>
                <td class="signature-box" style="width: 300px;">
                    <div class="signature-title">Signature du Responsable de Laboratoire</div>
                    <div style="font-style: italic; color: #94a3b8; font-size: 12px;">Signé électroniquement</div>
                </td>
            </tr>
        </table>
    </div>

    <div class="footer">
        <p>ChemLab LIMS — Certifié ISO 17025. Document généré automatiquement et infalsifiable.</p>
    </div>

</body>
</html>
