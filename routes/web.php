<?php

use App\Http\Controllers\AuditTrailController;
use App\Http\Controllers\DistributionController;
use App\Http\Controllers\EmvRecordController;
use App\Http\Controllers\ForcePinController;
use App\Http\Controllers\GranteeListController;
use App\Http\Controllers\InquiryController;
use App\Http\Controllers\LibraryDirectoryController;
use App\Http\Controllers\LiftingController;
use App\Http\Controllers\LockingController;
use App\Http\Controllers\OpeningController;
use App\Http\Controllers\OtcWithdrawalController;
use App\Http\Controllers\PayrollController;
use App\Http\Controllers\ReplacementController;
use App\Http\Controllers\RolePermissionController;
use App\Http\Controllers\SSOController;
use App\Http\Controllers\TransferOfFundController;
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
    Route::get('/pending-approval', [RolePermissionController::class, 'pendingApproval'])->name('pending.approval');

    Route::get('/dashboard', [EmvRecordController::class, 'dashboard'])->name('dashboard');
    Route::get('/inquiry', [EmvRecordController::class, 'dashboard'])->name('inquiry');
    Route::get('/directory', [EmvRecordController::class, 'dashboard'])->name('directory');
    Route::get('/libraries/directory', [EmvRecordController::class, 'dashboard']);
    Route::get('/drn', [EmvRecordController::class, 'dashboard'])->name('drn');
    Route::get('/libraries/drn', [EmvRecordController::class, 'dashboard']);
    Route::get('/grantee-list', [EmvRecordController::class, 'dashboard'])->name('grantee-list');
    Route::get('/grantee', [EmvRecordController::class, 'dashboard']);
    Route::get('/emv-database', [EmvRecordController::class, 'dashboard'])->name('emv-database');
    Route::get('/payroll', [EmvRecordController::class, 'dashboard'])->name('payroll');
    Route::get('/emv-payroll', [EmvRecordController::class, 'dashboard']);
    Route::get('/opening', [EmvRecordController::class, 'dashboard'])->name('opening');
    Route::get('/distribution', [EmvRecordController::class, 'dashboard'])->name('distribution');
    Route::get('/otc-withdrawal', [EmvRecordController::class, 'dashboard'])->name('otc-withdrawal');
    Route::get('/replacement', [EmvRecordController::class, 'dashboard'])->name('replacement');
    Route::get('/transfer-of-fund', [EmvRecordController::class, 'dashboard'])->name('transfer-of-fund');
    Route::get('/force-pin', [EmvRecordController::class, 'dashboard'])->name('force-pin');
    Route::get('/locking', [EmvRecordController::class, 'dashboard'])->name('locking');
    Route::get('/lifting', [EmvRecordController::class, 'dashboard'])->name('lifting');
    Route::get('/users', [EmvRecordController::class, 'dashboard'])->name('users');
    Route::get('/roles-and-permissions', [EmvRecordController::class, 'dashboard'])->name('roles-and-permissions');
    Route::get('/roles-permissions', [EmvRecordController::class, 'dashboard']);
    Route::get('/audit-trails', [EmvRecordController::class, 'dashboard'])->name('audit-trails');
    Route::get('/audit-trail', [EmvRecordController::class, 'dashboard']);
    Route::get('/aging', [EmvRecordController::class, 'dashboard'])->name('aging');
    Route::get('/overpayment', [EmvRecordController::class, 'dashboard'])->name('overpayment');
    Route::get('/data', [EmvRecordController::class, 'dashboard'])->name('data');

    Route::get('/roles-permissions/data', [RolePermissionController::class, 'index'])->name('roles-permissions.data');
    Route::post('/roles-permissions/roles', [RolePermissionController::class, 'storeRole'])->name('roles-permissions.roles.store');
    Route::post('/roles-permissions/roles/{id}', [RolePermissionController::class, 'updateRole'])->name('roles-permissions.roles.update');
    Route::post('/roles-permissions/users/{id}/approve', [RolePermissionController::class, 'approveUser'])->name('roles-permissions.users.approve');
    Route::post('/roles-permissions/users/{id}/role', [RolePermissionController::class, 'updateUserRole'])->name('roles-permissions.users.role');

    Route::get('/audit-trails/search', [AuditTrailController::class, 'search'])->name('audit-trails.search');
    Route::get('/audit-trails/export', [AuditTrailController::class, 'export'])->name('audit-trails.export');

    Route::get('/libraries/directory/data', [LibraryDirectoryController::class, 'index'])->name('libraries.directory.data');
    Route::post('/libraries/directory/municipalities/store', [LibraryDirectoryController::class, 'storeMunicipality'])->name('libraries.directory.municipalities.store');
    Route::post('/libraries/directory/municipalities/{id}/destroy', [LibraryDirectoryController::class, 'destroyMunicipality'])->name('libraries.directory.municipalities.destroy');
    Route::post('/libraries/directory/branches/store', [LibraryDirectoryController::class, 'storeBranch'])->name('libraries.directory.branches.store');
    Route::post('/libraries/directory/branches/{id}/destroy', [LibraryDirectoryController::class, 'destroyBranch'])->name('libraries.directory.branches.destroy');

    Route::get('/libraries/drn/data', [LibraryDirectoryController::class, 'drnIndex'])->name('libraries.drn.data');
    Route::post('/libraries/drn/store', [LibraryDirectoryController::class, 'storeDrn'])->name('libraries.drn.store');
    Route::post('/libraries/drn/{id}/destroy', [LibraryDirectoryController::class, 'destroyDrn'])->name('libraries.drn.destroy');
    Route::post('/libraries/drn/import', [LibraryDirectoryController::class, 'importDrn'])->name('libraries.drn.import');
    Route::post('/libraries/drn/assign-for-print', [LibraryDirectoryController::class, 'assignDrnForPrint'])->name('libraries.drn.assign-for-print');
    Route::post('/libraries/drn/reference-prefix', [LibraryDirectoryController::class, 'updateSecondCopyRefPrefix'])->name('libraries.drn.reference-prefix');

    Route::get('/emv-records/import', fn () => redirect()->route('emv-database'));
    Route::post('/emv-records/import', [EmvRecordController::class, 'import'])->name('emv-records.import');
    Route::get('/grantees/import', fn () => redirect()->route('grantee-list'));
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
    Route::get('/inquiry/display-fields', [InquiryController::class, 'displayFields'])->name('inquiry.display-fields');
    Route::post('/inquiry/display-fields', [InquiryController::class, 'saveDisplayFields'])->name('inquiry.display-fields.save');
    Route::post('/inquiry/add-request', [InquiryController::class, 'addRequest'])->name('inquiry.add-request');
    Route::get('/inquiry/household-requests', [InquiryController::class, 'householdRequests'])->name('inquiry.household-requests');
    Route::get('/module-counts', [InquiryController::class, 'moduleCounts'])->name('module-counts');
    Route::get('/reference-counts', [InquiryController::class, 'referenceCounts'])->name('reference-counts');

    Route::get('/opening/search', [OpeningController::class, 'search'])->name('opening.search');
    Route::get('/opening/export', [OpeningController::class, 'export'])->name('opening.export');
    Route::get('/opening/print', [OpeningController::class, 'print'])->name('opening.print');
    Route::post('/opening/store', [OpeningController::class, 'store'])->name('opening.store');
    Route::delete('/opening/{id}', [OpeningController::class, 'destroy'])->name('opening.destroy');
    Route::post('/opening/{id}/destroy', [OpeningController::class, 'destroy']);

    Route::get('/distribution/search', [DistributionController::class, 'search'])->name('distribution.search');
    Route::get('/distribution/export', [DistributionController::class, 'export'])->name('distribution.export');
    Route::get('/distribution/print', [DistributionController::class, 'print'])->name('distribution.print');
    Route::post('/distribution/store', [DistributionController::class, 'store'])->name('distribution.store');
    Route::delete('/distribution/{id}', [DistributionController::class, 'destroy'])->name('distribution.destroy');
    Route::post('/distribution/{id}/destroy', [DistributionController::class, 'destroy']);

    Route::get('/otc-withdrawal/search', [OtcWithdrawalController::class, 'search'])->name('otc-withdrawal.search');
    Route::get('/otc-withdrawal/export', [OtcWithdrawalController::class, 'export'])->name('otc-withdrawal.export');
    Route::get('/otc-withdrawal/print', [OtcWithdrawalController::class, 'print'])->name('otc-withdrawal.print');
    Route::post('/otc-withdrawal/store', [OtcWithdrawalController::class, 'store'])->name('otc-withdrawal.store');
    Route::delete('/otc-withdrawal/{id}', [OtcWithdrawalController::class, 'destroy'])->name('otc-withdrawal.destroy');
    Route::post('/otc-withdrawal/{id}/destroy', [OtcWithdrawalController::class, 'destroy']);

    Route::get('/replacement/search', [ReplacementController::class, 'search'])->name('replacement.search');
    Route::get('/replacement/export', [ReplacementController::class, 'export'])->name('replacement.export');
    Route::get('/replacement/print', [ReplacementController::class, 'print'])->name('replacement.print');
    Route::post('/replacement/store', [ReplacementController::class, 'store'])->name('replacement.store');
    Route::delete('/replacement/{id}', [ReplacementController::class, 'destroy'])->name('replacement.destroy');
    Route::post('/replacement/{id}/destroy', [ReplacementController::class, 'destroy']);

    Route::get('/transfer-of-fund/search', [TransferOfFundController::class, 'search'])->name('transfer-of-fund.search');
    Route::get('/transfer-of-fund/export', [TransferOfFundController::class, 'export'])->name('transfer-of-fund.export');
    Route::get('/transfer-of-fund/print', [TransferOfFundController::class, 'print'])->name('transfer-of-fund.print');
    Route::post('/transfer-of-fund/store', [TransferOfFundController::class, 'store'])->name('transfer-of-fund.store');
    Route::delete('/transfer-of-fund/{id}', [TransferOfFundController::class, 'destroy'])->name('transfer-of-fund.destroy');
    Route::post('/transfer-of-fund/{id}/destroy', [TransferOfFundController::class, 'destroy']);

    Route::get('/force-pin/search', [ForcePinController::class, 'search'])->name('force-pin.search');
    Route::get('/force-pin/export', [ForcePinController::class, 'export'])->name('force-pin.export');
    Route::get('/force-pin/print', [ForcePinController::class, 'print'])->name('force-pin.print');
    Route::post('/force-pin/store', [ForcePinController::class, 'store'])->name('force-pin.store');
    Route::delete('/force-pin/{id}', [ForcePinController::class, 'destroy'])->name('force-pin.destroy');
    Route::post('/force-pin/{id}/destroy', [ForcePinController::class, 'destroy']);

    Route::get('/locking/search', [LockingController::class, 'search'])->name('locking.search');
    Route::get('/locking/export', [LockingController::class, 'export'])->name('locking.export');
    Route::get('/locking/print', [LockingController::class, 'print'])->name('locking.print');
    Route::post('/locking/store', [LockingController::class, 'store'])->name('locking.store');
    Route::delete('/locking/{id}', [LockingController::class, 'destroy'])->name('locking.destroy');
    Route::post('/locking/{id}/destroy', [LockingController::class, 'destroy']);

    Route::get('/lifting/search', [LiftingController::class, 'search'])->name('lifting.search');
    Route::get('/lifting/export', [LiftingController::class, 'export'])->name('lifting.export');
    Route::get('/lifting/print', [LiftingController::class, 'print'])->name('lifting.print');
    Route::post('/lifting/store', [LiftingController::class, 'store'])->name('lifting.store');
    Route::delete('/lifting/{id}', [LiftingController::class, 'destroy'])->name('lifting.destroy');
    Route::post('/lifting/{id}/destroy', [LiftingController::class, 'destroy']);
});

