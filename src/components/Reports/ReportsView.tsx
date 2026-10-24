import React, { useState, useMemo } from 'react';
import {
  AcademicYear,
  SchoolClass,
  Section,
  Subject,
  Student,
  GradeRecord,
  AppSettings,
  GradeStage,
} from '../../types';
import { buildGradeKey } from '../../services/storage';
import {
  Printer,
  FileText,
  UserCheck,
  Award,
  AlertTriangle,
  ChevronDown,
  School,
} from 'lucide-react';
import { SchoolLogo } from '../Common/SchoolLogo';

interface ReportsViewProps {
  academicYears: AcademicYear[];
  classes: SchoolClass[];
  sections: Section[];
  subjects: Subject[];
  students: Student[];
  grades: Record<string, GradeRecord>;
  settings: AppSettings;
}

type ReportType = 'master_sheet' | 'student_card' | 'honor_roll' | 'missing_audit';

export const ReportsView: React.FC<ReportsViewProps> = ({
  academicYears,
  classes,
  sections,
  subjects,
  students,
  grades,
  settings,
}) => {
  const currentYear = academicYears.find((y) => y.isCurrent) || academicYears[0];
  const [selectedYearId, setSelectedYearId] = useState<string>(currentYear?.id || '');
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');

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

  const classSubjects = useMemo(
    () =>
      subjects
        .filter((sub) => sub.classId === selectedClassId)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [subjects, selectedClassId]
  );

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

  const [activeReport, setActiveReport] = useState<ReportType>('master_sheet');
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    sectionStudents[0]?.id || ''
  );

  React.useEffect(() => {
    if (sectionStudents.length > 0 && !sectionStudents.some((s) => s.id === selectedStudentId)) {
      setSelectedStudentId(sectionStudents[0].id);
    }
  }, [sectionStudents, selectedStudentId]);

  const activeClass = classes.find((c) => c.id === selectedClassId);
  const activeSection = sections.find((s) => s.id === selectedSectionId);
  const activeYear = academicYears.find((y) => y.id === selectedYearId);
  const targetStudent = sectionStudents.find((s) => s.id === selectedStudentId);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col gap-6 pb-16">
      {/* Configuration & Actions Bar (Hidden during print) */}
      <div className="no-print bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-2">
              <Printer className="w-6 h-6 text-emerald-400" />
              التقارير المدرسية والطباعة الرسمية
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              إعداد وطباعة سجلات الدرجات، الشهادات الفردية، وقوائم الشرف بجودة عالية متوافقة مع A4
            </p>
          </div>

          <button
            type="button"
            onClick={handlePrint}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة التقرير الحالي</span>
          </button>
        </div>

        {/* Report Selector Tabs */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={() => setActiveReport('master_sheet')}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors ${
              activeReport === 'master_sheet'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-950 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>شيت الدرجات الرسمي العام</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveReport('student_card')}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors ${
              activeReport === 'student_card'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-950 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>بطاقة درجات الطالب الفردية</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveReport('honor_roll')}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors ${
              activeReport === 'honor_roll'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-950 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>لوحة المتفوقين (الأوائل)</span>
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2">
          <div>
            <label className="block text-[11px] font-bold text-slate-400 mb-1">العام الدراسي</label>
            <div className="relative">
              <select
                value={selectedYearId}
                onChange={(e) => setSelectedYearId(e.target.value)}
                className="w-full h-9 px-3 text-xs bg-slate-950 border border-slate-700 rounded-lg text-slate-200 font-bold focus:outline-hidden appearance-none cursor-pointer"
              >
                {academicYears.map((y) => (
                  <option key={y.id} value={y.id}>{y.name}</option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 mb-1">الصف</label>
            <div className="relative">
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-full h-9 px-3 text-xs bg-slate-950 border border-slate-700 rounded-lg text-slate-200 font-bold focus:outline-hidden appearance-none cursor-pointer"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-400 mb-1">الشعبة</label>
            <div className="relative">
              <select
                value={selectedSectionId}
                onChange={(e) => setSelectedSectionId(e.target.value)}
                className="w-full h-9 px-3 text-xs bg-slate-950 border border-slate-700 rounded-lg text-slate-200 font-bold focus:outline-hidden appearance-none cursor-pointer"
              >
                {availableSections.map((s) => (
                  <option key={s.id} value={s.id}>الشعبة {s.name}</option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>

          {activeReport === 'student_card' && (
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">اختر الطالب</label>
              <div className="relative">
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full h-9 px-3 text-xs bg-slate-950 border border-slate-700 rounded-lg text-slate-200 font-bold focus:outline-hidden appearance-none cursor-pointer"
                >
                  {sectionStudents.map((s) => (
                    <option key={s.id} value={s.id}>#{s.seatNumber} - {s.name}</option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Printable Paper Canvas Area (A4 Styled) */}
      <div className="bg-white text-slate-950 p-8 md:p-12 rounded-xl shadow-2xl max-w-5xl mx-auto w-full printable-card font-sans">
        {/* Official Header */}
        <div className="border-b-2 border-slate-900 pb-4 mb-6">
          <div className="flex items-center justify-between text-center">
            <div className="text-right">
              <h4 className="font-bold text-xs text-slate-700">جمهورية العراق</h4>
              <h3 className="font-black text-sm text-slate-900">وزارة التربية والتعليم</h3>
              <p className="text-xs text-slate-600">{settings.city}</p>
            </div>

            <div className="flex flex-col items-center">
              {settings.schoolLogo ? (
                <div className="mb-1.5 flex items-center justify-center">
                  <SchoolLogo
                    logoUrl={settings.schoolLogo}
                    schoolName={settings.schoolName}
                    size="lg"
                    className="max-h-16 max-w-[120px]"
                  />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-full border-2 border-slate-900 flex items-center justify-center font-black text-lg mb-1">
                  <School className="w-6 h-6 text-slate-900" />
                </div>
              )}
              <h2 className="font-black text-base text-slate-900">
                {settings.schoolName}
              </h2>
            </div>

            <div className="text-left font-mono text-xs text-slate-700">
              <p>العام: {activeYear?.name}</p>
              <p>التاريخ: {new Date().toLocaleDateString('ar-EG')}</p>
              <p>الصف: {activeClass?.name}</p>
            </div>
          </div>

          <div className="text-center mt-3 pt-2 border-t border-slate-300">
            <h1 className="text-lg font-black text-slate-900">
              {activeReport === 'master_sheet' && `شيت الدرجات الرسمي العام — الصف: ${activeClass?.name} (شعبة ${activeSection?.name})`}
              {activeReport === 'student_card' && `بطاقة درجات الطالب — ${targetStudent?.name || ''}`}
              {activeReport === 'honor_roll' && `لوحة الشرف والتفوق الدراسي — الصف: ${activeClass?.name}`}
            </h1>
          </div>
        </div>

        {/* Master Sheet Report Content */}
        {activeReport === 'master_sheet' && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-slate-800 text-xs">
              <thead>
                <tr className="bg-slate-200 border-b border-slate-800 font-bold">
                  <th className="border border-slate-800 p-2 text-center w-8">ت</th>
                  <th className="border border-slate-800 p-2 text-right">اسم الطالب الثلاثي واللقب</th>
                  {classSubjects.map((sub) => (
                    <th key={sub.id} className="border border-slate-800 p-1.5 text-center">
                      <div className="font-black">{sub.name}</div>
                      <div className="text-[10px] font-normal text-slate-600">سعي / نهائي</div>
                    </th>
                  ))}
                  <th className="border border-slate-800 p-2 text-center w-14">المجموع</th>
                  <th className="border border-slate-800 p-2 text-center w-14">المعدل</th>
                  <th className="border border-slate-800 p-2 text-center w-16">النتيجة</th>
                </tr>
              </thead>
              <tbody>
                {sectionStudents.map((stu, sIdx) => {
                  let totalFinal = 0;
                  let counted = 0;
                  let hasFailed = false;

                  return (
                    <tr key={stu.id} className="border-b border-slate-400">
                      <td className="border border-slate-700 p-1.5 text-center font-mono">
                        {sIdx + 1}
                      </td>
                      <td className="border border-slate-700 p-1.5 font-bold">
                        {stu.name}
                      </td>

                      {classSubjects.map((sub) => {
                        const key = buildGradeKey(
                          selectedYearId,
                          selectedClassId,
                          selectedSectionId,
                          sub.id,
                          stu.id
                        );
                        const rec = grades[key];
                        const yr = rec?.termYearlyScore ?? '—';
                        const fn = rec?.finalScore ?? '—';

                        if (rec?.finalScore !== null && rec?.finalScore !== undefined) {
                          totalFinal += rec.finalScore;
                          counted++;
                          if (rec.finalScore < sub.passScore) hasFailed = true;
                        }

                        return (
                          <td key={sub.id} className="border border-slate-700 p-1 text-center font-mono text-[11px]">
                            {yr} / <span className="font-bold">{fn}</span>
                          </td>
                        );
                      })}

                      <td className="border border-slate-700 p-1.5 text-center font-mono font-bold">
                        {counted > 0 ? totalFinal : '—'}
                      </td>
                      <td className="border border-slate-700 p-1.5 text-center font-mono font-black">
                        {counted > 0 ? `${Math.round((totalFinal / counted) * 10) / 10}%` : '—'}
                      </td>
                      <td className="border border-slate-700 p-1.5 text-center font-bold text-[11px]">
                        {counted === classSubjects.length ? (hasFailed ? 'مكمل/راسب' : 'ناجح') : 'ناقص'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Student Individual Grade Card */}
        {activeReport === 'student_card' && targetStudent && (
          <div className="flex flex-col gap-6">
            <div className="bg-slate-100 p-4 rounded border border-slate-300 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-500">اسم الطالب:</span>
                <p className="font-bold text-sm text-slate-900">{targetStudent.name}</p>
              </div>
              <div>
                <span className="text-slate-500">رقم القيد:</span>
                <p className="font-mono font-bold text-slate-900">
                  {targetStudent.registrationNumber || `#${targetStudent.seatNumber}`}
                </p>
              </div>
              <div>
                <span className="text-slate-500">الصف والشعبة:</span>
                <p className="font-bold text-slate-900">{activeClass?.name} - {activeSection?.name}</p>
              </div>
              <div>
                <span className="text-slate-500">العام الدراسي:</span>
                <p className="font-mono font-bold text-slate-900">{activeYear?.name}</p>
              </div>
            </div>

            <table className="w-full border-collapse border border-slate-800 text-xs">
              <thead>
                <tr className="bg-slate-200 border-b border-slate-800 font-bold">
                  <th className="border border-slate-800 p-2 text-right">المادة الدراسية</th>
                  <th className="border border-slate-800 p-2 text-center">درجة الفصل الأول</th>
                  <th className="border border-slate-800 p-2 text-center">درجة نصف السنة</th>
                  <th className="border border-slate-800 p-2 text-center">درجة الفصل الثاني</th>
                  <th className="border border-slate-800 p-2 text-center bg-amber-50">درجة السعي السنوي</th>
                  <th className="border border-slate-800 p-2 text-center">درجة الامتحان النهائي</th>
                  <th className="border border-slate-800 p-2 text-center bg-emerald-50">الدرجة النهائية</th>
                </tr>
              </thead>
              <tbody>
                {classSubjects.map((sub) => {
                  const key = buildGradeKey(
                    selectedYearId,
                    selectedClassId,
                    selectedSectionId,
                    sub.id,
                    targetStudent.id
                  );
                  const rec = grades[key];

                  return (
                    <tr key={sub.id} className="border-b border-slate-400">
                      <td className="border border-slate-700 p-2 font-bold">{sub.name}</td>
                      <td className="border border-slate-700 p-2 text-center font-mono">{rec?.term1Score ?? '—'}</td>
                      <td className="border border-slate-700 p-2 text-center font-mono">{rec?.midtermScore ?? '—'}</td>
                      <td className="border border-slate-700 p-2 text-center font-mono">{rec?.term2Score ?? '—'}</td>
                      <td className="border border-slate-700 p-2 text-center font-mono font-bold bg-amber-50">{rec?.termYearlyScore ?? '—'}</td>
                      <td className="border border-slate-700 p-2 text-center font-mono">{rec?.finalExamScore ?? '—'}</td>
                      <td className="border border-slate-700 p-2 text-center font-mono font-black bg-emerald-50 text-sm">{rec?.finalScore ?? '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Honor Roll Content */}
        {activeReport === 'honor_roll' && (
          <div className="py-4">
            <p className="text-center text-sm font-semibold text-slate-700 mb-6">
              تعلن إدارة {settings.schoolName} عن أسماء الطلبة المتفوقين تقديراً لجهودهم ومثابرتهم العلمية المتميزة
            </p>

            <div className="grid grid-cols-2 gap-4">
              {sectionStudents.slice(0, 10).map((stu, idx) => (
                <div key={stu.id} className="border-2 border-slate-800 p-3 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-slate-900 text-white font-black text-sm flex items-center justify-center font-mono">
                      {idx + 1}
                    </span>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{stu.name}</h4>
                      <span className="text-xs text-slate-500">#{stu.seatNumber}</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2 py-1 bg-amber-100 border border-amber-300 rounded text-amber-900">
                    طالب متفوق
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Official Signatures Section */}
        <div className="mt-12 pt-6 border-t border-slate-800 grid grid-cols-3 text-center text-xs font-bold text-slate-800">
          <div>
            <p className="text-slate-600 mb-8">مدرس المادة / المشرف</p>
            <p className="font-bold">التوقيع: .....................</p>
          </div>
          <div>
            <p className="text-slate-600 mb-8">رئيس اللجنة الامتحانية</p>
            <p className="font-bold">{settings.examCommitteeHead}</p>
          </div>
          <div>
            <p className="text-slate-600 mb-8">مدير المدرسة والختم الرسمي</p>
            <p className="font-bold">{settings.directorName}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
