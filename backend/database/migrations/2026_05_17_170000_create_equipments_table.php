<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('equipments', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('model');
            $table->string('serial_number')->unique();
            $table->string('status')->default('Actif'); // Actif, En maintenance, En étalonnage, Inactif
            $table->date('last_calibration_at')->nullable();
            $table->date('next_calibration_at')->nullable();
            $table->date('last_maintenance_at')->nullable();
            $table->date('next_maintenance_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('equipments');
    }
};
