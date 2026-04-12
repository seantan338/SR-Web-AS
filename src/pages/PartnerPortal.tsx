import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus, Search, Filter, MoreVertical, Users, Briefcase, TrendingUp, Clock,
  Globe, Handshake, X, Edit2, Trash2, Building2, Phone, Mail, User,
  FileText, AlertCircle, CheckCircle, ChevronDown, Loader2,
} from 'lucide-react';
import { useFirebase } from '../lib/FirebaseContext';
import {
  db, collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot,
  query, where, orderBy, OperationType, handleFirestoreError,
} from '../lib/firebase';
import { PartnerClient, JobOrder, Application } from '../types';

// ─── helpers ────────────────────────────────────────────────────────────────

const BLANK_CLIENT: Omit<PartnerClient, 'id' | 'createdAt'> = {
  companyName: '', industry: '', contactName: '',
  contactEmail: '', contactPhone: '', status: 'active',
};

const BLANK_ORDER: Omit<JobOrder, 'id' | 'submittedBy' | 'partnerName' | 'status' | 'createdAt'> = {
  clientCompany: '', jobTitle: '', jobDescription: '',
  salaryRange: '', headcount: 1, urgency: 'medium', notes: '',
};

const URGENCY_COLORS: Record<string, string> = {
  low: 'bg-slate-100 text-slate-700',
  medium: 'bg-yellow-50 text-yellow-700',
  high: 'bg-red-50 text-red-700',
};

const ORDER_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-blue-50 text-blue-700',
  'in-progress': 'bg-yellow-50 text-yellow-700',
  filled: 'bg-green-50 text-green-700',
};

const STAGE_COLORS: Record<string, string> = {
  pending: 'bg-slate-100 text-slate-600',
  reviewed: 'bg-blue-50 text-blue-700',
  interviewing: 'bg-yellow-50 text-yellow-700',
  hired: 'bg-green-50 text-green-700',
  rejected: 'bg-red-50 text-red-700',
};

function thisMonthStart() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
}

// ─── sub-components ──────────────────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </motion.div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      {children}
    </div>
  );
}

const inputCls = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500';
const selectCls = `${inputCls} bg-white`;

// ─── main component ──────────────────────────────────────────────────────────

type Tab = 'clients' | 'orders' | 'placements';

