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
        Schema::create('samples', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('qr_code')->unique()->nullable();
            $table->foreignId('client_id')->nullable()->constrained('users')->onDelete('set null'); // Assuming clients are in users table for now
            $table->foreignId('technician_id')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('parent_id')->nullable()->constrained('samples')->onDelete('cascade');
            $table->string('temp_condition')->nullable();
            $table->decimal('temp_value', 5, 2)->nullable();
            $table->timestamp('sampled_at')->nullable();
            $table->string('status')->default('received'); // received, assigned, in_progress, completed
            $table->string('type')->default('Eau Potable'); // Eau Potable, Eau Résiduaire, Sol / Terre, Produit Chimique, Hydrocarbure, Alimentaire, Autre
            $table->string('priority')->default('Normale'); // Basse, Normale, Urgente, Critique
            $table->string('storage_location')->nullable(); // Réfrigérateur A, Salle 1, Zone de Stockage Température Ambiante, etc.
            $table->string('volume')->nullable(); // e.g. "250 ml", "1 L"
            $table->text('description')->nullable();
            $table->timestamp('received_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('samples');
    }
};
