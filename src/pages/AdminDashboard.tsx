import React, { useState, useEffect } from 'react';
import { getAllComplaints, getAllUsers, getAllAgents, assignComplaint } from '../services/complaintService';
import { getAllUsers as getUsers } from '../services/authService';
import { Complaint, User } from '../types';
import { Users, FileText, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const AdminDashboard: React.FC = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [agents, setAgents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigningComplaint, setAssigningComplaint] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'assigned' | 'in-progress' | 'resolved'>('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [complaintsData, usersData] = await Promise.all([
          getAllComplaints(),
          getUsers(),
        ]);
        
        setComplaints(complaintsData);
        setUsers(usersData);
        setAgents(usersData.filter(u => u.role === 'agent'));
      } catch (error) {
        console.error('Failed to fetch data:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAssignComplaint = async (complaintId: string, agentId: string) => {
    setAssigningComplaint(complaintId);
    try {
      const result = await assignComplaint(complaintId, agentId);
      if (result.success) {
        setComplaints(prev => 
          prev.map(complaint => 
            complaint.id === complaintId 
              ? { ...complaint, assignedAgent: agentId, status: 'assigned' as const, updatedAt: new Date().toISOString() }
              : complaint
          )
        );
        toast.success('Complaint assigned successfully');
      } else {
        toast.error(result.message || 'Failed to assign complaint');
      }
    } catch (error) {
      toast.error('An error occurred while assigning complaint');
    } finally {
      setAssigningComplaint(null);
    }
  };

  const getStats = () => {
    const totalComplaints = complaints.length;
    const pendingComplaints = complaints.filter(c => c.status === 'pending').length;
    const inProgressComplaints = complaints.filter(c => c.status === 'in-progress' || c.status === 'assigned').length;
    const resolvedComplaints = complaints.filter(c => c.status === 'resolved').length;
    const totalUsers = users.filter(u => u.role === 'user').length;

    return {
      totalComplaints,
      pendingComplaints,
      inProgressComplaints,
      resolvedComplaints,
      totalUsers,
    };
  };

  const filteredComplaints = complaints.filter(complaint => {
    if (filter === 'all') return true;
    return complaint.status === filter;
  });

  const stats = getStats();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Manage complaints, assign agents, and oversee the entire complaint resolution process.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Complaints</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalComplaints}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-3xl font-bold text-yellow-600">{stats.pendingComplaints}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">In Progress</p>
              <p className="text-3xl font-bold text-purple-600">{stats.inProgressComplaints}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Resolved</p>
              <p className="text-3xl font-bold text-green-600">{stats.resolvedComplaints}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-3xl font-bold text-indigo-600">{stats.totalUsers}</p>
            </div>
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-indigo-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Complaints Management */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">All Complaints</h2>
            
            {/* Filter Tabs */}
            <div className="mt-4 sm:mt-0">
              <nav className="flex space-x-4">
                {[
                  { key: 'all', label: 'All', count: complaints.length },
                  { key: 'pending', label: 'Pending', count: stats.pendingComplaints },
                  { key: 'assigned', label: 'Assigned', count: complaints.filter(c => c.status === 'assigned').length },
                  { key: 'in-progress', label: 'In Progress', count: complaints.filter(c => c.status === 'in-progress').length },
                  { key: 'resolved', label: 'Resolved', count: stats.resolvedComplaints },
                ].map(({ key, label, count }) => (
                  <button
                    key={key}
                    onClick={() => setFilter(key as typeof filter)}
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      filter === key
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {label} ({count})
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {filteredComplaints.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {filter === 'all' ? 'No complaints found' : `No ${filter} complaints`}
              </h3>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredComplaints.map((complaint) => {
                const user = users.find(u => u.id === complaint.userId);
                const assignedAgent = complaint.assignedAgent ? agents.find(a => a.id === complaint.assignedAgent) : null;
                
                return (
                  <div key={complaint.id} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-lg font-medium text-gray-900">{complaint.title}</h3>
                          <StatusBadge status={complaint.status} priority={complaint.priority} />
                        </div>
                        
                        <p className="text-gray-600 mb-3 line-clamp-2">{complaint.description}</p>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-sm text-gray-500 mb-4">
                          <div>
                            <span className="font-medium">ID:</span> #{complaint.id}
                          </div>
                          <div>
                            <span className="font-medium">User:</span> {user?.fullName || 'Unknown'}
                          </div>
                          <div>
                            <span className="font-medium">Product:</span> {complaint.product}
                          </div>
                          <div>
                            <span className="font-medium">Submitted:</span> {format(new Date(complaint.createdAt), 'MMM d, yyyy')}
                          </div>
                        </div>

                        {assignedAgent && (
                          <div className="text-sm text-gray-600 mb-3">
                            <span className="font-medium">Assigned to:</span> {assignedAgent.fullName}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Assignment Section */}
                    {complaint.status === 'pending' && (
                      <div className="border-t border-gray-200 pt-4">
                        <div className="flex items-center space-x-4">
                          <span className="text-sm font-medium text-gray-700">Assign to agent:</span>
                          <select
                            onChange={(e) => {
                              if (e.target.value) {
                                handleAssignComplaint(complaint.id, e.target.value);
                              }
                            }}
                            disabled={assigningComplaint === complaint.id}
                            className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            defaultValue=""
                          >
                            <option value="">Select an agent...</option>
                            {agents.map((agent) => (
                              <option key={agent.id} value={agent.id}>
                                {agent.fullName}
                              </option>
                            ))}
                          </select>
                          {assigningComplaint === complaint.id && (
                            <LoadingSpinner size="sm" />
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;