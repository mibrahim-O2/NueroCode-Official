import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Swords, Code2, AlertTriangle, CheckCircle2, Trophy } from 'lucide-react';
import Logo from '@/components/common/Logo';
import {
  getRoadmap,
  startNode,
  completeNode,
  getRecommendation,
  getTopicProgress,
} from '@/services/roadmapService';
import { useAuth } from '@/context/AuthContext';
import RoadmapNode from '@/components/roadmap/RoadmapNode';
import LeaderboardCard from '@/components/dashboard/LeaderboardCard';

const PRACTICE_CAPABILITY_THRESHOLD = 50;

export default function Roadmap() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [topicProgress, setTopicProgress] = useState({});
  const [actionPending, setActionPending] = useState(false);
  const [justUnlockedId, setJustUnlockedId] = useState(null);
  const [banner, setBanner] = useState(null);
  const [recommendation, setRecommendation] = useState(null);

  useEffect(() => {
    Promise.allSettled([
      getRoadmap().then((res) => {
        const data = res?.data || res;
        const list = Array.isArray(data) ? data : [];
        setNodes(list);
        const current = list.find((n) => n?.status === 'unlocked' || n?.status === 'in_progress');
        setSelected(current || list[0] || null);
      }),
      getRecommendation()
        .then((res) => setRecommendation(res?.data || res))
        .catch(() => setRecommendation(null)),
      getTopicProgress()
        .then((res) => {
          const data = res?.data?.topic_progress || res?.topic_progress || res || {};
          setTopicProgress(data);
        })
        .catch(() => setTopicProgress({})),
    ]).finally(() => {
      setLoading(false);
    });
  }, []);

  // The backend gates challenge-gate access on a GLOBAL count of passing
  // submissions across every topic (repositories.count_passing_submissions),
  // NOT a per-topic count. Mirror that here so this readiness bar agrees
  // with what the challenge endpoint actually enforces.
  const globalSolvedCount = Object.values(topicProgress).reduce(
    (sum, n) => sum + (Number(n) || 0),
    0
  );
  const isChallengeReady = globalSolvedCount >= PRACTICE_CAPABILITY_THRESHOLD;
  const progressPercent = Math.min(
    100,
    Math.round((globalSolvedCount / PRACTICE_CAPABILITY_THRESHOLD) * 100)
  );

  const topicsMasteredCount = nodes.filter((n) => n?.status === 'completed').length;
  const totalTopics = nodes.length;

  // Refetches roadmap + per-topic progress together so every view that
  // depends on either one (node list, readiness bar, selected panel)
  // reflects the same server state after a mutation.
  const refreshRoadmapState = async () => {
    const [roadmapRes, progressRes] = await Promise.allSettled([getRoadmap(), getTopicProgress()]);

    let list = [];
    if (roadmapRes.status === 'fulfilled') {
      const fresh = roadmapRes.value?.data || roadmapRes.value;
      list = Array.isArray(fresh) ? fresh : [];
      setNodes(list);
    }

    if (progressRes.status === 'fulfilled') {
      const data =
        progressRes.value?.data?.topic_progress || progressRes.value?.topic_progress || progressRes.value || {};
      setTopicProgress(data);
    }

    return list;
  };

  const handleStartPractice = async (node) => {
    if (!node?.id) return;
    setActionPending(true);
    try {
      const res = await startNode(node.id);
      const updated = res?.data || res;
      setNodes((prev) => prev.map((n) => (n?.id === updated?.id ? updated : n)));
      setSelected(updated);
      navigate(
        `/practice?nodeId=${encodeURIComponent(updated.id)}&topic=${encodeURIComponent(
          updated.topic || ''
        )}&difficulty=${encodeURIComponent(updated.difficulty || 'Easy')}`
      );
    } finally {
      setActionPending(false);
    }
  };

  const handleTakeChallenge = (node) => {
    if (node?.id) {
      navigate(`/challenge/${node.id}`);
    }
  };

  const handleComplete = async (node) => {
    if (!node?.id) return;
    setActionPending(true);
    try {
      const res = await completeNode(node.id);
      const result = res?.data || res;

      const list = await refreshRoadmapState();

      // node.position can legitimately be 0, so guard against the falsy
      // fallback dropping the "next position" check to NaN + 0.
      const nodePosition = node?.position ?? 0;
      const newlyUnlocked = list.find(
        (n) => n?.position === nodePosition + 1 && n?.status === 'unlocked'
      );
      if (newlyUnlocked) {
        setJustUnlockedId(newlyUnlocked.id);
        setTimeout(() => setJustUnlockedId(null), 900);
      }

      if (result?.user) {
        updateUser({ xp: result.user.xp, level: result.user.level, streak: result.user.streak });
      }

      // Keep the detail panel pointed at whatever is next to do, instead
      // of blanking it — nulling it here was what made the readiness bar
      // above flash to "Select a Topic — 0/50" right after every completion.
      const nextActive = list.find((n) => n?.status === 'unlocked' || n?.status === 'in_progress');
      setSelected(nextActive || null);

      setBanner(`+${result?.xp_awarded || 150} XP earned${result?.leveled_up ? ' — Level up!' : ''}`);
      setTimeout(() => setBanner(null), 3500);
    } finally {
      setActionPending(false);
    }
  };

  // Full-page Centered Animated Logo Loader using Project Logo Component
  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm">
        <div className="relative flex items-center justify-center">
          {/* Pulsing Outer Neon Glow */}
          <div className="absolute h-32 w-32 animate-ping rounded-full bg-orange/15 duration-1000" />
          <div className="absolute h-40 w-40 animate-pulse rounded-full bg-orange/10 blur-xl" />

          {/* Project Logo Component */}
          <div className="relative flex items-center justify-center drop-shadow-[0_0_25px_rgba(255,107,0,0.35)] animate-pulse">
            <Logo variant="icon" size={84} animated={true} />
          </div>
        </div>

        {/* Animated Loading Text */}
        <div className="mt-8 flex flex-col items-center gap-2">
          <p className="font-heading text-xs font-semibold tracking-wider text-text-primary uppercase animate-pulse">
            Loading Roadmap
          </p>
          <div className="flex gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-orange animate-bounce [animation-delay:-0.3s]" />
            <span className="h-1.5 w-1.5 rounded-full bg-orange animate-bounce [animation-delay:-0.15s]" />
            <span className="h-1.5 w-1.5 rounded-full bg-orange animate-bounce" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-slide-fade-in">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="font-heading font-semibold text-2xl text-text-primary">Roadmap</h1>
          <p className="mt-1 font-body text-sm text-text-muted">Your adaptive learning path</p>
        </div>

        {/* Topics-mastered summary stat */}
        {totalTopics > 0 && (
          <div className="flex items-center gap-2 rounded-input border border-border bg-card px-3.5 py-2 self-start sm:self-auto">
            <Trophy className="h-4 w-4 text-orange shrink-0" />
            <span className="font-mono text-xs text-text-secondary">
              <strong className="text-text-primary">{topicsMasteredCount}</strong> / {totalTopics} topics mastered
            </span>
          </div>
        )}
      </div>

      {/* Challenge Gate Readiness (global — matches the backend gate) */}
      <div className="rounded-card border border-border bg-card p-5 space-y-3 shadow-card transition-all duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {isChallengeReady ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />
            )}
            <h2 className="text-sm font-semibold text-text-primary">
              <span className="text-orange font-bold uppercase tracking-wide mr-2">Challenge Gate Readiness</span>
              {isChallengeReady ? (
                <span className="text-emerald-400">Ready for the Challenge Gate!</span>
              ) : (
                <span>
                  Readiness Level: <strong className="text-amber-400">Keep practicing</strong>
                </span>
              )}
            </h2>
          </div>
          <span className="font-mono text-xs text-text-muted">
            {globalSolvedCount} / {PRACTICE_CAPABILITY_THRESHOLD} problems solved ({progressPercent}%)
          </span>
        </div>

        {/* Segmented Progress Track — ticks mark each 10-problem milestone
            so progress reads as discrete steps earned, not just a blob of
            fill; the labeled 50 marker anchors the challenge-gate goal. */}
        <div className="relative pt-1">
          <div className="flex h-2.5 w-full gap-[3px]">
            {Array.from({ length: 10 }).map((_, i) => {
              const segmentThreshold = (i + 1) * 10;
              const filled = globalSolvedCount >= segmentThreshold;
              const partial =
                !filled && globalSolvedCount > i * 10
                  ? Math.round(((globalSolvedCount - i * 10) / 10) * 100)
                  : 0;
              return (
                <div
                  key={i}
                  className="relative flex-1 overflow-hidden rounded-full bg-charcoal border border-border"
                >
                  {(filled || partial > 0) && (
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isChallengeReady ? 'bg-emerald-500' : 'bg-gradient-to-r from-amber-500 to-orange'
                      }`}
                      style={{ width: filled ? '100%' : `${partial}%` }}
                    />
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-1 flex justify-between font-mono text-[10px] text-text-muted">
            <span>0</span>
            <span className="text-text-secondary">{PRACTICE_CAPABILITY_THRESHOLD} — challenge gate</span>
          </div>
        </div>

        <p className="text-xs text-text-muted">
          {isChallengeReady
            ? `You've solved ${PRACTICE_CAPABILITY_THRESHOLD}+ practice problems. You're prepared for the 10-problem challenge gates.`
            : `Solve ${Math.max(
                0,
                PRACTICE_CAPABILITY_THRESHOLD - globalSolvedCount
              )} more practice problems (any topic) to build a recommended foundation before attempting a 10-problem challenge gate.`}
        </p>
      </div>

      {banner && (
        <div className="animate-celebrate flex items-center gap-2 rounded-input border border-orange/40 bg-orange/10 px-4 py-2.5 text-sm text-orange">
          <Sparkles className="h-4 w-4" />
          {banner}
        </div>
      )}

      {recommendation?.recommended_topic && (
        <div className="animate-slide-fade-in flex items-start gap-3 rounded-input border border-teal/30 bg-teal/5 px-4 py-3 text-sm text-text-secondary">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-teal" />
          <span>
            <strong className="text-teal">Recommended next: {recommendation.recommended_topic}.</strong>{' '}
            {recommendation.reason}
          </span>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Node Progression List */}
        <div className="flex flex-col">
          {nodes.map((node, i) => (
            <RoadmapNode
              key={node?.id || i}
              node={node}
              isLast={i === nodes.length - 1}
              isSelected={selected?.id === node?.id}
              onSelect={(n) => setSelected(n)}
              onPractice={handleStartPractice}
              onTakeChallenge={handleTakeChallenge}
              justUnlocked={justUnlockedId === node?.id}
              recommended={recommendation?.recommended_topic === node?.topic}
            />
          ))}
        </div>

        {/* Node Detail and Action Panel */}
        <div className="flex flex-col gap-4">
          {selected && (
            <div className="animate-slide-fade-in rounded-card border border-orange/30 bg-card p-5 shadow-card space-y-4">
              <div>
                <h3 className="font-heading font-semibold text-text-primary text-base">
                  {selected.topic || 'Selected Topic'}
                </h3>
                <p className="mt-1 text-xs text-text-muted">
                  {selected.status === 'completed'
                    ? 'Topic Mastered'
                    : selected.status === 'locked'
                    ? 'Complete the previous topic challenge to unlock'
                    : isChallengeReady
                    ? 'Checkpoint challenge gate ready'
                    : 'Practice recommended before the challenge gate'}
                </p>
              </div>

              {selected.status !== 'completed' && selected.status !== 'locked' && (
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => handleTakeChallenge(selected)}
                    disabled={actionPending}
                    className="flex items-center justify-center gap-2 rounded-button bg-orange px-4 py-2.5 text-sm font-body font-semibold text-white shadow-button transition-all duration-200 hover:bg-orange-hover active:scale-95 disabled:opacity-50"
                  >
                    <Swords className="h-4 w-4" />
                    <span>Start Challenge (Click if ready)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleStartPractice(selected)}
                    disabled={actionPending}
                    className="flex items-center justify-center gap-2 rounded-button border border-border bg-charcoal px-4 py-2 text-xs font-body text-text-secondary transition-all duration-200 hover:border-orange/40 hover:text-text-primary active:scale-95 disabled:opacity-50"
                  >
                    <Code2 className="h-3.5 w-3.5" />
                    <span>Review Practice Mode</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleComplete(selected)}
                    disabled={actionPending}
                    className="rounded-button border border-border/50 px-4 py-1.5 text-[11px] font-body text-text-muted transition-all duration-200 hover:border-orange/30 hover:text-text-primary active:scale-95 disabled:opacity-50"
                  >
                    {actionPending ? 'Submitting…' : 'Mark Complete'}
                  </button>
                </div>
              )}
            </div>
          )}

          <LeaderboardCard />
        </div>
      </div>
    </div>
  );
}
