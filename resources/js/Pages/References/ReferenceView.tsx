import { Database, FileSpreadsheet, UsersRound } from 'lucide-react';

type ReferenceViewProps = {
  description: string;
  title: string;
  type: 'grantee' | 'emv-database' | 'emv-payroll';
};

const icons = {
  grantee: UsersRound,
  'emv-database': Database,
  'emv-payroll': FileSpreadsheet,
};

const sampleRows = {
  grantee: [
    ['GR-0001', 'Juan Dela Cruz', 'Active', 'Butuan City'],
    ['GR-0002', 'Maria Santos', 'Active', 'Cabadbaran City'],
    ['GR-0003', 'Pedro Reyes', 'Inactive', 'Bayugan City'],
  ],
  'emv-database': [
    ['EMV-1001', 'LANDBANK **** 4812', 'Linked', 'Sep 14, 2026'],
    ['EMV-1002', 'DBP **** 2034', 'For Review', 'Sep 10, 2026'],
    ['EMV-1003', 'LANDBANK **** 9110', 'Linked', 'Sep 08, 2026'],
  ],
  'emv-payroll': [
    ['PAY-2026-001', 'September Payroll', 'Prepared', 'PHP 245,000.00'],
    ['PAY-2026-002', 'August Payroll', 'Released', 'PHP 238,500.00'],
    ['PAY-2026-003', 'July Payroll', 'Released', 'PHP 241,750.00'],
  ],
};

export function ReferenceView({ description, title, type }: ReferenceViewProps) {
  const Icon = icons[type];
  const rows = sampleRows[type];

  return (
    <section className="mx-auto w-full max-w-[1800px] space-y-5">
      <div className="rounded-md border border-border bg-card p-4 shadow-sm dark:border-border dark:bg-card sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-md bg-accent text-primary dark:bg-accent dark:text-accent-foreground">
              <Icon className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-semibold tracking-normal">{title}</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground dark:text-muted-foreground">{description}</p>
          </div>
          <button className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90" type="button">
            Add New
          </button>
        </div>
      </div>

      <div className="rounded-md border border-border bg-card shadow-sm dark:border-border dark:bg-card">
        <div className="border-b border-border p-4 dark:border-border">
          <h3 className="text-sm font-semibold">{title} Records</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead className="bg-secondary text-xs uppercase text-muted-foreground dark:bg-card dark:text-accent-foreground">
              <tr>
                <th className="w-[18%] px-4 py-3 font-medium">Code</th>
                <th className="w-[40%] px-4 py-3 font-medium">Name / Details</th>
                <th className="w-[18%] px-4 py-3 font-medium">Status</th>
                <th className="w-[24%] px-4 py-3 font-medium">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row[0]} className="border-t border-border dark:border-border">
                  {row.map((cell) => (
                    <td key={cell} className="px-4 py-3">{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}



