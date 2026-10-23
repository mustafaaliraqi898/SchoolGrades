import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Student, GradeRecord, GradeStage, AppSettings } from '../../types';
import { validateScoreInput, formatScore } from '../../services/calculations';
import { EditConfirmationModal } from './EditConfirmationModal';
import { Check, AlertCircle, Lock, Edit3, MoveHorizontal, RotateCcw } from 'lucide-react';

interface GradeTableProps {
  students: Student[];
  grades: Record<string, GradeRecord>;
  currentStage: GradeStage;
  maxScore: number;
  settings: AppSettings;
  searchQuery: string;
  onSaveGrade: (
    studentId: string,
    field: 'term1Score' | 'midtermScore' | 'term2Score' | 'finalExamScore',
    fieldArabic: string,
    value: number | null
  ) => { success: boolean; error?: string };
}

type EditableField = 'term1Score' | 'midtermScore' | 'term2Score' | 'finalExamScore';

export type ColumnKey =
  | 'index'
  | 'studentName'
  | 'term1'
  | 'midterm'
  | 'term2'
  | 'termYearly'
  | 'finalExam'
  | 'finalScore';

export interface ColumnWidths {
  index: number;
  studentName: number;
  term1: number;
  midterm: number;
  term2: number;
  termYearly: number;
  finalExam: number;
  finalScore: number;
}

export const DEFAULT_COLUMN_WIDTHS: ColumnWidths = {
  index: 56,
  studentName: 260,
  term1: 140,
  midterm: 140,
  term2: 140,
  termYearly: 150,
  finalExam: 150,
  finalScore: 150,
};

const COLUMN_LIMITS: Record<ColumnKey, { min: number; max: number }> = {
  index: { min: 45, max: 95 },
  studentName: { min: 180, max: 550 },
  term1: { min: 110, max: 280 },
  midterm: { min: 110, max: 280 },
  term2: { min: 110, max: 280 },
  termYearly: { min: 120, max: 290 },
  finalExam: { min: 120, max: 290 },
  finalScore: { min: 120, max: 290 },
};

interface PendingConfirmation {
  student: Student;
  field: EditableField;
  fieldArabic: string;
  currentValue: number | null;
  proposedNewValue: number | null;
}

