<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\Request;

class AuditController extends Controller
{
    public function index(Request $request)
    {
        $query = AuditLog::with('user')->orderBy('created_at', 'desc');

        if ($request->has('action') && $request->action != '') {
            $query->where('action', $request->action);
        }

        if ($request->has('model') && $request->model != '') {
            $query->where('model', $request->model);
        }

        if ($request->has('user_id') && $request->user_id != '') {
            $query->where('user_id', $request->user_id);
        }

        if ($request->has('start_date') && $request->start_date != '') {
            $query->whereDate('created_at', '>=', $request->start_date);
        }

        if ($request->has('end_date') && $request->end_date != '') {
            $query->whereDate('created_at', '<=', $request->end_date);
        }

        $logs = $query->get();
        return response()->json($logs);
    }

    public function exportPdf(Request $request)
    {
        $query = AuditLog::with('user')->orderBy('created_at', 'desc');

        if ($request->has('action') && $request->action != '') {
            $query->where('action', $request->action);
        }
        if ($request->has('model') && $request->model != '') {
            $query->where('model', $request->model);
        }
        if ($request->has('start_date') && $request->start_date != '') {
            $query->whereDate('created_at', '>=', $request->start_date);
        }
        if ($request->has('end_date') && $request->end_date != '') {
            $query->whereDate('created_at', '<=', $request->end_date);
        }

        $logs = $query->get();
        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.audit_logs', compact('logs'))
                ->setPaper('a4', 'landscape');
                
        return $pdf->download('Registre_Audit_ISO17025_' . now()->format('Y-m-d') . '.pdf');
    }
}
