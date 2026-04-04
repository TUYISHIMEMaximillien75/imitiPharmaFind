import type { UserMode, PatientView } from '../../types';

interface FooterProps {
  userMode: UserMode;
  currentView: PatientView;
}

export default function Footer({ userMode, currentView }: FooterProps) {
  // We only show the footer heavily on landing or search results
  if (userMode !== 'patient' || currentView === 'verifying') {
    return null;
  }

  return (
    <footer className="bg-slate-50 py-8 text-center text-sm text-slate-400 border-t border-slate-200 mt-auto">
      <p>&copy; 2026 PharmaLocate Musanze. All rights reserved.</p>
    </footer>
  );
}