export default function PartnerPortal() {
  const { user, userProfile } = useFirebase();
  const uid = user?.uid ?? '';

  // ── state ────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<Tab>('clients');
  const [clients, setClients] = useState<PartnerClient[]>([]);
  const [orders, setOrders] = useState<JobOrder[]>([]);
  const [placements, setPlacements] = useState<Application[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingPlacements, setLoadingPlacements] = useState(true);

  const [search, setSearch] = useState('');
  const [clientError, setClientError] = useState('');
  const [orderError, setOrderError] = useState('');

  // modal state
  const [showClientModal, setShowClientModal] = useState(false);
  const [editingClient, setEditingClient] = useState<PartnerClient | null>(null);
  const [clientForm, setClientForm] = useState(BLANK_CLIENT);
  const [savingClient, setSavingClient] = useState(false);

  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderForm, setOrderForm] = useState(BLANK_ORDER);
  const [savingOrder, setSavingOrder] = useState(false);

  // menu
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // ── Firestore listeners ──────────────────────────────────────────────────
  useEffect(() => {
    if (!uid) return;

    const clientsRef = collection(db, 'partners', uid, 'clients');
    const unsub = onSnapshot(
      query(clientsRef, orderBy('createdAt', 'desc')),
      (snap) => {
        setClients(snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<PartnerClient, 'id'>) })));
        setLoadingClients(false);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, `partners/${uid}/clients`);
        setLoadingClients(false);
      },
    );
    return unsub;
  }, [uid]);

  useEffect(() => {
    if (!uid) return;

    const ordersRef = collection(db, 'jobOrders');
    const unsub = onSnapshot(
      query(ordersRef, where('submittedBy', '==', uid), orderBy('createdAt', 'desc')),
      (snap) => {
        setOrders(snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<JobOrder, 'id'>) })));
        setLoadingOrders(false);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'jobOrders');
        setLoadingOrders(false);
      },
    );
    return unsub;
  }, [uid]);

  useEffect(() => {
    if (!uid) return;

    const appsRef = collection(db, 'applications');
    const unsub = onSnapshot(
      query(appsRef, where('referredBy', '==', uid), orderBy('createdAt', 'desc')),
      (snap) => {
        setPlacements(snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Application, 'id'>) })));
        setLoadingPlacements(false);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'applications');
        setLoadingPlacements(false);
      },
    );
    return unsub;
  }, [uid]);

  // close context menu on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  // ── stats ────────────────────────────────────────────────────────────────
  const activeClientsCount = clients.filter(c => c.status === 'active').length;
  const openOrdersCount = orders.filter(o => o.status !== 'filled').length;
  const placementsThisMonth = placements.filter(
    p => p.status === 'hired' && p.createdAt >= thisMonthStart(),
  ).length;
  const pendingFollowUps = orders.filter(o => o.status === 'pending').length;

  // ── client handlers ──────────────────────────────────────────────────────
  function openAddClient() {
    setEditingClient(null);
    setClientForm(BLANK_CLIENT);
    setClientError('');
    setShowClientModal(true);
  }

  function openEditClient(client: PartnerClient) {
    setEditingClient(client);
    const { id: _id, createdAt: _ca, ...rest } = client;
    setClientForm(rest);
    setClientError('');
    setShowClientModal(true);
    setOpenMenu(null);
  }

  async function saveClient() {
    if (!clientForm.companyName.trim()) { setClientError('Company name is required.'); return; }
    setSavingClient(true);
    setClientError('');
    try {
      const clientsRef = collection(db, 'partners', uid, 'clients');
      if (editingClient?.id) {
        await updateDoc(doc(db, 'partners', uid, 'clients', editingClient.id), clientForm as Record<string, unknown>);
      } else {
        await addDoc(clientsRef, { ...clientForm, createdAt: new Date().toISOString() });
      }
      setShowClientModal(false);
    } catch (err) {
      setClientError('Failed to save. Please try again.');
      console.error(err);
    } finally {
      setSavingClient(false);
    }
  }

  async function deleteClient(client: PartnerClient) {
    if (!client.id) return;
    if (!window.confirm(`Remove "${client.companyName}"?`)) return;
    setOpenMenu(null);
    try {
      await deleteDoc(doc(db, 'partners', uid, 'clients', client.id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `partners/${uid}/clients/${client.id}`);
    }
  }

  // ── job order handlers ───────────────────────────────────────────────────
  function openAddOrder() {
    setOrderForm(BLANK_ORDER);
    setOrderError('');
    setShowOrderModal(true);
  }

  async function saveOrder() {
    if (!orderForm.clientCompany.trim() || !orderForm.jobTitle.trim()) {
      setOrderError('Client company and job title are required.');
      return;
    }
    setSavingOrder(true);
    setOrderError('');
    try {
      await addDoc(collection(db, 'jobOrders'), {
        ...orderForm,
        submittedBy: uid,
        partnerName: userProfile?.displayName ?? '',
        status: 'pending',
        createdAt: new Date().toISOString(),
      });
      setShowOrderModal(false);
    } catch (err) {
      setOrderError('Failed to submit. Please try again.');
      console.error(err);
    } finally {
      setSavingOrder(false);
    }
  }

  // ── filtered views ───────────────────────────────────────────────────────
  const filteredClients = clients.filter(c =>
    c.companyName.toLowerCase().includes(search.toLowerCase()) ||
    c.contactName.toLowerCase().includes(search.toLowerCase()),
  );

  const filteredOrders = orders.filter(o =>
    o.jobTitle.toLowerCase().includes(search.toLowerCase()) ||
    o.clientCompany.toLowerCase().includes(search.toLowerCase()),
  );

  // ── render ───────────────────────────────────────────────────────────────
  return (
    <div className="pt-16 min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Partner Dashboard</h1>
            <p className="text-slate-500">Manage your sourced clients and post job orders on their behalf.</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={openAddClient}
              className="bg-white text-slate-900 border border-slate-200 px-6 py-3 rounded-xl font-semibold hover:bg-slate-50 transition-all flex items-center"
            >
              <Handshake className="w-5 h-5 mr-2" />
              Add Client
            </button>
            <button
              onClick={openAddOrder}
              className="bg-orange-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-orange-600 transition-all flex items-center"
            >
              <Plus className="w-5 h-5 mr-2" />
              Post Job Order
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
          {[
            { label: 'Active Clients', value: loadingClients ? '—' : activeClientsCount, icon: Globe, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Open Job Orders', value: loadingOrders ? '—' : openOrdersCount, icon: Briefcase, color: 'text-orange-600', bg: 'bg-orange-50' },
            { label: 'Placements This Month', value: loadingPlacements ? '—' : placementsThisMonth, icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
            { label: 'Pending Follow-ups', value: loadingOrders ? '—' : pendingFollowUps, icon: Clock, color: 'text-green-600', bg: 'bg-green-50' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm"
            >
              <div className={`${stat.bg} ${stat.color} p-2 rounded-lg w-fit mb-4`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
              <div className="text-sm text-slate-500">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-6 bg-white border border-slate-200 rounded-xl p-1 w-fit">
          {([
            { key: 'clients', label: 'Clients', icon: Building2 },
            { key: 'orders', label: 'Job Orders', icon: FileText },
            { key: 'placements', label: 'Placements', icon: TrendingUp },
          ] as { key: Tab; label: string; icon: React.ElementType }[]).map(tab => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setSearch(''); }}
              className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">

          {/* ── Clients tab ─────────────────────────────────────────────── */}
          {activeTab === 'clients' && (
            <motion.div
              key="clients"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
            >
              <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-xl font-bold text-slate-900">Your Managed Clients</h2>
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search clients…"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      className="pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:border-orange-500 outline-none text-sm"
                    />
                  </div>
                </div>
              </div>

              {loadingClients ? (
                <div className="flex items-center justify-center py-16 text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading…
                </div>
              ) : filteredClients.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                  <Building2 className="w-10 h-10 mb-3 opacity-40" />
                  <p className="font-medium">{search ? 'No clients match your search.' : 'No clients yet — add one to get started.'}</p>
                </div>
              ) : (
                <div className="overflow-x-auto" ref={menuRef}>
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                        <th className="px-6 py-4 font-semibold">Company</th>
                        <th className="px-6 py-4 font-semibold">Industry</th>
                        <th className="px-6 py-4 font-semibold">Contact</th>
                        <th className="px-6 py-4 font-semibold">Status</th>
                        <th className="px-6 py-4 font-semibold">Added</th>
                        <th className="px-6 py-4"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredClients.map(client => (
                        <tr key={client.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-semibold text-slate-900">{client.companyName}</div>
                          </td>
                          <td className="px-6 py-4 text-slate-600 text-sm">{client.industry || '—'}</td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-slate-900">{client.contactName}</div>
                            <div className="text-xs text-slate-500">{client.contactEmail}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              client.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {client.status === 'active' ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-500 text-sm">
                            {new Date(client.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-right relative">
                            <button
                              onClick={() => setOpenMenu(openMenu === client.id ? null : client.id!)}
                              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                            {openMenu === client.id && (
                              <div className="absolute right-4 top-10 z-20 bg-white border border-slate-200 rounded-xl shadow-lg py-1 min-w-[140px]">
                                <button
                                  onClick={() => openEditClient(client)}
                                  className="flex items-center w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                                >
                                  <Edit2 className="w-4 h-4 mr-2" /> Edit
                                </button>
                                <button
                                  onClick={() => deleteClient(client)}
                                  className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" /> Remove
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          )}

          {/* ── Job Orders tab ───────────────────────────────────────────── */}
          {activeTab === 'orders' && (
            <motion.div
              key="orders"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
            >
              <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-xl font-bold text-slate-900">Submitted Job Orders</h2>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search orders…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:border-orange-500 outline-none text-sm"
                  />
                </div>
              </div>

              {loadingOrders ? (
                <div className="flex items-center justify-center py-16 text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading…
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                  <FileText className="w-10 h-10 mb-3 opacity-40" />
                  <p className="font-medium">{search ? 'No orders match your search.' : 'No job orders yet — post one to get started.'}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                        <th className="px-6 py-4 font-semibold">Job Title</th>
                        <th className="px-6 py-4 font-semibold">Client</th>
                        <th className="px-6 py-4 font-semibold">Headcount</th>
                        <th className="px-6 py-4 font-semibold">Urgency</th>
                        <th className="px-6 py-4 font-semibold">Status</th>
                        <th className="px-6 py-4 font-semibold">Submitted</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredOrders.map(order => (
                        <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-semibold text-slate-900">{order.jobTitle}</div>
                            {order.salaryRange && <div className="text-xs text-slate-500">{order.salaryRange}</div>}
                          </td>
                          <td className="px-6 py-4 text-slate-600 text-sm">{order.clientCompany}</td>
                          <td className="px-6 py-4 text-slate-700 text-sm font-medium">{order.headcount}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${URGENCY_COLORS[order.urgency] ?? ''}`}>
                              {order.urgency}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${ORDER_STATUS_COLORS[order.status] ?? ''}`}>
                              {order.status.replace('-', ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-500 text-sm">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          )}

          {/* ── Placements tab ───────────────────────────────────────────── */}
          {activeTab === 'placements' && (
            <motion.div
              key="placements"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
            >
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-xl font-bold text-slate-900">Referred Candidates</h2>
                <p className="text-sm text-slate-500 mt-1">Candidates you referred and their current pipeline stage.</p>
              </div>

              {loadingPlacements ? (
                <div className="flex items-center justify-center py-16 text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading…
                </div>
              ) : placements.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                  <Users className="w-10 h-10 mb-3 opacity-40" />
                  <p className="font-medium">No referrals on record yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                        <th className="px-6 py-4 font-semibold">Candidate</th>
                        <th className="px-6 py-4 font-semibold">Job Title</th>
                        <th className="px-6 py-4 font-semibold">Company</th>
                        <th className="px-6 py-4 font-semibold">Date Applied</th>
                        <th className="px-6 py-4 font-semibold">Stage</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {placements.map(p => (
                        <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 font-semibold text-slate-900">{p.candidateName ?? '—'}</td>
                          <td className="px-6 py-4 text-slate-600 text-sm">{p.jobTitle ?? '—'}</td>
                          <td className="px-6 py-4 text-slate-600 text-sm">{p.company ?? '—'}</td>
                          <td className="px-6 py-4 text-slate-500 text-sm">{new Date(p.createdAt).toLocaleDateString()}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${STAGE_COLORS[p.status] ?? 'bg-slate-100 text-slate-600'}`}>
                              {p.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* ── Add/Edit Client Modal ──────────────────────────────────────────── */}
      <AnimatePresence>
        {showClientModal && (
          <Modal
            title={editingClient ? 'Edit Client' : 'Add New Client'}
            onClose={() => setShowClientModal(false)}
          >
            <div className="space-y-4">
              <Field label="Company Name *">
                <input
                  className={inputCls}
                  value={clientForm.companyName}
                  onChange={e => setClientForm(f => ({ ...f, companyName: e.target.value }))}
                  placeholder="Acme Corp"
                />
              </Field>
              <Field label="Industry">
                <input
                  className={inputCls}
                  value={clientForm.industry}
                  onChange={e => setClientForm(f => ({ ...f, industry: e.target.value }))}
                  placeholder="Technology, Finance, Healthcare…"
                />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Contact Name">
                  <input
                    className={inputCls}
                    value={clientForm.contactName}
                    onChange={e => setClientForm(f => ({ ...f, contactName: e.target.value }))}
                    placeholder="Jane Smith"
                  />
                </Field>
                <Field label="Status">
                  <select
                    className={selectCls}
                    value={clientForm.status}
                    onChange={e => setClientForm(f => ({ ...f, status: e.target.value as 'active' | 'inactive' }))}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </Field>
              </div>
              <Field label="Contact Email">
                <input
                  className={inputCls}
                  type="email"
                  value={clientForm.contactEmail}
                  onChange={e => setClientForm(f => ({ ...f, contactEmail: e.target.value }))}
                  placeholder="jane@acme.com"
                />
              </Field>
              <Field label="Contact Phone">
                <input
                  className={inputCls}
                  type="tel"
                  value={clientForm.contactPhone}
                  onChange={e => setClientForm(f => ({ ...f, contactPhone: e.target.value }))}
                  placeholder="+65 9123 4567"
                />
              </Field>
              {clientError && (
                <div className="flex items-center text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4 mr-1.5 flex-shrink-0" /> {clientError}
                </div>
              )}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowClientModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={saveClient}
                  disabled={savingClient}
                  className="px-5 py-2 bg-orange-500 text-white rounded-lg text-sm font-semibold hover:bg-orange-600 disabled:opacity-60 flex items-center"
                >
                  {savingClient && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {editingClient ? 'Save Changes' : 'Add Client'}
                </button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* ── Post Job Order Modal ───────────────────────────────────────────── */}
      <AnimatePresence>
        {showOrderModal && (
          <Modal title="Post Job Order" onClose={() => setShowOrderModal(false)}>
            <div className="space-y-4">
              <Field label="Client Company *">
                <select
                  className={selectCls}
                  value={orderForm.clientCompany}
                  onChange={e => setOrderForm(f => ({ ...f, clientCompany: e.target.value }))}
                >
                  <option value="">Select a client…</option>
                  {clients.filter(c => c.status === 'active').map(c => (
                    <option key={c.id} value={c.companyName}>{c.companyName}</option>
                  ))}
                  <option value="__other__">Other / Enter manually</option>
                </select>
                {orderForm.clientCompany === '__other__' && (
                  <input
                    className={`${inputCls} mt-2`}
                    placeholder="Enter company name"
                    onChange={e => setOrderForm(f => ({ ...f, clientCompany: e.target.value }))}
                  />
                )}
              </Field>
              <Field label="Job Title *">
                <input
                  className={inputCls}
                  value={orderForm.jobTitle}
                  onChange={e => setOrderForm(f => ({ ...f, jobTitle: e.target.value }))}
                  placeholder="e.g. Senior Software Engineer"
                />
              </Field>
              <Field label="Job Description">
                <textarea
                  className={`${inputCls} h-24 resize-none`}
                  value={orderForm.jobDescription}
                  onChange={e => setOrderForm(f => ({ ...f, jobDescription: e.target.value }))}
                  placeholder="Role overview, key responsibilities…"
                />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Salary Range">
                  <input
                    className={inputCls}
                    value={orderForm.salaryRange}
                    onChange={e => setOrderForm(f => ({ ...f, salaryRange: e.target.value }))}
                    placeholder="e.g. $5,000–$7,000/mo"
                  />
                </Field>
                <Field label="Headcount">
                  <input
                    className={inputCls}
                    type="number"
                    min={1}
                    value={orderForm.headcount}
                    onChange={e => setOrderForm(f => ({ ...f, headcount: parseInt(e.target.value) || 1 }))}
                  />
                </Field>
              </div>
              <Field label="Urgency">
                <select
                  className={selectCls}
                  value={orderForm.urgency}
                  onChange={e => setOrderForm(f => ({ ...f, urgency: e.target.value as JobOrder['urgency'] }))}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </Field>
              <Field label="Additional Notes">
                <textarea
                  className={`${inputCls} h-20 resize-none`}
                  value={orderForm.notes}
                  onChange={e => setOrderForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Any special requirements or context…"
                />
              </Field>
              {orderError && (
                <div className="flex items-center text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4 mr-1.5 flex-shrink-0" /> {orderError}
                </div>
              )}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowOrderModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={saveOrder}
                  disabled={savingOrder}
                  className="px-5 py-2 bg-orange-500 text-white rounded-lg text-sm font-semibold hover:bg-orange-600 disabled:opacity-60 flex items-center"
                >
                  {savingOrder && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Submit Order
                </button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}
