/** Calendar dates are civil dates in the clinic's zone, independent of the browser. */
export function zonedParts(value: string | Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('sv-SE', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date(value));
  const get = (type: string) => parts.find(p => p.type === type)!.value;
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`;
}
export function addDays(day: string, count: number): string {
  const date = new Date(`${day}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + count);
  return date.toISOString().slice(0, 10);
}
export function clinicInstant(local: string, timeZone: string): string {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(local)) throw new Error('Informe uma data e um horário válidos.');
  const civil = Date.parse(`${local}:00Z`);
  let instant = civil;
  for (let i = 0; i < 4; i++) {
    const represented = Date.parse(`${zonedParts(new Date(instant), timeZone)}:00Z`);
    instant += civil - represented;
  }
  if (zonedParts(new Date(instant), timeZone) !== local) throw new Error('Este horário não existe no fuso da clínica. Escolha outro horário.');
  return new Date(instant).toISOString(); // Z is an explicit UTC offset.
}
export function weekStart(day: string): string {
  return addDays(day, -((new Date(`${day}T12:00:00Z`).getUTCDay() + 6) % 7));
}
