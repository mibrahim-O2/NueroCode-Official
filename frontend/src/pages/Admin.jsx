import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Loader2, RotateCcw, ExternalLink, Award } from 'lucide-react';
import { getAllUsers, updateUserRole, getAllCredentialsAdmin, resetStudentRoadmap } from '@/services/adminService';

const ROLES = ['student', 'educator', 'admin'];

export default function Admin() {
  const [users, setUsers] = useState([]);
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resettingId, setResettingId] = useState(null);
  const [confirmResetId, setConfirmResetId] = useState(null);

  const loadData = () => {
    setLoading(true);
    Promise.all([getAllUsers(), getAllCredentialsAdmin()])
      .then(([u, c]) => {
        setUsers(u);
        setCredentials(c);
      })
      .finally(() => setLoading(false));
  };

  useEffect(loadData, []);

  const handleRoleChange = async (userId, newRole) => {
    await updateUserRole(userId, newRole);
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
  };

  const handleReset = async (userId) => {
    setResettingId(userId);
    try {
      await resetStudentRoadmap(userId);
      setConfirmResetId(null);
    } finally {
      setResettingId(null);
    }
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
                <th className="px-5 py-3 font-normal">Reset Roadmap</th>
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
                  <td className="px-5 py-3">
                    {u.role === 'student' &&
                      (confirmResetId === u.id ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleReset(u.id)}
                            disabled={resettingId === u.id}
                            className="text-xs font-semibold text-status-error hover:underline"
                          >
                            {resettingId === u.id ? 'Resetting…' : 'Confirm'}
                          </button>
                          <button onClick={() => setConfirmResetId(null)} className="text-xs text-text-muted hover:underline">
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmResetId(u.id)}
                          className="flex items-center gap-1 text-xs text-text-muted hover:text-status-error"
                        >
                          <RotateCcw className="h-3 w-3" /> Reset
                        </button>
                      ))}
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
    </div>
  );
}