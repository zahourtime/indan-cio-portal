/**
 * Helpers shared by the Evidence Catalog, Scoring Breakdown and Head-to-Head screens.
 */

/** '2026-11-10' -> 'Q4 2026' */
export function quarterLabel(isoDate) {
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return String(isoDate || '—');
  return `Q${Math.floor(d.getUTCMonth() / 3) + 1} ${d.getUTCFullYear()}`;
}

/** '2026-11-10' -> '10.11.2026' */
export function formatRuDate(isoDate) {
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return String(isoDate || '—');
  return d.toLocaleDateString('ru-RU', { timeZone: 'UTC' });
}

/** Status key -> tailwind classes for the status chip. */
export const STATUS_STYLES = {
  active: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/25',
  final: 'text-sky-300 bg-sky-500/10 border-sky-500/25',
  draft: 'text-amber-300 bg-amber-500/10 border-amber-500/25',
  closed: 'text-zinc-300 bg-white/[0.05] border-white/15',
};

export const STATUS_OPTIONS = [
  { id: 'active', label: 'Active' },
  { id: 'final', label: 'Final' },
  { id: 'draft', label: 'Draft' },
  { id: 'closed', label: 'Postmortem / Closed' },
];

/** Round to one decimal, matching how scores are shown on the quadrant. */
export const round1 = (n) => Math.round(n * 10) / 10;

/** Weighted sum of criterion scores for one axis ('execution' | 'vision'). */
export function computeAxisScore(axisCriteria, vendorScores) {
  return axisCriteria.reduce(
    (sum, c) => sum + (vendorScores?.[c.id]?.score ?? 0) * c.weight,
    0,
  );
}
