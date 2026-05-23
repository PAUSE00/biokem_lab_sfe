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
        Schema::create('analyses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sample_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade'); // The technician who performed the analysis
            $table->json('parameters')->nullable(); // Optional, if we want to store raw parameters here too
            $table->string('status')->default('pending'); // pending, validated, rejected
            $table->timestamp('validated_at')->nullable();
            $table->integer('risk_score')->nullable();
            $table->text('ai_recommendation')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('analyses');
    }
};
