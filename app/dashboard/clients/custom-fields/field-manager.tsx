"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  createCustomField,
  updateCustomField,
  deleteCustomField,
  toggleCustomFieldActive,
  reorderCustomFields,
} from "@/app/actions/custom-fields";
import type { CustomField, EntityType, FieldType } from "@/app/actions/custom-fields";

type Props = {
  initialFields: CustomField[];
  entityType?: EntityType;
};

const FIELD_TYPE_VALUES: FieldType[] = ["text", "textarea", "number", "boolean", "select"];

type FormState = {
  label: string;
  field_type: FieldType;
  options: string[];
  is_required: boolean;
  is_active: boolean;
};

function emptyForm(): FormState {
  return { label: "", field_type: "text", options: [], is_required: false, is_active: true };
}

function fieldToForm(f: CustomField): FormState {
  return {
    label: f.label,
    field_type: f.field_type,
    options: f.options,
    is_required: f.is_required,
    is_active: f.is_active,
  };
}

function InlineForm({
  initial,
  onSave,
  onCancel,
  submitLabel,
}: {
  initial: FormState;
  onSave: (s: FormState) => Promise<void>;
  onCancel: () => void;
  submitLabel: string;
}) {
  const t = useTranslations("customFields");
  const [form, setForm] = useState<FormState>(initial);
  const [optionInput, setOptionInput] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function addOption() {
    const val = optionInput.trim();
    if (!val || form.options.includes(val)) return;
    set("options", [...form.options, val]);
    setOptionInput("");
  }

  function removeOption(opt: string) {
    set("options", form.options.filter((o) => o !== opt));
  }

  function handleOptionKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      addOption();
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.label.trim()) { setError(t("validationLabel")); return; }
    if (form.field_type === "select" && form.options.length === 0) {
      setError(t("validationOptions"));
      return;
    }
    setError(null);
    startTransition(async () => {
      await onSave(form);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-5 bg-slate-50 rounded-xl border border-slate-200">
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">{t("labelLabel")} *</label>
          <input
            type="text"
            required
            value={form.label}
            onChange={(e) => set("label", e.target.value)}
            placeholder={t("labelPlaceholder")}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">{t("typeLabel")}</label>
          <select
            value={form.field_type}
            onChange={(e) => set("field_type", e.target.value as FieldType)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {FIELD_TYPE_VALUES.map((v) => (
              <option key={v} value={v}>{t(`types.${v}`)}</option>
            ))}
          </select>
        </div>
      </div>

      {form.field_type === "select" && (
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">{t("optionsLabel")}</label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={optionInput}
              onChange={(e) => setOptionInput(e.target.value)}
              onKeyDown={handleOptionKeyDown}
              placeholder={t("optionPlaceholder")}
              className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="button"
              onClick={addOption}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              {t("addOption")}
            </button>
          </div>
          {form.options.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {form.options.map((opt) => (
                <span
                  key={opt}
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700"
                >
                  {opt}
                  <button
                    type="button"
                    onClick={() => removeOption(opt)}
                    className="text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.is_required}
            onChange={(e) => set("is_required", e.target.checked)}
            className="w-4 h-4 rounded accent-indigo-600"
          />
          <span className="text-sm text-slate-700">{t("isRequired")}</span>
        </label>
      </div>

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
        >
          {t("cancel")}
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors"
        >
          {isPending ? t("saving") : submitLabel}
        </button>
      </div>
    </form>
  );
}

export default function FieldManager({ initialFields, entityType = "treatment" }: Props) {
  const t = useTranslations("customFields");
  const router = useRouter();
  const [fields, setFields] = useState<CustomField[]>(initialFields);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleCreate(form: FormState) {
    const result = await createCustomField({
      label: form.label,
      field_type: form.field_type,
      options: form.options,
      is_required: form.is_required,
      entity_type: entityType,
    });
    if (!result.error) {
      setShowAddForm(false);
      // Refresh via page reload is handled by revalidatePath on server
      // For optimistic update, we'll reload
      router.refresh();
    }
  }

  async function handleUpdate(id: string, form: FormState) {
    const result = await updateCustomField(id, form);
    if (!result.error) {
      setEditingId(null);
      router.refresh();
    }
  }

  async function handleDelete(id: string) {
    startTransition(async () => {
      await deleteCustomField(id);
      setConfirmDelete(null);
      router.refresh();
    });
  }

  async function handleToggle(id: string, current: boolean) {
    startTransition(async () => {
      await toggleCustomFieldActive(id, !current);
      router.refresh();
    });
  }

  async function handleMove(index: number, direction: "up" | "down") {
    const newFields = [...fields];
    const swapWith = direction === "up" ? index - 1 : index + 1;
    if (swapWith < 0 || swapWith >= newFields.length) return;
    [newFields[index], newFields[swapWith]] = [newFields[swapWith], newFields[index]];
    setFields(newFields);
    startTransition(async () => {
      await reorderCustomFields(newFields.map((f) => f.id));
    });
  }

  return (
    <div className="space-y-3">
      {fields.length === 0 && !showAddForm && (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
          <p className="text-slate-400 text-sm">{t("noFields")}</p>
          <p className="text-slate-300 text-xs mt-1">{t("noFieldsHint")}</p>
        </div>
      )}

      {fields.map((field, idx) => (
        <div key={field.id} className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          {editingId === field.id ? (
            <div className="p-4">
              <InlineForm
                initial={fieldToForm(field)}
                onSave={(form) => handleUpdate(field.id, form)}
                onCancel={() => setEditingId(null)}
                submitLabel={t("saveChanges")}
              />
            </div>
          ) : (
            <div className="flex items-center gap-3 px-4 py-3">
              {/* Reorder */}
              <div className="flex flex-col gap-0.5 shrink-0">
                <button
                  type="button"
                  onClick={() => handleMove(idx, "up")}
                  disabled={idx === 0 || isPending}
                  className="rounded p-0.5 text-slate-300 hover:text-slate-500 disabled:opacity-20 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => handleMove(idx, "down")}
                  disabled={idx === fields.length - 1 || isPending}
                  className="rounded p-0.5 text-slate-300 hover:text-slate-500 disabled:opacity-20 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">
                  {field.label}
                  {field.is_required && <span className="ml-1 text-red-400 text-xs">*</span>}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                    {t(`types.${field.field_type}`)}
                  </span>
                  {field.field_type === "select" && field.options.length > 0 && (
                    <span className="text-xs text-slate-400">{field.options.join(", ")}</span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                {/* Active toggle */}
                <button
                  type="button"
                  onClick={() => handleToggle(field.id, field.is_active)}
                  disabled={isPending}
                  title={field.is_active ? t("deactivate") : t("activate")}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none ${
                    field.is_active ? "bg-indigo-600" : "bg-slate-200"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition-transform ${
                      field.is_active ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </button>

                {/* Edit */}
                <button
                  type="button"
                  onClick={() => { setEditingId(field.id); setConfirmDelete(null); }}
                  className="rounded p-1.5 text-slate-400 hover:bg-indigo-50 hover:text-indigo-500 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>

                {/* Delete */}
                {confirmDelete === field.id ? (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleDelete(field.id)}
                      disabled={isPending}
                      className="rounded px-2 py-1 text-xs bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                    >
                      {t("confirmYes")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(null)}
                      className="rounded px-2 py-1 text-xs bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                    >
                      {t("confirmNo")}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => { setConfirmDelete(field.id); setEditingId(null); }}
                    className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Add new field */}
      {showAddForm ? (
        <InlineForm
          initial={emptyForm()}
          onSave={handleCreate}
          onCancel={() => setShowAddForm(false)}
          submitLabel={t("addField")}
        />
      ) : (
        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          className="inline-flex items-center gap-2 rounded-xl border border-dashed border-indigo-300 bg-indigo-50/50 px-4 py-2.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          {t("addButton")}
        </button>
      )}
    </div>
  );
}
