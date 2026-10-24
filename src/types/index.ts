export type GradeStage = 'term1' | 'midterm' | 'term2' | 'final';

export type ResultGradeType =
  | 'term1Score'       // درجة الفصل الأول
  | 'midtermScore'     // درجة نصف السنة
  | 'term2Score'       // درجة الفصل الثاني
  | 'termYearlyScore'  // درجة السعي السنوي
  | 'finalExamScore'   // درجة الامتحان النهائي
  | 'finalScore';      // الدرجة النهائية

export type RoundingRule = 
  | 'standard'     // تقريب رياضي لأقرب عدد صحيح (>= 0.5 للأعلى)
  | 'ceil'         // جبر الكسر لصالح الطالب (أي كسر يرفع للأعلى)
  | 'floor'        // حذف الكسور بدون تقريب
  | 'one_decimal'  // إبقاء كسر عشري واحد
  | 'two_decimals'; // إبقاء كسرين عشريين

export interface AcademicYear {
  id: string;
  name: string; // e.g., "2026–2027"
  isCurrent: boolean;
}

export interface SchoolClass {
  id: string;
  name: string; // e.g., "الخامس العلمي"
  stage: string; // "إعدادي", "متوسط", "ابتدائي"
  order: number;
}

export interface Section {
  id: string;
  classId: string;
  name: string; // e.g., "أ", "ب", "ج"
}

export interface Subject {
  id: string;
  classId: string;
  name: string; // e.g., "الرياضيات", "اللغة العربية"
  maxScore: number; // default: 100
  passScore: number; // default: 50
  order: number;
}

export interface Student {
  id: string;
  name: string; // اسم الطالب
  registrationNumber?: string; // رقم القيد
  fatherPhone?: string; // رقم هاتف الأب
  seatNumber: number; // الرقم التسلسلي / الامتحاني
  nationalId?: string; // الرقم الوطني (للتوافق القديم)
  academicYearId: string;
  classId: string;
  sectionId: string;
  gender?: 'male' | 'female';
  notes?: string;
}

export interface GradeAuditEntry {
  field: 'term1Score' | 'midtermScore' | 'term2Score' | 'finalExamScore';
  fieldArabic: string;
  oldValue: number | null;
  newValue: number | null;
  timestamp: string;
  reason?: string;
}

export interface GradeRecord {
  id: string; // `${academicYearId}_${classId}_${sectionId}_${subjectId}_${studentId}`
  academicYearId: string;
  classId: string;
  sectionId: string;
  subjectId: string;
  studentId: string;
  
  // Official Arabic columns
  term1Score: number | null;       // درجة الفصل الأول
  midtermScore: number | null;     // درجة نصف السنة
  term2Score: number | null;       // درجة الفصل الثاني
  termYearlyScore: number | null;  // درجة السعي السنوي (محسوبة تلقائياً)
  finalExamScore: number | null;   // درجة الامتحان النهائي
  finalScore: number | null;       // الدرجة النهائية (محسوبة تلقائياً)

  lastUpdated: string;
  auditHistory?: GradeAuditEntry[];
}

export interface AppSettings {
  schoolName: string;
  directorName: string;
  examCommitteeHead: string;
  city: string;
  roundingRule: RoundingRule;
  maxScoreDefault: number;
  passScoreDefault: number;
  confirmPreviousTermEdits: boolean;
  theme: 'dark' | 'light';
  schoolLogo?: string; // Base64 data URL for school logo
  kuficLogo?: string; // Base64 data URL for school Kufic geometric logo
}

export interface ExemptionSettings {
  academicYearId: string;
  generalMinAverage: number;      // Default: 85
  generalMinSubjectScore: number; // Default: 75
  enableGeneralJabr: boolean;     // Enable applying school rounding rule to evaluation average
  individualMinScore: number;     // Default: 90
  isConfigured: boolean;          // Whether settings were explicitly reviewed and saved
  updatedAt?: string;
}

export interface IndividualExemptionSubjectResult {
  subjectId: string;
  subjectName: string;
  yearlyScore: number | null;
  requiredScore: number;
  status: 'مستحق للإعفاء الفردي' | 'غير مستحق' | 'غير مكتمل';
}

export interface GeneralExemptionResult {
  student: Student;
  rawAverage: number | null;        // Exact raw average
  evaluatedAverage: number | null;  // Average after applying Jabr if enabled
  appliedJabr: boolean;             // True if jabr was enabled and affected or evaluated
  minSubjectScore: number | null;   // Lowest yearly term score across subjects
  lowestSubjectName?: string;       // Name of subject with lowest score
  isComplete: boolean;              // True if all subjects have yearly scores
  status: 'معفى عام' | 'غير مشمول' | 'غير مكتمل';
  reason: string;                   // Explanation of status
  individualResults: IndividualExemptionSubjectResult[];
  subjectsBelowMin?: { subjectId: string; subjectName: string; score: number }[];
  isNearEligible?: boolean;         // True if meets average condition with strictly 1 or 2 subjects < minScore
}

export type UserRole = 'admin' | 'user';

export interface UserAccount {
  id: string;
  username: string;
  passwordHash: string;
  salt: string;
  role: UserRole;
  isActive: boolean;
  mustChangePassword?: boolean;
  createdAt: string;
  lastLogin?: string;
}

export interface AuthSession {
  user: {
    id: string;
    username: string;
    role: UserRole;
    mustChangePassword?: boolean;
  };
  token: string;
  loginTime: string;
}

export type CertificateElementKey =
  | 'officialLogo'
  | 'kuficLogo'
  | 'studentName'
  | 'academicYear'
  | 'directorName';

export interface CertificateElementConfig {
  x: number; // percentage from left (0 to 100)
  y: number; // percentage from top (0 to 100)
  width?: number; // percentage width of certificate canvas (e.g. 10%)
  height?: number; // percentage height or auto
  fontSize?: number; // font size in px at design base 1123px width
  fontWeight?: 'normal' | 'bold' | 'black';
  fontColor?: string; // hex color e.g. '#0f172a'
  fontFamily?: string; // 'Cairo' | 'Tajawal' | 'Amiri'
  textAlign?: 'center' | 'right' | 'left';
  visible: boolean;
}

export interface CertificateTemplateConfig {
  templateImage?: string; // Base64 data URL of uploaded background template
  elements: {
    officialLogo: CertificateElementConfig;
    kuficLogo: CertificateElementConfig;
    studentName: CertificateElementConfig;
    academicYear: CertificateElementConfig;
    directorName: CertificateElementConfig;
  };
  lastUpdated?: string;
}

export type ActiveTab = 
  | 'dashboard'
  | 'years'
  | 'classes'
  | 'students'
  | 'subjects'
  | 'grade_entry'
  | 'results'
  | 'exemption'
  | 'reports'
  | 'certificate_template'
  | 'backup'
  | 'settings';

