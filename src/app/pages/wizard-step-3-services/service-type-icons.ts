// Mapeamento local pelos IDs do catálogo de tipos de clínica.
// Paths SVG em uma grade 24 × 24, com a mesma espessura de traço.
export const SERVICE_TYPE_ICONS: Readonly<Record<number, string>> = {
  // Odontologia: dente.
  1: 'M12 5C9 5 8 3 6 3 2 3 3 10 4 13c1 3 1 8 3 8 2 0 2-7 5-7s3 7 5 7c2 0 2-5 3-8 1-3 2-10-2-10-2 0-3 2-6 2Z',
  // Medicina: estetoscópio.
  2: 'M5 3v2M11 3v2M4 4H3v5a5 5 0 0 0 10 0V4h-1M8 14v3a4 4 0 0 0 8 0v-3M19 11a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
  // Estética: brilhos.
  3: 'm12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3ZM20 2v4M18 4h4M4 18v4M2 20h4',
  // Psicologia: cérebro.
  4: 'M12 5a3 3 0 0 0-5-2 3 3 0 0 0-3 4 4 4 0 0 0-1 7 3 3 0 0 0 3 5 3 3 0 0 0 6 0V5Zm0 0a3 3 0 0 1 5-2 3 3 0 0 1 3 4 4 4 0 0 1 1 7 3 3 0 0 1-3 5 3 3 0 0 1-6 0M7 7c3 0 3 4 0 4m10-4c-3 0-3 4 0 4M6 15c3-1 4 1 3 3m9-3c-3-1-4 1-3 3',
  // Fisioterapia: pessoa em movimento.
  5: 'M14 4a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM4 8l8 2 8-4M12 10l-2 6-5 5m5-5 6 1 3 4',
  // Nutrição: maçã com folha.
  6: 'M12 8C7 4 3 8 3 12s3 9 6 9c2 0 2-1 3-1s1 1 3 1c3 0 6-5 6-9s-4-8-9-4ZM12 8V5m0 0c0-3 3-4 6-3 0 3-3 4-6 3Z',
  // Multidisciplinar: cruz de saúde.
  7: 'M9 3h6v6h6v6h-6v6H9v-6H3V9h6V3Z',
};

export const DEFAULT_SERVICE_ICON = 'M4 7h16v14H4V7Zm4 0V3h8v4M4 12h16M10 12v3h4v-3';

export function serviceTypeIcon(typeClientId: number): string {
  return SERVICE_TYPE_ICONS[typeClientId] ?? DEFAULT_SERVICE_ICON;
}
