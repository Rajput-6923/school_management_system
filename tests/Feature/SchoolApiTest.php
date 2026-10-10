<?php

use App\Models\SchoolRecord;
use App\Models\User;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;

uses(LazilyRefreshDatabase::class);

test('the API csrf bootstrap endpoint provides Laravel CSRF protection', function () {
    $response = $this->get('/api/csrf-cookie');

    $response->assertNoContent()
        ->assertCookie('XSRF-TOKEN');
});

test('guests cannot load the school snapshot', function () {
    $response = $this->getJson('/api/data');

    $response->assertUnauthorized();
});

test('valid credentials create a Laravel session for the frontend', function () {
    $user = User::factory()->create([
        'name' => 'School Administrator',
        'email' => 'admin@example.test',
        'password' => 'A-long-password-123',
        'role' => 'Admin',
    ]);

    $response = $this->postJson('/api/auth/login', [
        'email' => 'ADMIN@example.test',
        'password' => 'A-long-password-123',
    ]);

    $response->assertOk()
        ->assertJsonPath('user.id', (string) $user->id)
        ->assertJsonPath('user.fullName', 'School Administrator')
        ->assertJsonPath('user.role', 'Admin');
    $this->assertAuthenticatedAs($user);
});

test('administrators can create records consumed by the React snapshot', function () {
    $administrator = User::factory()->create(['role' => 'Admin']);

    $response = $this->actingAs($administrator)->postJson('/api/people/classes', [
        'id' => 'grade-7a',
        'name' => 'Grade 7',
        'gradeLevel' => 7,
        'section' => 'A',
        'classTeacherId' => null,
        'classTeacherName' => 'Unassigned',
        'roomNumber' => 'Room 12',
        'capacity' => 30,
    ]);

    $response->assertCreated()
        ->assertJsonPath('id', 'grade-7a');
    $this->assertDatabaseHas('school_records', [
        'record_type' => 'class',
        'record_id' => 'grade-7a',
    ]);

    $this->actingAs($administrator)->getJson('/api/data')
        ->assertOk()
        ->assertJsonPath('classes.0.id', 'grade-7a');
});

