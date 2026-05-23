<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AnalysisResult extends Model
{
    protected $fillable = [
        'analysis_id',
        'parameter',
        'value',
        'unit',
        'is_anomaly',
        'reference_min',
        'reference_max',
    ];

    protected $casts = [
        'is_anomaly' => 'boolean',
    ];

    public function analysis()
    {
        return $this->belongsTo(Analysis::class);
    }
}
