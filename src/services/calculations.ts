import {
  GradeRecord,
  RoundingRule,
  GradeStage,
  Subject,
  Student,
  ExemptionSettings,
  GeneralExemptionResult,
  IndividualExemptionSubjectResult,
} from '../types';

/**
 * Rounds a number according to the school's configured rounding rule
 */
export function applyRounding(value: number, rule: RoundingRule): number {
  if (value === null || value === undefined || isNaN(value)) {
    return 0;
  }

  switch (rule) {
    case 'standard':
      // التقريب الرياضي المعتاد: >= 0.5 للأعلى
      return Math.round(value);
    case 'ceil':
      // جبر الكسر لصالح الطالب: أي كسر يُجبر للأعلى (مثال 49.1 -> 50)
      return Math.ceil(value);
    case 'floor':
      // حذف الكسور تماماً بدون تقريب
      return Math.floor(value);
    case 'one_decimal':
      // خانة عشرية واحدة
      return Math.round(value * 10) / 10;
    case 'two_decimals':
      // خانتان عشريتان
      return Math.round(value * 100) / 100;
    default:
      return Math.round(value);
  }
}

/**
 * حساب درجة السعي السنوي:
 * درجة السعي السنوي = (درجة الفصل الأول + درجة نصف السنة + درجة الفصل الثاني) ÷ 3
 * 
 * قاعدة أساسية: إذا كانت إحدى الدرجات فارغة، لا تعتبرها صفراً، ولا تحسب النتيجة.
 */
export function calculateTermYearlyScore(
  term1: number | null,
  midterm: number | null,
  term2: number | null,
  roundingRule: RoundingRule = 'standard'
): number | null {
  if (term1 === null || midterm === null || term2 === null) {
    return null;
  }
  if (isNaN(term1) || isNaN(midterm) || isNaN(term2)) {
    return null;
  }

  const rawAverage = (term1 + midterm + term2) / 3;
  return applyRounding(rawAverage, roundingRule);
}

/**
 * حساب الدرجة النهائية:
 * الدرجة النهائية = (درجة السعي السنوي + درجة الامتحان النهائي) ÷ 2
 * 
 * قاعدة أساسية: إذا كان السعي أو الامتحان النهائي فارغاً، لا تحسب الدرجة النهائية.
 */
export function calculateFinalScore(
  yearlyScore: number | null,
  finalExam: number | null,
  roundingRule: RoundingRule = 'standard'
): number | null {
  if (yearlyScore === null || finalExam === null) {
    return null;
  }
  if (isNaN(yearlyScore) || isNaN(finalExam)) {
    return null;
  }

  const rawAverage = (yearlyScore + finalExam) / 2;
  return applyRounding(rawAverage, roundingRule);
}

/**
 * إعادة حساب وتحديث سجل الدرجات بالكامل
 */
export function recalculateGradeRecord(
  record: Partial<GradeRecord>,
  roundingRule: RoundingRule = 'standard'
): { termYearlyScore: number | null; finalScore: number | null } {
  const term1 = record.term1Score !== undefined ? record.term1Score : null;
  const midterm = record.midtermScore !== undefined ? record.midtermScore : null;
  const term2 = record.term2Score !== undefined ? record.term2Score : null;
  const finalExam = record.finalExamScore !== undefined ? record.finalExamScore : null;

  const termYearlyScore = calculateTermYearlyScore(term1, midterm, term2, roundingRule);
  const finalScore = calculateFinalScore(termYearlyScore, finalExam, roundingRule);

  return {
    termYearlyScore,
    finalScore,
  };
}

/**
 * فحص هل الدرجة المطلوبة في مرحلة معينة مدخلة
 */
export function isGradeEnteredForStage(
  record: GradeRecord | undefined,
  stage: GradeStage
): boolean {
  if (!record) return false;

  switch (stage) {
    case 'term1':
      return record.term1Score !== null && !isNaN(record.term1Score);
    case 'midterm':
      return record.midtermScore !== null && !isNaN(record.midtermScore);
    case 'term2':
      return record.term2Score !== null && !isNaN(record.term2Score);
    case 'final':
      return record.finalExamScore !== null && !isNaN(record.finalExamScore);
    default:
      return false;
  }
}

/**
 * فحص اكتمال جميع الدرجات المتطلبة حتى هذه المرحلة
 */
