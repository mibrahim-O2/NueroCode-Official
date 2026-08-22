import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Loader2, ChevronDown, ExternalLink, Award, AlertCircle, History } from 'lucide-react';
import {
  getAllUsers,
  updateUserRole,
  getAllCredentialsAdmin,
  getAuditLogs,
  resetDashboard,
  resetRoadmapModule,
  resetPractice,
  resetAssessments,
  resetCredentialsModule,
  resetFullStudent,
} from '@/services/adminService';
import ConfirmResetModal from '@/components/common/ConfirmResetModal';

const ROLES = ['student', 'educator', 'admin'];

const RESET_ACTIONS = [
  {
    key: 'dashboard',
    label: 'Reset Dashboard',
    items: ['XP', 'Level', 'Streak', 'Dashboard analytics'],
    fn: resetDashboard,
  },
  {
    key: 'roadmap',
    label: 'Reset Roadmap',
    items: ['Topic completion', 'Unlock state', 'Recommended next topic'],
    fn: resetRoadmapModule,
  },
  {
    key: 'practice',
    label: 'Reset Practice',
    items: [
      'Practice submissions',
      'AI feedback',
      'Complexity analysis',
      'Anti-pattern history',
      'Weak topics',
      'ChromaDB embeddings',
    ],
    fn: resetPractice,
  },
  {
    key: 'assessments',
    label: 'Reset Assessments',
    items: [
      'Attempts',
      'Scores',
      'Integrity logs',
      'Assessment status (attempts tied to an issued credential are preserved)',
    ],
    fn: resetAssessments,
  },
  {
    key: 'credentials',
    label: 'Reset Credentials',
    items: ['Certificates', 'Verification UUIDs', 'Badges'],
    fn: resetCredentialsModule,
  },
  {
    key: 'full',
    label: 'Reset Student (Full Reset)',
    items: [
      'Dashboard',
      'Roadmap',
      'Practice',
      'Assessments',
      'Credentials',
      'Learning Analytics',
      'AI Recommendation History',
      'ChromaDB Embeddings',
    ],
    fn: resetFullStudent,
  },
];

