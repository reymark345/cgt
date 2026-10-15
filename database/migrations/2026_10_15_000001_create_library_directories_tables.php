<?php

use App\Models\LbpBranchDirectory;
use App\Models\LbpCoveredMunicipality;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        LbpCoveredMunicipality::ensureTableExists();
        LbpBranchDirectory::ensureTableExists();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('lbp_covered_municipalities');
        Schema::dropIfExists('lbp_branch_directories');
    }
};