export function isCompleteUpToStage(
  record: GradeRecord | undefined,
  stage: GradeStage
): boolean {
  if (!record) return false;

  switch (stage) {
    case 'term1':
      return record.term1Score !== null;
    case 'midterm':
      return record.term1Score !== null && record.midtermScore !== null;
    case 'term2':
      return record.term1Score !== null && record.midtermScore !== null && record.term2Score !== null;
    case 'final':
      return (
        record.term1Score !== null &&
        record.midtermScore !== null &&
        record.term2Score !== null &&
        record.finalExamScore !== null
      );
    default:
      return false;
  }
}

/**
 * التحقق من صحة الرقم المدخل
 */
export function validateScoreInput(
  rawInput: string,
  maxScore: number = 100
): { isValid: boolean; value: number | null; error?: string } {
  const trimmed = rawInput.trim();
  if (trimmed === '') {
    return { isValid: true, value: null };
  }

  // دعم الأرقام العربية المشرقية والإنجليزية
  const normalized = trimmed.replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());

  const num = Number(normalized);
  if (isNaN(num)) {
    return { isValid: false, value: null, error: 'الرجاء إدخال رقم صحيح أو كسر صالح' };
  }

  if (num < 0) {
    return { isValid: false, value: null, error: 'لا يمكن أن تكون الدرجة سالبة (أقل من 0)' };
  }

  if (num > maxScore) {
    return { isValid: false, value: null, error: `الدرجة لا يمكن أن تتجاوز الحد الأعلى (${maxScore})` };
  }

  return { isValid: true, value: num };
}

/**
 * تنسيق عرض الدرجة
 */
export function formatScore(score: number | null | undefined): string {
  if (score === null || score === undefined || isNaN(score)) {
    return '—';
  }
  return score.toString();
}

/**
 * وصف خيارات التقريب باللغة العربية
 */
export const ROUNDING_RULE_LABELS: Record<RoundingRule, { title: string; desc: string }> = {
  standard: {
    title: 'تقريب رياضي لأقرب عدد صحيح (0.5 للأعلى)',
    desc: 'الكسر من 0.5 وما فوق يُقرب إلى الرقم التالي، وأقل من 0.5 يُحذف (مثال: 74.5 -> 75، 74.4 -> 74)',
  },
  ceil: {
    title: 'جبر الكسر لصالح الطالب (Ceil)',
    desc: 'أي كسر يُجبر إلى الدرجة الأعلى تلقائياً لمصلحة الطالب (مثال: 49.1 -> 50، 72.05 -> 73)',
  },
  floor: {
    title: 'حذف الكسور بدون تقريب (Floor)',
    desc: 'إلغاء أي جزء عشري تماماً (مثال: 74.9 -> 74)',
  },
  one_decimal: {
    title: 'إبقاء كسر عشري واحد (0.1)',
    desc: 'عرض الدرجة مع مرتبة عشرية واحدة (مثال: 78.3)',
  },
  two_decimals: {
    title: 'إبقاء كسرين عشريين (0.01)',
    desc: 'عرض الدرجة مع مرتبتين عشريتين لأعلى دقة (مثال: 78.33)',
  },
};

/**
 * تقييم استحقاق الطالب للإعفاء العام والإعفاء الفردي بصورة مركزية وموحدة
 */
