export interface Chip {
  id: string;
  label: string;
  icon?: string;
  count?: number;
}

interface ChipGroupProps {
  title: string;
  chips: Chip[];
  isActive: (id: string) => boolean;
  onToggle: (id: string) => void;
}

export default function ChipGroup({ title, chips, isActive, onToggle }: ChipGroupProps) {
  return (
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-2">{title}</h3>
      <div className="flex flex-wrap gap-2">
        {chips.map((chip) => {
          const active = isActive(chip.id);
          return (
            <button
              key={chip.id}
              type="button"
              onClick={() => onToggle(chip.id)}
              aria-pressed={active}
              className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                active ? 'bg-aws-orange text-white shadow-md' : 'bg-aws-lightgray text-aws-navy hover:bg-gray-200'
              }`}
            >
              {chip.icon && <span className="mr-1.5">{chip.icon}</span>}
              <span>{chip.label}</span>
              {chip.count !== undefined && (
                <span className={`ml-2 px-1.5 py-0.5 rounded-full text-xs ${active ? 'bg-white/30' : 'bg-white'}`}>
                  {chip.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
