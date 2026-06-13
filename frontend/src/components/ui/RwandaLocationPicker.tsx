import { useState, useEffect } from 'react';
import { MapPin, ChevronRight, X, Loader2 } from 'lucide-react';
import api from '../../services/api';

interface LocationNode {
  id: string;
  name: string;
  type: string;
  latitude?: number;
  longitude?: number;
  // context populated by the picker
  provinceName?: string;
  districtName?: string;
}

interface SelectedLevel {
  node: LocationNode;
  level: 'PROVINCE' | 'DISTRICT' | 'SECTOR';
}

interface Props {
  /** Called whenever the selected node changes */
  onSelect: (node: LocationNode | null) => void;
  /** Initial node id to preload (optional) */
  initialNodeId?: string;
  /** If true, shows a compact badge-style breadcrumb */
  compact?: boolean;
  className?: string;
}

const LEVEL_LABELS: Record<string, string> = {
  PROVINCE: 'Province',
  DISTRICT: 'District',
  SECTOR: 'Sector',
};

const NEXT_LEVEL: Record<string, string> = {
  PROVINCE: 'DISTRICT',
  DISTRICT: 'SECTOR',
  SECTOR: '',
};

export default function RwandaLocationPicker({ onSelect, initialNodeId, compact, className }: Props) {
  const [province, setProvince]   = useState<LocationNode | null>(null);
  const [district, setDistrict]   = useState<LocationNode | null>(null);
  const [sector, setSector]       = useState<LocationNode | null>(null);

  const [provinces,  setProvinces]  = useState<LocationNode[]>([]);
  const [districts,  setDistricts]  = useState<LocationNode[]>([]);
  const [sectors,    setSectors]    = useState<LocationNode[]>([]);

  const [loadingProv, setLoadingProv] = useState(true);
  const [loadingDist, setLoadingDist] = useState(false);
  const [loadingSec,  setLoadingSec]  = useState(false);

  // Load provinces on mount
  useEffect(() => {
    api.get('/locations/provinces')
      .then(r => setProvinces(r.data))
      .catch(() => {})
      .finally(() => setLoadingProv(false));
  }, []);

  // Load districts when province changes
  useEffect(() => {
    if (!province) { setDistricts([]); setDistrict(null); setSectors([]); setSector(null); return; }
    setLoadingDist(true);
    api.get(`/locations/children?parentId=${province.id}`)
      .then(r => setDistricts(r.data))
      .catch(() => {})
      .finally(() => setLoadingDist(false));
  }, [province]);

  // Load sectors when district changes
  useEffect(() => {
    if (!district) { setSectors([]); setSector(null); return; }
    setLoadingSec(true);
    api.get(`/locations/children?parentId=${district.id}`)
      .then(r => setSectors(r.data))
      .catch(() => {})
      .finally(() => setLoadingSec(false));
  }, [district]);

  // Notify parent whenever selection changes — enrich node with breadcrumb context
  useEffect(() => {
    if (!province && !district && !sector) { onSelect(null); return; }
    const node = sector ?? district ?? province;
    if (!node) { onSelect(null); return; }
    onSelect({
      ...node,
      provinceName: province?.name,
      districtName: district?.name,
    });
  }, [province, district, sector]);

  const handleProvince = (id: string) => {
    const node = provinces.find(p => p.id === id) ?? null;
    setProvince(node);
    setDistrict(null);
    setSector(null);
  };

  const handleDistrict = (id: string) => {
    const node = districts.find(d => d.id === id) ?? null;
    setDistrict(node);
    setSector(null);
  };

  const handleSector = (id: string) => {
    setSector(sectors.find(s => s.id === id) ?? null);
  };

  const clear = () => {
    setProvince(null); setDistrict(null); setSector(null);
  };

  const selectCls = `w-full border-2 border-slate-200 dark:border-gray-700 rounded-2xl px-4 py-3 text-sm
    focus:outline-none focus:border-sky-500 bg-slate-50 dark:bg-gray-800 dark:text-white
    transition-all disabled:opacity-50 appearance-none`;

  const currentSelection = sector ?? district ?? province;

  return (
    <div className={className}>
      {/* Breadcrumb trail */}
      {currentSelection && (
        <div className="flex items-center gap-1.5 flex-wrap mb-3">
          {province && (
            <span className="flex items-center gap-1 text-xs bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 px-2.5 py-1 rounded-full font-medium">
              <MapPin size={10} /> {province.name}
            </span>
          )}
          {district && (
            <>
              <ChevronRight size={12} className="text-slate-400" />
              <span className="text-xs bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 px-2.5 py-1 rounded-full font-semibold">
                {district.name}
              </span>
            </>
          )}
          {sector && (
            <>
              <ChevronRight size={12} className="text-slate-400" />
              <span className="text-xs bg-sky-500 text-white px-2.5 py-1 rounded-full font-bold">
                {sector.name}
              </span>
            </>
          )}
          <button onClick={clear} className="ml-1 text-slate-400 hover:text-red-500 transition-colors">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Province */}
      <div className="space-y-3">
        <div>
          <label className="text-xs font-semibold text-slate-500 dark:text-gray-400 mb-1.5 block uppercase tracking-wider">
            Province
          </label>
          {loadingProv ? (
            <div className="flex items-center gap-2 text-slate-400 text-sm py-2">
              <Loader2 size={14} className="animate-spin" /> Loading provinces...
            </div>
          ) : (
            <select value={province?.id ?? ''} onChange={e => handleProvince(e.target.value)} className={selectCls}>
              <option value="">Select Province...</option>
              {provinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          )}
        </div>

        {/* District */}
        {province && (
          <div className="animate-in slide-in-from-top-1 duration-200">
            <label className="text-xs font-semibold text-slate-500 dark:text-gray-400 mb-1.5 block uppercase tracking-wider">
              District <span className="text-sky-400 normal-case font-normal">in {province.name}</span>
            </label>
            {loadingDist ? (
              <div className="flex items-center gap-2 text-slate-400 text-sm py-2">
                <Loader2 size={14} className="animate-spin" /> Loading districts...
              </div>
            ) : (
              <select value={district?.id ?? ''} onChange={e => handleDistrict(e.target.value)} className={selectCls}>
                <option value="">Select District...</option>
                {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            )}
          </div>
        )}

        {/* Sector */}
        {district && (
          <div className="animate-in slide-in-from-top-1 duration-200">
            <label className="text-xs font-semibold text-slate-500 dark:text-gray-400 mb-1.5 block uppercase tracking-wider">
              Sector <span className="text-sky-400 normal-case font-normal">in {district.name}</span>
            </label>
            {loadingSec ? (
              <div className="flex items-center gap-2 text-slate-400 text-sm py-2">
                <Loader2 size={14} className="animate-spin" /> Loading sectors...
              </div>
            ) : (
              <>
                <select value={sector?.id ?? ''} onChange={e => handleSector(e.target.value)} className={selectCls}>
                  <option value="">(optional) Select Sector...</option>
                  {sectors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                {!sector && (
                  <p className="text-xs text-slate-400 dark:text-gray-500 mt-1.5">
                    You can search at District level or pick a specific sector.
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Current level hint */}
      {currentSelection && (
        <p className="text-xs text-slate-400 dark:text-gray-500 mt-2 flex items-center gap-1">
          <MapPin size={10} />
          Searching in: <strong className="text-sky-500 dark:text-sky-400 ml-1">{currentSelection.name}</strong>
          <span className="ml-1 opacity-60">({LEVEL_LABELS[currentSelection.type] ?? currentSelection.type})</span>
        </p>
      )}
    </div>
  );
}
