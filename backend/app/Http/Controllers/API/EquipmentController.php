<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Equipment;
use Illuminate\Http\Request;

class EquipmentController extends Controller
{
    public function index()
    {
        $equipments = Equipment::with('maintenanceTasks')->orderBy('name', 'asc')->get();
        return response()->json($equipments);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'model' => 'required|string|max:255',
            'serial_number' => 'required|string|max:255|unique:equipments,serial_number',
            'status' => 'required|string|in:Actif,En maintenance,En étalonnage,Inactif',
            'last_calibration_at' => 'nullable|date',
            'next_calibration_at' => 'nullable|date',
            'last_maintenance_at' => 'nullable|date',
            'next_maintenance_at' => 'nullable|date',
        ]);

        $equipment = Equipment::create($validated);

        return response()->json($equipment, 201);
    }

    public function show(Equipment $equipment)
    {
        return response()->json($equipment->load('maintenanceTasks'));
    }

    public function update(Request $request, Equipment $equipment)
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'model' => 'sometimes|required|string|max:255',
            'serial_number' => 'sometimes|required|string|max:255|unique:equipments,serial_number,' . $equipment->id,
            'status' => 'sometimes|required|string|in:Actif,En maintenance,En étalonnage,Inactif',
            'last_calibration_at' => 'nullable|date',
            'next_calibration_at' => 'nullable|date',
            'last_maintenance_at' => 'nullable|date',
            'next_maintenance_at' => 'nullable|date',
        ]);

        $equipment->update($validated);

        return response()->json($equipment);
    }

    public function destroy(Equipment $equipment)
    {
        $equipment->delete();
        return response()->json(null, 204);
    }
}
