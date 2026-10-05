import { makePayment } from "@/lib/actions";
import { PrintButton } from "@/components/print-button";
import { Badge, EmptyState, Panel, StatTile } from "@/components/ui";
import { readDb } from "@/lib/db";
import { activeAllocation } from "@/lib/queries";
import type { PaymentMethod, User } from "@/lib/types";
import { cn, formatDate, formatDateTime, money, semesterNow } from "@/lib/utils";

const METHOD_LABELS: Record<PaymentMethod, string> = {
  "airtel-money": "Airtel Money",
  "tnm-mpamba": "TNM Mpamba",
  "bank-transfer": "Bank transfer",
};

const METHOD_HINTS: Record<PaymentMethod, string> = {
  "airtel-money": "Dial *500# · merchant prompt appears after submitting",
  "tnm-mpamba": "Dial *405# · merchant prompt appears after submitting",
  "bank-transfer": "Pay into the MUBAS accommodation account and quote the reference",
};

const radioCard =
  "flex cursor-pointer items-start gap-3 rounded-xl bg-white px-4 py-3 ring-1 ring-cream-300 transition has-[:checked]:bg-cream-100 has-[:checked]:ring-2 has-[:checked]:ring-forest-600";

export function PaymentsSection({ user }: { user: User }) {
  const db = readDb();
  const semester = semesterNow();
  const allocation = activeAllocation(db, user.id, semester);
  const myPayments = db.payments
    .filter((p) => p.studentId === user.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const receiptsByPayment = new Map(db.receipts.map((r) => [r.paymentId, r]));
  const totalPaid = myPayments
    .filter((p) => p.status === "paid" && p.semester === semester)
    .reduce((n, p) => n + p.amount, 0);

  const student = db.users.find((u) => u.id === user.id);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label="Due this semester" value={money(108000)} hint="K27,000 per month equivalent" />
        <StatTile label="Paid this semester" value={money(totalPaid)} hint={totalPaid >= 108000 ? "Account settled" : "Outstanding balance applies"} />
        <StatTile
          label="Receipts issued"
          value={String(db.receipts.filter((r) => myPayments.some((p) => p.id === r.paymentId)).length)}
          hint="each with a unique tracking number"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Panel
          title="Make a payment"
          description="Hostel rent for the current semester. A receipt with a unique tracking number is issued instantly."
        >
          <form action={makePayment} className="space-y-5">
            <fieldset>
              <legend className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-700/70">
                Payment plan
              </legend>
              <div className="mt-2 grid gap-2">
                <label className={radioCard}>
                  <input type="radio" name="plan" value="semester" defaultChecked className="mt-1 accent-[#0f3d30]" />
                  <span>
                    <span className="block text-sm font-semibold text-ink-900">
                      Full semester · {money(108000)}
                    </span>
                    <span className="block text-xs text-ink-700/65">
                      Covers the complete {semester} semester
                    </span>
                  </span>
                </label>
                <label className={radioCard}>
                  <input type="radio" name="plan" value="month" className="mt-1 accent-[#0f3d30]" />
                  <span>
                    <span className="block text-sm font-semibold text-ink-900">
                      One month · {money(27000)}
                    </span>
                    <span className="block text-xs text-ink-700/65">Single month of residence</span>
                  </span>
                </label>
              </div>
            </fieldset>

            <fieldset>
              <legend className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-700/70">
                Method
              </legend>
              <div className="mt-2 grid gap-2">
                {(Object.keys(METHOD_LABELS) as PaymentMethod[]).map((method) => (
                  <label key={method} className={radioCard}>
                    <input
                      type="radio"
                      name="method"
                      value={method}
                      defaultChecked={method === "airtel-money"}
                      className="mt-1 accent-[#0f3d30]"
                    />
                    <span>
                      <span className="block text-sm font-semibold text-ink-900">
                        {METHOD_LABELS[method]}
                      </span>
                      <span className="block text-xs text-ink-700/65">{METHOD_HINTS[method]}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div>
              <label
                className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-700/70"
                htmlFor="payerPhone"
              >
                Payer phone / account note
              </label>
              <input
                id="payerPhone"
                name="payerPhone"
                required
                minLength={9}
                placeholder="e.g. 0991 234 567"
                className="mt-2 w-full rounded-xl bg-white px-3.5 py-2.5 text-sm text-ink-900 ring-1 ring-inset ring-cream-300 placeholder:text-ink-700/40 focus:ring-2 focus:ring-forest-600"
              />
            </div>

            {!allocation ? (
              <p className="rounded-xl bg-gold-500/15 px-4 py-3 text-xs leading-relaxed text-gold-600 ring-1 ring-inset ring-gold-500/40">
                Tip: you can pay before allocation, but a receipt is easiest to match once you
                hold a bed.
              </p>
            ) : null}

            <button
              type="submit"
              className="w-full rounded-xl bg-forest-700 px-4 py-3 text-sm font-bold text-cream-50 transition hover:bg-forest-600"
            >
              Pay &amp; issue receipt
            </button>
            <p className="text-center text-[11px] text-ink-700/55">
              Prototype gateway — no live mobile-money charge is made.
            </p>
          </form>
        </Panel>

        <Panel
          title="My receipts"
          description="Verifiable receipts for every hostel payment you have made."
        >
          {myPayments.length === 0 ? (
            <EmptyState
              title="No payments yet"
              body="Pay your hostel rent above and your receipt will be generated with a unique tracking number."
            />
          ) : (
            <ul className="space-y-4">
              {myPayments.map((payment) => {
                const receipt = receiptsByPayment.get(payment.id);
                return (
                  <li
                    key={payment.id}
                    className="overflow-hidden rounded-2xl ring-1 ring-cream-300"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3 bg-ink-900 px-5 py-3 text-cream-100">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold-400">
                          Official hostel rent receipt
                        </p>
                        <p className="font-mono text-sm text-cream-50">
                          {receipt?.tracking ?? "unissued"}
                        </p>
                      </div>
                      <div className="no-print flex items-center gap-2">
                        <Badge tone={payment.status === "paid" ? "green" : "gold"}>
                          {payment.status}
                        </Badge>
                        <PrintButton label="Print" />
                      </div>
                    </div>
                    <dl className="grid gap-3 bg-white px-5 py-4 text-sm sm:grid-cols-2">
                      <div>
                        <dt className="text-[10px] font-bold uppercase tracking-[0.16em] text-ink-700/55">
                          Student
                        </dt>
                        <dd className="mt-0.5 font-medium text-ink-900">
                          {student?.name} · {student?.regNumber ?? "—"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[10px] font-bold uppercase tracking-[0.16em] text-ink-700/55">
                          Amount
                        </dt>
                        <dd className="mt-0.5 font-medium text-ink-900">{money(payment.amount)}</dd>
                      </div>
                      <div>
                        <dt className="text-[10px] font-bold uppercase tracking-[0.16em] text-ink-700/55">
                          Method
                        </dt>
                        <dd className="mt-0.5 font-medium text-ink-900">
                          {METHOD_LABELS[payment.method]}
                          <span className="block font-mono text-xs text-ink-700/60">
                            {payment.reference}
                          </span>
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[10px] font-bold uppercase tracking-[0.16em] text-ink-700/55">
                          Issued
                        </dt>
                        <dd className="mt-0.5 font-medium text-ink-900">
                          {formatDateTime(receipt?.issuedAt ?? payment.createdAt)}
                          <span className="block text-xs text-ink-700/60">{payment.semester}</span>
                        </dd>
                      </div>
                    </dl>
                    <p className="border-t border-dashed border-cream-300 bg-cream-50 px-5 py-2.5 text-[11px] text-ink-700/60">
                      Generated by the MUBAS Smart Hostel Booking &amp; Management System — quote
                      the tracking number for any verification.
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ admin view */

export function PaymentsAdminSection() {
  const db = readDb();
  const rows = [...db.payments]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 40);
  const receiptsByPayment = new Map(db.receipts.map((r) => [r.paymentId, r]));
  const collected = db.payments
    .filter((p) => p.status === "paid")
    .reduce((n, p) => n + p.amount, 0);
  const byMethod = (method: PaymentMethod) =>
    db.payments.filter((p) => p.method === method && p.status === "paid").length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Collected" value={money(collected)} hint="all recorded payments" tone="dark" />
        <StatTile label="Receipts issued" value={String(db.receipts.length)} hint="unique tracking numbers" />
        <StatTile label="Airtel Money" value={String(byMethod("airtel-money"))} hint="payments" />
        <StatTile
          label="Mpamba / bank"
          value={`${byMethod("tnm-mpamba")} / ${byMethod("bank-transfer")}`}
          hint="payments"
        />
      </div>

      <Panel title="Payment ledger" description="Every payment with its receipt tracking number.">
        {rows.length === 0 ? (
          <EmptyState title="No payments yet" body="Student payments will appear here live." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-cream-300 text-[10px] uppercase tracking-[0.16em] text-ink-700/60">
                  <th className="py-2 pr-4 font-bold">Tracking number</th>
                  <th className="py-2 pr-4 font-bold">Student</th>
                  <th className="py-2 pr-4 font-bold">Amount</th>
                  <th className="py-2 pr-4 font-bold">Method</th>
                  <th className="py-2 pr-4 font-bold">Reference</th>
                  <th className="py-2 pr-4 font-bold">Date</th>
                  <th className="py-2 font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-200">
                {rows.map((payment) => {
                  const student = db.users.find((u) => u.id === payment.studentId);
                  const receipt = receiptsByPayment.get(payment.id);
                  return (
                    <tr key={payment.id} className="align-top">
                      <td className="py-3 pr-4 font-mono text-xs text-ink-900">
                        {receipt?.tracking ?? "—"}
                      </td>
                      <td className="py-3 pr-4">
                        <span className="block font-medium text-ink-900">
                          {student?.name ?? "Unknown"}
                        </span>
                        <span className="block text-xs text-ink-700/60">
                          {student?.regNumber ?? "—"}
                        </span>
                      </td>
                      <td className="py-3 pr-4 font-medium">{money(payment.amount)}</td>
                      <td className="py-3 pr-4">{METHOD_LABELS[payment.method]}</td>
                      <td className="py-3 pr-4 font-mono text-xs">{payment.reference}</td>
                      <td className="py-3 pr-4 text-xs">{formatDate(payment.createdAt)}</td>
                      <td className="py-3">
                        <Badge tone={payment.status === "paid" ? "green" : "gold"}>
                          {payment.status}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
