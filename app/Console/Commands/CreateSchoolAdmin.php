<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Str;

class CreateSchoolAdmin extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'school:create-admin';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create a school administrator account';

    public function handle(): int
    {
        $name = trim($this->ask('Administrator full name'));
        $email = Str::lower(trim($this->ask('Administrator email')));
        $password = (string) $this->secret('Administrator password (at least 12 characters)');
        $confirmation = (string) $this->secret('Confirm administrator password');

        if ($name === '' || ! filter_var($email, FILTER_VALIDATE_EMAIL) || mb_strlen($password) < 12 || $password !== $confirmation) {
            $this->error('A name, valid email, matching passwords, and a password of at least 12 characters are required.');

            return self::FAILURE;
        }

        if (User::query()->where('email', $email)->exists()) {
            $this->error('An account with that email already exists.');

            return self::FAILURE;
        }

        User::query()->create([
            'name' => $name,
            'email' => $email,
            'password' => $password,
            'role' => 'Admin',
            'is_active' => true,
        ]);

        $this->info('Administrator account created.');

        return self::SUCCESS;
    }
}
