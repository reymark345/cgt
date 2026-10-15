<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class LbpBranchDirectory extends Model
{
    use HasFactory;

    protected $table = 'lbp_branch_directories';

    protected $fillable = [
        'branch',
        'addressee_name',
        'addressee_position',
        'addressee_branch',
        'address_1',
        'address_2',
    ];

    /**
     * Ensure the lbp_branch_directories table exists and is seeded with default LBP branch directory records.
     */
    public static function ensureTableExists(): void
    {
        if (! Schema::hasTable('lbp_branch_directories')) {
            Schema::create('lbp_branch_directories', function (Blueprint $table) {
                $table->id();
                $table->string('branch')->index();
                $table->string('addressee_name')->nullable();
                $table->string('addressee_position')->nullable();
                $table->string('addressee_branch')->nullable();
                $table->string('address_1')->nullable();
                $table->string('address_2')->nullable();
                $table->timestamps();
            });
        }

        if (static::query()->count() === 0) {
            static::seedDefaults();
        }
    }

    /**
     * Seed default Caraga LBP Branch Directory records matching the official directory table.
     */
    public static function seedDefaults(): void
    {
        $now = now();
        $rows = [
            [
                'branch' => 'Butuan',
                'addressee_name' => 'MS. EMELITA I. ESCALANTE',
                'addressee_position' => 'Branch Head',
                'addressee_branch' => 'Land Bank of the Philippines - Butuan Branch',
                'address_1' => 'Ong Hoc Building, Montilla Blvd. Cor. P. Burgoz St.,',
                'address_2' => 'Butuan City',
            ],
            [
                'branch' => 'Butuan - E. Luna',
                'addressee_name' => 'MR. CARLITO L. DAING',
                'addressee_position' => 'Branch Head',
                'addressee_branch' => 'Land Bank of the Philippines - Butuan - E. Luna Branch',
                'address_1' => 'Ground Floor, Saint Joseph Parish Hall, E. Luna Street, Sikatuna,',
                'address_2' => 'Butuan City',
            ],
            [
                'branch' => 'Cabadbaran',
                'addressee_name' => 'MS. RUBY M. CULTURA',
                'addressee_position' => 'Branch Head',
                'addressee_branch' => 'Land Bank of the Philippines - Cabadbaran Branch',
                'address_1' => 'Chang Building Atega Cor. Asis Streets,',
                'address_2' => 'Cabadbaran City',
            ],
            [
                'branch' => 'Bayugan',
                'addressee_name' => 'MS. MARY JOY A. TORCENDE',
                'addressee_position' => 'Branch Head',
                'addressee_branch' => 'Land Bank of the Philippines - Bayugan Branch',
                'address_1' => 'Dy Building, National Highway, Brgy. Taglatawan,',
                'address_2' => 'Bayugan City',
            ],
            [
                'branch' => 'San Francisco',
                'addressee_name' => 'MS. JULIET T. ARIÑO',
                'addressee_position' => 'Branch Head',
                'addressee_branch' => 'Land Bank of the Philippines - San Francisco Branch',
                'address_1' => 'San Francisco Public Market Mall, Center Island Street,',
                'address_2' => 'San Francisco, Agusan Del Sur',
            ],
            [
                'branch' => 'Bunawan',
                'addressee_name' => 'MR. ADRIAN LLOYD O. TAN',
                'addressee_position' => 'Branch Head',
                'addressee_branch' => 'Land Bank of the Philippines - Bunawan Branch',
                'address_1' => 'Municipal Compound, Purok 4, Brgy. San Teodoro,',
                'address_2' => 'Bunawan, Agusan Del Sur',
            ],
            [
                'branch' => 'Dinagat Islands',
                'addressee_name' => 'MS. MARIA CELESTE F. ADVINCULA',
                'addressee_position' => 'Branch Head',
                'addressee_branch' => 'Land Bank of the Philippines - Dinagat Branch',
                'address_1' => 'R.R. Buray Ave. Cor H.Tovar St. Poblacion,',
                'address_2' => 'San Jose, Dinagat Islands',
            ],
            [
                'branch' => 'Surigao',
                'addressee_name' => 'MS. ABIGAIL A. MALUBAG',
                'addressee_position' => 'Branch Head',
                'addressee_branch' => 'Land Bank of the Philippines - Surigao Branch',
                'address_1' => 'Surigao City Hall Compound, Borromeo Street,',
                'address_2' => 'Surigao City',
            ],
            [
                'branch' => 'Surigao - Luna',
                'addressee_name' => 'MR. CHARLITO D. ARQUION',
                'addressee_position' => 'Branch Head',
                'addressee_branch' => 'Land Bank of the Philippines - Surigao - Luna Branch',
                'address_1' => 'Parkway Building, Brgy. Luna,',
                'address_2' => 'Surigao City',
            ],
            [
                'branch' => 'Claver',
                'addressee_name' => 'MR. RENEBOY L. BONITA',
                'addressee_position' => 'Branch Head',
                'addressee_branch' => 'Land Bank of the Philippines - Claver Branch',
                'address_1' => 'National Highway, Barangay Ladgaron,',
                'address_2' => 'Claver, Surigao Del Norte',
            ],
            [
                'branch' => 'Bislig',
                'addressee_name' => 'MS. CONCEPCION ROXAN U. DIADULA',
                'addressee_position' => 'Branch Head',
                'addressee_branch' => 'Land Bank of the Philippines - Bislig Branch',
                'address_1' => 'Landbank Building F. Clar Street, Mangagoy,',
                'address_2' => 'Bislig City',
            ],
            [
                'branch' => 'Tandag',
                'addressee_name' => 'MS. ELVIRA C. TAN',
                'addressee_position' => 'Branch Head',
                'addressee_branch' => 'Land Bank of the Philippines - Tandag Branch',
                'address_1' => 'Bautista Building, Donasco Street,',
                'address_2' => 'Tandag City',
            ],
        ];

        $insertData = array_map(fn ($row) => array_merge($row, [
            'created_at' => $now,
            'updated_at' => $now,
        ]), $rows);

        static::query()->insert($insertData);
    }
}

