<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MaintenanceTask extends Model
{
    use HasFactory;

    protected $fillable = [
        'equipment_id',
        'type',
        'description',
        'scheduled_at',
        'completed_at',
        'status',
        'technician_name',
        'cost',
        'notes',
    ];

    protected $casts = [
        'scheduled_at' => 'date',
        'completed_at' => 'date',
        'cost' => 'decimal:2',
    ];

    public function equipment()
    {
        return $this->belongsTo(Equipment::class, 'equipment_id');
    }
}
