<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\StockItem;
use App\Models\AuditLog;
use App\Models\Notification;
use Illuminate\Http\Request;

class StockController extends Controller
{
    public function index()
    {
        $stockItems = StockItem::orderBy('name', 'asc')->get();
        return response()->json($stockItems);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'quantity' => 'required|numeric|min:0',
            'unit' => 'required|string|max:50',
            'threshold' => 'required|numeric|min:0',
            'expiry_date' => 'nullable|date',
            'supplier_name' => 'nullable|string|max:255',
        ]);

        $stockItem = StockItem::create($validated);

        // Check for low stock immediately
        if ($stockItem->quantity <= $stockItem->threshold) {
            Notification::create([
                'user_id' => null,
                'type' => 'stock_faible',
                'message' => "Alerte de stock : La quantité de {$stockItem->name} ({$stockItem->quantity} {$stockItem->unit}) est inférieure ou égale au seuil de sécurité ({$stockItem->threshold} {$stockItem->unit}).",
            ]);
        }

        // Audit Log
        AuditLog::log(auth()->id(), 'CREATE', 'StockItem', $stockItem->id, [
            'name' => $stockItem->name,
            'quantity' => $stockItem->quantity,
            'unit' => $stockItem->unit,
        ]);

        return response()->json($stockItem, 201);
    }

    public function show(StockItem $stockItem)
    {
        return response()->json($stockItem);
    }

    public function update(Request $request, StockItem $stockItem)
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'quantity' => 'sometimes|required|numeric|min:0',
            'unit' => 'sometimes|required|string|max:50',
            'threshold' => 'sometimes|required|numeric|min:0',
            'expiry_date' => 'nullable|date',
            'supplier_name' => 'nullable|string|max:255',
        ]);

        $oldQty = $stockItem->quantity;
        $stockItem->update($validated);

        // Check for low stock if quantity or threshold changed
        if ($stockItem->quantity <= $stockItem->threshold) {
            Notification::create([
                'user_id' => null,
                'type' => 'stock_faible',
                'message' => "Alerte de stock : La quantité de {$stockItem->name} ({$stockItem->quantity} {$stockItem->unit}) est inférieure ou égale au seuil de sécurité ({$stockItem->threshold} {$stockItem->unit}).",
            ]);
        }

        // Audit Log
        AuditLog::log(auth()->id(), 'UPDATE', 'StockItem', $stockItem->id, [
            'name' => $stockItem->name,
            'quantity_before' => $oldQty,
            'quantity_after' => $stockItem->quantity,
        ]);

        return response()->json($stockItem);
    }

    public function destroy(StockItem $stockItem)
    {
        $id = $stockItem->id;
        $name = $stockItem->name;

        $stockItem->delete();

        // Audit Log
        AuditLog::log(auth()->id(), 'DELETE', 'StockItem', $id, [
            'name' => $name,
        ]);

        return response()->json(null, 204);
    }
}
