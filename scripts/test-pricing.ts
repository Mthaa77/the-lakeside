import { estimate, estimateWeekendCard, estimateWeekday } from '../src/lib/pricing-engine';

let pass = 0, fail = 0;
function check(name: string, actual: any, expected: any) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) { pass++; console.log(`  OK ${name}`); }
  else { fail++; console.log(`  FAIL ${name} -> expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`); }
}

console.log('Pricing engine vectors:');

let r = estimateWeekendCard({ date: '2026-11-07', adults: 100 }, 'weekend');
check('Sat 100 standard = 198000', r.ok ? r.total : r, 198000);
r = estimateWeekendCard({ date: '2026-11-07', adults: 100, topUp: true }, 'weekend-topup');
check('Sat 100 top-up = 238000', r.ok ? r.total : r, 238000);
r = estimateWeekendCard({ date: '2026-11-06', adults: 80 }, 'weekend');
check('Fri 80 = 162000', r.ok ? r.total : r, 162000);
r = estimateWeekendCard({ date: '2026-11-08', adults: 40 }, 'weekend');
check('Sun 40 = 96000', r.ok ? r.total : r, 96000);
r = estimateWeekendCard({ date: '2026-11-05', adults: 40 }, 'weekend');
check('Thu 40 weekend card = 86000', r.ok ? r.total : r, 86000);
r = estimateWeekday({ date: '2026-11-03', adults: 40 });
check('Weekday 40 = 85000', r.ok ? r.total : r, 85000);
r = estimateWeekendCard({ date: '2026-11-07', adults: 60 }, 'weekend');
check('Sat 60 billed 80 = 172000', r.ok ? r.total : r, 172000);
check('Sat 60 min notice shown', r.ok ? r.minNotice !== null : false, true);
r = estimateWeekday({ date: '2026-11-02', adults: 20 });
check('Weekday 20 = 58000', r.ok ? r.total : r, 58000);
r = estimateWeekday({ date: '2026-11-02', adults: 45 });
check('Weekday 45 = 93000', r.ok ? r.total : r, 93000);
check('Weekday 45 indicative', r.ok ? r.isIndicative : false, true);
r = estimateWeekday({ date: '2026-11-02', adults: 100 });
check('Weekday 100 = 150000', r.ok ? r.total : r, 150000);
r = estimateWeekday({ date: '2026-11-02', adults: 115 });
check('Weekday 115 = POR (error)', r.ok, false);
r = estimateWeekendCard({ date: '2027-03-13', adults: 100 }, 'weekend');
check('Sat 2027 100 = 208000', r.ok ? r.total : r, 208000);
r = estimateWeekendCard({ date: '2026-11-07', adults: 100, rooms: { heritage: 3 } }, 'weekend');
check('Heritage x3 roomsTotal = 5100', r.ok ? r.roomsTotal : r, 5100);
r = estimateWeekendCard({ date: '2026-11-07', adults: 100 }, 'weekend');
check('Sat deposit = 34000', r.ok ? r.deposit.amount : r, 34000);
r = estimateWeekday({ date: '2026-11-03', adults: 40 });
check('Weekday 40 deposit = 21250', r.ok ? r.deposit.amount : r, 21250);
const bundle = estimate({ date: '2026-12-02', adults: 100 });
check('Dec fallback reason', bundle.fallbackReason !== null, true);
check('Dec weekend works', bundle.weekend.ok, true);
const thursday = estimate({ date: '2026-11-05', adults: 80 });
check('Thursday shows both', thursday.showBoth, true);
check('Thursday weekend ok', thursday.weekend.ok, true);
check('Thursday weekday ok', thursday.weekday?.ok === true, true);
// past date rejected
r = estimateWeekendCard({ date: '2020-01-01', adults: 100 }, 'weekend');
check('Past date rejected', r.ok, false);
// unconfigured year (2028)
r = estimateWeekendCard({ date: '2028-06-10', adults: 100 }, 'weekend');
check('2028 = price on request', r.ok, false);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
