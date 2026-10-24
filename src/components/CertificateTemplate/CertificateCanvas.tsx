import React from 'react';
import {
  AppSettings,
  CertificateTemplateConfig,
  CertificateElementKey,
} from '../../types';
import { School, Sparkles } from 'lucide-react';

export interface CertificateCanvasProps {
  config: CertificateTemplateConfig;
  settings: AppSettings;
  studentName: string;
  academicYear: string;
  directorName: string;
  isForPrint?: boolean;
  activeElementKey?: CertificateElementKey | null;
  onElementMouseDown?: (e: React.MouseEvent, key: CertificateElementKey) => void;
  className?: string;
  style?: React.CSSProperties;
}

export const CertificateCanvas: React.FC<CertificateCanvasProps> = ({
  config,
  settings,
  studentName,
  academicYear,
  directorName,
  isForPrint = false,
  activeElementKey = null,
  onElementMouseDown,
  className = '',
  style = {},
}) => {
  return (
    <div
      className={`certificate-canvas-container relative select-none w-full h-full overflow-hidden ${className}`}
      style={{
        fontFamily: 'Cairo, Tajawal, Amiri, sans-serif',
        background: config.templateImage
          ? '#ffffff'
          : 'linear-gradient(135deg, #faf5eb 0%, #ffffff 50%, #f7f3e8 100%)',
        ...style,
      }}
    >
      {/* Background Layer: Custom Uploaded Template OR Default Ornamental Frame */}
      {config.templateImage ? (
        <img
          src={config.templateImage}
          alt="قالب شهادة التقدير"
          className="absolute inset-0 w-full h-full object-fill pointer-events-none"
          style={{ imageRendering: 'auto' }}
        />
      ) : (
        /* Default Classical Islamic / Academic Certificate Template Frame */
        <div className="absolute inset-0 w-full h-full pointer-events-none p-5 sm:p-7 flex flex-col justify-between border-[14px] border-[#c5a059] outline outline-2 outline-[#8c6b2d] bg-[#fbf9f4]">
          {/* Corner Arabesque Geometric Ornaments */}
          <div className="absolute top-2 right-2 w-16 h-16 border-t-4 border-r-4 border-[#8c6b2d]" />
          <div className="absolute top-2 left-2 w-16 h-16 border-t-4 border-l-4 border-[#8c6b2d]" />
          <div className="absolute bottom-2 right-2 w-16 h-16 border-b-4 border-r-4 border-[#8c6b2d]" />
          <div className="absolute bottom-2 left-2 w-16 h-16 border-b-4 border-l-4 border-[#8c6b2d]" />

          {/* Inner Border */}
          <div className="absolute inset-3 border-2 border-dashed border-[#c5a059]/60" />

          {/* Default Classical Text Content if no template image is supplied */}
          <div className="relative z-0 flex flex-col items-center text-center mt-6">
            <span className="text-xs tracking-widest text-[#8c6b2d] font-bold uppercase mb-1">
              جمهورية العراق — وزارة التربية والتعليم
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-[#5a421c] tracking-tight">
              {settings.schoolName || 'ثانوية المتميزين النموذجية'}
            </h2>
            <div className="mt-3 px-6 py-1 bg-[#c5a059]/15 border-y-2 border-[#c5a059] rounded-sm">
              <h1 className="text-2xl sm:text-3xl font-black text-[#8c6b2d] tracking-wide">
                شـهـادة شـكـر وتـقـديـر
              </h1>
            </div>
            <p className="text-xs text-slate-600 mt-3 max-w-lg leading-relaxed">
              يسر إدارة المدرسة أن تمنح هذه الشهادة تقديراً للجد والاجتهاد والتميز الأكاديمي، متمنين دوام التفوق والنجاح الباهر
            </p>
          </div>

          <div className="relative z-0 flex items-center justify-between px-10 mb-4 text-xs font-bold text-[#5a421c]">
            <div className="text-right">
              <span className="text-[11px] text-slate-500 block">العام الدراسي</span>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full border-2 border-[#c5a059] flex items-center justify-center text-[10px] text-[#8c6b2d] font-bold">
                ختم المدرسة
              </div>
            </div>
            <div className="text-left">
              <span className="text-[11px] text-slate-500 block">مدير المدرسة</span>
            </div>
          </div>
        </div>
      )}

      {/* 1. Official School Logo */}
      {config.elements.officialLogo.visible && (
        <div
          onClick={(e) => !isForPrint && onElementMouseDown && onElementMouseDown(e, 'officialLogo')}
          onMouseDown={(e) => !isForPrint && onElementMouseDown && onElementMouseDown(e, 'officialLogo')}
          className={`absolute transition-shadow ${
            !isForPrint && activeElementKey === 'officialLogo'
              ? 'ring-2 ring-emerald-500 ring-offset-2 z-30 cursor-move'
              : !isForPrint
              ? 'hover:ring-1 hover:ring-emerald-400/60 z-20 cursor-pointer'
              : 'z-20'
          }`}
          style={{
            left: `${config.elements.officialLogo.x}%`,
            top: `${config.elements.officialLogo.y}%`,
            width: `${config.elements.officialLogo.width || 10}%`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          {settings.schoolLogo ? (
            <img
              src={settings.schoolLogo}
              alt="شعار المدرسة الرسمي"
              className="w-full h-auto object-contain pointer-events-none drop-shadow-sm"
            />
          ) : !isForPrint ? (
            <div className="w-full aspect-square rounded-xl border-2 border-dashed border-emerald-500/70 bg-emerald-500/10 flex flex-col items-center justify-center p-1 text-center">
              <School className="w-5 h-5 text-emerald-600 mb-0.5" />
              <span className="text-[9px] font-bold text-emerald-700 leading-tight">
                شعار المدرسة
              </span>
              <span className="text-[7px] text-emerald-600">(من الإعدادات)</span>
            </div>
          ) : null}
        </div>
      )}

      {/* 2. Kufic Geometric School Logo */}
      {config.elements.kuficLogo.visible && (
        <div
          onClick={(e) => !isForPrint && onElementMouseDown && onElementMouseDown(e, 'kuficLogo')}
          onMouseDown={(e) => !isForPrint && onElementMouseDown && onElementMouseDown(e, 'kuficLogo')}
          className={`absolute transition-shadow ${
            !isForPrint && activeElementKey === 'kuficLogo'
              ? 'ring-2 ring-amber-500 ring-offset-2 z-30 cursor-move'
              : !isForPrint
              ? 'hover:ring-1 hover:ring-amber-400/60 z-20 cursor-pointer'
              : 'z-20'
          }`}
          style={{
            left: `${config.elements.kuficLogo.x}%`,
            top: `${config.elements.kuficLogo.y}%`,
            width: `${config.elements.kuficLogo.width || 10}%`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          {settings.kuficLogo ? (
            <img
              src={settings.kuficLogo}
              alt="شعار المدرسة بالخط الكوفي"
              className="w-full h-auto object-contain pointer-events-none drop-shadow-sm"
            />
          ) : !isForPrint ? (
            <div className="w-full aspect-square rounded-xl border-2 border-dashed border-amber-500/70 bg-amber-500/10 flex flex-col items-center justify-center p-1 text-center">
              <Sparkles className="w-5 h-5 text-amber-600 mb-0.5" />
              <span className="text-[9px] font-bold text-amber-700 leading-tight">
                الشعار الكوفي
              </span>
              <span className="text-[7px] text-amber-600">(من الإعدادات)</span>
            </div>
          ) : null}
        </div>
      )}

      {/* 3. Student Name */}
      {config.elements.studentName.visible && (
        <div
          onClick={(e) => !isForPrint && onElementMouseDown && onElementMouseDown(e, 'studentName')}
          onMouseDown={(e) => !isForPrint && onElementMouseDown && onElementMouseDown(e, 'studentName')}
          className={`absolute whitespace-nowrap px-2 py-0.5 rounded ${
            !isForPrint && activeElementKey === 'studentName'
              ? 'ring-2 ring-blue-500 ring-offset-2 z-30 cursor-move bg-blue-500/10'
              : !isForPrint
              ? 'hover:ring-1 hover:ring-blue-400/60 z-20 cursor-pointer'
              : 'z-20'
          }`}
          style={{
            left: `${config.elements.studentName.x}%`,
            top: `${config.elements.studentName.y}%`,
            transform: 'translate(-50%, -50%)',
            fontSize: `${config.elements.studentName.fontSize || 32}px`,
            fontWeight:
              config.elements.studentName.fontWeight === 'black'
                ? 900
                : config.elements.studentName.fontWeight === 'bold'
                ? 700
                : 500,
            color: config.elements.studentName.fontColor || '#0f172a',
            fontFamily: config.elements.studentName.fontFamily || 'Cairo',
            textAlign: config.elements.studentName.textAlign || 'center',
          }}
        >
          {studentName}
        </div>
      )}

      {/* 4. Academic Year */}
      {config.elements.academicYear.visible && (
        <div
          onClick={(e) => !isForPrint && onElementMouseDown && onElementMouseDown(e, 'academicYear')}
          onMouseDown={(e) => !isForPrint && onElementMouseDown && onElementMouseDown(e, 'academicYear')}
          className={`absolute whitespace-nowrap px-2 py-0.5 rounded ${
            !isForPrint && activeElementKey === 'academicYear'
              ? 'ring-2 ring-purple-500 ring-offset-2 z-30 cursor-move bg-purple-500/10'
              : !isForPrint
              ? 'hover:ring-1 hover:ring-purple-400/60 z-20 cursor-pointer'
              : 'z-20'
          }`}
          style={{
            left: `${config.elements.academicYear.x}%`,
            top: `${config.elements.academicYear.y}%`,
            transform: 'translate(-50%, -50%)',
            fontSize: `${config.elements.academicYear.fontSize || 16}px`,
            fontWeight:
              config.elements.academicYear.fontWeight === 'black'
                ? 900
                : config.elements.academicYear.fontWeight === 'bold'
                ? 700
                : 500,
            color: config.elements.academicYear.fontColor || '#334155',
            fontFamily: config.elements.academicYear.fontFamily || 'Tajawal',
            textAlign: config.elements.academicYear.textAlign || 'center',
          }}
        >
          {academicYear}
        </div>
      )}

      {/* 5. Principal / Director Name */}
      {config.elements.directorName.visible && (
        <div
          onClick={(e) => !isForPrint && onElementMouseDown && onElementMouseDown(e, 'directorName')}
          onMouseDown={(e) => !isForPrint && onElementMouseDown && onElementMouseDown(e, 'directorName')}
          className={`absolute whitespace-nowrap px-2 py-0.5 rounded ${
            !isForPrint && activeElementKey === 'directorName'
              ? 'ring-2 ring-rose-500 ring-offset-2 z-30 cursor-move bg-rose-500/10'
              : !isForPrint
              ? 'hover:ring-1 hover:ring-rose-400/60 z-20 cursor-pointer'
              : 'z-20'
          }`}
          style={{
            left: `${config.elements.directorName.x}%`,
            top: `${config.elements.directorName.y}%`,
            transform: 'translate(-50%, -50%)',
            fontSize: `${config.elements.directorName.fontSize || 18}px`,
            fontWeight:
              config.elements.directorName.fontWeight === 'black'
                ? 900
                : config.elements.directorName.fontWeight === 'bold'
                ? 700
                : 500,
            color: config.elements.directorName.fontColor || '#1e293b',
            fontFamily: config.elements.directorName.fontFamily || 'Tajawal',
            textAlign: config.elements.directorName.textAlign || 'center',
          }}
        >
          {directorName}
        </div>
      )}
    </div>
  );
};
