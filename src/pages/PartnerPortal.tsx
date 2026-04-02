import React from 'react';
import { motion } from 'motion/react';
import { Plus, Search, Filter, MoreVertical, Users, Briefcase, TrendingUp, Clock, Globe, Handshake } from 'lucide-react';

const mockClients = [
  { id: '1', name: 'DesignCo Inc.', jobs: 4, status: 'Active', joined: '2 months ago' },
  { id: '2', name: 'Pixel Perfect', jobs: 2, status: 'Pending', joined: '1 week ago' },
  { id: '3', name: 'Creative Labs', jobs: 7, status: 'Active', joined: '5 months ago' },
];

export default function PartnerPortal() {
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
            <button className="bg-white text-slate-900 border border-slate-200 px-6 py-3 rounded-xl font-semibold hover:bg-slate-50 transition-all flex items-center justify-center">
              <Handshake className="w-5 h-5 mr-2" />
              Add New Client
            </button>
            <button className="bg-orange-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-orange-600 transition-all flex items-center justify-center">
              <Plus className="w-5 h-5 mr-2" />
              Post Job Order
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          {[
            { label: 'Sourced Clients', value: '24', icon: Globe, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Active Job Orders', value: '56', icon: Briefcase, color: 'text-orange-600', bg: 'bg-orange-50' },
            { label: 'Total Placements', value: '112', icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
            { label: 'Partner Commission', value: '$12.4k', icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
          ].map((stat, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.bg} ${stat.color} p-2 rounded-lg`}>
                  <stat.icon className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
              <div className="text-sm text-slate-500">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Clients Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-xl font-bold text-slate-900">Your Managed Clients</h2>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" placeholder="Search clients..." className="pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:border-orange-500 outline-none text-sm" />
              </div>
              <button className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50">
                <Filter className="w-4 h-4 text-slate-600" />
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-sm uppercase tracking-wider">
                  <th className="px-6 py-4 font-semibold">Client Name</th>
                  <th className="px-6 py-4 font-semibold">Active Jobs</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Partner Since</th>
                  <th className="px-6 py-4 font-semibold"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {mockClients.map((client) => (
                  <tr key={client.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{client.name}</div>
                      <div className="text-xs text-slate-500">Tech & Creative</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <span className="text-slate-900 font-medium">{client.jobs}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        client.status === 'Active' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'
                      }`}>
                        {client.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-sm">{client.joined}</td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 text-slate-400 hover:text-slate-600">
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-6 border-t border-slate-200 text-center">
            <button className="text-orange-500 font-semibold text-sm hover:underline">View all managed accounts</button>
          </div>
        </div>
      </div>
    </div>
  );
}
