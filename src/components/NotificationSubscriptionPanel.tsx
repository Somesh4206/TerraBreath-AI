import React, { useState, useEffect } from 'react';
import {
  Bell,
  Mail,
  CheckCircle2,
  AlertTriangle,
  Send,
  Trash2,
  Shield,
  Loader2,
  Users,
  Radio,
  Check,
  Flame,
  Info,
} from 'lucide-react';
import { RiskAssessment } from '../types/terrabreath';
import { ProvenanceBadge } from './ProvenanceBadge';

interface Subscription {
  id: string;
  email: string;
  role: string;
  triggerLevel: 'CRITICAL';
  aoiScope: string;
  subscribedAt: string;
  notificationCount: number;
  lastNotifiedAt?: string;
}

interface NotificationSubscriptionPanelProps {
  risk: RiskAssessment | null;
  aoiName?: string;
}

export const NotificationSubscriptionPanel: React.FC<NotificationSubscriptionPanelProps> = ({
  risk,
  aoiName = 'Active Basin',
}) => {
  const [email, setEmail] = useState('someshm7662@gmail.com');
  const [role, setRole] = useState('Lead Remote Sensing Analyst');
  const [aoiScope, setAoiScope] = useState<'CURRENT' | 'ALL'>('ALL');
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDispatchingTest, setIsDispatchingTest] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const isCurrentCritical = risk?.riskLevel === 'CRITICAL';

  // Fetch active subscriptions
  const fetchSubscriptions = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/notifications/subscriptions');
      if (res.ok) {
        const data = await res.json();
        setSubscriptions(data.subscriptions || []);
      }
    } catch (err) {
      console.error('Failed to load subscriptions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  // Handle register / subscribe
  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setStatusMessage({ text: 'Please enter a valid analyst email address.', type: 'error' });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          role,
          aoiScope: aoiScope === 'CURRENT' ? aoiName : 'ALL',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setStatusMessage({
          text: `Analyst email ${email} successfully registered for automated CRITICAL risk alert dispatches.`,
          type: 'success',
        });
        await fetchSubscriptions();
      } else {
        const err = await res.json();
        setStatusMessage({ text: err.error || 'Failed to register subscription.', type: 'error' });
      }
    } catch (err) {
      setStatusMessage({ text: 'Network error registering email notification.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle unsubscribe
  const handleUnsubscribe = async (id: string, subEmail: string) => {
    try {
      const res = await fetch(`/api/notifications/unsubscribe/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setStatusMessage({ text: `Removed ${subEmail} from automated critical dispatch list.`, type: 'info' });
        await fetchSubscriptions();
      }
    } catch (err) {
      console.error('Failed to unsubscribe:', err);
    }
  };

  // Test dispatch
  const handleTestDispatch = async () => {
    setIsDispatchingTest(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/notifications/test-dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          aoiName,
          riskScore: risk ? risk.riskScore.toFixed(2) : '0.84',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setStatusMessage({
          text: `Simulated critical alert dispatched to ${data.recipient} via TLS direct relay (Latency: ${data.simulatedLatencyMs}ms).`,
          type: 'success',
        });
        await fetchSubscriptions();
      }
    } catch (err) {
      setStatusMessage({ text: 'Failed to dispatch test notification.', type: 'error' });
    } finally {
      setIsDispatchingTest(false);
    }
  };

  return (
    <div className="border-t border-slate-800/80 pt-5 mt-5">
      {/* Section Header */}
      <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Bell className="w-4 h-4 text-rose-400" />
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
          </div>
          <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
            Automated Critical Risk Notification Dispatch Relay
          </h4>
          <span className="px-2 py-0.5 text-[9px] font-mono rounded bg-rose-950 text-rose-300 border border-rose-800 font-semibold flex items-center gap-1">
            <Flame className="w-3 h-3 text-rose-400" />
            TRIGGER: CRITICAL (SCORE ≥ 0.75)
          </span>
        </div>

        <ProvenanceBadge type="LIVE" source="SMTP / TLS Alert Relay" />
      </div>

      <p className="text-xs text-slate-400 mb-4 leading-relaxed font-sans">
        Register operational duty analysts to automatically receive high-priority emergency dispatches with telemetry digests and PDF briefing links the moment the multi-source engine flags an active river basin as <strong className="text-rose-400 font-semibold">CRITICAL</strong> risk.
      </p>

      {/* Critical Status Callout Banner (when current active AOI is critical) */}
      {isCurrentCritical && (
        <div className="mb-4 p-3 rounded-lg bg-rose-950/40 border border-rose-800/80 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 animate-bounce" />
            <div className="text-xs font-mono text-rose-200">
              <span className="font-bold">CURRENT BASIN IS AT CRITICAL FLOOD RISK ({risk.riskScore.toFixed(2)})</span>
              <div className="text-[11px] text-rose-400 font-sans mt-0.5">
                Automated dispatch trigger is active for {aoiName}. All registered duty officers will be notified on ingestion cycle ticks.
              </div>
            </div>
          </div>

          <button
            onClick={handleTestDispatch}
            disabled={isDispatchingTest}
            className="px-3 py-1.5 rounded text-xs font-mono font-semibold bg-rose-600 hover:bg-rose-500 text-white transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm disabled:opacity-50"
          >
            {isDispatchingTest ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            <span>Dispatch Emergency Test Alert</span>
          </button>
        </div>
      )}

      {/* Subscription Form Card */}
      <div className="bg-[#0b0e14] border border-slate-800 rounded-lg p-4 mb-4">
        <form onSubmit={handleSubscribe} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            {/* Email Input */}
            <div className="sm:col-span-5 space-y-1">
              <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Mail className="w-3 h-3 text-cyan-400" />
                <span>Analyst Email Address</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="analyst@agency.gov"
                required
                className="w-full bg-slate-900 border border-slate-700/80 rounded px-3 py-2 text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
              />
            </div>

            {/* Analyst Role */}
            <div className="sm:col-span-4 space-y-1">
              <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Shield className="w-3 h-3 text-cyan-400" />
                <span>Operational Role</span>
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded px-2.5 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-500 transition-colors cursor-pointer"
              >
                <option value="Lead Remote Sensing Analyst">Lead Remote Sensing Analyst</option>
                <option value="Hydrological Modeler">Hydrological Modeler</option>
                <option value="Emergency Civil Defense Officer">Emergency Civil Defense Officer</option>
                <option value="Duty Operations Supervisor">Duty Operations Supervisor</option>
              </select>
            </div>

            {/* Monitored AOI Scope */}
            <div className="sm:col-span-3 space-y-1">
              <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Radio className="w-3 h-3 text-cyan-400" />
                <span>Basin Scope</span>
              </label>
              <select
                value={aoiScope}
                onChange={(e) => setAoiScope(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded px-2.5 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-500 transition-colors cursor-pointer"
              >
                <option value="ALL">All Global Basins</option>
                <option value="CURRENT">Current ({aoiName.split(' - ')[0]})</option>
              </select>
            </div>
          </div>

          {/* Form Actions Row */}
          <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
            <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Includes instant PDF risk dossier link and multi-sensor telemetry payload</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleTestDispatch}
                disabled={isDispatchingTest}
                className="px-3 py-1.5 rounded text-xs font-mono font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                title="Send test alert email simulation"
              >
                {isDispatchingTest ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3 h-3" />}
                <span>Send Test Alert</span>
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-1.5 rounded text-xs font-mono font-semibold text-white bg-cyan-600 hover:bg-cyan-500 transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
              >
                {isSubmitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                <span>Register Notification Email</span>
              </button>
            </div>
          </div>
        </form>

        {/* Status Toast / Inline Alert Message */}
        {statusMessage && (
          <div
            className={`mt-3 p-2.5 rounded text-xs font-mono flex items-center gap-2 border ${
              statusMessage.type === 'success'
                ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/80'
                : statusMessage.type === 'error'
                ? 'bg-rose-950/40 text-rose-300 border-rose-800/80'
                : 'bg-slate-900 text-slate-300 border-slate-700'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : statusMessage.type === 'error' ? (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <Info className="w-4 h-4 text-slate-400 shrink-0" />
            )}
            <span className="flex-1">{statusMessage.text}</span>
            <button
              onClick={() => setStatusMessage(null)}
              className="text-slate-500 hover:text-slate-300 text-xs px-1 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Active Subscriptions Roster */}
      <div className="bg-[#0b0e14] border border-slate-800/80 rounded-lg overflow-hidden">
        <div className="px-4 py-2.5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px] font-mono uppercase font-semibold text-slate-300">
              Active Registered Analysts ({subscriptions.length})
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-500">
            Automated SMTP Dispatch Enabled
          </span>
        </div>

        {isLoading ? (
          <div className="p-4 text-center text-xs font-mono text-slate-400 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
            <span>Loading active subscriptions...</span>
          </div>
        ) : subscriptions.length === 0 ? (
          <div className="p-4 text-center text-xs font-mono text-slate-500">
            No registered notification recipients. Add an analyst email above to activate automated critical risk alerts.
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {subscriptions.map((sub) => (
              <div
                key={sub.id}
                className="px-4 py-3 flex items-center justify-between flex-wrap gap-2 hover:bg-slate-900/40 transition-colors"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-semibold text-cyan-300">
                      {sub.email}
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-rose-950 text-rose-300 border border-rose-800 font-semibold">
                      {sub.triggerLevel} ONLY
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                      Scope: {sub.aoiScope}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-sans flex items-center gap-3">
                    <span>Role: <strong className="text-slate-300 font-mono">{sub.role}</strong></span>
                    <span>·</span>
                    <span>Dispatches sent: <strong className="text-slate-200 font-mono">{sub.notificationCount}</strong></span>
                    {sub.lastNotifiedAt && (
                      <>
                        <span>·</span>
                        <span>Last alert: <strong className="text-slate-400 font-mono">{new Date(sub.lastNotifiedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong></span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleUnsubscribe(sub.id, sub.email)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 rounded border border-transparent hover:border-rose-900 transition-colors cursor-pointer"
                    title={`Unsubscribe ${sub.email}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
