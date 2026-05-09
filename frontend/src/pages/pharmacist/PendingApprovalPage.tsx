import { Clock, Building2 } from 'lucide-react';

export default function PendingApprovalPage() {
  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="relative mb-8">
          <div className="w-28 h-28 bg-amber-100 dark:bg-amber-900/20 rounded-3xl flex items-center justify-center mx-auto border-2 border-amber-200 dark:border-amber-800">
            <Building2 size={52} className="text-amber-500 dark:text-amber-400" />
          </div>
          <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-amber-400 rounded-full flex items-center justify-center border-4 border-white dark:border-gray-950 shadow-md">
            <Clock size={18} className="text-white" />
          </div>
        </div>

        <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white mb-3">Awaiting Approval</h1>
        <p className="text-slate-500 dark:text-gray-400 leading-relaxed mb-6">
          Your pharmacy registration is currently under review by our admin team. You'll receive access to your full dashboard once your license and details have been verified.
        </p>

        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 text-left space-y-2">
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-400">What happens next?</p>
          <ul className="text-sm text-amber-700 dark:text-amber-500 space-y-1 list-disc list-inside">
            <li>Admin reviews your license number</li>
            <li>Approval usually takes 1–2 business days</li>
            <li>You'll see your dashboard once approved</li>
          </ul>
        </div>

        <p className="text-slate-400 dark:text-gray-600 text-sm mt-6">
          Need help? Contact{' '}
          <a href="mailto:support@imitipharmafind.rw" className="text-sky-500 hover:underline">support@imitipharmafind.rw</a>
        </p>
      </div>
    </div>
  );
}
