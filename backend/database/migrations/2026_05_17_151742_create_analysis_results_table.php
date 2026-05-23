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
        Schema::create('analysis_results', function (Blueprint $table) {
            $table->id();
            $table->foreignId('analysis_id')->constrained()->onDelete('cascade');
            $table->string('parameter'); // pH, Zinc, Sulfate, etc.
            $table->string('value'); // Kept as string to support things like "< 0.01" or decimals
            $table->string('unit')->nullable();
            $table->boolean('is_anomaly')->default(false);
            $table->string('reference_min')->nullable();
            $table->string('reference_max')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('analysis_results');
    }
};
