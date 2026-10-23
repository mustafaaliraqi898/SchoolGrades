import React, { useState } from 'react';
import { AppSettings, RoundingRule, UserRole } from '../../types';
import { db } from '../../services/storage';
import { ROUNDING_RULE_LABELS } from '../../services/calculations';
import { Settings, Save, CheckCircle2, Calculator, School, ShieldAlert, Monitor } from 'lucide-react';
import { UserManagementSection } from './UserManagementSection';

interface SettingsViewProps {
  settings: AppSettings;
  currentUserId?: string;
  userRole?: UserRole;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  currentUserId,
  userRole = 'admin',
}) => {
  const [formData, setFormData] = useState<AppSettings>(settings);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    db.updateSettings(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const roundingRules: RoundingRule[] = [
    'standard',
    'ceil',
    'floor',
    'one_decimal',
    'two_decimals',
  ];

  return (
    <div className="flex flex-col gap-6 pb-16">
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-slate-300" />
            إعدادات النظام والتقريب ومعادلات الدرجات
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            تخصيص قواعد التقريب الحسابي لدرجة السعي والنهائي، بيانات المدرسة الرسمية، وضوابط الأمان
          </p>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-950/70 border border-emerald-500/50 text-emerald-300 text-sm font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>تم حفظ الإعدادات وإعادة احتساب درجات السعي والدرجات النهائية تلقائياً لجميع الطلاب!</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* 1. School Official Information */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
          <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <School className="w-5 h-5 text-blue-400" />
            بيانات المدرسة والترويسة الرسمية للتقارير
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">اسم المدرسة الرسمي</label>
              <input
                type="text"
                value={formData.schoolName}
                onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                className="w-full h-10 px-3 text-sm bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:border-emerald-500 focus:outline-hidden font-bold"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">المدينة والمديرية العامة</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full h-10 px-3 text-sm bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:border-emerald-500 focus:outline-hidden"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">اسم مدير المدرسة</label>
              <input
                type="text"
                value={formData.directorName}
                onChange={(e) => setFormData({ ...formData, directorName: e.target.value })}
                className="w-full h-10 px-3 text-sm bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:border-emerald-500 focus:outline-hidden"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">اسم رئيس اللجنة الامتحانية</label>
              <input
                type="text"
                value={formData.examCommitteeHead}
                onChange={(e) => setFormData({ ...formData, examCommitteeHead: e.target.value })}
                className="w-full h-10 px-3 text-sm bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:border-emerald-500 focus:outline-hidden"
                required
              />
            </div>
          </div>
        </div>

        {/* 2. Rounding Rules - Crucial requirement from prompt */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <Calculator className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">
              قاعدة تقريب الكسور وحساب المعدلات
            </h3>
          </div>
          <p className="text-xs text-slate-400 mb-5 leading-relaxed">
            يتم تطبيق هذه القاعدة مباشرة على حساب <strong>درجة السعي السنوي</strong> (مجموع الفصول الثلاثة ÷ 3) وحساب <strong>الدرجة النهائية</strong> (السعي + الامتحان النهائي ÷ 2).
          </p>

          <div className="flex flex-col gap-3">
            {roundingRules.map((rule) => {
              const info = ROUNDING_RULE_LABELS[rule];
              const isSelected = formData.roundingRule === rule;

              return (
                <label
                  key={rule}
                  className={`p-4 rounded-xl border flex items-start gap-3.5 cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-slate-950 border-emerald-500 shadow-md shadow-emerald-500/10 ring-1 ring-emerald-500/50'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="roundingRule"
                    value={rule}
                    checked={isSelected}
                    onChange={() => setFormData({ ...formData, roundingRule: rule })}
                    className="mt-1 w-4 h-4 text-emerald-500 focus:ring-0 bg-slate-900 border-slate-700"
                  />
                  <div className="flex flex-col">
                    <span className={`font-bold text-sm ${isSelected ? 'text-emerald-400' : 'text-slate-200'}`}>
                      {info.title}
                    </span>
                    <span className="text-xs text-slate-400 mt-1 leading-relaxed">
                      {info.desc}
                    </span>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {/* 3. Security & Confirmation Preferences */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">
              ضوابط الأمان وحماية الدرجات السابقة
            </h3>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-xl">
            <div>
              <h4 className="font-bold text-sm text-slate-200">
                طلب تأكيد صريح قبل تعديل أي درجة سابقة
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                عند النقر لتعديل درجات الفصول السابقة، تظهر نافذة تأكيد تحذر من تأثير التعديل على السعي والنهائي.
              </p>
            </div>

            <input
              type="checkbox"
              checked={formData.confirmPreviousTermEdits}
              onChange={(e) => setFormData({ ...formData, confirmPreviousTermEdits: e.target.checked })}
              className="w-5 h-5 rounded text-emerald-500 focus:ring-0 bg-slate-900 border-slate-700 cursor-pointer"
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-sm flex items-center gap-2 shadow-lg shadow-emerald-600/25 transition-all cursor-pointer"
          >
            <Save className="w-5 h-5" />
            <span>حفظ جميع الإعدادات وتطبيقها فوراً</span>
          </button>
        </div>
      </form>

      {/* 4. User Accounts & Access Control (Admin-Only Section) */}
      {userRole === 'admin' && (
        <UserManagementSection currentUserId={currentUserId || ''} />
      )}
    </div>
  );
};
