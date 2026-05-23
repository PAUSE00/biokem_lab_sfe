<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Sample extends Model
{
    protected $fillable = [
        'code',
        'qr_code',
        'client_id',
        'technician_id',
        'parent_id',
        'status',
        'type',
        'priority',
        'storage_location',
        'volume',
        'temp_condition',
        'temp_value',
        'description',
        'sampled_at',
        'received_at',
    ];

    protected $casts = [
        'received_at' => 'datetime',
        'sampled_at' => 'datetime',
        'temp_value' => 'float',
    ];

    public function parent()
    {
        return $this->belongsTo(Sample::class, 'parent_id');
    }

    public function aliquots()
    {
        return $this->hasMany(Sample::class, 'parent_id');
    }

    public function client()
    {
        return $this->belongsTo(User::class, 'client_id');
    }

    public function technician()
    {
        return $this->belongsTo(User::class, 'technician_id');
    }

    public function analyses()
    {
        return $this->hasMany(Analysis::class);
    }

    public function deviations()
    {
        return $this->hasMany(Deviation::class);
    }

    public function getCustodyTimeline()
    {
        $analysisIds = $this->analyses()->pluck('id')->toArray();

        return \App\Models\AuditLog::with('user')
            ->where(function($query) use ($analysisIds) {
                $query->where(function($q) {
                    $q->where('model', 'Sample')
                      ->where('model_id', $this->id);
                });
                if (!empty($analysisIds)) {
                    $query->orWhere(function($q) use ($analysisIds) {
                        $q->where('model', 'Analysis')
                          ->whereIn('model_id', $analysisIds);
                    });
                }
            })
            ->orderBy('created_at', 'asc')
            ->get();
    }
}
