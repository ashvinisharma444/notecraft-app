import { auth } from '@/lib/auth';
import { BookOpen, FileText, Folder, Sparkles } from 'lucide-react';

export default async function DashboardPage() {
  const session = await auth();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center" style={{ color: 'var(--foreground)' }}>
      <div className="max-w-lg">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-6"
          style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
          <BookOpen className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-4xl font-bold mb-3">
          Welcome back{session?.user?.name ? `, ${session.user.name.split(' ')[0]}` : ''}! 👋
        </h1>
        <p className="text-lg mb-8" style={{ color: 'var(--muted)' }}>
          Your workspace is ready. Select a project from the sidebar or create a new one to get started.
        </p>

        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: Folder, label: 'Organize projects', desc: 'Group pages into projects' },
            { icon: FileText, label: 'Rich pages', desc: 'Headings, tables, code blocks' },
            { icon: Sparkles, label: 'Auto-save', desc: 'Never lose your work' },
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} className="rounded-xl p-4 text-left"
              style={{ background: 'var(--sidebar-hover)', border: '1px solid var(--border)' }}>
              <Icon className="w-5 h-5 mb-2" style={{ color: 'var(--primary)' }} />
              <div className="text-sm font-medium">{label}</div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
