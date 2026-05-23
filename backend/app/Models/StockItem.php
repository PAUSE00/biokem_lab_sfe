<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StockItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'quantity',
        'unit',
        'threshold',
        'expiry_date',
        'supplier_name',
    ];

    protected $casts = [
        'quantity' => 'decimal:2',
        'threshold' => 'decimal:2',
        'expiry_date' => 'date',
    ];
}
