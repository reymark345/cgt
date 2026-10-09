<?php

use App\Http\Controllers\EmvRecordController;
use App\Http\Controllers\GranteeListController;
use App\Http\Controllers\InquiryController;
use App\Http\Controllers\OpeningController;
use App\Http\Controllers\PayrollController;
use App\Http\Controllers\SSOController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Landing');
})->name('landing');

Route::get('/login', function () {
    return Inertia::render('Login');
})->name('login');

Route::get('/login-sso', [SSOController::class, 'login'])->name('sso.login');
Route::get('/login-sso/callback', [SSOController::class, 'callback'])->name('sso.callback');
Route::get('/sso/login', [SSOController::class, 'login']);
Route::get('/sso/callback', [SSOController::class, 'callback']);
Route::post('/sso/logout', [SSOController::class, 'logout'])->name('sso.logout');

Route::middleware('sso.auth')->group(function () {
    Route::get('/dashboard', [EmvRecordController::class, 'dashboard'])->name('dashboard');
    Route::get('/emv-records/import', fn () => redirect()->route('dashboard'));
    Route::post('/emv-records/import', [EmvRecordController::class, 'import'])->name('emv-records.import');
    Route::get('/grantees/import', fn () => redirect()->route('dashboard'));
    Route::post('/grantees/import', [GranteeListController::class, 'import'])->name('grantees.import');
    Route::get('/grantees/import/{id}/status', [GranteeListController::class, 'status'])->name('grantees.import.status');
    Route::post('/grantees/import/{id}/process-batch', [GranteeListController::class, 'processBatch'])->name('grantees.import.batch');
    Route::get('/grantees/search', [GranteeListController::class, 'search'])->name('grantees.search');
    Route::get('/grantees/export', [GranteeListController::class, 'export'])->name('grantees.export');
    Route::get('/emv-database/search', [EmvRecordController::class, 'search'])->name('emv-database.search');
    Route::get('/emv-database/export', [EmvRecordController::class, 'export'])->name('emv-database.export');
    Route::post('/emv-database/import', [EmvRecordController::class, 'import'])->name('emv-database.import');
    Route::get('/emv-database/import/{id}/status', [EmvRecordController::class, 'status'])->name('emv-database.import.status');
    Route::post('/emv-database/import/{id}/process-batch', [EmvRecordController::class, 'processBatch'])->name('emv-database.import.batch');

    Route::post('/payroll/import', [PayrollController::class, 'import'])->name('payroll.import');
    Route::get('/payroll/import/{id}/status', [PayrollController::class, 'status'])->name('payroll.import.status');
    Route::post('/payroll/import/{id}/process-batch', [PayrollController::class, 'processBatch'])->name('payroll.import.batch');
    Route::get('/payroll/search', [PayrollController::class, 'search'])->name('payroll.search');
    Route::get('/payroll/export', [PayrollController::class, 'export'])->name('payroll.export');
    Route::post('/payroll/{id}/update', [PayrollController::class, 'update'])->name('payroll.update');

    Route::get('/inquiry/search', [InquiryController::class, 'search'])->name('inquiry.search');
    Route::get('/inquiry/samples', [InquiryController::class, 'samples'])->name('inquiry.samples');
    Route::get('/inquiry/request-options', [InquiryController::class, 'requestOptions'])->name('inquiry.request-options');
    Route::post('/inquiry/add-request', [InquiryController::class, 'addRequest'])->name('inquiry.add-request');
    Route::get('/inquiry/household-requests', [InquiryController::class, 'householdRequests'])->name('inquiry.household-requests');

    Route::get('/opening/search', [OpeningController::class, 'search'])->name('opening.search');
    Route::get('/opening/export', [OpeningController::class, 'export'])->name('opening.export');
    Route::get('/opening/print', [OpeningController::class, 'print'])->name('opening.print');
    Route::post('/opening/store', [OpeningController::class, 'store'])->name('opening.store');
    Route::delete('/opening/{id}', [OpeningController::class, 'destroy'])->name('opening.destroy');
    Route::post('/opening/{id}/destroy', [OpeningController::class, 'destroy']);
});

