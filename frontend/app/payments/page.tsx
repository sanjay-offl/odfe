"use client";

import Link from "next/link";
import {
  HiOutlineArrowLeft,
  HiOutlineCurrencyDollar,
  HiOutlineCreditCard,
  HiOutlineBanknotes,
  HiOutlineDevicePhoneMobile,
  HiOutlineCheckCircle,
} from "react-icons/hi2";

const paymentMethods = [
  { id: 1, name: "Visa ending 4242", type: "Credit Card", icon: HiOutlineCreditCard, last4: "4242", isDefault: true },
  { id: 2, name: "Cash Drawer", type: "Cash", icon: HiOutlineBanknotes, last4: "", isDefault: false },
  { id: 3, name: "Apple Pay", type: "Mobile", icon: HiOutlineDevicePhoneMobile, last4: "", isDefault: false },
  { id: 4, name: "Mastercard ending 8888", type: "Credit Card", icon: HiOutlineCreditCard, last4: "8888", isDefault: false },
];

const transactions = [
  { id: "TXN-9001", orderId: "#1245", method: "Visa •••• 4242", amount: "$87.50", status: "Completed", time: "2 min ago" },
  { id: "TXN-9002", orderId: "#1244", method: "Cash", amount: "$42.00", status: "Completed", time: "8 min ago" },
  { id: "TXN-9003", orderId: "#1243", method: "Apple Pay", amount: "$156.20", status: "Completed", time: "12 min ago" },
  { id: "TXN-9004", orderId: "#1242", method: "Visa •••• 4242", amount: "$28.50", status: "Refunded", time: "15 min ago" },
  { id: "TXN-9005", orderId: "#1241", method: "MC •••• 8888", amount: "$64.80", status: "Completed", time: "20 min ago" },
  { id: "TXN-9006", orderId: "#1240", method: "Cash", amount: "$112.00", status: "Completed", time: "25 min ago" },
  { id: "TXN-9007", orderId: "#1239", method: "Visa •••• 4242", amount: "$47.50", status: "Completed", time: "30 min ago" },
  { id: "TXN-9008", orderId: "#1238", method: "Apple Pay", amount: "$134.90", status: "Failed", time: "35 min ago" },
];

const statusColors: Record<string, string> = {
  Completed: "bg-brand-500/15 text-brand-400",
  Refunded: "bg-amber-500/15 text-amber-400",
  Failed: "bg-red-500/15 text-red-400",
};

export default function PaymentsPage() {
  return (
    <div className="min-h-screen bg-surface-950">
      <header className="flex items-center gap-4 border-b border-white/5 px-6 py-4">
        <Link
          href="/dashboard"
          className="rounded-xl p-2 text-surface-400 transition-colors hover:bg-white/5 hover:text-white"
        >
          <HiOutlineArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex items-center gap-2">
          <HiOutlineCurrencyDollar className="h-5 w-5 text-brand-400" />
          <h1 className="text-lg font-bold text-white">Payments</h1>
        </div>
      </header>

      <div className="p-6">
        {/* Payment Methods */}
        <div className="mb-8">
          <h2 className="mb-4 text-base font-semibold text-white">Payment Methods</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {paymentMethods.map((method) => (
              <div key={method.id} className="glass-card p-5">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                    <method.icon className="h-5 w-5 text-brand-400" />
                  </div>
                  {method.isDefault && (
                    <span className="flex items-center gap-1 text-xs text-brand-400">
                      <HiOutlineCheckCircle className="h-3.5 w-3.5" />
                      Default
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-semibold text-white">{method.name}</h3>
                <p className="mt-1 text-xs text-surface-500">{method.type}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="glass-card overflow-hidden">
          <div className="border-b border-white/5 px-5 py-4">
            <h2 className="text-base font-semibold text-white">Recent Transactions</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="px-5 py-3 font-medium text-surface-400">Transaction</th>
                  <th className="px-5 py-3 font-medium text-surface-400">Order</th>
                  <th className="px-5 py-3 font-medium text-surface-400">Method</th>
                  <th className="px-5 py-3 font-medium text-surface-400">Amount</th>
                  <th className="px-5 py-3 font-medium text-surface-400">Status</th>
                  <th className="px-5 py-3 font-medium text-surface-400">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {transactions.map((txn) => (
                  <tr key={txn.id} className="text-surface-300 transition-colors hover:bg-white/5">
                    <td className="px-5 py-3 font-medium text-white">{txn.id}</td>
                    <td className="px-5 py-3">{txn.orderId}</td>
                    <td className="px-5 py-3">{txn.method}</td>
                    <td className="px-5 py-3 font-medium text-white">{txn.amount}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[txn.status]}`}>
                        {txn.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-surface-500">{txn.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
