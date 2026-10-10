<?php

use App\Http\Controllers\SchoolApiController;
use Illuminate\Support\Facades\Route;

Route::prefix('api')->group(function (): void {
    Route::get('/health', [SchoolApiController::class, 'health']);
    Route::get('/csrf-cookie', fn () => response()->noContent());
    Route::post('/auth/login', [SchoolApiController::class, 'login'])->middleware('throttle:10,15');

    Route::middleware('auth')->group(function (): void {
        Route::post('/auth/logout', [SchoolApiController::class, 'logout']);
        Route::get('/auth/me', [SchoolApiController::class, 'me']);
        Route::get('/data', [SchoolApiController::class, 'snapshot']);
        Route::post('/data/import', [SchoolApiController::class, 'import']);
        Route::post('/data/migrate-local-storage', [SchoolApiController::class, 'migrateLocalStorage']);

        Route::post('/finance/invoices/{id}/payments', [SchoolApiController::class, 'addPayment']);
        Route::patch('/finance/notices/{id}/pin', [SchoolApiController::class, 'toggleNoticePin']);
        Route::put('/finance/settings', [SchoolApiController::class, 'updateSettings']);
        Route::put('/academic/{resource}', [SchoolApiController::class, 'saveCollection'])
            ->whereIn('resource', ['attendance', 'results']);

        Route::get('/{group}/{resource}', [SchoolApiController::class, 'index'])
            ->whereIn('group', ['people', 'academic', 'finance']);
        Route::post('/{group}/{resource}', [SchoolApiController::class, 'store'])
            ->whereIn('group', ['people', 'academic', 'finance']);
        Route::put('/{group}/{resource}/{id}', [SchoolApiController::class, 'update'])
            ->whereIn('group', ['people', 'academic', 'finance']);
        Route::delete('/{group}/{resource}/{id}', [SchoolApiController::class, 'destroy'])
            ->whereIn('group', ['people', 'academic', 'finance']);
    });
});

Route::get('/', function () {
    return view('welcome');
});
