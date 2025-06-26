import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAgentComplaints, updateComplaintStatus } from '../services/complaintService';
import { Complaint } from '../types';
import { MessageSquare, Clock, CheckCircle2, AlertCircle, Users } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const AgentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  useEffect(() => {
    const fetchComplaints = async () => {
      if (user) {
        try {
          const agentComplaints = await getAgentComplaints(user.id);
          setComplaints(agentComplaints);
        } catch (error) {
          console.error('Failed to fetch complaints:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchComplaints();
  }, [user]);

  const handleStatusUpdate = async (complaintId: string, newStatus: Complaint['status']) => {
    if (!user) return;

    setUpdatingStatus(complaintId);
    try {
      const result = await updateComplaintStatus(complaintId, newStatus, user.id);
      if (result.success) {
        setComplaints(prev => 
          prev.map(complaint => 
            complaint.id === complaintId 
              ? { ...complaint, status: newStatus, updatedAt: new Date().toISOString() }
              : complaint
          )
        );
        toast.success(`Status updated to ${newStatus.replace('-', ' ')}`);
      } else {
        toast.error(result.message || 'Failed to update status');
      }
    } catch (error) {
      toast.error('An error occurred while updating status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const getStatusCounts = () => {
    return {
      assigned: complaints.filter(c => c.status === 'assigned').length,
      inProgress: complaints.filter(c => c.status === 'in-progress').length,
      resolved: complaints.filter(c => c.status === 'resolved').length,
    };
  };

  const statusCounts = getStatusCounts();

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
        <h1 className="text-3xl font-bold text-gray-900">Agent Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Welcome back, {user?.fullName}! Manage your assigned complaints and help customers resolve their issues.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Assigned</p>
              <p className="text-3xl font-bold text-gray-900">{complaints.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">New Assignments</p>
              <p className="text-3xl font-bold text-blue-600">{statusCounts.assigned}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">In Progress</p>
              <p className="text-3xl font-bold text-purple-600">{statusCounts.inProgress}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Resolved</p>
              <p className="text-3xl font-bold text-green-600">{statusCounts.resolved}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Assigned Complaints */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Assigned Complaints</h2>

          {complaints.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No complaints assigned</h3>
              <p className="text-gray-500">
                You don't have any complaints assigned to you at the moment.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {complaints.map((complaint) => (
                <div key={complaint.id} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-medium text-gray-900">{complaint.title}</h3>
                        <StatusBadge status={complaint.status} priority={complaint.priority} />
                      </div>
                      
                      <p className="text-gray-600 mb-3 line-clamp-2">{complaint.description}</p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-gray-500 mb-4">
                        <div>
                          <span className="font-medium">ID:</span> #{complaint.id}
                        </div>
                        <div>
                          <span className="font-medium">Product:</span> {complaint.product}
                        </div>
                        <div>
                          <span className="font-medium">Submitted:</span> {format(new Date(complaint.createdAt), 'MMM d, yyyy')}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center gap-3">
                    {/* Status Update Buttons */}
                    {complaint.status === 'assigned' && (
                      <button
                        onClick={() => handleStatusUpdate(complaint.id, 'in-progress')}
                        disabled={updatingStatus === complaint.id}
                        className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-purple-600 bg-purple-100 rounded-md hover:bg-purple-200 transition-colors disabled:opacity-50"
                      >
                        {updatingStatus === complaint.id ? (
                          <LoadingSpinner size="sm" className="mr-1" />
                        ) : null}
                        Start Working
                      </button>
                    )}
                    
                    {complaint.status === 'in-progress' && (
                      <button
                        onClick={() => handleStatusUpdate(complaint.id, 'resolved')}
                        disabled={updatingStatus === complaint.id}
                        className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-green-600 bg-green-100 rounded-md hover:bg-green-200 transition-colors disabled:opacity-50"
                      >
                        {updatingStatus === complaint.id ? (
                          <LoadingSpinner size="sm" className="mr-1" />
                        ) : null}
                        Mark Resolved
                      </button>
                    )}

                    {/* Chat Button */}
                    <Link
                      to={`/complaint/${complaint.id}/chat`}
                      className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-100 rounded-md hover:bg-blue-200 transition-colors"
                    >
                      <MessageSquare className="h-4 w-4 mr-1" />
                      Chat ({complaint.messages.length})
                    </Link>

                    {/* View Details Button */}
                    <Link
                      to={`/complaint/${complaint.id}`}
                      className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgentDashboard;