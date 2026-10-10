CREATE TABLE IF NOT EXISTS teachers (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL DEFAULT '',
  gender TEXT NOT NULL CHECK (gender IN ('Male', 'Female', 'Other')),
  qualification TEXT NOT NULL DEFAULT '',
  department TEXT NOT NULL,
  designation TEXT NOT NULL,
  joining_date DATE NOT NULL,
  address TEXT NOT NULL DEFAULT '',
  subjects TEXT[] NOT NULL DEFAULT '{}',
  assigned_class TEXT,
  experience_years INTEGER NOT NULL DEFAULT 0 CHECK (experience_years >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS school_classes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  grade_level INTEGER NOT NULL CHECK (grade_level BETWEEN 1 AND 12),
  section TEXT NOT NULL,
  class_teacher_id TEXT REFERENCES teachers(id) ON DELETE SET NULL,
  room_number TEXT NOT NULL DEFAULT '',
  capacity INTEGER NOT NULL CHECK (capacity > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (grade_level, section)
);

CREATE TABLE IF NOT EXISTS subjects (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  department TEXT NOT NULL,
  grade_level INTEGER NOT NULL CHECK (grade_level BETWEEN 1 AND 12),
  teacher_id TEXT REFERENCES teachers(id) ON DELETE SET NULL,
  teacher_name TEXT NOT NULL DEFAULT 'Unassigned',
  credits INTEGER NOT NULL CHECK (credits > 0),
  hours_per_week INTEGER NOT NULL CHECK (hours_per_week > 0),
  subject_type TEXT NOT NULL CHECK (subject_type IN ('Core', 'Elective', 'Practical')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY,
  admission_no TEXT NOT NULL UNIQUE,
  roll_no TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('Male', 'Female', 'Other')),
  dob DATE NOT NULL,
  class_id TEXT NOT NULL REFERENCES school_classes(id) ON DELETE RESTRICT,
  enrollment_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Active', 'Graduated', 'Suspended', 'Inactive')),
  blood_group TEXT,
  email TEXT,
  phone TEXT,
  address TEXT NOT NULL DEFAULT '',
  guardian_name TEXT NOT NULL,
  guardian_relation TEXT NOT NULL DEFAULT '',
  guardian_phone TEXT NOT NULL,
  guardian_email TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (class_id, roll_no)
);

CREATE TABLE IF NOT EXISTS attendance (
  id TEXT PRIMARY KEY,
  class_id TEXT NOT NULL REFERENCES school_classes(id) ON DELETE CASCADE,
  attendance_date DATE NOT NULL,
  marked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  marked_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (class_id, attendance_date)
);

CREATE TABLE IF NOT EXISTS attendance_records (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  attendance_id TEXT NOT NULL REFERENCES attendance(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  roll_no TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Present', 'Absent', 'Late', 'Excused')),
  remarks TEXT,
  UNIQUE (attendance_id, student_id)
);

CREATE TABLE IF NOT EXISTS exams (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  academic_term TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Upcoming', 'Ongoing', 'Completed')),
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (end_date >= start_date)
);

CREATE TABLE IF NOT EXISTS exam_classes (
  exam_id TEXT NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  class_id TEXT NOT NULL REFERENCES school_classes(id) ON DELETE CASCADE,
  PRIMARY KEY (exam_id, class_id)
);

CREATE TABLE IF NOT EXISTS exam_results (
  id TEXT PRIMARY KEY,
  exam_id TEXT NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  class_id TEXT NOT NULL REFERENCES school_classes(id) ON DELETE RESTRICT,
  marks JSONB NOT NULL DEFAULT '[]'::JSONB CHECK (jsonb_typeof(marks) = 'array'),
  total_marks_obtained NUMERIC(9, 2) NOT NULL DEFAULT 0 CHECK (total_marks_obtained >= 0),
  total_max_marks NUMERIC(9, 2) NOT NULL DEFAULT 0 CHECK (total_max_marks >= 0),
  percentage NUMERIC(6, 2) NOT NULL DEFAULT 0 CHECK (percentage BETWEEN 0 AND 100),
  gpa NUMERIC(4, 2) NOT NULL DEFAULT 0 CHECK (gpa >= 0),
  overall_grade TEXT NOT NULL DEFAULT 'F',
  class_rank INTEGER CHECK (class_rank IS NULL OR class_rank > 0),
  teacher_remarks TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (exam_id, student_id)
);

CREATE TABLE IF NOT EXISTS fee_invoices (
  id TEXT PRIMARY KEY,
  invoice_no TEXT NOT NULL UNIQUE,
  student_id TEXT NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
  student_name TEXT NOT NULL,
  class_id TEXT NOT NULL REFERENCES school_classes(id) ON DELETE RESTRICT,
  class_name TEXT NOT NULL,
  fee_type TEXT NOT NULL CHECK (fee_type IN ('Tuition Fee', 'Lab Fee', 'Transport Fee', 'Library Fee', 'Annual Examination')),
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  due_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Paid', 'Pending', 'Partial', 'Overdue')),
  academic_term TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fee_payments (
  id TEXT PRIMARY KEY,
  invoice_id TEXT NOT NULL REFERENCES fee_invoices(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  payment_date DATE NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('Bank Transfer', 'Cash', 'Credit/Debit Card', 'Online/UPI')),
  transaction_ref TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (invoice_id, transaction_ref)
);

CREATE TABLE IF NOT EXISTS timetable_slots (
  id TEXT PRIMARY KEY,
  class_id TEXT NOT NULL REFERENCES school_classes(id) ON DELETE CASCADE,
  day TEXT NOT NULL CHECK (day IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday')),
  period_number INTEGER NOT NULL CHECK (period_number BETWEEN 1 AND 12),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  subject_name TEXT NOT NULL,
  subject_code TEXT NOT NULL,
  teacher_name TEXT NOT NULL,
  room_number TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (end_time > start_time),
  UNIQUE (class_id, day, period_number)
);

CREATE TABLE IF NOT EXISTS notices (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Academic', 'Event', 'Holiday', 'Administrative', 'Sports')),
  priority TEXT NOT NULL CHECK (priority IN ('Urgent', 'Normal', 'Low')),
  target_audience TEXT NOT NULL CHECK (target_audience IN ('All', 'Students', 'Teachers', 'Parents')),
  published_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expiry_date DATE,
  is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
  author_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS school_settings (
  id BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK (id = TRUE),
  school_name TEXT NOT NULL,
  motto TEXT NOT NULL DEFAULT '',
  established_year TEXT NOT NULL DEFAULT '',
  principal_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  website TEXT NOT NULL DEFAULT '',
  academic_year TEXT NOT NULL DEFAULT '',
  currency_symbol TEXT NOT NULL DEFAULT '$',
  grading_scale JSONB NOT NULL DEFAULT '[]'::JSONB CHECK (jsonb_typeof(grading_scale) = 'array'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('Admin', 'Teacher', 'Student', 'Bursar')),
  teacher_id TEXT REFERENCES teachers(id) ON DELETE SET NULL,
  student_id TEXT REFERENCES students(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (teacher_id IS NULL OR student_id IS NULL)
);

CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_unique ON users (LOWER(email));
CREATE INDEX IF NOT EXISTS students_class_id_idx ON students (class_id);
CREATE INDEX IF NOT EXISTS attendance_date_idx ON attendance (attendance_date);
CREATE INDEX IF NOT EXISTS fee_invoices_student_id_idx ON fee_invoices (student_id);
CREATE INDEX IF NOT EXISTS fee_invoices_status_idx ON fee_invoices (status);
CREATE INDEX IF NOT EXISTS notices_published_date_idx ON notices (published_date DESC);
CREATE INDEX IF NOT EXISTS exam_results_student_exam_idx ON exam_results (student_id, exam_id);

CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'teachers', 'school_classes', 'subjects', 'students', 'attendance', 'exams',
    'exam_results', 'fee_invoices', 'timetable_slots', 'notices', 'school_settings', 'users'
  ] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS set_updated_at ON %I', table_name);
    EXECUTE format('CREATE TRIGGER set_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION set_updated_at()', table_name);
  END LOOP;
END;
$$;
