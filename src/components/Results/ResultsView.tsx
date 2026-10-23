import React, { useState, useMemo } from 'react';
import {
  AcademicYear,
  SchoolClass,
  Section,
  Subject,
  Student,
  GradeRecord,
  AppSettings,
  ResultGradeType,
} from '../../types';
import { buildGradeKey } from '../../services/storage';
import * as XLSX from 'xlsx';
import {
  Trophy,
  Award,
  ChevronDown,
  Printer,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Search,
  Filter,
  BarChart3,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';

interface ResultsViewProps {
  academicYears: AcademicYear[];
  classes: SchoolClass[];
  sections: Section[];
  subjects: Subject[];
  students: Student[];
  grades: Record<string, GradeRecord>;
  settings: AppSettings;
}

export const GRADE_TYPE_CONFIG: Record<
  ResultGradeType,
  { label: string; shortLabel: string; description: string; badgeColor: string }
> = {
  term1Score: {
    label: 'درجة الفصل الأول',
    shortLabel: 'الفصل الأول',
    description: 'درجات تقييم الفصل الدراسي الأول',
    badgeColor: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  },
  midtermScore: {
    label: 'درجة نصف السنة',
    shortLabel: 'نصف السنة',
    description: 'درجات امتحانات نصف السنة الدراسية',
    badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  },
  term2Score: {
    label: 'درجة الفصل الثاني',
    shortLabel: 'الفصل الثاني',
    description: 'درجات تقييم الفصل الدراسي الثاني',
    badgeColor: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
  },
  termYearlyScore: {
    label: 'درجة السعي السنوي',
    shortLabel: 'السعي السنوي',
    description: 'معدل درجات السعي السنوي المحسوبة وفق القواعد المعتمدة',
    badgeColor: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  },
  finalExamScore: {
    label: 'درجة الامتحان النهائي',
    shortLabel: 'الامتحان النهائي',
    description: 'درجات الدور الأول للامتحان النهائي',
    badgeColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  },
  finalScore: {
    label: 'الدرجة النهائية',
    shortLabel: 'الدرجة النهائية',
    description: 'النتيجة العامة والدرجة النهائية المحسوبة آلياً',
    badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  },
};

export const ResultsView: React.FC<ResultsViewProps> = ({
  academicYears,
  classes,
  sections,
  subjects,
  students,
  grades,
  settings,
}) => {
  // 1. Academic Year Filter
  const currentYear = academicYears.find((y) => y.isCurrent) || academicYears[0];
  const [selectedYearId, setSelectedYearId] = useState<string>(currentYear?.id || '');

  // 2. Class Filter
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');

  // 3. Section Filter
  const availableSections = useMemo(
    () => sections.filter((s) => s.classId === selectedClassId),
    [sections, selectedClassId]
  );
  const [selectedSectionId, setSelectedSectionId] = useState<string>(
    availableSections[0]?.id || ''
  );

  React.useEffect(() => {
    if (availableSections.length > 0 && !availableSections.some((s) => s.id === selectedSectionId)) {
      setSelectedSectionId(availableSections[0].id);
    }
  }, [availableSections, selectedSectionId]);

  // 4. Grade Type Filter (The new 4th filter requested)
  const [selectedGradeType, setSelectedGradeType] = useState<ResultGradeType>('finalScore');

  // Search Query Filter
  const [searchQuery, setSearchQuery] = useState('');

  // Subjects sorted strictly by order
  const classSubjects = useMemo(
    () =>
      subjects
        .filter((sub) => sub.classId === selectedClassId)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [subjects, selectedClassId]
  );

  // Section Students
  const sectionStudents = useMemo(() => {
    return students
      .filter(
        (s) =>
          s.classId === selectedClassId &&
          s.sectionId === selectedSectionId &&
          s.academicYearId === selectedYearId
      )
      .sort((a, b) => a.seatNumber - b.seatNumber);
  }, [students, selectedClassId, selectedSectionId, selectedYearId]);

  // Active records helpers
  const activeYear = academicYears.find((y) => y.id === selectedYearId);
  const activeClass = classes.find((c) => c.id === selectedClassId);
  const activeSection = sections.find((s) => s.id === selectedSectionId);
  const activeGradeConfig = GRADE_TYPE_CONFIG[selectedGradeType];

  // Aggregate results per student across subjects according to selectedGradeType
  const studentResults = useMemo(() => {
    return sectionStudents.map((student) => {
      let totalScore = 0;
      let countedSubjects = 0;
      let failedSubjectsCount = 0;
      let hasIncomplete = false;

      const subjectScores: Record<string, number | null> = {};

      classSubjects.forEach((sub) => {
        const key = buildGradeKey(
          selectedYearId,
          selectedClassId,
          selectedSectionId,
          sub.id,
          student.id
        );
        const record = grades[key];

        // Read specific score field requested
        const score = record ? record[selectedGradeType] : null;
        subjectScores[sub.id] = score;

        if (score !== null && score !== undefined && !isNaN(score)) {
          totalScore += score;
          countedSubjects++;
          if (score < sub.passScore) {
            failedSubjectsCount++;
          }
        } else {
          hasIncomplete = true;
        }
      });

      // Strict completeness check: all subjects must have recorded scores
      const isComplete =
        !hasIncomplete && countedSubjects === classSubjects.length && classSubjects.length > 0;

      // Average: only computed when all subjects are complete, avoiding false provisional averages
      const average = isComplete
        ? Math.round((totalScore / classSubjects.length) * 10) / 10
        : null;

      // Result Status: ناجح (Passed), مكمل (1-2 failed subjects), راسب (Failed), غير مكتمل (Incomplete)
      let status: 'ناجح' | 'مكمل' | 'راسب' | 'غير مكتمل' = 'غير مكتمل';
      if (isComplete) {
        if (failedSubjectsCount === 0) status = 'ناجح';
        else if (failedSubjectsCount <= 2) status = 'مكمل';
        else status = 'راسب';
      }

      return {
        student,
        totalScore,
        countedSubjects,
        failedSubjectsCount,
        hasIncomplete,
        isComplete,
        average,
        status,
        subjectScores,
      };
    });
  }, [sectionStudents, classSubjects, selectedYearId, selectedClassId, selectedSectionId, selectedGradeType, grades]);

  // Filter students based on search query
  const filteredResults = useMemo(() => {
    if (!searchQuery.trim()) return studentResults;
    const q = searchQuery.trim().toLowerCase();
    return studentResults.filter(
      (r) =>
        r.student.name.toLowerCase().includes(q) ||
        (r.student.registrationNumber && r.student.registrationNumber.includes(q)) ||
        (r.student.seatNumber && String(r.student.seatNumber).includes(q))
    );
  }, [studentResults, searchQuery]);

  // Overall Statistics for this selected grade type
  const classStats = useMemo(() => {
    const total = studentResults.length;
    if (total === 0) {
      return { total: 0, completed: 0, passed: 0, failed: 0, incomplete: 0, passRate: 0, highestAvg: null };
    }

    const completed = studentResults.filter((r) => r.isComplete).length;
    const passed = studentResults.filter((r) => r.status === 'ناجح').length;
    const supplementary = studentResults.filter((r) => r.status === 'مكمل').length;
    const failed = studentResults.filter((r) => r.status === 'راسب').length;
    const incomplete = studentResults.filter((r) => r.status === 'غير مكتمل').length;

    const passRate = completed > 0 ? Math.round((passed / completed) * 100) : 0;

    const averages = studentResults
      .map((r) => r.average)
      .filter((avg): avg is number => avg !== null);
    const highestAvg = averages.length > 0 ? Math.max(...averages) : null;

    return {
      total,
      completed,
      passed,
      supplementary,
      failed,
      incomplete,
      passRate,
      highestAvg,
    };
  }, [studentResults]);

  // Top 10 Students ranking based on completed average in this selected grade type
  const topStudents = useMemo(() => {
    return [...studentResults]
      .filter((r) => r.average !== null && r.isComplete && r.status === 'ناجح')
      .sort((a, b) => (b.average || 0) - (a.average || 0))
      .slice(0, 10);
  }, [studentResults]);

  // Export to Excel file with UTF-8 support and Right-to-Left sheet formatting
  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();

    const headers = [
      'ت',
      'رقم القيد',
      'اسم الطالب',
      ...classSubjects.map((s) => `${s.name} (${s.maxScore})`),
      'المجموع',
      'المعدل',
      'النتيجة',
    ];

    const rows = studentResults.map((r, idx) => {
      const row: (string | number)[] = [
        idx + 1,
        r.student.registrationNumber || '—',
        r.student.name,
        ...classSubjects.map((s) => {
          const score = r.subjectScores[s.id];
          return score !== null && score !== undefined && !isNaN(score) ? score : '—';
        }),
        r.isComplete ? r.totalScore : (r.countedSubjects > 0 ? `${r.totalScore} (جزئي)` : '—'),
        r.average !== null ? `${r.average}%` : '—',
        r.status,
      ];
      return row;
    });

    const titleRows = [
      [`نتائج الطلاب — ${activeGradeConfig.label}`],
      [`المدرسة: ${settings.schoolName || 'الإدارة المدرسية'} | العام الدراسي: ${activeYear?.name || ''} | الصف: ${activeClass?.name || ''} | الشعبة: ${activeSection?.name || ''}`],
      [`تاريخ التصدير: ${new Date().toLocaleDateString('ar-EG')}`],
      [],
    ];

    const ws = XLSX.utils.aoa_to_sheet([...titleRows, headers, ...rows]);
    ws['!views'] = [{ rightToLeft: true }];
    ws['!cols'] = [
      { wch: 6 },
      { wch: 14 },
      { wch: 32 },
      ...classSubjects.map(() => ({ wch: 16 })),
      { wch: 12 },
      { wch: 12 },
      { wch: 14 },
    ];

    XLSX.utils.book_append_sheet(wb, ws, activeGradeConfig.shortLabel);
    XLSX.writeFile(
      wb,
      `نتائج_${activeClass?.name || 'الصف'}_شعبة_${activeSection?.name || 'شعبة'}_${activeGradeConfig.shortLabel}.xlsx`
    );
  };

  return (
    <div className="flex flex-col gap-6 pb-16" dir="rtl">
      {/* Printable Header (Visible only when printing) */}
      <div className="hidden print:block text-center border-b-2 border-slate-900 pb-4 mb-4">
        <h1 className="text-xl font-bold text-black">{settings.schoolName || 'جمهورية العراق - وزارة التربية'}</h1>
        <h2 className="text-lg font-black text-black mt-1">
          كشف نتائج الطلاب — {activeGradeConfig.label}
        </h2>
        <div className="flex justify-center gap-6 text-xs text-slate-700 mt-2 font-bold">
          <span>العام الدراسي: {activeYear?.name}</span>
          <span>الصف: {activeClass?.name}</span>
          <span>الشعبة: {activeSection?.name}</span>
          <span>تاريخ الطباعة: {new Date().toLocaleDateString('ar-EG')}</span>
        </div>
      </div>

      {/* Main Header & Filter Control Bar */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl flex flex-col gap-4 no-print">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1.5 ${activeGradeConfig.badgeColor}`}>
                <Sparkles className="w-3 h-3" />
                <span>النوع المعروض: {activeGradeConfig.label}</span>
              </span>
              <span className="text-slate-400 text-xs hidden sm:inline">
                {activeGradeConfig.description}
              </span>
            </div>
            <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
              <Trophy className="w-6 h-6 text-amber-400" />
              <span>عرض وتدقيق نتائج وتقييم الطلاب</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              اختر نوع الدرجة المطلوب لعرض كشف الدرجات الشامل، مع حساب المجموع والمعدل والترتيب آلياً.
            </p>
          </div>

          {/* Action Buttons: Export Excel & Print */}
          <div className="flex items-center gap-2.5 self-start lg:self-auto">
            <button
              type="button"
              onClick={handleExportExcel}
              className="h-10 px-3.5 text-xs font-bold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-2 cursor-pointer transition-colors"
              title={`تصدير كشف ${activeGradeConfig.label} إلى ملف Excel`}
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>تصدير Excel</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="h-10 px-4 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/20 transition-colors"
              title="طباعة النتائج المعروضة حالياً"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة النتائج</span>
            </button>
          </div>
        </div>

        {/* 4 Filters Sequential Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Filter 1: Academic Year */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">1. العام الدراسي</label>
            <div className="relative">
              <select
                value={selectedYearId}
                onChange={(e) => setSelectedYearId(e.target.value)}
                className="w-full h-10 px-3 pr-3 pl-8 text-xs bg-slate-950 border border-slate-700 rounded-lg text-slate-200 font-bold focus:border-emerald-500 focus:outline-hidden appearance-none cursor-pointer"
              >
                {academicYears.map((y) => (
                  <option key={y.id} value={y.id}>
                    {y.name} {y.isCurrent ? '(الحالي)' : ''}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute left-2.5 top-3 pointer-events-none" />
            </div>
          </div>

          {/* Filter 2: School Class */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">2. الصف الدراسي</label>
            <div className="relative">
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-full h-10 px-3 pr-3 pl-8 text-xs bg-slate-950 border border-slate-700 rounded-lg text-slate-200 font-bold focus:border-emerald-500 focus:outline-hidden appearance-none cursor-pointer"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.stage})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute left-2.5 top-3 pointer-events-none" />
            </div>
          </div>

          {/* Filter 3: Section */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">3. الشعبة</label>
            <div className="relative">
              <select
                value={selectedSectionId}
                onChange={(e) => setSelectedSectionId(e.target.value)}
                className="w-full h-10 px-3 pr-3 pl-8 text-xs bg-slate-950 border border-slate-700 rounded-lg text-slate-200 font-bold focus:border-emerald-500 focus:outline-hidden appearance-none cursor-pointer"
              >
                {availableSections.map((s) => (
                  <option key={s.id} value={s.id}>
                    شعبة {s.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute left-2.5 top-3 pointer-events-none" />
            </div>
          </div>

          {/* Filter 4: Grade Type (The newly added 4th filter) */}
          <div>
            <label className="block text-xs font-bold text-emerald-400 mb-1.5 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5" />
              <span>4. نوع الدرجة المعروضة</span>
            </label>
            <div className="relative">
              <select
                value={selectedGradeType}
                onChange={(e) => setSelectedGradeType(e.target.value as ResultGradeType)}
                className="w-full h-10 px-3 pr-3 pl-8 text-xs bg-emerald-950/40 border border-emerald-500/50 rounded-lg text-emerald-300 font-bold focus:border-emerald-400 focus:outline-hidden appearance-none cursor-pointer shadow-sm"
              >
                <option value="term1Score">درجة الفصل الأول</option>
                <option value="midtermScore">درجة نصف السنة</option>
                <option value="term2Score">درجة الفصل الثاني</option>
                <option value="termYearlyScore">درجة السعي السنوي</option>
                <option value="finalExamScore">درجة الامتحان النهائي</option>
                <option value="finalScore">الدرجة النهائية</option>
              </select>
              <ChevronDown className="w-4 h-4 text-emerald-400 absolute left-2.5 top-3 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards for the chosen Grade Type */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 no-print">
        <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex flex-col">
          <span className="text-[11px] text-slate-400">إجمالي طلاب الشعبة</span>
          <span className="text-xl font-bold font-mono text-white mt-1">{classStats.total}</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex flex-col">
          <span className="text-[11px] text-slate-400">الدرجات المكتملة</span>
          <span className="text-xl font-bold font-mono text-blue-400 mt-1">
            {classStats.completed} <span className="text-xs text-slate-500">من {classStats.total}</span>
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex flex-col">
          <span className="text-[11px] text-slate-400">عدد الناجحين</span>
          <span className="text-xl font-bold font-mono text-emerald-400 mt-1">{classStats.passed}</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex flex-col">
          <span className="text-[11px] text-slate-400">المكملون (1-2 مادة)</span>
          <span className="text-xl font-bold font-mono text-amber-400 mt-1">{classStats.supplementary}</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex flex-col">
          <span className="text-[11px] text-slate-400">الراسبون (3 فأكثر)</span>
          <span className="text-xl font-bold font-mono text-red-400 mt-1">{classStats.failed}</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex flex-col">
          <span className="text-[11px] text-slate-400">نسبة النجاح للمكتملين</span>
          <span className="text-xl font-bold font-mono text-emerald-300 mt-1">
            {classStats.completed > 0 ? `${classStats.passRate}%` : '—'}
          </span>
        </div>
      </div>

      {/* Top 5 Honors Cards for this Selected Grade Type */}
      {topStudents.length > 0 && (
        <div className="bg-gradient-to-r from-amber-950/20 via-slate-900 to-slate-900 border border-amber-500/30 rounded-2xl p-5 shadow-xl no-print">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-base text-amber-300">
                لوحة الشرف — المتفوقون في {activeGradeConfig.label} ({activeClass?.name} - شعبة {activeSection?.name})
              </h3>
            </div>
            <span className="text-xs text-amber-400/80 font-mono">
              أعلى معدل: {classStats.highestAvg !== null ? `${classStats.highestAvg}%` : '—'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
            {topStudents.slice(0, 5).map((rankItem, idx) => (
              <div
                key={rankItem.student.id}
                className="bg-slate-950/80 border border-amber-500/30 p-3.5 rounded-xl flex flex-col justify-between hover:border-amber-400/60 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center font-mono">
                    {idx + 1}
                  </span>
                  <span className="text-xs font-mono font-bold text-amber-400">
                    معدل: {rankItem.average}%
                  </span>
                </div>
                <h4 className="font-bold text-sm text-white mt-2 line-clamp-1">
                  {rankItem.student.name}
                </h4>
                <span className="text-[11px] text-slate-400 font-mono mt-1">
                  المجموع: {rankItem.totalScore}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Table Toolbar & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
        <div className="relative max-w-sm w-full">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث باسم الطالب أو رقم القيد..."
            className="w-full h-10 pr-9 pl-3 text-xs bg-slate-900 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-hidden"
          />
          <Search className="w-4 h-4 text-slate-500 absolute right-3 top-3 pointer-events-none" />
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>عرض</span>
          <strong className="text-white font-mono">{filteredResults.length}</strong>
          <span>من إجمالي</span>
          <strong className="text-white font-mono">{studentResults.length}</strong>
          <span>طالباً في الشعبة</span>
        </div>
      </div>

      {/* Complete Student Ledger Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl">
        <table className="w-full border-collapse text-right select-none">
          <thead>
            <tr className="bg-slate-900 border-b border-slate-700 text-xs font-bold text-slate-300">
              <th className="p-3 text-center w-12 border-l border-slate-800">ت</th>
              <th className="p-3 min-w-[220px] border-l border-slate-800">اسم الطالب</th>
              {classSubjects.map((sub) => (
                <th key={sub.id} className="p-2.5 text-center min-w-[95px] border-l border-slate-800 text-[11px]">
                  <div>{sub.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono font-normal">
                    (ع: {sub.maxScore} | ن: {sub.passScore})
                  </div>
                </th>
              ))}
              <th className="p-3 text-center min-w-[90px] border-l border-slate-800 bg-slate-850 text-white font-mono">
                المجموع
              </th>
              <th className="p-3 text-center min-w-[90px] border-l border-slate-800 bg-slate-850 text-emerald-400 font-mono">
                المعدل
              </th>
              <th className="p-3 text-center min-w-[110px] bg-slate-850 text-white">
                النتيجة
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800/60">
            {filteredResults.length === 0 ? (
              <tr>
                <td colSpan={classSubjects.length + 5} className="py-12 text-center text-slate-400">
                  <p className="text-sm font-bold">لا توجد نتائج مطابقة للشروط أو البحث الحالي</p>
                  <p className="text-xs text-slate-500 mt-1">
                    تأكد من اختيار العام الدراسي والصف والشعبة الصحيحة، أو تحقق من عبارة البحث.
                  </p>
                </td>
              </tr>
            ) : (
              filteredResults.map((r, idx) => (
                <tr key={r.student.id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="p-2.5 text-center text-xs text-slate-400 font-mono border-l border-slate-800">
                    {idx + 1}
                  </td>
                  <td className="p-2.5 border-l border-slate-800">
                    <div className="font-bold text-sm text-slate-200">{r.student.name}</div>
                    {r.student.registrationNumber && (
                      <div className="text-[11px] text-slate-500 font-mono">
                        قيد: {r.student.registrationNumber}
                      </div>
                    )}
                  </td>

                  {/* Subject Scores for selected grade type */}
                  {classSubjects.map((sub) => {
                    const score = r.subjectScores[sub.id];
                    const isNull = score === null || score === undefined || isNaN(score);
                    const isPass = !isNull && score >= sub.passScore;

                    return (
                      <td
                        key={sub.id}
                        className={`p-2.5 text-center font-mono text-sm border-l border-slate-800 ${
                          isNull
                            ? 'text-slate-500 bg-slate-900/20'
                            : isPass
                            ? 'text-slate-200'
                            : 'text-red-400 font-bold bg-red-950/30'
                        }`}
                      >
                        {isNull ? '—' : score}
                      </td>
                    );
                  })}

                  {/* Total Score */}
                  <td className="p-2.5 text-center font-mono font-bold text-white border-l border-slate-800 bg-slate-950/40">
                    {r.isComplete ? (
                      r.totalScore
                    ) : r.countedSubjects > 0 ? (
                      <span className="text-slate-400 text-xs" title="مجموع جزئي - توجد درجات غير مكتملة">
                        {r.totalScore}*
                      </span>
                    ) : (
                      <span className="text-slate-500">—</span>
                    )}
                  </td>

                  {/* Average */}
                  <td className="p-2.5 text-center font-mono font-bold text-emerald-400 border-l border-slate-800 bg-slate-950/40">
                    {r.average !== null ? `${r.average}%` : <span className="text-slate-500 font-normal">—</span>}
                  </td>

                  {/* Status Badge */}
                  <td className="p-2.5 text-center">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                        r.status === 'ناجح'
                          ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                          : r.status === 'مكمل'
                          ? 'bg-amber-950 text-amber-400 border-amber-800'
                          : r.status === 'راسب'
                          ? 'bg-red-950 text-red-400 border-red-800'
                          : 'bg-slate-800/80 text-slate-400 border-slate-700'
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Informative Guidance Footer Note */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-3.5 flex items-center gap-3 text-xs text-slate-400 no-print">
        <Info className="w-4 h-4 text-purple-400 shrink-0" />
        <div>
          <span>ملاحظة: علامة الشرطة (—) تعني أن الدرجة غير مدخلة بعد ولم تُحتسب صفراً. </span>
          <span>المجموع والمعدل يُحسبان بصورة نهائية فور اكتمال رصد جميع المواد لهذا النوع من الدرجات.</span>
        </div>
      </div>
    </div>
  );
};