export default function Admin() {
  const [users, setUsers] = useState([]);
  const [credentials, setCredentials] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleError, setRoleError] = useState(null);
  const [openMenuUserId, setOpenMenuUserId] = useState(null);
  const [pendingReset, setPendingReset] = useState(null); // { userId, action }

  const loadData = () => {
    setLoading(true);
    Promise.all([getAllUsers(), getAllCredentialsAdmin(), getAuditLogs()])
      .then(([u, c, logs]) => {
        setUsers(u);
        setCredentials(c);
        setAuditLogs(logs);
      })
      .finally(() => setLoading(false));
  };

  useEffect(loadData, []);

  const handleRoleChange = async (userId, newRole) => {
    setRoleError(null);
    try {
      await updateUserRole(userId, newRole);
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
      loadData(); // refresh audit log
    } catch (err) {
      setRoleError(err.message || 'Role change failed.');
    }
  };

  const handleResetConfirm = async (reason) => {
    await pendingReset.action.fn(pendingReset.userId, reason);
    setPendingReset(null);
    loadData();
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-text-muted" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading font-semibold text-2xl text-text-primary">Administration</h1>
          <p className="mt-1 font-body text-sm text-text-muted">System-wide user and credential management</p>
        </div>
        <Link
          to="/educator"
          className="flex items-center gap-1.5 rounded-button border border-border px-3 py-2 text-xs text-text-secondary transition-colors duration-200 hover:border-emerald hover:text-emerald"
        >
          <ShieldCheck className="h-3.5 w-3.5" /> View Cohort Dashboard
        </Link>
      </div>

      {roleError && (
        <div className="flex items-center gap-2 rounded-input border border-status-error/40 bg-status-error/10 px-4 py-3 text-sm text-status-error">
          <AlertCircle className="h-4 w-4 shrink-0" /> {roleError}
        </div>
      )}

      <div className="rounded-card border border-border bg-card shadow-card">
        <h2 className="p-5 pb-0 font-heading font-semibold text-text-primary">User Management</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase text-text-muted">
                <th className="px-5 py-3 font-normal">Name</th>
                <th className="px-5 py-3 font-normal">Email</th>
                <th className="px-5 py-3 font-normal">Role</th>
                <th className="px-5 py-3 font-normal">XP</th>
                <th className="px-5 py-3 font-normal">Reset</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-border last:border-0">
                  <td className="px-5 py-3 text-text-primary">{u.name}</td>
                  <td className="px-5 py-3 text-text-muted">{u.email}</td>
                  <td className="px-5 py-3">
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      className="rounded-input border border-border bg-elevated px-2 py-1 text-xs text-text-primary"
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-5 py-3 text-text-secondary">{u.xp}</td>
                  <td className="relative px-5 py-3">
                    {u.role === 'student' && (
                      <>
                        <button
                          onClick={() => setOpenMenuUserId(openMenuUserId === u.id ? null : u.id)}
                          className="flex items-center gap-1 rounded-input border border-border px-2.5 py-1.5 text-xs text-text-secondary transition-colors duration-200 hover:border-emerald hover:text-emerald"
                        >
                          Reset <ChevronDown className="h-3 w-3" />
                        </button>
                        {openMenuUserId === u.id && (
                          <div className="absolute right-5 z-10 mt-1 w-56 rounded-card border border-border bg-charcoal p-1.5 shadow-dropdown">
                            {RESET_ACTIONS.map((action) => (
                              <button
                                key={action.key}
                                onClick={() => {
                                  setPendingReset({ userId: u.id, action });
                                  setOpenMenuUserId(null);
                                }}
                                className="w-full rounded-input px-3 py-2 text-left text-xs text-text-secondary transition-colors duration-200 hover:bg-elevated hover:text-text-primary"
                              >
                                {action.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-text-muted">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-card border border-border bg-card shadow-card">
        <h2 className="flex items-center gap-2 p-5 pb-0 font-heading font-semibold text-text-primary">
          <Award className="h-4 w-4 text-gold" /> All Credentials
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase text-text-muted">
                <th className="px-5 py-3 font-normal">Student</th>
                <th className="px-5 py-3 font-normal">Badge</th>
                <th className="px-5 py-3 font-normal">Topics</th>
                <th className="px-5 py-3 font-normal">Score</th>
                <th className="px-5 py-3 font-normal">Verify</th>
              </tr>
            </thead>
            <tbody>
              {credentials.map((c) => (
                <tr key={c.id} className="border-b border-border last:border-0">
                  <td className="px-5 py-3 text-text-primary">{c.student_name}</td>
                  <td className="px-5 py-3 capitalize text-gold">{c.badge_level}</td>
                  <td className="px-5 py-3 text-text-secondary">{c.topics_mastered.join(', ')}</td>
                  <td className="px-5 py-3 text-text-secondary">{c.assessment_score}%</td>
                  <td className="px-5 py-3">
                    <a
                      href={`/verify/${c.verify_uuid}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-xs text-emerald hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" /> View
                    </a>
                  </td>
                </tr>
              ))}
              {credentials.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-text-muted">
                    No credentials issued yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-card border border-border bg-card shadow-card">
        <h2 className="flex items-center gap-2 p-5 pb-0 font-heading font-semibold text-text-primary">
          <History className="h-4 w-4 text-text-muted" /> Recent Admin Activity
        </h2>
        <div className="max-h-64 overflow-y-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase text-text-muted">
                <th className="px-5 py-3 font-normal">Date</th>
                <th className="px-5 py-3 font-normal">Admin</th>
                <th className="px-5 py-3 font-normal">Target</th>
                <th className="px-5 py-3 font-normal">Action</th>
                <th className="px-5 py-3 font-normal">Reason</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map((log) => (
                <tr key={log.id} className="border-b border-border last:border-0">
                  <td className="px-5 py-3 text-text-muted">{new Date(log.created_at).toLocaleString()}</td>
                  <td className="px-5 py-3 text-text-secondary">{log.admin_name}</td>
                  <td className="px-5 py-3 text-text-secondary">{log.target_user_name}</td>
                  <td className="px-5 py-3 font-mono text-xs text-emerald">{log.action}</td>
                  <td className="px-5 py-3 text-text-muted">{log.reason || '—'}</td>
                </tr>
              ))}
              {auditLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-text-muted">
                    No admin activity recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {pendingReset && (
        <ConfirmResetModal
          title={pendingReset.action.label}
          items={pendingReset.action.items}
          onCancel={() => setPendingReset(null)}
          onConfirm={handleResetConfirm}
        />
      )}
    </div>
  );
}