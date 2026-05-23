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
        Schema::create('maintenance_tasks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('equipment_id')->constrained('equipments')->onDelete('cascade');
            $table->string('type'); // Maintenance préventive, Maintenance corrective, Étalonnage / Calibration
            $table->text('description');
            $table->date('scheduled_at');
            $table->date('completed_at')->nullable();
            $table->string('status')->default('Planifié'); // Planifié, En cours, Terminé, Annulé
            $table->string('technician_name');
            $table->decimal('cost', 10, 2)->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('maintenance_tasks');
    }
};
