import React from 'react';
import {
  AcademicYear,
  SchoolClass,
  Section,
  Subject,
  Student,
  GradeRecord,
  AppSettings,
  ActiveTab,
} from '../../types';
import {
  Calendar,
  Layers,
  Users,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  FileSpreadsheet,
  Award,
  ArrowLeft,
  ShieldCheck,
  HardDrive,
} from 'lucide-react';

interface DashboardViewProps {
  academicYears: AcademicYear[];
  classes: SchoolClass[];
  sections: Section[];
  subjects: Subject[];
  students: Student[];
  grades: Record<string, GradeRecord>;
  settings: AppSettings;
  onNavigate: (tab: ActiveTab) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  academicYears,
  classes,
  sections,
  subjects,
  students,
  grades,
  settings,
  onNavigate,
}) => {
  const currentYear = academicYears.find((y) => y.isCurrent) || academicYears[0];

  // Subject completion analysis
  const subjectStats = React.useMemo(() => {
    let completedCount = 0;
    let pendingCount = 0;

    const details: {
      subject: Subject;
      totalExpected: number;
      enteredCount: number;
      isComplete: boolean;
      percent: number;
    }[] = [];

    const sortedSubjects = [...subjects].sort((a, b) => {
      if (a.classId !== b.classId) return a.classId.localeCompare(b.classId);
      return (a.order ?? 0) - (b.order ?? 0);
    });

    sortedSubjects.forEach((sub) => {
      // Find students who should have grades in this subject
      const applicableStudents = students.filter((s) => s.classId === sub.classId);
      const totalExpected = applicableStudents.length;

      let enteredCount = 0;
      applicableStudents.forEach((stu) => {
        const key = `${currentYear?.id}_${stu.classId}_${stu.sectionId}_${sub.id}_${stu.id}`;
        const record = grades[key];
        if (record && record.term1Score !== null) {
          enteredCount++;
        }
      });

      const isComplete = totalExpected > 0 && enteredCount === totalExpected;
      if (isComplete) {
        completedCount++;
      } else {
        pendingCount++;
      }

      details.push({
        subject: sub,
        totalExpected,
        enteredCount,
        isComplete,
        percent: totalExpected > 0 ? Math.round((enteredCount / totalExpected) * 100) : 0,
      });
    });

    return { completedCount, pendingCount, details };
  }, [subjects, students, grades, currentYear]);

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 text-xs font-bold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              نظام إدارة الدرجات المدرسية الداخلي
            </span>
            <span className="text-slate-400 text-xs flex items-center gap-1 font-mono">
              <HardDrive className="w-3.5 h-3.5 text-blue-400" />
              يعمل 100% بدون اتصال بالإنترنت
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white">
            {settings.schoolName}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            العام الدراسي النشط: <span className="text-white font-bold">{currentYear?.name || 'غير محدد'}</span> — مدير المدرسة: <span className="text-slate-200">{settings.directorName}</span>
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('grade_entry')}
          className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-600/25 transition-all transform hover:-translate-y-0.5 cursor-pointer"
        >
          <FileSpreadsheet className="w-5 h-5" />
          <span>بدء رصد الدرجات الآن</span>
          <ArrowLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Main KPI Stat Cards (Clickable) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Academic Years */}
        <div
          onClick={() => onNavigate('years')}
          className="bg-slate-900/90 border border-slate-800 hover:border-blue-500/50 p-4 rounded-xl flex flex-col justify-between cursor-pointer transition-all hover:bg-slate-850 group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400">العام الحالي</span>
            <Calendar className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-lg font-black text-white font-mono">
            {currentYear?.name || '2026–2027'}
          </div>
          <span className="text-[11px] text-blue-400 mt-1 flex items-center gap-1">
            إدارة الأعوام ←
          </span>
        </div>

        {/* Classes */}
        <div
          onClick={() => onNavigate('classes')}
          className="bg-slate-900/90 border border-slate-800 hover:border-teal-500/50 p-4 rounded-xl flex flex-col justify-between cursor-pointer transition-all hover:bg-slate-850 group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400">عدد الصفوف</span>
            <Layers className="w-4 h-4 text-teal-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {classes.length}
          </div>
          <span className="text-[11px] text-teal-400 mt-1 flex items-center gap-1">
            إدارة الصفوف ←
          </span>
        </div>

        {/* Sections */}
        <div
          onClick={() => onNavigate('classes')}
          className="bg-slate-900/90 border border-slate-800 hover:border-amber-500/50 p-4 rounded-xl flex flex-col justify-between cursor-pointer transition-all hover:bg-slate-850 group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400">عدد الشعب</span>
            <Layers className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {sections.length}
          </div>
          <span className="text-[11px] text-amber-400 mt-1 flex items-center gap-1">
            عرض الشعب ←
          </span>
        </div>

        {/* Students */}
        <div
          onClick={() => onNavigate('students')}
          className="bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 p-4 rounded-xl flex flex-col justify-between cursor-pointer transition-all hover:bg-slate-850 group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400">عدد الطلاب</span>
            <Users className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {students.length}
          </div>
          <span className="text-[11px] text-indigo-400 mt-1 flex items-center gap-1">
            سجل الطلاب ←
          </span>
        </div>

        {/* Completed Subjects */}
        <div
          onClick={() => onNavigate('grade_entry')}
          className="bg-slate-900/90 border border-slate-800 hover:border-emerald-500/50 p-4 rounded-xl flex flex-col justify-between cursor-pointer transition-all hover:bg-slate-850 group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-emerald-400">مواد مكتملة</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">
            {subjectStats.completedCount}
          </div>
          <span className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
            مكتملة الرصد
          </span>
        </div>

        {/* Pending Subjects */}
        <div
          onClick={() => onNavigate('grade_entry')}
          className="bg-slate-900/90 border border-slate-800 hover:border-red-500/50 p-4 rounded-xl flex flex-col justify-between cursor-pointer transition-all hover:bg-slate-850 group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-red-400">درجات ناقصة</span>
            <AlertCircle className="w-4 h-4 text-red-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-black text-red-400 font-mono">
            {subjectStats.pendingCount}
          </div>
          <span className="text-[11px] text-red-400 mt-1 flex items-center gap-1">
            تحتاج استكمال ←
          </span>
        </div>
      </div>

      {/* Progress Breakdown Per Subject */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              حالة اكتمال رصد المواد الدراسية (الفصل الأول)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              متابعة مباشرة لنسبة إدخال درجات كل مادة دراسية على مستوى الصفوف
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('grade_entry')}
            className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
          >
            <span>فتح شاشة الرصد</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjectStats.details.map(({ subject, totalExpected, enteredCount, isComplete, percent }) => {
            const classObj = classes.find((c) => c.id === subject.classId);

            return (
              <div
                key={subject.id}
                onClick={() => onNavigate('grade_entry')}
                className="bg-slate-950 border border-slate-800/80 hover:border-slate-700 p-4 rounded-xl cursor-pointer transition-all hover:bg-slate-900/50 flex flex-col gap-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-slate-200">
                      {subject.name}
                    </h4>
                    <span className="text-xs text-slate-400">
                      {classObj?.name || 'الصف'}
                    </span>
                  </div>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${
                      isComplete
                        ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60'
                        : 'bg-red-950/60 text-red-400 border-red-800/60'
                    }`}
                  >
                    {isComplete ? 'مكتمل' : 'ناقص'}
                  </span>
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1 font-mono">
                    <span>{enteredCount} من {totalExpected} طالباً</span>
                    <span className="font-bold text-slate-200">{percent}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        isComplete ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
