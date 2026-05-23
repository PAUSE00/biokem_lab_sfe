<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\MaintenanceTask;
use App\Models\Equipment;
use Illuminate\Http\Request;
use Carbon\Carbon;

class MaintenanceTaskController extends Controller
{
    public function index(Request $request)
    {
        $tasks = MaintenanceTask::with('equipment')
            ->orderBy('scheduled_at', 'desc')
            ->get();
        return response()->json($tasks);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'equipment_id' => 'required|exists:equipments,id',
            'type' => 'required|string|in:Maintenance préventive,Maintenance corrective,Étalonnage / Calibration',
            'description' => 'required|string',
            'scheduled_at' => 'required|date',
            'technician_name' => 'required|string|max:255',
            'cost' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
            'status' => 'required|string|in:Planifié,En cours,Terminé,Annulé',
        ]);

        $task = MaintenanceTask::create($validated);

        // Smart scheduling logic if created directly as Terminé
        if ($task->status === 'Terminé') {
            $task->completed_at = $task->completed_at ?? now()->toDateString();
            $task->save();
            $this->updateEquipmentDates($task);
        }

        return response()->json($task->load('equipment'), 201);
    }

    public function update(Request $request, MaintenanceTask $maintenanceTask)
    {
        $validated = $request->validate([
            'equipment_id' => 'sometimes|required|exists:equipments,id',
            'type' => 'sometimes|required|string|in:Maintenance préventive,Maintenance corrective,Étalonnage / Calibration',
            'description' => 'sometimes|required|string',
            'scheduled_at' => 'sometimes|required|date',
            'completed_at' => 'nullable|date',
            'status' => 'sometimes|required|string|in:Planifié,En cours,Terminé,Annulé',
            'technician_name' => 'sometimes|required|string|max:255',
            'cost' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        $maintenanceTask->update($validated);

        // Smart scheduling logic when task status transitions to Terminé
        if ($maintenanceTask->status === 'Terminé') {
            if (!$maintenanceTask->completed_at) {
                $maintenanceTask->completed_at = now()->toDateString();
                $maintenanceTask->save();
            }
            $this->updateEquipmentDates($maintenanceTask);
        }

        return response()->json($maintenanceTask->load('equipment'));
    }

    public function destroy(MaintenanceTask $maintenanceTask)
    {
        $maintenanceTask->delete();
        return response()->json(null, 204);
    }

    /**
     * Smart dates update helper for equipment calibration/maintenance lifecycle.
     */
    private function updateEquipmentDates(MaintenanceTask $task)
    {
        $equipment = $task->equipment;
        if (!$equipment) return;

        $completedDate = Carbon::parse($task->completed_at);

        if ($task->type === 'Étalonnage / Calibration') {
            $equipment->last_calibration_at = $completedDate->toDateString();
            // Automatically plan next calibration in 6 months
            $equipment->next_calibration_at = $completedDate->copy()->addMonths(6)->toDateString();
            $equipment->status = 'Actif';
        } else {
            // Maintenance task
            $equipment->last_maintenance_at = $completedDate->toDateString();
            // Automatically plan next maintenance in 6 months
            $equipment->next_maintenance_at = $completedDate->copy()->addMonths(6)->toDateString();
            $equipment->status = 'Actif';
        }

        $equipment->save();
    }
}
