<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Deviation extends Model
{
    use HasFactory;

    protected $fillable = [
        'sample_id',
        'type',
        'parameter',
        'expected_limit',
        'actual_value',
        'status',
        'comments',
        'logged_by',
        'closed_by',
        'signature_data',
    ];

    public function sample()
    {
        return $this->belongsTo(Sample::class);
    }

    public function loggedBy()
    {
        return $this->belongsTo(User::class, 'logged_by');
    }

    public function closedBy()
    {
        return $this->belongsTo(User::class, 'closed_by');
    }
}
