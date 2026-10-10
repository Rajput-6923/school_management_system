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
        Schema::create('school_records', function (Blueprint $table) {
            $table->id();
            $table->string('record_type', 30);
            $table->string('record_id', 100);
            $table->json('payload');
            $table->timestamps();

            $table->unique(['record_type', 'record_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('school_records');
    }
};
