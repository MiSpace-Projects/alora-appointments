import type { Metadata } from 'next';
import { requireOwner } from '@/lib/owner';
import { listCustomerRecords } from '@/lib/data/customers';
import { directoryOverview, summarizeCustomer } from '@/lib/customer-insights';
import { familyForCategory } from '@/app/features/servicesSection/servicesData';
import { OwnerTabs } from '../OwnerTabs';
import { CustomerDirectory } from './CustomerDirectory';
import ownerStyles from '../owner.module.css';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Customers', robots: { index: false, follow: false } };

export default async function OwnerCustomersPage() {
  await requireOwner();
  const now = new Date();
  const records = await listCustomerRecords();
  const summaries = records.map((record) =>
    summarizeCustomer(record, now, (category) => familyForCategory(category)?.title ?? null),
  );
  const customers = summaries.filter((summary) => !summary.isOwner);
  const overview = directoryOverview(customers, now);

  return (
    <main className={ownerStyles.page}>
      <OwnerTabs active="customers" />
      <header className={ownerStyles.head}>
        <div>
          <h1 className={ownerStyles.title}>Customers</h1>
          <p className={ownerStyles.subtitle}>
            {overview.customers === 0
              ? 'No customers yet.'
              : `${overview.customers} customer${overview.customers === 1 ? '' : 's'} · ${overview.newLast30Days} joined in the last 30 days`}
          </p>
        </div>
      </header>
      <CustomerDirectory customers={customers} overview={overview} now={now.toISOString()} />
    </main>
  );
}
