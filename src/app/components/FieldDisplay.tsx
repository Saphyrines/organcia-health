import { ChangeEvent } from "react";

type FieldDisplayProps = {
  label: string;
  value: string;
  isEditing: boolean;
  fieldName: string;
  onEdit: () => void;
  onChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onSave: () => void;
  options?: string[]; // Si présent, rend une <select>
};

export default function FieldDisplay({
  label,
  value,
  isEditing,
  fieldName,
  onEdit,
  onChange,
  onSave,
  options,
}: FieldDisplayProps) {
  return (
    <div className="mb-4">
      <label className="block font-semibold mb-1">{label}</label>

      {isEditing ? (
        <div className="flex gap-2">
          {options ? (
            <select
              name={fieldName}
              value={value}
              onChange={onChange}
              className="border border-gray-300 rounded px-2 py-1"
            >
              {options.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              name={fieldName}
              value={value}
              onChange={onChange}
              className="border border-gray-300 rounded px-2 py-1"
            />
          )}

          <button
            onClick={onSave}
            className="bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
          >
            Enregistrer
          </button>
        </div>
      ) : (
        <div className="flex justify-between items-center">
          <span>{value || <span className="text-gray-400 italic">Non renseigné</span>}</span>
          <button
            onClick={onEdit}
            className="text-sm text-COLORS.main hover:text-[#bb6241]"
          >
            Modifier
          </button>
        </div>
      )}
    </div>
  );
}
