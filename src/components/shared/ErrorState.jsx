import { AlertCircle } from 'lucide-react';

export default function ErrorState({ title = 'Error', message = 'Something went wrong', onRetry }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
      <AlertCircle className="mx-auto mb-4 text-red-500" size={48} />
      <h3 className="font-semibold text-gray-900">{title}</h3>
      <p className="mt-2 text-sm text-gray-600">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
        >
          Try Again
        </button>
      )}
    </div>
  );
}
