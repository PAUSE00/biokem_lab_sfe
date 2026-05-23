<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Analysis extends Model
{
    protected $fillable = [
        'sample_id',
        'user_id',
        'parameters',
        'status',
        'validated_at',
        'risk_score',
        'ai_recommendation',
        'metadata',
    ];

    protected $casts = [
        'parameters' => 'array',
        'validated_at' => 'datetime',
        'metadata' => 'array',
    ];

    public function sample()
    {
        return $this->belongsTo(Sample::class);
    }

    public function technician()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function results()
    {
        return $this->hasMany(AnalysisResult::class);
    }
}
