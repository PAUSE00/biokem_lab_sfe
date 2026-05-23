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
        Schema::create('deviations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sample_id')->constrained('samples')->onDelete('cascade');
            $table->string('type'); // TEMPERATURE_EXCURSION, VOLUME_ANOMALY, etc.
            $table->string('parameter'); // temp_value, volume, etc.
            $table->string('expected_limit');
            $table->string('actual_value');
            $table->string('status')->default('OPEN'); // OPEN, RESOLVED
            $table->text('comments')->nullable();
            $table->foreignId('logged_by')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('closed_by')->nullable()->constrained('users')->onDelete('set null');
            $table->mediumText('signature_data')->nullable(); // closing signature base64 image
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('deviations');
    }
};
