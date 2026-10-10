<?php

namespace App\Http\Controllers;

use App\Models\SchoolRecord;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class SchoolApiController extends Controller
{
    private const RESOURCE_TYPES = [
        'people' => [
            'students' => 'student',
            'teachers' => 'teacher',
            'classes' => 'class',
            'subjects' => 'subject',
        ],
        'academic' => [
            'attendance' => 'attendance',
            'exams' => 'exam',
            'results' => 'result',
            'timetable' => 'timetable',
        ],
        'finance' => [
            'invoices' => 'invoice',
            'notices' => 'notice',
            'settings' => 'settings',
        ],
    ];

    private const DEFAULT_SETTINGS = [
        'schoolName' => 'EduFlow School',
        'motto' => '',
        'establishedYear' => '',
        'principalName' => '',
        'email' => '',
        'phone' => '',
        'address' => '',
        'website' => '',
        'academicYear' => '',
        'currencySymbol' => '$',
        'gradingScale' => [],
    ];

    private const EMPTY_ALLOWED_TEXT_FIELDS = [
        'student' => ['admissionNo', 'rollNo', 'firstName', 'lastName', 'address', 'guardianName', 'guardianRelation', 'guardianPhone', 'guardianEmail'],
        'teacher' => ['employeeId', 'firstName', 'lastName', 'phone', 'qualification', 'department', 'designation', 'address'],
        'class' => ['name', 'section', 'roomNumber'],
        'subject' => ['code', 'name', 'department', 'teacherName'],
        'attendance' => ['markedBy', 'records.*.studentName', 'records.*.rollNo'],
        'exam' => ['title', 'academicTerm'],
        'result' => ['marks.*.subjectId', 'marks.*.subjectName', 'marks.*.grade', 'marks.*.remarks', 'overallGrade'],
        'invoice' => ['invoiceNo', 'studentName', 'className', 'academicTerm'],
        'payment' => ['transactionRef'],
        'timetable' => ['subjectName', 'subjectCode', 'teacherName', 'roomNumber'],
        'notice' => ['title', 'content', 'authorName'],
        'settings' => ['schoolName', 'motto', 'establishedYear', 'principalName', 'email', 'phone', 'address', 'website', 'academicYear', 'currencySymbol', 'gradingScale.*.grade'],
    ];

    private const EMPTY_ALLOWED_ARRAY_FIELDS = [
        'teacher' => ['subjects'],
        'attendance' => ['records'],
        'exam' => ['classes'],
        'result' => ['marks'],
        'settings' => ['gradingScale'],
    ];

    public function health(): JsonResponse
    {
        DB::connection()->select('SELECT 1');

        return response()->json(['status' => 'ok', 'database' => 'connected']);
    }

    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'email', 'max:254'],
            'password' => ['required', 'string', 'max:200'],
        ]);

        $user = User::query()
            ->whereRaw('LOWER(email) = ?', [mb_strtolower($credentials['email'])])
            ->first();

        if (! $user || ! $user->is_active || ! Hash::check($credentials['password'], $user->password)) {
            return response()->json(['error' => 'Email or password is incorrect.'], 401);
        }

        Auth::login($user);
        $request->session()->regenerate();
        $user->forceFill(['last_login_at' => now()])->save();

        return response()->json(['user' => $this->publicUser($user)]);
    }

    public function logout(Request $request): \Illuminate\Http\Response
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->noContent();
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json(['user' => $this->publicUser($request->user())]);
    }

    public function index(Request $request, string $group, string $resource): JsonResponse
    {
        $type = $this->resourceType($group, $resource);
        $this->authorizeResource($request, 'read', $type);

        if ($type === 'settings') {
            return response()->json($this->settings());
        }

        return response()->json($this->scopeRecords($this->records($type), $type, $request->user()));
    }

    public function store(Request $request, string $group, string $resource): JsonResponse
    {
        $type = $this->resourceType($group, $resource);
        $this->authorizeResource($request, 'create', $type);
        $data = $this->validatedRecord($type, $request->all());
        $id = $data['id'] ?? Str::uuid()->toString();

        if (SchoolRecord::query()->where('record_type', $type)->where('record_id', $id)->exists()) {
            return response()->json(['error' => 'A record with this identifier already exists.'], 409);
        }

        $data['id'] = $id;
        $record = SchoolRecord::query()->create([
            'record_type' => $type,
            'record_id' => $id,
            'payload' => $data,
        ]);

        return response()->json($this->recordResponse($type, $id), 201);
    }

    public function update(Request $request, string $group, string $resource, string $id): JsonResponse
    {
        $type = $this->resourceType($group, $resource);
        $this->authorizeResource($request, 'update', $type);
        $record = $this->findRecord($type, $id);
        $data = $this->validatedRecord($type, $request->all(), $id);
        $data['id'] = $id;
        $record->payload = $data;
        $record->save();

        return response()->json($this->recordResponse($type, $id));
    }

    public function updateSettings(Request $request): JsonResponse
    {
        $this->authorizeResource($request, 'update', 'settings');
        $settings = $this->validatedRecord('settings', $request->all());
        $record = SchoolRecord::query()->updateOrCreate(
            ['record_type' => 'settings', 'record_id' => 'school'],
            ['payload' => $settings],
        );

        return response()->json($record->payload);
    }

    public function destroy(Request $request, string $group, string $resource, string $id): \Illuminate\Http\Response
    {
        $type = $this->resourceType($group, $resource);
        $this->authorizeResource($request, 'delete', $type);
        $record = $this->findRecord($type, $id);
        $record->delete();

        return response()->noContent();
    }

    public function saveCollection(Request $request, string $resource): JsonResponse
    {
        $type = $this->resourceType('academic', $resource);
        $this->authorizeResource($request, 'update', $type);
        $data = $this->validatedRecord($type, $request->all());

        if ($type === 'attendance') {
            $studentIds = array_column($data['records'], 'studentId');
            if (count($studentIds) !== count(array_unique($studentIds))) {
                return response()->json(['error' => 'Attendance contains duplicate student IDs.'], 422);
            }
        }

        $record = DB::transaction(function () use ($type, $data): SchoolRecord {
            $record = SchoolRecord::query()->where('record_type', $type)
                ->where('record_id', $data['id'] ?? '')
                ->lockForUpdate()
                ->first();

            if ($type === 'result') {
                $record ??= SchoolRecord::query()->where('record_type', $type)
                    ->where('payload->examId', $data['examId'])
                    ->where('payload->studentId', $data['studentId'])
                    ->lockForUpdate()
                    ->first();
            }

            $id = $record?->record_id ?? ($data['id'] ?? Str::uuid()->toString());
            $data['id'] = $id;

            if (! $record) {
                return SchoolRecord::query()->create([
                    'record_type' => $type,
                    'record_id' => $id,
                    'payload' => $data,
                ]);
            }

            $record->payload = $data;
            $record->save();

            return $record;
        });

        return response()->json($record->payload);
    }

    public function addPayment(Request $request, string $id): JsonResponse
    {
        $this->authorizeResource($request, 'create', 'payment');
        $payment = $this->validatedRecord('payment', $request->all());

        $invoice = DB::transaction(function () use ($id, $payment): ?array {
            $record = SchoolRecord::query()->where('record_type', 'invoice')
                ->where('record_id', $id)
                ->lockForUpdate()
                ->first();

            if (! $record) {
                return null;
            }

            $invoice = $record->payload;
            $payments = $invoice['payments'] ?? [];
            if (collect($payments)->contains(fn (array $savedPayment): bool => ($savedPayment['transactionRef'] ?? null) === $payment['transactionRef'])) {
                throw ValidationException::withMessages([
                    'transactionRef' => 'A payment with this transaction reference already exists.',
                ]);
            }

            $paidAmount = array_sum(array_column($payments, 'amount'));
            $remaining = (float) $invoice['amount'] - $paidAmount;
            if ((float) $payment['amount'] > $remaining) {
                throw ValidationException::withMessages([
                    'amount' => 'Payment amount exceeds the outstanding balance.',
                ]);
            }

            $payment['id'] = $payment['id'] ?? Str::uuid()->toString();
            $payment['invoiceId'] = $id;
            $payments[] = $payment;
            $paidAmount += (float) $payment['amount'];
            $invoice['payments'] = $payments;
            $invoice['paidAmount'] = $paidAmount;
            $invoice['status'] = $paidAmount >= (float) $invoice['amount']
                ? 'Paid'
                : ($paidAmount > 0 ? 'Partial' : (($invoice['dueDate'] ?? '') < now()->toDateString() ? 'Overdue' : 'Pending'));

            $record->payload = $invoice;
            $record->save();

            return $invoice;
        });

        if (! $invoice) {
            return response()->json(['error' => 'Invoice not found.'], 404);
        }

        return response()->json($invoice, 201);
    }

    public function toggleNoticePin(Request $request, string $id): JsonResponse
    {
        $this->authorizeResource($request, 'update', 'notice');
        $record = $this->findRecord('notice', $id);
        $data = $record->payload;
        $data['isPinned'] = ! ($data['isPinned'] ?? false);
        $record->payload = $data;
        $record->save();

        return response()->json($record->payload);
    }

    public function snapshot(Request $request): JsonResponse
    {
        $snapshot = [
            'students' => $this->records('student'),
            'teachers' => $this->records('teacher'),
            'classes' => $this->records('class'),
            'subjects' => $this->records('subject'),
            'attendance' => $this->records('attendance'),
            'exams' => $this->records('exam'),
            'results' => $this->records('result'),
            'invoices' => $this->records('invoice'),
            'timetableSlots' => $this->records('timetable'),
            'notices' => $this->records('notice'),
            'settings' => $this->settings(),
        ];

        return response()->json($this->scopeSnapshot($snapshot, $request->user()));
    }

    public function import(Request $request): \Illuminate\Http\Response
    {
        $this->authorizeResource($request, 'import', 'snapshot');
        $data = $request->validate($this->snapshotRules());

        DB::transaction(fn () => $this->importSnapshot($data));

        return response()->noContent();
    }

    public function migrateLocalStorage(Request $request): JsonResponse
    {
        $this->authorizeResource($request, 'import', 'snapshot');
        $data = $request->validate($this->snapshotRules());

        if (SchoolRecord::query()->lockForUpdate()->exists()) {
            return response()->json(['error' => 'School records already exist; browser data was not imported.'], 409);
        }

        DB::transaction(fn () => $this->importSnapshot($data));

        return response()->json(['status' => 'imported']);
    }

    private function publicUser(User $user): array
    {
        return [
            'id' => (string) $user->id,
            'email' => $user->email,
            'fullName' => $user->name,
            'role' => $user->role,
            'teacherId' => $user->teacher_id,
            'studentId' => $user->student_id,
        ];
    }

    private function resourceType(string $group, string $resource): string
    {
        $type = self::RESOURCE_TYPES[$group][$resource] ?? null;
        abort_if($type === null, 404, 'Resource not found.');

        return $type;
    }

    private function authorizeResource(Request $request, string $action, string $type): void
    {
        $role = $request->user()->role;
        $allowedRoles = match ($action.':'.$type) {
            'read:student' => ['Admin', 'Teacher', 'Bursar', 'Student'],
            'read:teacher', 'read:subject' => ['Admin', 'Teacher'],
            'read:class' => ['Admin', 'Teacher', 'Bursar', 'Student'],
            'read:attendance', 'read:exam', 'read:result', 'read:timetable' => ['Admin', 'Teacher', 'Student'],
            'read:invoice' => ['Admin', 'Bursar', 'Student'],
            'read:notice', 'read:settings' => ['Admin', 'Teacher', 'Bursar', 'Student'],
            'create:student', 'update:student', 'delete:student',
            'create:teacher', 'update:teacher', 'delete:teacher',
            'create:class', 'update:class', 'delete:class',
            'create:subject', 'update:subject', 'delete:subject',
            'delete:exam', 'update:settings', 'import:snapshot' => ['Admin'],
            'create:attendance', 'update:attendance', 'create:exam', 'update:exam',
            'create:result', 'update:result', 'create:timetable', 'update:timetable', 'delete:timetable',
            'create:notice', 'update:notice', 'delete:notice' => ['Admin', 'Teacher'],
            'create:invoice', 'delete:invoice', 'create:payment' => ['Admin', 'Bursar'],
            default => [],
        };

        abort_unless(in_array($role, $allowedRoles, true), 403, 'You are not authorized to perform this action.');
    }

    private function findRecord(string $type, string $id): SchoolRecord
    {
        return SchoolRecord::query()->where('record_type', $type)
            ->where('record_id', $id)
            ->firstOrFail();
    }

    /**
     * @return array<string, mixed>
     */
    private function validationRules(string $type): array
    {
        $optionalId = ['sometimes', 'string', 'max:100'];
        $requiredId = ['required', 'string', 'max:100'];

        $rules = match ($type) {
            'student' => [
                'id' => $optionalId,
                'admissionNo' => ['required', 'string', 'max:100'],
                'rollNo' => ['required', 'string', 'max:30'],
                'firstName' => ['required', 'string', 'max:100'],
                'lastName' => ['required', 'string', 'max:100'],
                'gender' => ['required', 'in:Male,Female,Other'],
                'dob' => ['required', 'date_format:Y-m-d'],
                'classId' => ['required', 'string', 'max:100'],
                'className' => ['sometimes', 'nullable', 'string', 'max:100'],
                'section' => ['sometimes', 'nullable', 'string', 'max:10'],
                'enrollmentDate' => ['required', 'date_format:Y-m-d'],
                'status' => ['required', 'in:Active,Graduated,Suspended,Inactive'],
                'bloodGroup' => ['sometimes', 'nullable', 'string', 'max:10'],
                'email' => ['sometimes', 'string', 'max:254', $this->allowEmptyEmail()],
                'phone' => ['sometimes', 'nullable', 'string', 'max:50'],
                'address' => ['required', 'string', 'max:500'],
                'guardianName' => ['required', 'string', 'max:200'],
                'guardianRelation' => ['required', 'string', 'max:100'],
                'guardianPhone' => ['required', 'string', 'max:50'],
                'guardianEmail' => ['required', 'string', 'max:254', $this->allowEmptyEmail()],
                'avatarUrl' => ['sometimes', 'nullable', 'string', 'max:1000'],
            ],
            'teacher' => [
                'id' => $optionalId,
                'employeeId' => ['required', 'string', 'max:100'],
                'firstName' => ['required', 'string', 'max:100'],
                'lastName' => ['required', 'string', 'max:100'],
                'email' => ['required', 'email', 'max:254'],
                'phone' => ['required', 'string', 'max:50'],
                'gender' => ['required', 'in:Male,Female,Other'],
                'qualification' => ['required', 'string', 'max:250'],
                'department' => ['required', 'string', 'max:150'],
                'designation' => ['required', 'string', 'max:150'],
                'joiningDate' => ['required', 'date_format:Y-m-d'],
                'address' => ['required', 'string', 'max:500'],
                'subjects' => ['required', 'array', 'max:100'],
                'subjects.*' => ['string', 'max:120'],
                'assignedClass' => ['sometimes', 'nullable', 'string', 'max:120'],
                'experienceYears' => ['required', 'integer', 'between:0,80'],
            ],
            'class' => [
                'id' => $optionalId,
                'name' => ['required', 'string', 'max:100'],
                'gradeLevel' => ['required', 'integer', 'between:1,12'],
                'section' => ['required', 'string', 'max:10'],
                'classTeacherId' => ['sometimes', 'nullable', 'string', 'max:100'],
                'classTeacherName' => ['sometimes', 'nullable', 'string', 'max:200'],
                'roomNumber' => ['required', 'string', 'max:100'],
                'capacity' => ['required', 'integer', 'between:1,500'],
                'enrolledCount' => ['sometimes', 'integer', 'min:0'],
                'subjectsCount' => ['sometimes', 'integer', 'min:0'],
            ],
            'subject' => [
                'id' => $optionalId,
                'code' => ['required', 'string', 'max:30'],
                'name' => ['required', 'string', 'max:150'],
                'department' => ['required', 'string', 'max:150'],
                'gradeLevel' => ['required', 'integer', 'between:1,12'],
                'teacherId' => ['sometimes', 'nullable', 'string', 'max:100'],
                'teacherName' => ['required', 'string', 'max:200'],
                'credits' => ['required', 'integer', 'between:1,30'],
                'hoursPerWeek' => ['required', 'integer', 'between:1,40'],
                'type' => ['required', 'in:Core,Elective,Practical'],
            ],
            'attendance' => [
                'id' => $requiredId,
                'date' => ['required', 'date_format:Y-m-d'],
                'classId' => ['required', 'string', 'max:100'],
                'markedAt' => ['required', 'date'],
                'markedBy' => ['required', 'string', 'max:200'],
                'records' => ['required', 'array', 'max:1000'],
                'records.*.studentId' => ['required', 'string', 'max:100'],
                'records.*.studentName' => ['required', 'string', 'max:200'],
                'records.*.rollNo' => ['required', 'string', 'max:30'],
                'records.*.status' => ['required', 'in:Present,Absent,Late,Excused'],
                'records.*.remarks' => ['sometimes', 'nullable', 'string', 'max:500'],
            ],
            'exam' => [
                'id' => $optionalId,
                'title' => ['required', 'string', 'max:200'],
                'academicTerm' => ['required', 'string', 'max:100'],
                'startDate' => ['required', 'date_format:Y-m-d'],
                'endDate' => ['required', 'date_format:Y-m-d', 'after_or_equal:startDate'],
                'status' => ['required', 'in:Upcoming,Ongoing,Completed'],
                'classes' => ['required', 'array', 'max:500'],
                'classes.*' => ['string', 'max:100'],
                'description' => ['sometimes', 'nullable', 'string', 'max:2000'],
            ],
            'result' => [
                'id' => $optionalId,
                'examId' => ['required', 'string', 'max:100'],
                'studentId' => ['required', 'string', 'max:100'],
                'classId' => ['required', 'string', 'max:100'],
                'marks' => ['required', 'array', 'max:100'],
                'marks.*.subjectId' => ['required', 'string', 'max:100'],
                'marks.*.subjectName' => ['required', 'string', 'max:150'],
                'marks.*.maxMarks' => ['required', 'numeric', 'between:0,10000'],
                'marks.*.marksObtained' => ['required', 'numeric', 'between:0,10000'],
                'marks.*.grade' => ['required', 'string', 'max:10'],
                'marks.*.remarks' => ['required', 'string', 'max:1000'],
                'totalMarksObtained' => ['required', 'numeric', 'min:0'],
                'totalMaxMarks' => ['required', 'numeric', 'min:0'],
                'percentage' => ['required', 'numeric', 'between:0,100'],
                'gpa' => ['required', 'numeric', 'between:0,10'],
                'overallGrade' => ['required', 'string', 'max:10'],
                'classRank' => ['sometimes', 'nullable', 'integer', 'min:1'],
                'teacherRemarks' => ['sometimes', 'nullable', 'string', 'max:2000'],
            ],
            'invoice' => [
                'id' => $optionalId,
                'invoiceNo' => ['required', 'string', 'max:100'],
                'studentId' => ['required', 'string', 'max:100'],
                'studentName' => ['required', 'string', 'max:200'],
                'classId' => ['required', 'string', 'max:100'],
                'className' => ['required', 'string', 'max:100'],
                'feeType' => ['required', 'in:Tuition Fee,Lab Fee,Transport Fee,Library Fee,Annual Examination'],
                'amount' => ['required', 'numeric', 'gt:0', 'max:100000000'],
                'paidAmount' => ['sometimes', 'numeric', 'min:0'],
                'dueDate' => ['required', 'date_format:Y-m-d'],
                'status' => ['required', 'in:Paid,Pending,Partial,Overdue'],
                'academicTerm' => ['required', 'string', 'max:100'],
                'createdAt' => ['sometimes', 'date_format:Y-m-d'],
                'payments' => ['sometimes', 'array'],
                'payments.*.id' => ['sometimes', 'string', 'max:100'],
                'payments.*.invoiceId' => ['sometimes', 'string', 'max:100'],
                'payments.*.amount' => ['required', 'numeric', 'gt:0', 'max:100000000'],
                'payments.*.paymentDate' => ['required', 'date_format:Y-m-d'],
                'payments.*.paymentMethod' => ['required', 'in:Bank Transfer,Cash,Credit/Debit Card,Online/UPI'],
                'payments.*.transactionRef' => ['required', 'string', 'max:150'],
                'payments.*.notes' => ['sometimes', 'nullable', 'string', 'max:1000'],
            ],
            'payment' => [
                'id' => $optionalId,
                'amount' => ['required', 'numeric', 'gt:0', 'max:100000000'],
                'paymentDate' => ['required', 'date_format:Y-m-d'],
                'paymentMethod' => ['required', 'in:Bank Transfer,Cash,Credit/Debit Card,Online/UPI'],
                'transactionRef' => ['required', 'string', 'max:150'],
                'notes' => ['sometimes', 'nullable', 'string', 'max:1000'],
            ],
            'timetable' => [
                'id' => $optionalId,
                'classId' => ['required', 'string', 'max:100'],
                'day' => ['required', 'in:Monday,Tuesday,Wednesday,Thursday,Friday'],
                'periodNumber' => ['required', 'integer', 'between:1,12'],
                'startTime' => ['required', 'date_format:H:i'],
                'endTime' => ['required', 'date_format:H:i', 'after:startTime'],
                'subjectName' => ['required', 'string', 'max:150'],
                'subjectCode' => ['required', 'string', 'max:30'],
                'teacherName' => ['required', 'string', 'max:200'],
                'roomNumber' => ['required', 'string', 'max:100'],
            ],
            'notice' => [
                'id' => $optionalId,
                'title' => ['required', 'string', 'max:200'],
                'content' => ['required', 'string', 'max:10000'],
                'category' => ['required', 'in:Academic,Event,Holiday,Administrative,Sports'],
                'priority' => ['required', 'in:Urgent,Normal,Low'],
                'targetAudience' => ['required', 'in:All,Students,Teachers,Parents'],
                'publishedDate' => ['sometimes', 'date_format:Y-m-d'],
                'expiryDate' => ['sometimes', 'nullable', 'date_format:Y-m-d'],
                'isPinned' => ['required', 'boolean'],
                'authorName' => ['required', 'string', 'max:200'],
            ],
            'settings' => [
                'schoolName' => ['required', 'string', 'max:200'],
                'motto' => ['required', 'string', 'max:500'],
                'establishedYear' => ['required', 'string', 'max:20'],
                'principalName' => ['required', 'string', 'max:200'],
                'email' => ['required', 'string', 'max:254', $this->allowEmptyEmail()],
                'phone' => ['required', 'string', 'max:50'],
                'address' => ['required', 'string', 'max:500'],
                'website' => ['required', 'string', 'max:300'],
                'academicYear' => ['required', 'string', 'max:30'],
                'currencySymbol' => ['required', 'string', 'max:5'],
                'gradingScale' => ['required', 'array', 'max:30'],
                'gradingScale.*.grade' => ['required', 'string', 'max:10'],
                'gradingScale.*.minScore' => ['required', 'numeric', 'between:0,100'],
                'gradingScale.*.maxScore' => ['required', 'numeric', 'between:0,100'],
                'gradingScale.*.gpaPoint' => ['required', 'numeric', 'between:0,10'],
            ],
            default => abort(404, 'Resource not found.'),
        };

        foreach (self::EMPTY_ALLOWED_TEXT_FIELDS[$type] ?? [] as $field) {
            if (isset($rules[$field])) {
                $rules[$field] = array_map(
                    fn (mixed $rule): mixed => $rule === 'required' ? 'present' : $rule,
                    $rules[$field],
                );
            }
        }

        foreach (self::EMPTY_ALLOWED_ARRAY_FIELDS[$type] ?? [] as $field) {
            if (isset($rules[$field])) {
                $rules[$field] = array_map(
                    fn (mixed $rule): mixed => $rule === 'required' ? 'present' : $rule,
                    $rules[$field],
                );
            }
        }

        return $rules;
    }

    /**
     * @param  array<string, mixed>  $input
     * @return array<string, mixed>
     */
    private function validatedRecord(string $type, array $input, ?string $recordId = null): array
    {
        $validator = Validator::make($input, $this->validationRules($type));

        if ($type === 'result') {
            $validator->after(function ($validator) use ($input): void {
                if (! isset($input['marks']) || ! is_array($input['marks'])) {
                    return;
                }

                $obtained = array_sum(array_column($input['marks'], 'marksObtained'));
                $possible = array_sum(array_column($input['marks'], 'maxMarks'));
                if (collect($input['marks'])->contains(
                    fn (mixed $mark): bool => is_array($mark)
                        && ($mark['marksObtained'] ?? 0) > ($mark['maxMarks'] ?? 0),
                )) {
                    $validator->errors()->add('marks', 'Marks obtained cannot exceed maximum marks.');
                }
                if (abs($obtained - (float) ($input['totalMarksObtained'] ?? -1)) > 0.01
                    || abs($possible - (float) ($input['totalMaxMarks'] ?? -1)) > 0.01) {
                    $validator->errors()->add('totalMarksObtained', 'Result totals must match the subject marks.');
                }
                $percentage = $possible > 0 ? ($obtained / $possible) * 100 : 0;
                if (abs($percentage - (float) ($input['percentage'] ?? -1)) > 0.1) {
                    $validator->errors()->add('percentage', 'Percentage must match the subject marks.');
                }
            });
        }

        $data = $validator->validate();
        $this->assertRecordIntegrity($type, $data, $recordId ?? ($data['id'] ?? null));

        if ($type === 'teacher') {
            $data['email'] = Str::lower($data['email']);
        }
        if ($type === 'student') {
            $class = SchoolRecord::query()->where('record_type', 'class')
                ->where('record_id', $data['classId'])
                ->first()?->payload;
            if (is_array($class)) {
                $data['className'] = $class['name'] ?? ($data['className'] ?? '');
                $data['section'] = $class['section'] ?? ($data['section'] ?? '');
            }
        }
        if ($type === 'invoice') {
            $data['payments'] = $data['payments'] ?? [];
            $data['paidAmount'] = array_sum(array_column($data['payments'], 'amount'));
            $data['createdAt'] = $data['createdAt'] ?? now()->toDateString();
        }
        if ($type === 'notice') {
            $data['publishedDate'] = $data['publishedDate'] ?? now()->toDateString();
        }
        if ($type === 'settings') {
            $data['email'] = $data['email'] ?? '';
        }

        return $data;
    }

    private function allowEmptyEmail(): \Closure
    {
        return static function (string $attribute, mixed $value, \Closure $fail): void {
            if ($value !== '' && ! filter_var($value, FILTER_VALIDATE_EMAIL)) {
                $fail("The {$attribute} field must be a valid email address.");
            }
        };
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function assertRecordIntegrity(string $type, array $data, ?string $recordId): void
    {
        $requireRecord = function (string $relatedType, ?string $relatedId, string $field): void {
            if ($relatedId && ! SchoolRecord::query()->where('record_type', $relatedType)
                ->where('record_id', $relatedId)
                ->exists()) {
                throw ValidationException::withMessages([
                    $field => 'The selected record does not exist.',
                ]);
            }
        };
        $assertUnique = function (string $relatedType, string $field, mixed $value, string $inputField) use ($recordId): void {
            if ($value === null || $value === '') {
                return;
            }

            $query = SchoolRecord::query()
                ->where('record_type', $relatedType)
                ->where("payload->{$field}", $value);
            if ($recordId !== null) {
                $query->where('record_id', '!=', $recordId);
            }

            if ($query->exists()) {
                throw ValidationException::withMessages([
                    $inputField => 'The value has already been taken.',
                ]);
            }
        };

        match ($type) {
            'student' => (function () use ($data, $requireRecord, $assertUnique): void {
                $requireRecord('class', $data['classId'], 'classId');
                $assertUnique('student', 'admissionNo', $data['admissionNo'], 'admissionNo');
                $duplicateRollNumber = SchoolRecord::query()->where('record_type', 'student')
                    ->where('payload->classId', $data['classId'])
                    ->where('payload->rollNo', $data['rollNo'])
                    ->when(isset($data['id']), fn ($query) => $query->where('record_id', '!=', $data['id']))
                    ->exists();
                if ($duplicateRollNumber) {
                    throw ValidationException::withMessages(['rollNo' => 'The roll number is already used in this class.']);
                }
            })(),
            'teacher' => (function () use ($data, $assertUnique): void {
                $assertUnique('teacher', 'employeeId', $data['employeeId'], 'employeeId');
                $assertUnique('teacher', 'email', mb_strtolower($data['email']), 'email');
            })(),
            'class' => (function () use ($data, $requireRecord, $recordId): void {
                $requireRecord('teacher', $data['classTeacherId'] ?? null, 'classTeacherId');
                $duplicate = SchoolRecord::query()->where('record_type', 'class')
                    ->where('payload->gradeLevel', $data['gradeLevel'])
                    ->where('payload->section', $data['section'])
                    ->when($recordId !== null, fn ($query) => $query->where('record_id', '!=', $recordId))
                    ->exists();
                if ($duplicate) {
                    throw ValidationException::withMessages(['section' => 'A class already exists for this grade and section.']);
                }
            })(),
            'subject' => (function () use ($data, $requireRecord, $assertUnique): void {
                $requireRecord('teacher', $data['teacherId'] ?? null, 'teacherId');
                $assertUnique('subject', 'code', $data['code'], 'code');
            })(),
            'attendance' => (function () use ($data, $requireRecord): void {
                $requireRecord('class', $data['classId'], 'classId');
                foreach ($data['records'] as $index => $attendanceRecord) {
                    $student = SchoolRecord::query()->where('record_type', 'student')
                        ->where('record_id', $attendanceRecord['studentId'])
                        ->first();
                    if (! $student || ($student->payload['classId'] ?? null) !== $data['classId']) {
                        throw ValidationException::withMessages([
                            "records.{$index}.studentId" => 'Every attendance record must belong to a student in the selected class.',
                        ]);
                    }
                }
            })(),
            'exam' => (function () use ($data, $requireRecord): void {
                foreach ($data['classes'] as $index => $classId) {
                    $requireRecord('class', $classId, "classes.{$index}");
                }
            })(),
            'result' => (function () use ($data, $requireRecord): void {
                $requireRecord('exam', $data['examId'], 'examId');
                $requireRecord('student', $data['studentId'], 'studentId');
                $requireRecord('class', $data['classId'], 'classId');
            })(),
            'invoice' => (function () use ($data, $requireRecord, $assertUnique): void {
                $requireRecord('student', $data['studentId'], 'studentId');
                $requireRecord('class', $data['classId'], 'classId');
                $assertUnique('invoice', 'invoiceNo', $data['invoiceNo'], 'invoiceNo');
            })(),
            'timetable' => $requireRecord('class', $data['classId'], 'classId'),
            default => null,
        };
    }

    /**
     * @return array<string, mixed>
     */
    private function snapshotRules(): array
    {
        return [
            'students' => ['sometimes', 'array'],
            'students.*' => ['array'],
            'teachers' => ['sometimes', 'array'],
            'teachers.*' => ['array'],
            'classes' => ['sometimes', 'array'],
            'classes.*' => ['array'],
            'subjects' => ['sometimes', 'array'],
            'subjects.*' => ['array'],
            'attendance' => ['sometimes', 'array'],
            'attendance.*' => ['array'],
            'exams' => ['sometimes', 'array'],
            'exams.*' => ['array'],
            'results' => ['sometimes', 'array'],
            'results.*' => ['array'],
            'invoices' => ['sometimes', 'array'],
            'invoices.*' => ['array'],
            'timetableSlots' => ['sometimes', 'array'],
            'timetableSlots.*' => ['array'],
            'notices' => ['sometimes', 'array'],
            'notices.*' => ['array'],
            'settings' => ['sometimes', 'array'],
        ];
    }

    /**
     * @param  array<string, mixed>  $snapshot
     */
    private function importSnapshot(array $snapshot): void
    {
        $collections = [
            'teachers' => 'teacher',
            'classes' => 'class',
            'subjects' => 'subject',
            'students' => 'student',
            'attendance' => 'attendance',
            'exams' => 'exam',
            'results' => 'result',
            'invoices' => 'invoice',
            'timetableSlots' => 'timetable',
            'notices' => 'notice',
        ];

        foreach ($collections as $collection => $type) {
            foreach ($snapshot[$collection] ?? [] as $input) {
                $data = $this->validatedRecord($type, $input);
                $id = $data['id'] ?? Str::uuid()->toString();
                $data['id'] = $id;

                SchoolRecord::query()->firstOrCreate(
                    ['record_type' => $type, 'record_id' => $id],
                    ['payload' => $data],
                );
            }
        }

        if (isset($snapshot['settings'])) {
            $settings = $this->validatedRecord('settings', $snapshot['settings']);
            SchoolRecord::query()->updateOrCreate(
                ['record_type' => 'settings', 'record_id' => 'school'],
                ['payload' => $settings],
            );
        }
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function records(string $type): array
    {
        if ($type === 'settings') {
            return [];
        }

        $records = SchoolRecord::query()->where('record_type', $type)
            ->orderBy('record_id')
            ->get()
            ->map(fn (SchoolRecord $record): array => $record->payload)
            ->values()
            ->all();

        if ($type === 'student') {
            $classes = collect($this->rawRecords('class'))->keyBy('id');
            foreach ($records as &$student) {
                $class = $classes->get($student['classId'] ?? '');
                if ($class) {
                    $student['className'] = $class['name'];
                    $student['section'] = $class['section'];
                }
            }
            unset($student);
        }

        if ($type === 'class') {
            $teachers = collect($this->rawRecords('teacher'))->keyBy('id');
            $studentCounts = collect($this->rawRecords('student'))->countBy('classId');
            $subjectCounts = collect($this->rawRecords('subject'))->countBy('gradeLevel');
            foreach ($records as &$class) {
                $teacher = $teachers->get($class['classTeacherId'] ?? '');
                $class['classTeacherId'] = $class['classTeacherId'] ?? '';
                $class['classTeacherName'] = $teacher
                    ? trim(($teacher['firstName'] ?? '').' '.($teacher['lastName'] ?? ''))
                    : 'Unassigned';
                $class['enrolledCount'] = $studentCounts->get($class['id'], 0);
                $class['subjectsCount'] = $subjectCounts->get($class['gradeLevel'], 0);
            }
            unset($class);
        }

        if ($type === 'subject') {
            $teachers = collect($this->rawRecords('teacher'))->keyBy('id');
            foreach ($records as &$subject) {
                $subject['teacherId'] = $subject['teacherId'] ?? '';
                $teacher = $teachers->get($subject['teacherId'] ?? '');
                if ($teacher) {
                    $subject['teacherName'] = trim(($teacher['firstName'] ?? '').' '.($teacher['lastName'] ?? ''));
                }
            }
            unset($subject);
        }

        return $records;
    }

    /**
     * @return array<string, mixed>
     */
    private function recordResponse(string $type, string $id): array
    {
        return collect($this->records($type))->firstWhere('id', $id) ?? [];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function rawRecords(string $type): array
    {
        return SchoolRecord::query()->where('record_type', $type)
            ->orderBy('record_id')
            ->get()
            ->map(fn (SchoolRecord $record): array => $record->payload)
            ->values()
            ->all();
    }

    /**
     * @return array<string, mixed>
     */
    private function settings(): array
    {
        $record = SchoolRecord::query()->where('record_type', 'settings')
            ->where('record_id', 'school')
            ->first();

        return $record?->payload ?? array_replace(self::DEFAULT_SETTINGS, [
            'academicYear' => now()->format('Y'),
        ]);
    }

    /**
     * @param  array<string, mixed>  $snapshot
     * @return array<string, mixed>
     */
    private function scopeSnapshot(array $snapshot, User $user): array
    {
        if ($user->role === 'Admin' || $user->role === 'Teacher') {
            if ($user->role === 'Teacher') {
                $snapshot['invoices'] = [];
            }

            return $snapshot;
        }

        if ($user->role === 'Bursar') {
            $snapshot['teachers'] = [];
            $snapshot['subjects'] = [];
            $snapshot['attendance'] = [];
            $snapshot['exams'] = [];
            $snapshot['results'] = [];
            $snapshot['timetableSlots'] = [];

            return $snapshot;
        }

        $studentId = $user->student_id;
        $student = collect($snapshot['students'])->firstWhere('id', $studentId);
        $classId = $student['classId'] ?? null;
        $gradeLevel = collect($snapshot['classes'])->firstWhere('id', $classId)['gradeLevel'] ?? null;

        $snapshot['students'] = $student ? [$student] : [];
        $snapshot['teachers'] = [];
        $snapshot['classes'] = array_values(array_filter(
            $snapshot['classes'],
            fn (array $class): bool => $class['id'] === $classId,
        ));
        $snapshot['subjects'] = array_values(array_filter(
            $snapshot['subjects'],
            fn (array $subject): bool => $subject['gradeLevel'] === $gradeLevel,
        ));
        $snapshot['attendance'] = array_values(array_filter(array_map(
            function (array $attendance) use ($studentId): ?array {
                $attendance['records'] = array_values(array_filter(
                    $attendance['records'],
                    fn (array $record): bool => $record['studentId'] === $studentId,
                ));

                return $attendance['records'] === [] ? null : $attendance;
            },
            $snapshot['attendance'],
        )));
        $snapshot['exams'] = array_values(array_filter(
            $snapshot['exams'],
            fn (array $exam): bool => in_array($classId, $exam['classes'], true),
        ));
        $snapshot['results'] = array_values(array_filter(
            $snapshot['results'],
            fn (array $result): bool => $result['studentId'] === $studentId,
        ));
        $snapshot['invoices'] = array_values(array_filter(
            $snapshot['invoices'],
            fn (array $invoice): bool => $invoice['studentId'] === $studentId,
        ));
        $snapshot['timetableSlots'] = array_values(array_filter(
            $snapshot['timetableSlots'],
            fn (array $slot): bool => $slot['classId'] === $classId,
        ));
        $snapshot['notices'] = array_values(array_filter(
            $snapshot['notices'],
            fn (array $notice): bool => in_array($notice['targetAudience'], ['All', 'Students'], true),
        ));

        return $snapshot;
    }

    /**
     * @param  array<int, array<string, mixed>>  $records
     * @return array<int, array<string, mixed>>
     */
    private function scopeRecords(array $records, string $type, User $user): array
    {
        if ($user->role !== 'Student') {
            return $records;
        }

        $student = collect($this->rawRecords('student'))->firstWhere('id', $user->student_id);
        $classId = $student['classId'] ?? null;
        $class = collect($this->rawRecords('class'))->firstWhere('id', $classId);
        $gradeLevel = $class['gradeLevel'] ?? null;
        $studentId = $user->student_id;

        return match ($type) {
            'student' => array_values(array_filter($records, fn (array $record): bool => $record['id'] === $studentId)),
            'class' => array_values(array_filter($records, fn (array $record): bool => $record['id'] === $classId)),
            'subject' => array_values(array_filter(
                $records,
                fn (array $record): bool => $record['gradeLevel'] === $gradeLevel,
            )),
            'attendance' => array_values(array_filter(array_map(
                function (array $attendance) use ($studentId): ?array {
                    $attendance['records'] = array_values(array_filter(
                        $attendance['records'],
                        fn (array $record): bool => $record['studentId'] === $studentId,
                    ));

                    return $attendance['records'] === [] ? null : $attendance;
                },
                $records,
            ))),
            'exam' => array_values(array_filter(
                $records,
                fn (array $exam): bool => in_array($classId, $exam['classes'], true),
            )),
            'result' => array_values(array_filter(
                $records,
                fn (array $record): bool => $record['studentId'] === $studentId,
            )),
            'invoice' => array_values(array_filter(
                $records,
                fn (array $record): bool => $record['studentId'] === $studentId,
            )),
            'timetable' => array_values(array_filter(
                $records,
                fn (array $record): bool => $record['classId'] === $classId,
            )),
            'notice' => array_values(array_filter(
                $records,
                fn (array $record): bool => in_array($record['targetAudience'], ['All', 'Students'], true),
            )),
            default => [],
        };
    }
}
