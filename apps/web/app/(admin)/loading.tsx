// File: apps/web/app/(admin)/loading.tsx
// Description: Loading UI for admin section during navigation
// Why: Provides visual feedback when navigating between admin pages
// RELEVANT FILES: apps/web/app/(admin)/layout.tsx

export default function Loading() {
  return (
    <div className="flex items-center justify-center h-64">
      <div 
        className="h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"
        role="status"
        aria-label="Loading"
      />
    </div>
  );
}
