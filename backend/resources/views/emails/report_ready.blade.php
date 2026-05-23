<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Votre Rapport d'Analyse est Prêt</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #334155; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="border-bottom: 2px solid #3b82f6; padding-bottom: 20px; margin-bottom: 20px;">
        <h2 style="color: #1e3a8a; margin: 0;">ChemLab LIMS</h2>
    </div>
    
    <p>Bonjour,</p>
    
    <p>Nous avons le plaisir de vous informer que l'analyse de votre échantillon <strong>{{ $analysis->sample->code ?? 'N/D' }}</strong> a été entièrement validée par nos responsables de laboratoire.</p>
    
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #1e3a8a;">Détails du rapport :</h3>
        <table style="width: 100%; font-size: 14px;">
            <tr>
                <td style="font-weight: bold; width: 150px; padding: 5px 0;">N° d'Analyse :</td>
                <td style="padding: 5px 0;">AN-{{ str_pad($analysis->id, 4, '0', STR_PAD_LEFT) }}</td>
            </tr>
            <tr>
                <td style="font-weight: bold; padding: 5px 0;">Code Échantillon :</td>
                <td style="padding: 5px 0;">{{ $analysis->sample->code ?? 'N/D' }}</td>
            </tr>
            <tr>
                <td style="font-weight: bold; padding: 5px 0;">Date de Validation :</td>
                <td style="padding: 5px 0;">{{ $analysis->validated_at ? \Carbon\Carbon::parse($analysis->validated_at)->format('d/m/Y H:i') : 'N/D' }}</td>
            </tr>
        </table>
    </div>

    <p>Le rapport PDF officiel complet est désormais disponible au téléchargement dans votre espace client sur la plateforme ChemLab.</p>

    <div style="text-align: center; margin: 30px 0;">
        <a href="http://localhost:5173/reports" style="background-color: #3b82f6; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; display: inline-block;">Accéder à mes Rapports</a>
    </div>

    <p style="font-size: 12px; color: #64748b; margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center;">
        ChemLab LIMS — Système d'Information de Laboratoire certifié.<br>
        Ne pas répondre à ce message automatique.
    </p>
</body>
</html>
