<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\SampleController;
use App\Http\Controllers\API\AnalysisController;
use App\Http\Controllers\API\UserController;
use App\Http\Controllers\API\ReportController;
use App\Http\Controllers\API\NotificationController;
use App\Http\Controllers\API\EquipmentController;
use App\Http\Controllers\API\MaintenanceTaskController;
use App\Http\Controllers\API\StockController;
use App\Http\Controllers\API\AuditController;
use App\Http\Controllers\API\DashboardController;

Route::post('/auth/login', [AuthController::class, 'login']);
Route::get('/public/samples/{code}', [SampleController::class, 'publicTrack']);
Route::get('/public/reports/{id}/download', [ReportController::class, 'publicDownload']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
    
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    // API resource routes for Phase 1 & 3
    Route::post('samples/bulk-import', [SampleController::class, 'bulkImport']);
    Route::get('storage/occupancy', [SampleController::class, 'getStorageOccupancy']);
    Route::post('deviations/{id}/resolve', [SampleController::class, 'resolveDeviation']);
    Route::post('samples/{id}/transfer', [SampleController::class, 'logTransfer']);
    Route::post('samples/{id}/aliquots', [SampleController::class, 'createAliquots']);
    Route::apiResource('samples', SampleController::class);
    Route::apiResource('analyses', AnalysisController::class);
    Route::post('analyses/{id}/validate', [AnalysisController::class, 'validateAnalysis']);
    Route::apiResource('users', UserController::class);
    Route::get('reports/{id}/download', [ReportController::class, 'download']);
    Route::get('notifications', [NotificationController::class, 'index']);
    Route::patch('notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    
    Route::apiResource('equipments', EquipmentController::class);
    Route::apiResource('maintenance-tasks', MaintenanceTaskController::class);
    Route::apiResource('stock', StockController::class);
    Route::get('audit-logs', [AuditController::class, 'index']);
    Route::get('audit-logs/export-pdf', [AuditController::class, 'exportPdf']);
    
    Route::get('dashboard/kpis', [DashboardController::class, 'getKpis']);
    Route::get('dashboard/charts', [DashboardController::class, 'getCharts']);
});


