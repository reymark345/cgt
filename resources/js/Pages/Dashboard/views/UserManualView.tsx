import { BookOpen, PackageCheck } from 'lucide-react';

import { Button } from '@/Components/ui/button';

const manualSections = [
  {
    title: 'Receiving Records',
    description: 'Use the Incoming screen to review deliveries, donations, procurements, and transfer records.',
    items: ['Select an office type tab.', 'Filter by reference, supplier, inventory type, or creator.', 'Click column headers to sort records.'],
  },
  {
    title: 'Creating Incoming',
    description: 'The Create Incoming button starts a new receiving entry for the selected office.',
    items: ['Confirm the office tab before creating.', 'Fill supplier and inventory details.', 'Attach supporting documents before verification.'],
  },
  {
    title: 'Exporting Data',
    description: 'The Export button downloads the current filtered records as a CSV file.',
    items: ['Apply filters first.', 'Check the result count.', 'Export only the records currently matching your search.'],
  },
];

export function UserManualView({ notice, onOpenIncoming }: { notice: string; onOpenIncoming: () => void }) {
  return (
    <section className="mx-auto max-w-6xl rounded-md border border-border bg-card p-4 shadow-sm dark:border-border dark:bg-card sm:p-6">
      <div className="flex flex-col gap-4 border-b border-border pb-5 dark:border-border lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-accent text-primary dark:bg-accent dark:text-accent-foreground">
            <BookOpen className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-semibold tracking-normal">User Manual</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground dark:text-muted-foreground">
            Quick guide for navigating receiving records, creating incoming entries, filtering the table, and exporting reports.
          </p>
          <p className="mt-2 text-xs font-medium text-primary dark:text-accent-foreground">{notice}</p>
        </div>

        <Button className="gap-2 bg-primary hover:bg-primary/90" onClick={onOpenIncoming}>
          <PackageCheck className="h-4 w-4" />
          Go to Incoming
        </Button>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {manualSections.map((section) => (
          <article key={section.title} className="rounded-md border border-border bg-secondary p-4 dark:border-border dark:bg-card">
            <h3 className="text-sm font-semibold text-foreground dark:text-foreground">{section.title}</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground dark:text-muted-foreground">{section.description}</p>
            <ul className="mt-4 space-y-2 text-sm text-foreground dark:text-muted-foreground">
              {section.items.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-md border border-border p-4 dark:border-border">
          <h3 className="text-sm font-semibold">Common Actions</h3>
          <div className="mt-4 space-y-3">
            {[
              ['Search records', 'Use the filter boxes, then press Search.'],
              ['Sort a column', 'Click any sortable table heading.'],
              ['Change page size', 'Use Rows per page at the bottom.'],
              ['Download report', 'Click Export after applying filters.'],
            ].map(([title, description]) => (
              <div key={title} className="rounded-md bg-secondary p-3 dark:bg-card">
                <div className="text-sm font-medium text-foreground dark:text-accent-foreground">{title}</div>
                <div className="mt-1 text-xs text-muted-foreground dark:text-muted-foreground">{description}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-md border border-border p-4 dark:border-border">
          <h3 className="text-sm font-semibold">Workflow</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {[
              ['1', 'Receive', 'Create or locate an incoming record.'],
              ['2', 'Review', 'Check supplier, inventory type, amount, and delivery date.'],
              ['3', 'Attach', 'Add supporting documents for validation.'],
              ['4', 'Verify', 'Confirm details and mark the record verified.'],
            ].map(([step, title, description]) => (
              <div key={step} className="flex gap-3 rounded-md bg-secondary p-3 dark:bg-card">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">{step}</div>
                <div>
                  <div className="text-sm font-medium">{title}</div>
                  <div className="mt-1 text-xs leading-5 text-muted-foreground dark:text-muted-foreground">{description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}




