import type { FilterState, SortOption } from '../../hooks/useSearch.js';

interface FilterPanelProps {
  filters: FilterState;
  onFilterChange: (updates: Partial<FilterState>) => void;
  onReset: () => void;
  sort: SortOption;
  onSortChange: (sort: SortOption) => void;
  totalCount: number;
  favoritesCount: number;
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'best_match', label: 'Best Match' },
  { value: 'nearest', label: 'Nearest First' },
  { value: 'youngest', label: 'Youngest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'recent', label: 'Recently Listed' },
];

export function FilterPanel({
  filters,
  onFilterChange,
  onReset,
  sort,
  onSortChange,
  totalCount,
  favoritesCount,
}: FilterPanelProps) {
  return (
    <aside className="w-full lg:w-64 shrink-0 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-800">Filters</h2>
        <button onClick={onReset} className="text-xs text-teal-600 hover:underline">
          Reset
        </button>
      </div>

      {/* Sort */}
      <div>
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Sort by</label>
        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value as SortOption)}
          className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Favorites toggle */}
      <CheckboxRow
        label={`Favorites only (${favoritesCount})`}
        checked={filters.favoritesOnly}
        onChange={(v) => onFilterChange({ favoritesOnly: v })}
      />

      {/* Pet type */}
      <FilterSection title="Pet Type">
        {(['dog', 'cat', 'either'] as const).map((type) => (
          <RadioRow
            key={type}
            label={type === 'either' ? 'Either' : type === 'dog' ? 'Dogs' : 'Cats'}
            checked={filters.petType === type}
            onChange={() => onFilterChange({ petType: type })}
          />
        ))}
      </FilterSection>

      {/* Compatibility */}
      <FilterSection title="Compatibility">
        <CheckboxRow label="Good with kids" checked={filters.goodWithKids} onChange={(v) => onFilterChange({ goodWithKids: v })} />
        <CheckboxRow label="Good with dogs" checked={filters.goodWithDogs} onChange={(v) => onFilterChange({ goodWithDogs: v })} />
        <CheckboxRow label="Good with cats" checked={filters.goodWithCats} onChange={(v) => onFilterChange({ goodWithCats: v })} />
      </FilterSection>

      {/* Age */}
      <FilterSection title="Age">
        {['baby', 'young', 'adult', 'senior'].map((age) => (
          <CheckboxRow
            key={age}
            label={age.charAt(0).toUpperCase() + age.slice(1)}
            checked={filters.ageGroups.includes(age)}
            onChange={(checked) => {
              const updated = checked
                ? [...filters.ageGroups, age]
                : filters.ageGroups.filter((a) => a !== age);
              onFilterChange({ ageGroups: updated });
            }}
          />
        ))}
      </FilterSection>

      {/* Size */}
      <FilterSection title="Size">
        {[
          { value: 'small', label: 'Small' },
          { value: 'medium', label: 'Medium' },
          { value: 'large', label: 'Large' },
          { value: 'xlarge', label: 'Extra Large' },
        ].map((s) => (
          <CheckboxRow
            key={s.value}
            label={s.label}
            checked={filters.sizeGroups.includes(s.value)}
            onChange={(checked) => {
              const updated = checked
                ? [...filters.sizeGroups, s.value]
                : filters.sizeGroups.filter((v) => v !== s.value);
              onFilterChange({ sizeGroups: updated });
            }}
          />
        ))}
      </FilterSection>

      {/* Gender */}
      <FilterSection title="Gender">
        {[
          { value: 'male', label: 'Male' },
          { value: 'female', label: 'Female' },
          { value: 'unknown', label: 'Unknown' },
        ].map((g) => (
          <CheckboxRow
            key={g.value}
            label={g.label}
            checked={filters.genders.includes(g.value)}
            onChange={(checked) => {
              const updated = checked
                ? [...filters.genders, g.value]
                : filters.genders.filter((v) => v !== g.value);
              onFilterChange({ genders: updated });
            }}
          />
        ))}
      </FilterSection>

      {/* Listing type */}
      <FilterSection title="Listing Type">
        {[
          { value: 'rescue', label: 'Rescue / Adopt' },
          { value: 'foster', label: 'Foster' },
          { value: 'breeder', label: 'Breeder' },
        ].map((lt) => (
          <CheckboxRow
            key={lt.value}
            label={lt.label}
            checked={filters.listingTypes.includes(lt.value)}
            onChange={(checked) => {
              const updated = checked
                ? [...filters.listingTypes, lt.value]
                : filters.listingTypes.filter((v) => v !== lt.value);
              onFilterChange({ listingTypes: updated });
            }}
          />
        ))}
      </FilterSection>

      {/* Match score minimum */}
      <div>
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          Min Match Score: {filters.minScore}%
        </label>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={filters.minScore}
          onChange={(e) => onFilterChange({ minScore: parseInt(e.target.value, 10) })}
          className="w-full mt-1 accent-teal-600"
        />
      </div>

      <p className="text-xs text-gray-400 text-center">{totalCount} results</p>
    </aside>
  );
}

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">{title}</h3>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function CheckboxRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="rounded accent-teal-600"
      />
      {label}
    </label>
  );
}

function RadioRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
      <input
        type="radio"
        checked={checked}
        onChange={onChange}
        className="accent-teal-600"
      />
      {label}
    </label>
  );
}