export function evaluateStudentExemption(
  student: Student,
  classSubjects: Subject[],
  studentGrades: Record<string, GradeRecord | undefined>,
  exemptionSettings: ExemptionSettings,
  schoolRoundingRule: RoundingRule
): GeneralExemptionResult {
  let totalYearlyScore = 0;
  let completedSubjectsCount = 0;
  let hasIncomplete = false;
  let minSubjectScore: number | null = null;
  let lowestSubjectName: string | undefined = undefined;

  const individualResults: IndividualExemptionSubjectResult[] = [];
  const subjectsBelowMin: { subjectId: string; subjectName: string; score: number }[] = [];

  classSubjects.forEach((sub) => {
    const record = studentGrades[sub.id];
    const score = record ? record.termYearlyScore : null;

    let individualStatus: 'مستحق للإعفاء الفردي' | 'غير مستحق' | 'غير مكتمل' = 'غير مكتمل';
    if (score !== null && score !== undefined && !isNaN(score)) {
      totalYearlyScore += score;
      completedSubjectsCount++;
      if (minSubjectScore === null || score < minSubjectScore) {
        minSubjectScore = score;
        lowestSubjectName = sub.name;
      }
      if (score < exemptionSettings.generalMinSubjectScore) {
        subjectsBelowMin.push({ subjectId: sub.id, subjectName: sub.name, score });
      }
      if (score >= exemptionSettings.individualMinScore) {
        individualStatus = 'مستحق للإعفاء الفردي';
      } else {
        individualStatus = 'غير مستحق';
      }
    } else {
      hasIncomplete = true;
    }

    individualResults.push({
      subjectId: sub.id,
      subjectName: sub.name,
      yearlyScore: score,
      requiredScore: exemptionSettings.individualMinScore,
      status: individualStatus,
    });
  });

  const totalApprovedSubjects = classSubjects.length;
  const isComplete = !hasIncomplete && completedSubjectsCount === totalApprovedSubjects && totalApprovedSubjects > 0;

  if (!isComplete) {
    return {
      student,
      rawAverage: null,
      evaluatedAverage: null,
      appliedJabr: exemptionSettings.enableGeneralJabr,
      minSubjectScore,
      lowestSubjectName,
      isComplete: false,
      status: 'غير مكتمل',
      reason: totalApprovedSubjects === 0 
        ? 'لا توجد مواد مسجلة لهذا الصف' 
        : `لم تكتمل درجات السعي السنوي (${completedSubjectsCount} من ${totalApprovedSubjects} مواد مسجلة)`,
      individualResults,
      subjectsBelowMin,
      isNearEligible: false,
    };
  }

  // حساب المعدل بدقة وقسمته حصراً على عدد المواد المعتمدة للصف
  const rawAverage = totalYearlyScore / totalApprovedSubjects;

  // تقييم الجبر: عند التفعيل يُطبّق نظام التقريب المعتمد للمدرسة، وعند الإلغاء يُعتمد المعدل الدقيق
  let evaluatedAverage = rawAverage;
  if (exemptionSettings.enableGeneralJabr) {
    evaluatedAverage = applyRounding(rawAverage, schoolRoundingRule);
  }

  const meetsAverage = evaluatedAverage >= exemptionSettings.generalMinAverage;
  const meetsMinSubject = minSubjectScore !== null && minSubjectScore >= exemptionSettings.generalMinSubjectScore;

  // فحص حالة "قريب من الاستحقاق": يحقق شرط المعدل لكن لديه مادة أو مادتان فقط دون الحد الأدنى
  const isNearEligible = !meetsMinSubject && meetsAverage && (subjectsBelowMin.length === 1 || subjectsBelowMin.length === 2);

  let status: 'معفى عام' | 'غير مشمول' = 'غير مشمول';
  let reason = '';

  if (meetsAverage && meetsMinSubject) {
    status = 'معفى عام';
    reason = 'مستوفٍ لكافة الشروط المقررة';
  } else {
    status = 'غير مشمول';
    const reasons: string[] = [];
    if (!meetsAverage) {
      if (exemptionSettings.enableGeneralJabr) {
        reasons.push(`المعدل المعتمد بعد الجبر (${evaluatedAverage}) أقل من المطلوب (${exemptionSettings.generalMinAverage})`);
      } else {
        reasons.push(`المعدل العام الأصلي (${(Math.round(rawAverage * 100) / 100).toFixed(2)}) أقل من المطلوب (${exemptionSettings.generalMinAverage}) دون جبر`);
      }
    }
    if (!meetsMinSubject && minSubjectScore !== null) {
      if (subjectsBelowMin.length === 1) {
        reasons.push(`مادة واحدة دون الحد الأدنى (${subjectsBelowMin[0].subjectName}: ${subjectsBelowMin[0].score} < ${exemptionSettings.generalMinSubjectScore})`);
      } else if (subjectsBelowMin.length === 2) {
        reasons.push(`مادتان دون الحد الأدنى (${subjectsBelowMin.map(s => `${s.subjectName}: ${s.score}`).join('، ')} < ${exemptionSettings.generalMinSubjectScore})`);
      } else {
        reasons.push(`توجد ${subjectsBelowMin.length} مواد دون الحد الأدنى (${exemptionSettings.generalMinSubjectScore})`);
      }
    }
    reason = reasons.join('، و');
  }

  return {
    student,
    rawAverage: Math.round(rawAverage * 100) / 100,
    evaluatedAverage: exemptionSettings.enableGeneralJabr ? evaluatedAverage : Math.round(rawAverage * 100) / 100,
    appliedJabr: exemptionSettings.enableGeneralJabr,
    minSubjectScore,
    lowestSubjectName,
    isComplete: true,
    status,
    reason,
    individualResults,
    subjectsBelowMin,
    isNearEligible,
  };
}
