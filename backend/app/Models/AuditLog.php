<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'action',
        'model',
        'model_id',
        'changes',
    ];

    protected $casts = [
        'changes' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public static function log($userId, $action, $model, $modelId, $changes = null)
    {
        return self::create([
            'user_id' => $userId,
            'action' => $action,
            'model' => $model,
            'model_id' => $modelId,
            'changes' => $changes,
        ]);
    }
}
