// Sub-categories under "Service Request" hold case notes, so their quick-add dialog
// becomes "New SR" and starts from the case notes template below.
export function isServiceRequest(category: string): boolean {
  return /^service\s+requests?$/i.test(category.trim());
}

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

// DD-MMM-YYYY HH:MM UTC
export function formatSrDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(date.getUTCDate())}-${MONTHS[date.getUTCMonth()]}-${date.getUTCFullYear()} `
    + `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())} UTC`;
}

const field = (label: string, value: string) => `<p><strong>${label}:</strong> ${value}</p>`;
const listField = (label: string, items: string[]) =>
  `<p><strong>${label}:</strong></p><ul>${items.map(i => `<li><p>${i}</p></li>`).join('')}</ul>`;
const section = (name: string) => `<hr><h3>${name}</h3>`;

export function srTemplateHtml(date: Date = new Date()): string {
  return [
    '<h2>CASE NOTES UPDATE</h2>',
    field('Date/Time', formatSrDate(date)),
    field('Log Type', '[Customer Inbound / Customer Outbound / No Contact / Service Provider]'),

    section('SITUATION'),
    field('Issue', '[Brief description of the problem.]'),
    field('Customer Impact', '[Describe business or service impact.]'),
    field('Current Status', '[Current state of the issue.]'),

    section('ACTIONS TAKEN'),
    `<ul>${['[Action 1]', '[Action 2]', '[Action 3]', '[Action 4]'].map(i => `<li><p>${i}</p></li>`).join('')}</ul>`,
    listField('Logs Reviewed', ['[Log 1]', '[Log 2]']),
    listField('Customer Interaction', ['[Meeting / Call / Email / Teams Session]', '[Summary of discussion]']),

    section('RESULTS'),
    listField('Findings', ['[Finding 1]', '[Finding 2]', '[Finding 3]']),
    listField('Errors Observed', ['[Error 1]', '[Error 2]']),
    field('Outcome', '[Issue persists / Issue resolved / Monitoring / Pending Engineering]'),

    section('NEXT STEPS'),
    listField('Customer Actions', ['[Action]']),
    listField('Support Actions', ['[Action]']),
    listField('Engineering Actions', ['[Action]']),
    listField('Follow-Up Plan', ['[Scheduled meeting, callback, monitoring, escalation]']),
    field('Owner', '[Customer / Support / Engineering]'),
  ].join('');
}
