import { useEffect, useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { getRoadmap, startNode, completeNode } from '@/services/roadmapService';
import { useAuth } from '@/context/AuthContext';
import RoadmapNode from '@/components/roadmap/RoadmapNode';
import LeaderboardCard from '@/components/dashboard/LeaderboardCard';

export default function Roadmap() {
  const { updateUser } = useAuth();
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [actionPending, setActionPending] = useState(false);
  const [justUnlockedId, setJustUnlockedId] = useState(null);
  const [banner, setBanner] = useState(null);

  useEffect(() => {
    getRoadmap()
      .then((data) => {
        setNodes(data);
        const current = data.find((n) => n.status === 'unlocked' || n.status === 'in_progress');
        setSelected(current || null);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleStart = async (node) => {
    setActionPending(true);
    try {
      const updated = await startNode(node.id);
      setNodes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
      setSelected(updated);
    } finally {
      setActionPending(false);
    }
  };

  const handleComplete = async (node) => {
    setActionPending(true);
    try {
      const result = await completeNode(node.id);
      const fresh = await getRoadmap();

      const newlyUnlocked = fresh.find(
        (n) => n.position === node.position + 1 && n.status === 'unlocked'
      );
      if (newlyUnlocked) {
        setJustUnlockedId(newlyUnlocked.id);
        setTimeout(() => setJustUnlockedId(null), 900);
      }

      setNodes(fresh);
      updateUser({ xp: result.user.xp, level: result.user.level, streak: result.user.streak });
      setSelected(null);
      setBanner(`+${result.xp_awarded} XP earned${result.leveled_up ? ' — Level up!' : ''}`);
      setTimeout(() => setBanner(null), 3500);
    } finally {
      setActionPending(false);
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
      <div>
        <h1 className="font-heading font-semibold text-2xl text-text-primary">Roadmap</h1>
        <p className="mt-1 font-body text-sm text-text-muted">Your adaptive learning path</p>
      </div>

      {banner && (
        <div className="flex items-center gap-2 rounded-input border border-emerald/40 bg-emerald/10 px-4 py-2.5 text-sm text-emerald animate-fade-in">
          <Sparkles className="h-4 w-4" />
          {banner}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col">
          {nodes.map((node, i) => (
            <RoadmapNode
              key={node.id}
              node={node}
              isLast={i === nodes.length - 1}
              isSelected={selected?.id === node.id}
              onSelect={setSelected}
              justUnlocked={justUnlockedId === node.id}
            />
          ))}
        </div>

        <div className="flex flex-col gap-4">
          {selected && selected.status !== 'completed' && (
            <div className="rounded-card border border-emerald/30 bg-card p-5 shadow-card">
              <h3 className="font-heading font-semibold text-text-primary">{selected.topic}</h3>
              <p className="mt-1 text-xs text-text-muted">
                {selected.status === 'in_progress' ? 'Challenge in progress' : 'Ready to start this topic'}
              </p>
              <div className="mt-4 flex flex-col gap-2">
                {selected.status === 'unlocked' && (
                  <button
                    onClick={() => handleStart(selected)}
                    disabled={actionPending}
                    className="rounded-button bg-emerald px-4 py-2.5 text-sm font-body text-white shadow-button transition-colors duration-200 hover:bg-emerald-hover disabled:opacity-50"
                  >
                    Start Challenge
                  </button>
                )}
                <button
                  onClick={() => handleComplete(selected)}
                  disabled={actionPending}
                  className="rounded-button border border-emerald px-4 py-2.5 text-sm font-body text-emerald transition-colors duration-200 hover:bg-emerald/10 disabled:opacity-50"
                >
                  {actionPending ? 'Submitting…' : 'Mark Complete'}
                </button>
              </div>
            </div>
          )}

          <LeaderboardCard />
        </div>
      </div>
    </div>
  );
}