test('the frontend school snapshot imports all modules additively', function () {
    $administrator = User::factory()->create(['role' => 'Admin']);
    $snapshot = [
        'teachers' => [[
            'id' => 'teacher-1',
            'employeeId' => 'EMP-1',
            'firstName' => 'Taylor',
            'lastName' => 'Teacher',
            'email' => 'taylor@example.test',
            'phone' => '555-0100',
            'gender' => 'Other',
            'qualification' => 'MEd',
            'department' => 'Science',
            'designation' => 'Teacher',
            'joiningDate' => '2025-01-01',
            'address' => 'School Street',
            'subjects' => ['Biology'],
            'assignedClass' => 'Grade 7 - A',
            'experienceYears' => 3,
        ]],
        'classes' => [[
            'id' => 'class-1',
            'name' => 'Grade 7',
            'gradeLevel' => 7,
            'section' => 'A',
            'classTeacherId' => 'teacher-1',
            'classTeacherName' => 'Taylor Teacher',
            'roomNumber' => 'Room 7',
            'capacity' => 30,
        ]],
        'subjects' => [[
            'id' => 'subject-1',
            'code' => 'BIO-7',
            'name' => 'Biology',
            'department' => 'Science',
            'gradeLevel' => 7,
            'teacherId' => 'teacher-1',
            'teacherName' => 'Taylor Teacher',
            'credits' => 2,
            'hoursPerWeek' => 4,
            'type' => 'Core',
        ]],
        'students' => [[
            'id' => 'student-1',
            'admissionNo' => 'ADM-1',
            'rollNo' => '01',
            'firstName' => 'Casey',
            'lastName' => 'Student',
            'gender' => 'Other',
            'dob' => '2013-02-01',
            'classId' => 'class-1',
            'className' => 'Grade 7',
            'section' => 'A',
            'enrollmentDate' => '2025-01-01',
            'status' => 'Active',
            'bloodGroup' => 'O+',
            'email' => 'casey@example.test',
            'phone' => '555-0101',
            'address' => 'Student Street',
            'guardianName' => 'Alex Student',
            'guardianRelation' => 'Parent',
            'guardianPhone' => '555-0102',
            'guardianEmail' => 'alex@example.test',
            'avatarUrl' => '',
        ]],
        'attendance' => [[
            'id' => 'attendance-1',
            'date' => '2026-10-10',
            'classId' => 'class-1',
            'markedAt' => '2026-10-10T08:00:00.000Z',
            'markedBy' => 'Taylor Teacher',
            'records' => [[
                'studentId' => 'student-1',
                'studentName' => 'Casey Student',
                'rollNo' => '01',
                'status' => 'Present',
                'remarks' => '',
            ]],
        ]],
        'exams' => [[
            'id' => 'exam-1',
            'title' => 'Midterm',
            'academicTerm' => '2026',
            'startDate' => '2026-10-01',
            'endDate' => '2026-10-10',
            'status' => 'Completed',
            'classes' => ['class-1'],
            'description' => '',
        ]],
        'results' => [[
            'id' => 'result-1',
            'examId' => 'exam-1',
            'studentId' => 'student-1',
            'classId' => 'class-1',
            'marks' => [[
                'subjectId' => 'subject-1',
                'subjectName' => 'Biology',
                'maxMarks' => 100,
                'marksObtained' => 90,
                'grade' => 'A',
                'remarks' => '',
            ]],
            'totalMarksObtained' => 90,
            'totalMaxMarks' => 100,
            'percentage' => 90,
            'gpa' => 4,
            'overallGrade' => 'A',
            'classRank' => 1,
            'teacherRemarks' => '',
        ]],
        'invoices' => [[
            'id' => 'invoice-1',
            'invoiceNo' => 'INV-001',
            'studentId' => 'student-1',
            'studentName' => 'Casey Student',
            'classId' => 'class-1',
            'className' => 'Grade 7',
            'feeType' => 'Tuition Fee',
            'amount' => 500,
            'paidAmount' => 100,
            'dueDate' => '2026-12-01',
            'status' => 'Partial',
            'academicTerm' => '2026',
            'createdAt' => '2026-01-01',
            'payments' => [[
                'id' => 'payment-1',
                'invoiceId' => 'invoice-1',
                'amount' => 100,
                'paymentDate' => '2026-02-01',
                'paymentMethod' => 'Cash',
                'transactionRef' => 'TX-1',
                'notes' => '',
            ]],
        ]],
        'timetableSlots' => [[
            'id' => 'slot-1',
            'classId' => 'class-1',
            'day' => 'Monday',
            'periodNumber' => 1,
            'startTime' => '08:30',
            'endTime' => '09:15',
            'subjectName' => 'Biology',
            'subjectCode' => 'BIO-7',
            'teacherName' => 'Taylor Teacher',
            'roomNumber' => 'Room 7',
        ]],
        'notices' => [[
            'id' => 'notice-1',
            'title' => 'Science Fair',
            'content' => 'Science fair next week.',
            'category' => 'Academic',
            'priority' => 'Normal',
            'targetAudience' => 'All',
            'publishedDate' => '2026-10-01',
            'expiryDate' => null,
            'isPinned' => false,
            'authorName' => 'Taylor Teacher',
        ]],
        'settings' => [
            'schoolName' => 'EduFlow School',
            'motto' => '',
            'establishedYear' => '2000',
            'principalName' => 'Jordan Principal',
            'email' => '',
            'phone' => '',
            'address' => '',
            'website' => '',
            'academicYear' => '2026',
            'currencySymbol' => '$',
            'gradingScale' => [],
        ],
    ];

    $this->actingAs($administrator)->postJson('/api/data/import', $snapshot)->assertNoContent();
    $this->actingAs($administrator)->postJson('/api/data/import', $snapshot)->assertNoContent();
    $response = $this->actingAs($administrator)->getJson('/api/data');

    $response->assertOk()
        ->assertJsonPath('students.0.id', 'student-1')
        ->assertJsonPath('teachers.0.id', 'teacher-1')
        ->assertJsonPath('classes.0.enrolledCount', 1)
        ->assertJsonPath('attendance.0.records.0.status', 'Present')
        ->assertJsonPath('exams.0.id', 'exam-1')
        ->assertJsonPath('results.0.percentage', 90)
        ->assertJsonPath('invoices.0.paidAmount', 100)
        ->assertJsonPath('invoices.0.payments.0.transactionRef', 'TX-1')
        ->assertJsonPath('timetableSlots.0.id', 'slot-1')
        ->assertJsonPath('notices.0.id', 'notice-1')
        ->assertJsonPath('settings.schoolName', 'EduFlow School');
    expect(SchoolRecord::query()->count())->toBe(11);

    $this->actingAs($administrator)->putJson('/api/finance/settings', [
        ...$snapshot['settings'],
        'schoolName' => 'Updated School',
    ])->assertOk()->assertJsonPath('schoolName', 'Updated School');
});

