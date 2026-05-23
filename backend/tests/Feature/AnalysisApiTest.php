<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use App\Models\Sample;
use App\Models\Analysis;
use Laravel\Sanctum\Sanctum;

class AnalysisApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_list_analyses()
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $sample = Sample::create([
            'code' => 'SMP-12345',
            'type' => 'Eau Potable',
            'status' => 'received',
        ]);

        $analysis = Analysis::create([
            'sample_id' => $sample->id,
            'user_id' => $user->id,
            'parameters' => ['pH', 'Turbidité'],
            'status' => 'En cours',
        ]);

        $response = $this->getJson('/api/analyses');

        $response->assertStatus(200);
        $response->assertJsonFragment([
            'id' => $analysis->id,
            'status' => 'En cours',
        ]);
    }

    public function test_can_validate_analysis()
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $sample = Sample::create([
            'code' => 'SMP-54321',
            'type' => 'Eau Potable',
            'status' => 'received',
        ]);

        $analysis = Analysis::create([
            'sample_id' => $sample->id,
            'user_id' => $user->id,
            'parameters' => ['pH', 'Turbidité'],
            'status' => 'En cours',
        ]);

        $payload = [
            'results' => [
                [
                    'parameter' => 'pH',
                    'value' => '7.4',
                    'unit' => '',
                    'reference_min' => 6.0,
                    'reference_max' => 9.0,
                ],
                [
                    'parameter' => 'Turbidité',
                    'value' => '2.1',
                    'unit' => 'NTU',
                    'reference_min' => 0,
                    'reference_max' => 5.0,
                ],
            ]
        ];

        $response = $this->postJson("/api/analyses/{$analysis->id}/validate", $payload);

        $response->assertStatus(200);
        $this->assertDatabaseHas('analyses', [
            'id' => $analysis->id,
            'status' => 'Validé',
            'risk_score' => 0,
        ]);

        $this->assertDatabaseHas('analysis_results', [
            'analysis_id' => $analysis->id,
            'parameter' => 'pH',
            'value' => '7.4',
            'is_anomaly' => false,
        ]);
    }

    public function test_can_delete_analysis()
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $sample = Sample::create([
            'code' => 'SMP-99999',
            'type' => 'Eau Potable',
            'status' => 'received',
        ]);

        $analysis = Analysis::create([
            'sample_id' => $sample->id,
            'user_id' => $user->id,
            'parameters' => ['pH'],
            'status' => 'En cours',
        ]);

        $response = $this->deleteJson("/api/analyses/{$analysis->id}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('analyses', [
            'id' => $analysis->id,
        ]);
    }
}
