<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Analysis;
use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;

class ReportController extends Controller
{
    public function download($id)
    {
        $analysis = Analysis::with(['sample', 'technician', 'results'])->findOrFail($id);
        
        $pdf = Pdf::loadView('pdf.report', compact('analysis'));
        
        return $pdf->download('Rapport_Analyse_AN-' . str_pad($analysis->id, 4, '0', STR_PAD_LEFT) . '.pdf');
    }

    public function publicDownload($id)
    {
        $analysis = Analysis::with(['sample', 'technician', 'results'])->findOrFail($id);
        
        $pdf = Pdf::loadView('pdf.report', compact('analysis'));
        
        return $pdf->download('Rapport_Analyse_AN-' . str_pad($analysis->id, 4, '0', STR_PAD_LEFT) . '.pdf');
    }
}
