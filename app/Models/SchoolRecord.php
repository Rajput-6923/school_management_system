<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SchoolRecord extends Model
{
    protected $fillable = [
        'record_type',
        'record_id',
        'payload',
    ];

    protected function casts(): array
    {
        return [
            'payload' => 'array',
        ];
    }
}