export const GradeTable: React.FC<GradeTableProps> = ({
  students,
  grades,
  currentStage,
  maxScore,
  settings,
  searchQuery,
  onSaveGrade,
}) => {
  // Filter students based on search query without breaking seat numbers or sorting
  const filteredStudents = students.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

  // Column widths with localStorage persistence
  const [colWidths, setColWidths] = useState<ColumnWidths>(() => {
    try {
      const saved = localStorage.getItem('school_app_table_col_widths');
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_COLUMN_WIDTHS, ...parsed };
      }
    } catch (e) {
      console.warn('Failed to load table column widths from localStorage', e);
    }
    return DEFAULT_COLUMN_WIDTHS;
  });

  const [resizingCol, setResizingCol] = useState<ColumnKey | null>(null);
  const resizeStateRef = useRef<{
    colKey: ColumnKey;
    startX: number;
    startWidth: number;
  } | null>(null);

  // Active cell being edited: { studentIndex: number, field: EditableField }
  const [activeCell, setActiveCell] = useState<{ studentIndex: number; field: EditableField } | null>(null);
  const [inputValue, setInputValue] = useState<string>('');
  const [inputError, setInputError] = useState<string | null>(null);
  const [savedCellFlash, setSavedCellFlash] = useState<{ studentId: string; field: EditableField } | null>(null);

  // Protection modal state for earlier term editing
  const [pendingConfirmation, setPendingConfirmation] = useState<PendingConfirmation | null>(null);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const tableRef = useRef<HTMLTableElement | null>(null);

  // Resizing mouse events handler for RTL table (dragging left increases width)
  const handleMouseDownResize = (colKey: ColumnKey, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    resizeStateRef.current = {
      colKey,
      startX: e.clientX,
      startWidth: colWidths[colKey],
    };
    setResizingCol(colKey);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!resizeStateRef.current) return;
      const { colKey: activeCol, startX, startWidth } = resizeStateRef.current;
      // In RTL, dragging mouse towards the left (decreasing clientX) enlarges the column!
      const delta = startX - moveEvent.clientX;
      const limits = COLUMN_LIMITS[activeCol];
      const newWidth = Math.max(limits.min, Math.min(limits.max, Math.round(startWidth + delta)));

      setColWidths((prev) => ({
        ...prev,
        [activeCol]: newWidth,
      }));
    };

    const handleMouseUp = () => {
      if (resizeStateRef.current) {
        setColWidths((latest) => {
          try {
            localStorage.setItem('school_app_table_col_widths', JSON.stringify(latest));
          } catch (err) {
            console.warn(err);
          }
          return latest;
        });
      }
      resizeStateRef.current = null;
      setResizingCol(null);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleDoubleClickResize = (colKey: ColumnKey) => {
    setColWidths((prev) => {
      const updated = {
        ...prev,
        [colKey]: DEFAULT_COLUMN_WIDTHS[colKey],
      };
      try {
        localStorage.setItem('school_app_table_col_widths', JSON.stringify(updated));
      } catch (err) {
        console.warn(err);
      }
      return updated;
    });
  };

  const handleResetAllWidths = () => {
    setColWidths(DEFAULT_COLUMN_WIDTHS);
    try {
      localStorage.setItem('school_app_table_col_widths', JSON.stringify(DEFAULT_COLUMN_WIDTHS));
    } catch (err) {
      console.warn(err);
    }
  };

  // Helper to render resize divider handle on column boundary
  const renderResizeHandle = (colKey: ColumnKey) => (
    <div
      onMouseDown={(e) => handleMouseDownResize(colKey, e)}
      onDoubleClick={() => handleDoubleClickResize(colKey)}
      className={`absolute left-0 top-0 bottom-0 w-3.5 -translate-x-1/2 cursor-col-resize z-40 group/handle flex items-center justify-center select-none ${
        resizingCol === colKey ? 'opacity-100' : 'hover:opacity-100'
      }`}
      title="اسحب لتعديل عرض العمود (نقر مزدوج للضبط الافتراضي)"
    >
      <div
        className={`h-full transition-all duration-150 ${
          resizingCol === colKey
            ? 'w-1 bg-emerald-400 shadow-sm shadow-emerald-400/50'
            : 'w-0.5 bg-slate-700/80 group-hover/handle:w-1 group-hover/handle:bg-emerald-400'
        }`}
      />
    </div>
  );

  // Determine current primary field for the active stage
  const primaryFieldForStage: Record<GradeStage, EditableField> = {
    term1: 'term1Score',
    midterm: 'midtermScore',
    term2: 'term2Score',
    final: 'finalExamScore',
  };

  const primaryField = primaryFieldForStage[currentStage];

  const fieldToWidthKey: Record<EditableField, ColumnKey> = {
    term1Score: 'term1',
    midtermScore: 'midterm',
    term2Score: 'term2',
    finalExamScore: 'finalExam',
  };

  // Helper to get field title in Arabic
  const getFieldArabic = (field: EditableField): string => {
    switch (field) {
      case 'term1Score':
        return 'درجة الفصل الأول';
      case 'midtermScore':
        return 'درجة نصف السنة';
      case 'term2Score':
        return 'درجة الفصل الثاني';
      case 'finalExamScore':
        return 'درجة الامتحان النهائي';
    }
  };

  // Helper to check if a field is considered "previous stage" relative to current active stage
  const isPreviousStageField = (field: EditableField): boolean => {
    const stageOrder: Record<EditableField, number> = {
      term1Score: 1,
      midtermScore: 2,
      term2Score: 3,
      finalExamScore: 4,
    };
    const currentOrder: Record<GradeStage, number> = {
      term1: 1,
      midterm: 2,
      term2: 3,
      final: 4,
    };
    return stageOrder[field] < currentOrder[currentStage];
  };

  // Focus input automatically when activeCell changes
  useEffect(() => {
    if (activeCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [activeCell]);

  // Start editing a cell
  const startEditing = (studentIndex: number, field: EditableField, forceBypassConfirmation = false) => {
    const student = filteredStudents[studentIndex];
    if (!student) return;

    const gradeRecord = Object.values(grades).find((g) => g.studentId === student.id);
    const currentValue = gradeRecord ? gradeRecord[field] : null;

    // Check if this is an edit of a previous term that already has a value, and requires confirmation
    if (
      !forceBypassConfirmation &&
      settings.confirmPreviousTermEdits &&
      isPreviousStageField(field) &&
      currentValue !== null
    ) {
      setPendingConfirmation({
        student,
        field,
        fieldArabic: getFieldArabic(field),
        currentValue,
        proposedNewValue: null,
      });
      return;
    }

    setActiveCell({ studentIndex, field });
    setInputValue(currentValue !== null && currentValue !== undefined ? currentValue.toString() : '');
    setInputError(null);
  };

  // Save current active cell
  const handleSave = (moveToNext: boolean = true) => {
    if (!activeCell) return;

    const student = filteredStudents[activeCell.studentIndex];
    if (!student) return;

    const validation = validateScoreInput(inputValue, maxScore);
    if (!validation.isValid) {
      setInputError(validation.error || 'درجة غير صالحة');
      return;
    }

    const result = onSaveGrade(
      student.id,
      activeCell.field,
      getFieldArabic(activeCell.field),
      validation.value
    );

    if (!result.success) {
      setInputError(result.error || 'فشل حفظ الدرجة محلياً');
      return;
    }

    setSavedCellFlash({ studentId: student.id, field: activeCell.field });
    setTimeout(() => {
      setSavedCellFlash(null);
    }, 1200);

    setInputError(null);

    if (moveToNext) {
      const nextIndex = activeCell.studentIndex + 1;
      if (nextIndex < filteredStudents.length) {
        startEditing(nextIndex, activeCell.field, true);
      } else {
        setActiveCell(null);
      }
    } else {
      setActiveCell(null);
    }
  };

  // Cancel edit
  const handleCancel = () => {
    setActiveCell(null);
    setInputError(null);
    setInputValue('');
  };

  // Handle keyboard events in table cell
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave(true);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      handleSave(false);
      if (activeCell && activeCell.studentIndex + 1 < filteredStudents.length) {
        startEditing(activeCell.studentIndex + 1, activeCell.field, true);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      handleSave(false);
      if (activeCell && activeCell.studentIndex - 1 >= 0) {
        startEditing(activeCell.studentIndex - 1, activeCell.field, true);
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      handleSave(false);
      if (e.shiftKey) {
        if (activeCell && activeCell.studentIndex - 1 >= 0) {
          startEditing(activeCell.studentIndex - 1, activeCell.field, true);
        }
      } else {
        if (activeCell && activeCell.studentIndex + 1 < filteredStudents.length) {
          startEditing(activeCell.studentIndex + 1, activeCell.field, true);
        }
      }
    }
  };

  // Render cell content and styling
  const renderScoreCell = (
    student: Student,
    studentIndex: number,
    field: EditableField,
    fieldArabic: string,
    isPrimaryForStage: boolean
  ) => {
    const gradeRecord = Object.values(grades).find((g) => g.studentId === student.id);
    const score = gradeRecord ? gradeRecord[field] : null;
    const isEditing = activeCell?.studentIndex === studentIndex && activeCell?.field === field;
    const isSaved = savedCellFlash?.studentId === student.id && savedCellFlash?.field === field;
    const isPrevious = isPreviousStageField(field);

    const widthKey = fieldToWidthKey[field];
    const cellWidthStyle = {
      width: `${colWidths[widthKey]}px`,
      minWidth: `${colWidths[widthKey]}px`,
      maxWidth: `${colWidths[widthKey]}px`,
    };

    if (isEditing) {
      return (
        <td
          key={field}
          style={cellWidthStyle}
          className="p-1 bg-slate-900 ring-2 ring-emerald-500 relative z-[15] border-b border-l border-slate-800"
        >
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                if (inputError) setInputError(null);
              }}
              onKeyDown={handleKeyDown}
              onBlur={() => handleSave(false)}
              className="w-full h-10 px-3 text-center font-mono text-base font-bold bg-slate-950 border border-emerald-500 rounded text-emerald-400 focus:outline-hidden"
              placeholder={`0 - ${maxScore}`}
              dir="ltr"
            />
            {inputError && (
              <div className="absolute top-full right-0 mt-1 z-30 bg-red-950 text-red-300 text-xs px-2.5 py-1.5 rounded border border-red-700 shadow-xl whitespace-nowrap flex items-center gap-1.5 animate-in fade-in">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{inputError}</span>
              </div>
            )}
          </div>
        </td>
      );
    }

    const isEmpty = score === null || score === undefined;

    return (
      <td
        key={field}
        data-col={widthKey}
        data-empty={isEmpty ? "true" : undefined}
        style={cellWidthStyle}
        onClick={() => startEditing(studentIndex, field)}
        className={`p-2.5 text-center font-mono text-sm transition-all duration-150 cursor-pointer select-none relative group border-b border-l border-slate-800/80 ${
          isPrimaryForStage
            ? 'bg-slate-900/70 hover:bg-slate-800/90'
            : isPrevious
            ? 'bg-slate-950/40 text-slate-400 hover:bg-slate-900/60'
            : 'bg-slate-950/30'
        } ${
          isEmpty
            ? 'bg-red-950/20 text-red-400 border-red-900/40 hover:bg-red-950/30 font-semibold'
            : 'text-slate-100 font-bold'
        }`}
        title={
          isEmpty
            ? `الدرجة غير مدخلة بعد (انقر للإدخال)`
            : isPrevious
            ? `درجة سابقة (${fieldArabic}): ${score} (انقر للتعديل مع حماية السجلات)`
            : `انقر للتعديل (${fieldArabic})`
        }
      >
        <div className="flex items-center justify-center gap-1.5">
          {isSaved ? (
            <span className="flex items-center gap-1 text-emerald-400 text-xs font-bold animate-pulse">
              <Check className="w-4 h-4" />
              <span>{formatScore(score)}</span>
            </span>
          ) : isEmpty ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-900/30 text-red-300 border border-red-800/50">
              غير مدخلة
            </span>
          ) : (
            <span className="text-base tracking-wide">{formatScore(score)}</span>
          )}

          {isPrevious && !isEmpty && (
            <Lock className="w-3 h-3 text-slate-500 opacity-60 group-hover:opacity-100" />
          )}
          {isPrimaryForStage && (
            <Edit3 className="w-3 h-3 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
        </div>
      </td>
    );
  };

  // Render computed read-only cell
  const renderComputedCell = (
    score: number | null | undefined,
    label: string,
    keySuffix: string,
    widthKey: ColumnKey
  ) => {
    const isMissing = score === null || score === undefined;
    const cellWidthStyle = {
      width: `${colWidths[widthKey]}px`,
      minWidth: `${colWidths[widthKey]}px`,
      maxWidth: `${colWidths[widthKey]}px`,
    };

    return (
      <td
        key={keySuffix}
        data-col={widthKey}
        data-empty={isMissing ? "true" : undefined}
        style={cellWidthStyle}
        className={`p-2.5 text-center font-mono text-sm font-bold border-b border-l border-slate-800/80 ${
          isMissing
            ? 'bg-amber-950/10 text-amber-500/80 border-amber-900/20'
            : score >= settings.passScoreDefault
            ? 'bg-emerald-950/20 text-emerald-400 border-emerald-900/30'
            : 'bg-red-950/30 text-red-400 border-red-900/30'
        }`}
        title={isMissing ? `في انتظار اكتمال الدرجات لحساب ${label}` : `${label}: ${score}`}
      >
        {isMissing ? (
          <span className="text-xs text-amber-400/70 font-sans">
            — ناقصة —
          </span>
        ) : (
          <span className="text-base font-extrabold">{score}</span>
        )}
      </td>
    );
  };

  return (
    <div className="w-full flex flex-col gap-2">
      {/* Table Helper & Reset Column Widths Bar */}
      <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 px-1 py-1">
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
          <MoveHorizontal className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>
            اسحب حواف أي عمود لتغيير عرضه يدوياً كما في Excel (نقر مزدوج على الحافة للضبط التلقائي).
          </span>
        </div>

        <button
          type="button"
          onClick={handleResetAllWidths}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-[11px] font-bold transition-colors cursor-pointer"
          title="استعادة عرض جميع الأعمدة إلى المقاسات القياسية"
        >
          <RotateCcw className="w-3 h-3 text-amber-400" />
          <span>إعادة ضبط أبعاد الأعمدة</span>
        </button>
      </div>

      {/* Excel Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 shadow-2xl">
        <table ref={tableRef} className="w-full border-separate border-spacing-0 text-right select-none">
          {/* Explicit colgroup to enforce dynamic widths */}
          <colgroup>
            <col style={{ width: `${colWidths.index}px` }} />
            <col style={{ width: `${colWidths.studentName}px` }} />
            <col style={{ width: `${colWidths.term1}px` }} />
            {(currentStage === 'midterm' || currentStage === 'term2' || currentStage === 'final') && (
              <col style={{ width: `${colWidths.midterm}px` }} />
            )}
            {(currentStage === 'term2' || currentStage === 'final') && (
              <>
                <col style={{ width: `${colWidths.term2}px` }} />
                <col style={{ width: `${colWidths.termYearly}px` }} />
              </>
            )}
            {currentStage === 'final' && (
              <>
                <col style={{ width: `${colWidths.finalExam}px` }} />
                <col style={{ width: `${colWidths.finalScore}px` }} />
              </>
            )}
          </colgroup>

          <thead>
            <tr className="bg-slate-900 border-b border-slate-700 text-xs font-bold text-slate-300 uppercase tracking-wider">
              {/* Sticky Column 1: ت (التسلسل) */}
              <th
                style={{
                  position: 'sticky',
                  right: 0,
                  width: `${colWidths.index}px`,
                  minWidth: `${colWidths.index}px`,
                  maxWidth: `${colWidths.index}px`,
                }}
                className="relative p-3 text-center border-b border-l border-slate-800 bg-slate-900 text-slate-300 font-bold z-[35]"
              >
                <span>ت</span>
                {renderResizeHandle('index')}
              </th>

              {/* Sticky Column 2: اسم الطالب */}
              <th
                style={{
                  position: 'sticky',
                  right: `${colWidths.index}px`,
                  width: `${colWidths.studentName}px`,
                  minWidth: `${colWidths.studentName}px`,
                  maxWidth: `${colWidths.studentName}px`,
                }}
                className="relative p-3 text-right border-b border-l-2 border-l-slate-700 border-slate-800 bg-slate-900 text-slate-200 font-bold z-[35] shadow-[-4px_0_10px_-2px_rgba(0,0,0,0.6)]"
              >
                <div className="flex items-center justify-between">
                  <span>اسم الطالب</span>
                  <span className="text-[10px] text-slate-500 font-mono font-normal">
                    {colWidths.studentName}px
                  </span>
                </div>
                {renderResizeHandle('studentName')}
              </th>

              {/* Stage 1 Column: درجة الفصل الأول */}
              <th
                style={{
                  width: `${colWidths.term1}px`,
                  minWidth: `${colWidths.term1}px`,
                  maxWidth: `${colWidths.term1}px`,
                }}
                className={`relative p-3 text-center border-b border-l border-slate-800 ${
                  currentStage === 'term1' ? 'bg-blue-950/60 text-blue-300 border-b-2 border-b-blue-500' : 'bg-slate-900 text-slate-400'
                }`}
              >
                <span>درجة الفصل الأول</span>
                {currentStage === 'term1' && <span className="block text-[10px] text-blue-400 font-normal">● قيد الإدخال</span>}
                {renderResizeHandle('term1')}
              </th>

              {/* Stage 2 Column: درجة نصف السنة */}
              {(currentStage === 'midterm' || currentStage === 'term2' || currentStage === 'final') && (
                <th
                  style={{
                    width: `${colWidths.midterm}px`,
                    minWidth: `${colWidths.midterm}px`,
                    maxWidth: `${colWidths.midterm}px`,
                  }}
                  className={`relative p-3 text-center border-b border-l border-slate-800 ${
                    currentStage === 'midterm' ? 'bg-cyan-950/60 text-cyan-300 border-b-2 border-b-cyan-500' : 'bg-slate-900 text-slate-400'
                  }`}
                >
                  <span>درجة نصف السنة</span>
                  {currentStage === 'midterm' && <span className="block text-[10px] text-cyan-400 font-normal">● قيد الإدخال</span>}
                  {renderResizeHandle('midterm')}
                </th>
              )}

              {/* Stage 3 Column: درجة الفصل الثاني */}
              {(currentStage === 'term2' || currentStage === 'final') && (
                <th
                  style={{
                    width: `${colWidths.term2}px`,
                    minWidth: `${colWidths.term2}px`,
                    maxWidth: `${colWidths.term2}px`,
                  }}
                  className={`relative p-3 text-center border-b border-l border-slate-800 ${
                    currentStage === 'term2' ? 'bg-amber-950/60 text-amber-300 border-b-2 border-b-amber-500' : 'bg-slate-900 text-slate-400'
                  }`}
                >
                  <span>درجة الفصل الثاني</span>
                  {currentStage === 'term2' && <span className="block text-[10px] text-amber-400 font-normal">● قيد الإدخال</span>}
                  {renderResizeHandle('term2')}
                </th>
              )}

              {/* Auto Calculated: درجة السعي السنوي */}
              {(currentStage === 'term2' || currentStage === 'final') && (
                <th
                  style={{
                    width: `${colWidths.termYearly}px`,
                    minWidth: `${colWidths.termYearly}px`,
                    maxWidth: `${colWidths.termYearly}px`,
                  }}
                  className="relative p-3 text-center border-b border-l border-slate-800 bg-slate-900 text-amber-300"
                >
                  <div className="flex flex-col items-center">
                    <span>درجة السعي السنوي</span>
                    <span className="text-[10px] text-amber-400/80 font-normal">(محسوبة تلقائياً ÷3)</span>
                  </div>
                  {renderResizeHandle('termYearly')}
                </th>
              )}

              {/* Stage 4 Column: درجة الامتحان النهائي */}
              {currentStage === 'final' && (
                <th
                  style={{
                    width: `${colWidths.finalExam}px`,
                    minWidth: `${colWidths.finalExam}px`,
                    maxWidth: `${colWidths.finalExam}px`,
                  }}
                  className="relative p-3 text-center border-b border-l border-slate-800 bg-emerald-950/60 text-emerald-300 border-b-2 border-b-emerald-500"
                >
                  <span>درجة الامتحان النهائي</span>
                  <span className="block text-[10px] text-emerald-400 font-normal">● قيد الإدخال</span>
                  {renderResizeHandle('finalExam')}
                </th>
              )}

              {/* Auto Calculated: الدرجة النهائية */}
              {currentStage === 'final' && (
                <th
                  style={{
                    width: `${colWidths.finalScore}px`,
                    minWidth: `${colWidths.finalScore}px`,
                    maxWidth: `${colWidths.finalScore}px`,
                  }}
                  className="relative p-3 text-center border-b border-l border-slate-800 bg-slate-900 text-emerald-400 font-black"
                >
                  <div className="flex flex-col items-center">
                    <span>الدرجة النهائية</span>
                    <span className="text-[10px] text-emerald-300/80 font-normal">(محسوبة تلقائياً ÷2)</span>
                  </div>
                  {renderResizeHandle('finalScore')}
                </th>
              )}
            </tr>
          </thead>

          <tbody>
            {filteredStudents.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-slate-500 text-sm border-b border-slate-800 bg-slate-950">
                  {searchQuery ? 'لا توجد نتائج مطابقة لاسم الطالب المبحوث عنه.' : 'لا يوجد طلاب مسجلون في هذه الشعبة.'}
                </td>
              </tr>
            ) : (
              filteredStudents.map((student, sIdx) => {
                const gradeRecord = Object.values(grades).find((g) => g.studentId === student.id);

                return (
                  <tr
                    key={student.id}
                    className="hover:bg-slate-900/50 transition-colors group"
                  >
                    {/* Sticky Column 1: Index */}
                    <td
                      style={{
                        position: 'sticky',
                        right: 0,
                        width: `${colWidths.index}px`,
                        minWidth: `${colWidths.index}px`,
                        maxWidth: `${colWidths.index}px`,
                      }}
                      className="p-2.5 text-center text-xs text-slate-400 font-mono border-b border-l border-slate-800/80 bg-slate-950 group-hover:bg-slate-900 z-[25] transition-colors"
                    >
                      {sIdx + 1}
                    </td>

                    {/* Sticky Column 2: Student Name */}
                    <td
                      style={{
                        position: 'sticky',
                        right: `${colWidths.index}px`,
                        width: `${colWidths.studentName}px`,
                        minWidth: `${colWidths.studentName}px`,
                        maxWidth: `${colWidths.studentName}px`,
                      }}
                      className="p-2.5 border-b border-l-2 border-l-slate-700 border-slate-800/80 bg-slate-950 group-hover:bg-slate-900 z-[25] shadow-[-4px_0_10px_-2px_rgba(0,0,0,0.6)] transition-colors overflow-hidden"
                    >
                      <div className="flex items-center justify-between gap-2 overflow-hidden">
                        <span
                          className="font-bold text-slate-200 text-sm group-hover:text-emerald-400 transition-colors truncate block flex-1"
                          title={student.name}
                        >
                          {student.name}
                        </span>
                        <span
                          className="text-[11px] text-slate-500 font-mono shrink-0"
                          title={`رقم القيد: ${student.registrationNumber || student.seatNumber}`}
                        >
                          {student.registrationNumber ? `قيد: ${student.registrationNumber}` : `#${student.seatNumber}`}
                        </span>
                      </div>
                    </td>

                    {/* Column 1: درجة الفصل الأول */}
                    {renderScoreCell(
                      student,
                      sIdx,
                      'term1Score',
                      'درجة الفصل الأول',
                      currentStage === 'term1'
                    )}

                    {/* Column 2: درجة نصف السنة */}
                    {(currentStage === 'midterm' || currentStage === 'term2' || currentStage === 'final') &&
                      renderScoreCell(
                        student,
                        sIdx,
                        'midtermScore',
                        'درجة نصف السنة',
                        currentStage === 'midterm'
                      )}

                    {/* Column 3: درجة الفصل الثاني */}
                    {(currentStage === 'term2' || currentStage === 'final') &&
                      renderScoreCell(
                        student,
                        sIdx,
                        'term2Score',
                        'درجة الفصل الثاني',
                        currentStage === 'term2'
                      )}

                    {/* Auto Column: درجة السعي السنوي */}
                    {(currentStage === 'term2' || currentStage === 'final') &&
                      renderComputedCell(
                        gradeRecord?.termYearlyScore,
                        'درجة السعي السنوي',
                        `yearly_${student.id}`,
                        'termYearly'
                      )}

                    {/* Column 5: درجة الامتحان النهائي */}
                    {currentStage === 'final' &&
                      renderScoreCell(
                        student,
                        sIdx,
                        'finalExamScore',
                        'درجة الامتحان النهائي',
                        true
                      )}

                    {/* Auto Column: الدرجة النهائية */}
                    {currentStage === 'final' &&
                      renderComputedCell(
                        gradeRecord?.finalScore,
                        'الدرجة النهائية',
                        `final_${student.id}`,
                        'finalScore'
                      )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Confirmation Modal for Safeguarding Previous Grades */}
      {pendingConfirmation && (
        <EditConfirmationModal
          isOpen={true}
          studentName={pendingConfirmation.student.name}
          fieldArabic={pendingConfirmation.fieldArabic}
          currentValue={pendingConfirmation.currentValue}
          newValue={pendingConfirmation.proposedNewValue}
          onConfirm={() => {
            const studentIdx = filteredStudents.findIndex((s) => s.id === pendingConfirmation.student.id);
            const targetField = pendingConfirmation.field;
            setPendingConfirmation(null);
            if (studentIdx !== -1) {
              startEditing(studentIdx, targetField, true);
            }
          }}
          onCancel={() => setPendingConfirmation(null)}
        />
      )}
    </div>
  );
};
