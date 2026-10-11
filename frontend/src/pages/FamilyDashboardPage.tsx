import React, { useState, useEffect } from 'react';
import {
  Users,
  CheckCircle2,
  AlertCircle,
  Copy,
  Trash2,
  KeyRound,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { BigButton } from '../components/BigButton';
import { FamilyPermission } from '../types';

export const FamilyDashboardPage: React.FC = () => {
  const { role } = useAuth();
  const { t } = useLanguage();

  // Farmer State: Invite creation
  const [helperPhone, setHelperPhone] = useState('');
  const [generatedInvite, setGeneratedInvite] = useState<{
    code: string;
    expires_at: string;
    instructions: string;
  } | null>(null);
  const [activeHelpers, setActiveHelpers] = useState<any[]>([]);

  // Helper State: Accept invite & view farmers
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [connectedFarmers, setConnectedFarmers] = useState<FamilyPermission[]>([]);

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadData = async () => {
    try {
      if (role === 'farmer') {
        const res = await api.family.listHelpers();
        setActiveHelpers(res.helpers || []);
      } else {
        const res = await api.family.listFarmers();
        setConnectedFarmers(res);
      }
    } catch (err) {
      console.error('Error loading family data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [role]);

  // Farmer creates invitation
  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const res = await api.family.createInvite(helperPhone);
      setGeneratedInvite({
        code: res.invite_code,
        expires_at: res.expires_at,
        instructions: res.instructions
      });
      setSuccessMsg('Invitation code created! Share this code with your helper.');
      setHelperPhone('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to generate invitation code.');
    } finally {
      setLoading(false);
    }
  };

  // Helper accepts code
  const handleAcceptInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const res = await api.family.acceptInvite(inviteCodeInput);
      setSuccessMsg(res.message);
      setInviteCodeInput('');
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to accept invitation. Code may be invalid or expired.');
    } finally {
      setLoading(false);
    }
  };

  // Farmer revokes helper
  const handleRevoke = async (id: string) => {
    if (!window.confirm('Are you sure you want to revoke this helper access?')) return;
    try {
      await api.family.revokeHelper(id);
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const copyCodeToClipboard = () => {
    if (generatedInvite?.code) {
      navigator.clipboard.writeText(generatedInvite.code);
      alert('Code copied to clipboard!');
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-900 px-3.5 py-1.5 rounded-full text-base font-bold">
          <Users className="w-5 h-5 text-amber-700" />
          <span>{t.familyTitle}</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-gray-900">
          కుటుంబ సహాయకుల కనెక్ట్ (Family Helper Access)
        </h1>
        <p className="text-gray-600 text-lg">
          {t.familySubtitle}
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 border-2 border-red-300 rounded-2xl text-red-800 text-lg flex items-center gap-2">
          <AlertCircle className="w-6 h-6 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-green-50 border-2 border-green-300 rounded-2xl text-green-800 text-lg flex items-center gap-2">
          <CheckCircle2 className="w-6 h-6 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* FARMER VIEW: Invite Son/Daughter/Helper */}
      {role === 'farmer' ? (
        <div className="space-y-8">
          <div className="farmer-card p-8 bg-white space-y-6">
            <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2 border-b pb-2">
              <KeyRound className="w-6 h-6 text-emerald-700" />
              <span>{t.generateCodeBtn}</span>
            </h2>

            <form onSubmit={handleCreateInvite} className="space-y-4">
              <div>
                <label className="block text-lg font-bold text-gray-800 mb-2">
                  Helper's Mobile Number / సహాయకుని ఫోన్ నంబర్ *
                </label>
                <input
                  type="tel"
                  required
                  value={helperPhone}
                  onChange={(e) => setHelperPhone(e.target.value)}
                  placeholder="e.g. 9848098765"
                  className="w-full px-4 py-3.5 text-lg font-bold rounded-xl border-2 border-gray-300 focus:border-emerald-600"
                />
              </div>

              <BigButton
                type="submit"
                disabled={loading}
                variant="primary"
                className="w-full sm:w-auto text-xl"
              >
                {loading ? t.loading : 'Generate 6-Letter Access Code'}
              </BigButton>
            </form>

            {generatedInvite && (
              <div className="p-6 bg-amber-50 rounded-2xl border-2 border-amber-300 space-y-3">
                <span className="text-sm font-bold text-amber-900 block">
                  Authorization Code (Valid for 7 days):
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-4xl font-black tracking-widest text-amber-950 bg-white px-5 py-2 rounded-xl border border-amber-300 shadow-sm">
                    {generatedInvite.code}
                  </span>
                  <button
                    type="button"
                    onClick={copyCodeToClipboard}
                    className="p-3 bg-amber-200 hover:bg-amber-300 text-amber-900 rounded-xl"
                    title="Copy Code"
                  >
                    <Copy className="w-6 h-6" />
                  </button>
                </div>
                <p className="text-base text-amber-900 font-medium">
                  {generatedInvite.instructions}
                </p>
              </div>
            )}
          </div>

          {/* Active Authorized Helpers */}
          <div className="farmer-card p-6 bg-white space-y-4">
            <h3 className="text-2xl font-black text-gray-900 border-b pb-2">
              Authorized Helpers on Your Farm ({activeHelpers.length})
            </h3>
            {activeHelpers.length > 0 ? (
              <div className="divide-y">
                {activeHelpers.map((h) => (
                  <div key={h.permission_id} className="py-4 flex items-center justify-between">
                    <div>
                      <h4 className="text-lg font-bold text-gray-900">{h.helper_name}</h4>
                      <p className="text-sm text-gray-600">{h.helper_phone || h.helper_email}</p>
                      <span className="text-xs text-emerald-800 font-semibold bg-emerald-100 px-2.5 py-0.5 rounded-full inline-block mt-1">
                        Active Helper (Read Only)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRevoke(h.permission_id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-xl font-bold flex items-center gap-1"
                    >
                      <Trash2 className="w-5 h-5" />
                      <span className="text-sm">Revoke Access</span>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 py-4">No family helpers connected yet.</p>
            )}
          </div>
        </div>
      ) : (
        /* HELPER VIEW: Connect to Farmer */
        <div className="space-y-8">
          <div className="farmer-card p-8 bg-white space-y-6">
            <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2 border-b pb-2">
              <KeyRound className="w-6 h-6 text-amber-700" />
              <span>{t.helperEnterCode}</span>
            </h2>

            <form onSubmit={handleAcceptInvite} className="space-y-4">
              <div>
                <label className="block text-lg font-bold text-gray-800 mb-2">
                  6-Letter Invitation Code / రైతు ఆహ్వాన కోడ్ *
                </label>
                <input
                  type="text"
                  required
                  maxLength={10}
                  value={inviteCodeInput}
                  onChange={(e) => setInviteCodeInput(e.target.value.toUpperCase())}
                  placeholder="e.g. ABCXYZ"
                  className="w-full px-4 py-3.5 text-2xl font-black tracking-widest text-center uppercase rounded-xl border-2 border-gray-300 focus:border-emerald-600"
                />
              </div>

              <BigButton
                type="submit"
                disabled={loading}
                variant="accent"
                className="w-full sm:w-auto text-xl"
              >
                {loading ? t.loading : t.joinFarmerBtn}
              </BigButton>
            </form>
          </div>

          {/* Connected Farmers */}
          <div className="farmer-card p-6 bg-white space-y-4">
            <h3 className="text-2xl font-black text-gray-900 border-b pb-2">
              Farmers You Are Assisting ({connectedFarmers.length})
            </h3>
            {connectedFarmers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {connectedFarmers.map((f) => (
                  <div
                    key={f.id}
                    className="p-5 rounded-2xl border-2 border-emerald-900/10 bg-emerald-50/30 flex items-center justify-between"
                  >
                    <div>
                      <h4 className="text-xl font-black text-emerald-950">{f.farmer_name}</h4>
                      <p className="text-sm text-gray-600">{f.farmer_phone || 'Protected phone'}</p>
                      <span className="text-xs text-emerald-800 font-semibold bg-emerald-100 px-2.5 py-0.5 rounded-full inline-block mt-2">
                        {f.permission_level} Access
                      </span>
                    </div>

                    <a
                      href="/dashboard"
                      className="p-3 bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1 shadow-sm hover:bg-emerald-800"
                    >
                      <span>View Farm</span>
                      <ArrowRight className="w-5 h-5" />
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 py-4">
                You haven't connected to any farmer's account yet. Ask the farmer for their 6-letter invite code.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
