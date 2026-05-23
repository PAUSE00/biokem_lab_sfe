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
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->string('action'); // e.g. 'CREATE', 'UPDATE', 'DELETE', 'VALIDATE', 'DOWNLOAD'
            $table->string('model')->nullable(); // e.g. 'Sample', 'Analysis', 'Equipment', 'StockItem'
            $table->unsignedBigInteger('model_id')->nullable();
            $table->json('changes')->nullable(); // JSON representation of changes or action details
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};
