<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class LbpCoveredMunicipality extends Model
{
    use HasFactory;

    protected $table = 'lbp_covered_municipalities';

    protected $fillable = [
        'province',
        'municipality',
        'lbp_branch_id',
        'covered_lbp_branch',
    ];

    protected function casts(): array
    {
        return [
            'lbp_branch_id' => 'integer',
        ];
    }

    public function branchDirectory(): BelongsTo
    {
        return $this->belongsTo(LbpBranchDirectory::class, 'lbp_branch_id');
    }

    /**
     * Ensure the lbp_covered_municipalities table exists and is seeded with default Caraga data.
     */
    public static function ensureTableExists(): void
    {
        if (! Schema::hasTable('lbp_covered_municipalities')) {
            Schema::create('lbp_covered_municipalities', function (Blueprint $table) {
                $table->id();
                $table->string('province')->index();
                $table->string('municipality')->index();
                $table->unsignedBigInteger('lbp_branch_id')->nullable()->index();
                $table->string('covered_lbp_branch')->index();
                $table->timestamps();
            });
        }

        if (static::query()->count() === 0) {
            static::seedDefaults();
        }
    }

    /**
     * Seed default Caraga LBP Branch Covered Municipality records.
     */
    public static function seedDefaults(): void
    {
        $now = now();
        $rows = [
            // AGUSAN DEL NORTE
            ['province' => 'AGUSAN DEL NORTE', 'municipality' => 'BUENAVISTA', 'covered_lbp_branch' => 'Butuan'],
            ['province' => 'AGUSAN DEL NORTE', 'municipality' => 'CARMEN', 'covered_lbp_branch' => 'Butuan'],
            ['province' => 'AGUSAN DEL NORTE', 'municipality' => 'CITY OF BUTUAN', 'covered_lbp_branch' => 'Butuan - E. Luna'],
            ['province' => 'AGUSAN DEL NORTE', 'municipality' => 'CITY OF CABADBARAN', 'covered_lbp_branch' => 'Cabadbaran'],
            ['province' => 'AGUSAN DEL NORTE', 'municipality' => 'JABONGA', 'covered_lbp_branch' => 'Cabadbaran'],
            ['province' => 'AGUSAN DEL NORTE', 'municipality' => 'KITCHARAO', 'covered_lbp_branch' => 'Cabadbaran'],
            ['province' => 'AGUSAN DEL NORTE', 'municipality' => 'LAS NIEVES', 'covered_lbp_branch' => 'Butuan'],
            ['province' => 'AGUSAN DEL NORTE', 'municipality' => 'MAGALLANES', 'covered_lbp_branch' => 'Cabadbaran'],
            ['province' => 'AGUSAN DEL NORTE', 'municipality' => 'NASIPIT', 'covered_lbp_branch' => 'Butuan'],
            ['province' => 'AGUSAN DEL NORTE', 'municipality' => 'REMEDIOS T. ROMUALDEZ', 'covered_lbp_branch' => 'Cabadbaran'],
            ['province' => 'AGUSAN DEL NORTE', 'municipality' => 'SANTIAGO', 'covered_lbp_branch' => 'Cabadbaran'],
            ['province' => 'AGUSAN DEL NORTE', 'municipality' => 'TUBAY', 'covered_lbp_branch' => 'Cabadbaran'],

            // AGUSAN DEL SUR
            ['province' => 'AGUSAN DEL SUR', 'municipality' => 'BUNAWAN', 'covered_lbp_branch' => 'Bunawan'],
            ['province' => 'AGUSAN DEL SUR', 'municipality' => 'CITY OF BAYUGAN', 'covered_lbp_branch' => 'Bayugan'],
            ['province' => 'AGUSAN DEL SUR', 'municipality' => 'ESPERANZA', 'covered_lbp_branch' => 'Bayugan'],
            ['province' => 'AGUSAN DEL SUR', 'municipality' => 'LA PAZ', 'covered_lbp_branch' => 'San Francisco'],
            ['province' => 'AGUSAN DEL SUR', 'municipality' => 'LORETO', 'covered_lbp_branch' => 'Bunawan'],
            ['province' => 'AGUSAN DEL SUR', 'municipality' => 'PROSPERIDAD', 'covered_lbp_branch' => 'San Francisco'],
            ['province' => 'AGUSAN DEL SUR', 'municipality' => 'ROSARIO', 'covered_lbp_branch' => 'San Francisco'],
            ['province' => 'AGUSAN DEL SUR', 'municipality' => 'SAN FRANCISCO', 'covered_lbp_branch' => 'San Francisco'],
            ['province' => 'AGUSAN DEL SUR', 'municipality' => 'SAN LUIS', 'covered_lbp_branch' => 'San Francisco'],
            ['province' => 'AGUSAN DEL SUR', 'municipality' => 'SANTA JOSEFA', 'covered_lbp_branch' => 'Bunawan'],
            ['province' => 'AGUSAN DEL SUR', 'municipality' => 'SIBAGAT', 'covered_lbp_branch' => 'Bayugan'],
            ['province' => 'AGUSAN DEL SUR', 'municipality' => 'TALACOGON', 'covered_lbp_branch' => 'San Francisco'],
            ['province' => 'AGUSAN DEL SUR', 'municipality' => 'TRENTO', 'covered_lbp_branch' => 'Bunawan'],
            ['province' => 'AGUSAN DEL SUR', 'municipality' => 'VERUELA', 'covered_lbp_branch' => 'Bunawan'],

            // DINAGAT ISLANDS
            ['province' => 'DINAGAT ISLANDS', 'municipality' => 'BASILISA', 'covered_lbp_branch' => 'Dinagat Islands'],
            ['province' => 'DINAGAT ISLANDS', 'municipality' => 'CAGDIANAO', 'covered_lbp_branch' => 'Dinagat Islands'],
            ['province' => 'DINAGAT ISLANDS', 'municipality' => 'DINAGAT', 'covered_lbp_branch' => 'Dinagat Islands'],
            ['province' => 'DINAGAT ISLANDS', 'municipality' => 'LIBJO', 'covered_lbp_branch' => 'Dinagat Islands'],
            ['province' => 'DINAGAT ISLANDS', 'municipality' => 'LORETO', 'covered_lbp_branch' => 'Dinagat Islands'],
            ['province' => 'DINAGAT ISLANDS', 'municipality' => 'SAN JOSE', 'covered_lbp_branch' => 'Dinagat Islands'],
            ['province' => 'DINAGAT ISLANDS', 'municipality' => 'TUBAJON', 'covered_lbp_branch' => 'Dinagat Islands'],

            // SURIGAO DEL NORTE
            ['province' => 'SURIGAO DEL NORTE', 'municipality' => 'ALEGRIA', 'covered_lbp_branch' => 'Surigao - San Nicolas'],
            ['province' => 'SURIGAO DEL NORTE', 'municipality' => 'BACUAG', 'covered_lbp_branch' => 'Claver'],
            ['province' => 'SURIGAO DEL NORTE', 'municipality' => 'BURGOS', 'covered_lbp_branch' => 'Surigao'],
            ['province' => 'SURIGAO DEL NORTE', 'municipality' => 'CITY OF SURIGAO', 'covered_lbp_branch' => 'Surigao - San Nicolas'],
            ['province' => 'SURIGAO DEL NORTE', 'municipality' => 'CLAVER', 'covered_lbp_branch' => 'Claver'],
            ['province' => 'SURIGAO DEL NORTE', 'municipality' => 'DAPA', 'covered_lbp_branch' => 'Surigao'],
            ['province' => 'SURIGAO DEL NORTE', 'municipality' => 'DEL CARMEN', 'covered_lbp_branch' => 'Surigao'],
            ['province' => 'SURIGAO DEL NORTE', 'municipality' => 'GENERAL LUNA', 'covered_lbp_branch' => 'Surigao'],
            ['province' => 'SURIGAO DEL NORTE', 'municipality' => 'GIGAQUIT', 'covered_lbp_branch' => 'Claver'],
            ['province' => 'SURIGAO DEL NORTE', 'municipality' => 'MAINIT', 'covered_lbp_branch' => 'Surigao - San Nicolas'],
            ['province' => 'SURIGAO DEL NORTE', 'municipality' => 'MALIMONO', 'covered_lbp_branch' => 'Surigao'],
            ['province' => 'SURIGAO DEL NORTE', 'municipality' => 'PILAR', 'covered_lbp_branch' => 'Surigao'],
            ['province' => 'SURIGAO DEL NORTE', 'municipality' => 'PLACER', 'covered_lbp_branch' => 'Surigao - San Nicolas'],
            ['province' => 'SURIGAO DEL NORTE', 'municipality' => 'SAN BENITO', 'covered_lbp_branch' => 'Surigao'],
            ['province' => 'SURIGAO DEL NORTE', 'municipality' => 'SAN FRANCISCO', 'covered_lbp_branch' => 'Surigao'],
            ['province' => 'SURIGAO DEL NORTE', 'municipality' => 'SAN ISIDRO', 'covered_lbp_branch' => 'Surigao'],
            ['province' => 'SURIGAO DEL NORTE', 'municipality' => 'SANTA MONICA', 'covered_lbp_branch' => 'Surigao'],
            ['province' => 'SURIGAO DEL NORTE', 'municipality' => 'SISON', 'covered_lbp_branch' => 'Surigao'],
            ['province' => 'SURIGAO DEL NORTE', 'municipality' => 'SOCORRO', 'covered_lbp_branch' => 'Claver'],
            ['province' => 'SURIGAO DEL NORTE', 'municipality' => 'TAGANA-AN', 'covered_lbp_branch' => 'Surigao'],
            ['province' => 'SURIGAO DEL NORTE', 'municipality' => 'TUBOD', 'covered_lbp_branch' => 'Surigao - San Nicolas'],

            // SURIGAO DEL SUR
            ['province' => 'SURIGAO DEL SUR', 'municipality' => 'BAROBO', 'covered_lbp_branch' => 'San Francisco'],
            ['province' => 'SURIGAO DEL SUR', 'municipality' => 'BAYABAS', 'covered_lbp_branch' => 'Tandag'],
            ['province' => 'SURIGAO DEL SUR', 'municipality' => 'CAGWAIT', 'covered_lbp_branch' => 'Tandag'],
            ['province' => 'SURIGAO DEL SUR', 'municipality' => 'CANTILAN', 'covered_lbp_branch' => 'Tandag'],
            ['province' => 'SURIGAO DEL SUR', 'municipality' => 'CARMEN', 'covered_lbp_branch' => 'Tandag'],
            ['province' => 'SURIGAO DEL SUR', 'municipality' => 'CARRASCAL', 'covered_lbp_branch' => 'Tandag'],
            ['province' => 'SURIGAO DEL SUR', 'municipality' => 'CITY OF BISLIG', 'covered_lbp_branch' => 'Bislig'],
            ['province' => 'SURIGAO DEL SUR', 'municipality' => 'CITY OF TANDAG', 'covered_lbp_branch' => 'Tandag'],
            ['province' => 'SURIGAO DEL SUR', 'municipality' => 'CORTES', 'covered_lbp_branch' => 'Tandag'],
            ['province' => 'SURIGAO DEL SUR', 'municipality' => 'HINATUAN', 'covered_lbp_branch' => 'Bislig'],
            ['province' => 'SURIGAO DEL SUR', 'municipality' => 'LANUZA', 'covered_lbp_branch' => 'Tandag'],
            ['province' => 'SURIGAO DEL SUR', 'municipality' => 'LIANGA', 'covered_lbp_branch' => 'San Francisco'],
            ['province' => 'SURIGAO DEL SUR', 'municipality' => 'LINGIG', 'covered_lbp_branch' => 'Bislig'],
            ['province' => 'SURIGAO DEL SUR', 'municipality' => 'MADRID', 'covered_lbp_branch' => 'Tandag'],
            ['province' => 'SURIGAO DEL SUR', 'municipality' => 'MARIHATAG', 'covered_lbp_branch' => 'Tandag'],
            ['province' => 'SURIGAO DEL SUR', 'municipality' => 'SAN AGUSTIN', 'covered_lbp_branch' => 'San Francisco'],
            ['province' => 'SURIGAO DEL SUR', 'municipality' => 'SAN MIGUEL', 'covered_lbp_branch' => 'Tandag'],
            ['province' => 'SURIGAO DEL SUR', 'municipality' => 'TAGBINA', 'covered_lbp_branch' => 'Bislig'],
            ['province' => 'SURIGAO DEL SUR', 'municipality' => 'TAGO', 'covered_lbp_branch' => 'Tandag'],
        ];

        $insertData = array_map(fn ($row) => array_merge($row, [
            'created_at' => $now,
            'updated_at' => $now,
        ]), $rows);

        static::query()->insert($insertData);
    }
}

