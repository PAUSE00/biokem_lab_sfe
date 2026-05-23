<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Equipment extends Model
{
    use HasFactory;

    protected $table = 'equipments';

    protected $fillable = [
        'name',
        'model',
        'serial_number',
        'status',
        'last_calibration_at',
        'next_calibration_at',
        'last_maintenance_at',
        'next_maintenance_at',
    ];

    protected $casts = [
        'last_calibration_at' => 'date',
        'next_calibration_at' => 'date',
        'last_maintenance_at' => 'date',
        'next_maintenance_at' => 'date',
    ];

    public function maintenanceTasks()
    {
        return $this->hasMany(MaintenanceTask::class, 'equipment_id');
    }
}
