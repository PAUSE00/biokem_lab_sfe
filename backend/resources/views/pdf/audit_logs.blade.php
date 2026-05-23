<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Registre d'Audit ISO 17025</title>
    <style>
        body { font-family: 'Helvetica', 'Arial', sans-serif; font-size: 11px; color: #333; }
        .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #0ea5e9; padding-bottom: 10px; }
        .title { font-size: 18px; font-weight: bold; color: #0f172a; margin-bottom: 5px; }
        .subtitle { font-size: 12px; color: #64748b; }
        .meta { margin-bottom: 20px; font-size: 10px; color: #64748b; text-align: right; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th { background-color: #f1f5f9; color: #334155; font-weight: bold; padding: 8px; border: 1px solid #cbd5e1; text-align: left; }
        td { padding: 8px; border: 1px solid #cbd5e1; vertical-align: top; }
        .action { font-weight: bold; color: #0284c7; }
        .footer { text-align: center; font-size: 9px; color: #94a3b8; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 10px; }
        .changes { font-family: 'Courier New', Courier, monospace; font-size: 9px; background: #f8fafc; padding: 4px; border-radius: 2px; }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">REGISTRE D'AUDIT ET DE TRAÇABILITÉ</div>
        <div class="subtitle">Conformité ISO/IEC 17025 — ChemLab LIMS</div>
    </div>
    
    <div class="meta">
        Généré le : {{ \Carbon\Carbon::now()->format('d/m/Y à H:i:s') }}<br>
        Nombre d'enregistrements : {{ count($logs) }}
    </div>

    <table>
        <thead>
            <tr>
                <th style="width: 15%">Date & Heure</th>
                <th style="width: 15%">Utilisateur</th>
                <th style="width: 15%">Action</th>
                <th style="width: 15%">Entité ciblée</th>
                <th style="width: 40%">Détails / Modifications</th>
            </tr>
        </thead>
        <tbody>
            @foreach($logs as $log)
            <tr>
                <td>{{ \Carbon\Carbon::parse($log->created_at)->format('d/m/Y H:i:s') }}</td>
                <td>{{ $log->user ? $log->user->name : 'Système' }}<br><small>{{ $log->user ? $log->user->role : '' }}</small></td>
                <td class="action">{{ str_replace('_', ' ', $log->action) }}</td>
                <td>{{ $log->model }} #{{ $log->model_id }}</td>
                <td>
                    @if($log->changes)
                        <div class="changes">
                            @foreach($log->changes as $key => $value)
                                <strong>{{ $key }}</strong>: {{ is_array($value) ? json_encode($value) : $value }}<br>
                            @endforeach
                        </div>
                    @else
                        <em>Aucun détail</em>
                    @endif
                </td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <div class="footer">
        ChemLab LIMS — Document généré automatiquement et certifié inaltérable.<br>
        Ce registre constitue une preuve numérique de traçabilité des opérations.
    </div>
</body>
</html>
