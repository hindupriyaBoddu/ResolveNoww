import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserComplaints, deleteComplaint } from '../services/complaintService';
import { Complaint } from '../types';
import { Eye, Trash2, MessageSquare, FileText } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const MyComplaintsPage: React.FC = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'assigned' | 'in-progress' | 'resolved'>('all');

  useEffect(() => {
    const fetchComplaints = async () => {
      if (user) {
        try {
          const userComplaints = await getUserComplaints(user.id);
          setComplaints(userComplaints);
        } catch (error) {
          console.error('Failed to fetch complaints:', error);
          toast.error('Failed to load complaints');
        } finally {
          setLoading(false);
        }
      }
    };

    fetchComplaints();
  }, [user]);

  const handleDelete = async (complaintId: string) => {
    if (!user || !window.confirm('Are you sure you want to delete this complaint?')) {
      return;
    }

    setDeletingId(complaintId);
    try {
      const result = await deleteComplaint(complaintId, user.id);
      if (result.success) {
        setComplaints(prev => prev.filter(c => c.id !== complaintId));
        toast.success('Complaint deleted successfully');
      } else {
        toast.error(result.message || 'Failed to delete complaint');
      }
    } catch (error) {
      toast.error('An error occurred while deleting the complaint');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredComplaints = complaints.filter(complaint => {
    if (filter === 'all') return true;
    return complaint.status === filter;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Complaints</h1>
          <p className="mt-2 text-gray-600">
            Track and manage all your submitted complaints
          </p>
        </div>
        <Link
          to="/submit-complaint"
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Submit New Complaint
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'all', label: 'All', count: complaints.length },
            { key: 'pending', label: 'Pending', count: complaints.filter(c => c.status === 'pending').length },
            { key: 'assigned', label: 'Assigned', count: complaints.filter(c => c.status === 'assigned').length },
            { key: 'in-progress', label: 'In Progress', count: complaints.filter(c => c.status === 'in-progress').length },
            { key: 'resolved', label: 'Resolved', count: complaints.filter(c => c.status === 'resolved').length },
          ].map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setFilter(key as typeof filter)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                filter === key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {label} ({count})
            </button>
          ))}
        </nav>
      </div>

      {filteredComplaints.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {filter === 'all' ? 'No complaints found' : `No ${filter} complaints`}
          </h3>
          <p className="text-gray-500 mb-6">
            {filter === 'all' 
              ? "You haven't submitted any complaints yet."
              : `You don't have any ${filter} complaints at the moment.`
            }
          </p>
          {filter === 'all' && (
            <Link
              to="/submit-complaint"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Submit Your First Complaint
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="divide-y divide-gray-200">
            {filteredComplaints.map((complaint) => (
              <div key={complaint.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
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

                    {complaint.assignedAgent && (
                      <div className="text-sm text-gray-600 mb-3">
                        <span className="font-medium">Status:</span> Assigned to support agent
                        {complaint.messages.length > 0 && (
                          <span className="ml-2">• {complaint.messages.length} message(s)</span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="ml-6 flex items-center space-x-2">
                    {complaint.assignedAgent && complaint.messages.length > 0 && (
                      <Link
                        to={`/complaint/${complaint.id}/chat`}
                        className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-100 rounded-md hover:bg-blue-200 transition-colors"
                      >
                        <MessageSquare className="h-4 w-4 mr-1" />
                        Chat
                      </Link>
                    )}
                    
                    <Link
                      to={`/complaint/${complaint.id}`}
                      className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Link>

                    {complaint.status === 'pending' && (
                      <button
                        onClick={() => handleDelete(complaint.id)}
                        disabled={deletingId === complaint.id}
                        className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-600 bg-red-100 rounded-md hover:bg-red-200 transition-colors disabled:opacity-50"
                      >
                        {deletingId === complaint.id ? (
                          <LoadingSpinner size="sm" className="mr-1" />
                        ) : (
                          <Trash2 className="h-4 w-4 mr-1" />
                        )}
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MyComplaintsPage;