test('teachers cannot create administrator-only class records', function () {
    $teacher = User::factory()->create(['role' => 'Teacher']);

    $response = $this->actingAs($teacher)->postJson('/api/people/classes', [
        'id' => 'grade-7a',
        'name' => 'Grade 7',
        'gradeLevel' => 7,
        'section' => 'A',
        'roomNumber' => 'Room 12',
        'capacity' => 30,
    ]);

    $response->assertForbidden();
    expect(SchoolRecord::query()->count())->toBe(0);
});

test('invalid school records return field validation errors without persistence', function () {
    $administrator = User::factory()->create(['role' => 'Admin']);

    $response = $this->actingAs($administrator)->postJson('/api/people/students', [
        'id' => 'student-invalid',
    ]);

    $response->assertUnprocessable()
        ->assertJsonStructure(['error', 'errors']);
    expect(SchoolRecord::query()->count())->toBe(0);
});

test('student accounts only receive their own records', function () {
    $studentUser = User::factory()->create([
        'role' => 'Student',
        'student_id' => 'student-own',
    ]);
    SchoolRecord::query()->create([
        'record_type' => 'student',
        'record_id' => 'student-own',
        'payload' => ['id' => 'student-own', 'classId' => 'class-a'],
    ]);
    SchoolRecord::query()->create([
        'record_type' => 'student',
        'record_id' => 'student-other',
        'payload' => ['id' => 'student-other', 'classId' => 'class-b'],
    ]);

    $response = $this->actingAs($studentUser)->getJson('/api/data');

    $response->assertOk()
        ->assertJsonCount(1, 'students')
        ->assertJsonPath('students.0.id', 'student-own');
});

test('bursar payments reject overpayment and update the invoice balance', function () {
    $bursar = User::factory()->create(['role' => 'Bursar']);
    SchoolRecord::query()->create([
        'record_type' => 'class',
        'record_id' => 'class-1',
        'payload' => ['id' => 'class-1', 'name' => 'Grade 1', 'gradeLevel' => 1, 'section' => 'A'],
    ]);
    SchoolRecord::query()->create([
        'record_type' => 'student',
        'record_id' => 'student-1',
        'payload' => ['id' => 'student-1', 'classId' => 'class-1'],
    ]);
    $this->actingAs($bursar)->postJson('/api/finance/invoices', [
        'id' => 'invoice-1',
        'invoiceNo' => 'INV-001',
        'studentId' => 'student-1',
        'studentName' => 'Student One',
        'classId' => 'class-1',
        'className' => 'Grade 1',
        'feeType' => 'Tuition Fee',
        'amount' => 500,
        'dueDate' => '2026-12-01',
        'status' => 'Pending',
        'academicTerm' => '2026',
    ])->assertCreated();

    $response = $this->postJson('/api/finance/invoices/invoice-1/payments', [
        'amount' => 501,
        'paymentDate' => '2026-10-10',
        'paymentMethod' => 'Cash',
        'transactionRef' => 'TX-OVER',
    ]);

    $response->assertUnprocessable()
        ->assertJsonPath('error', 'Payment amount exceeds the outstanding balance.');
    expect(SchoolRecord::query()->where('record_type', 'invoice')->firstOrFail()->payload['payments'])->toBe([]);

    $this->postJson('/api/finance/invoices/invoice-1/payments', [
        'amount' => 300,
        'paymentDate' => '2026-10-10',
        'paymentMethod' => 'Cash',
        'transactionRef' => 'TX-1',
    ])->assertCreated()
        ->assertJsonPath('paidAmount', 300)
        ->assertJsonPath('status', 'Partial');

    $this->postJson('/api/finance/invoices/invoice-1/payments', [
        'amount' => 200,
        'paymentDate' => '2026-10-10',
        'paymentMethod' => 'Cash',
        'transactionRef' => 'TX-2',
    ])->assertCreated()
        ->assertJsonPath('paidAmount', 500)
        ->assertJsonPath('status', 'Paid');
});
