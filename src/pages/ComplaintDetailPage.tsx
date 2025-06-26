import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getComplaintById } from '../services/complaintService';
import { Complaint } from '../types';
import { ArrowLeft, Calendar, MapPin, Phone, Package, MessageSquare } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import { format } from 'date-fns';

const ComplaintDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchComplaint = async () => {
      if (id) {
        try {
          const complaintData = await getComplaintById(id);
          setComplaint(complaintData);
        } catch (error) {
          console.error('Failed to fetch complaint:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchComplaint();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Complaint Not Found</h1>
          <p className="text-gray-600 mb-6">The complaint you're looking for doesn't exist or has been removed.</p>
          <Link
            to="/my-complaints"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to My Complaints
          </Link>
        </div>
      </div>
    );
  }

  const statusSteps = [
    { key: 'pending', label: 'Submitted', completed: true },
    { key: 'assigned', label: 'Assigned', completed: ['assigned', 'in-progress', 'resolved'].includes(complaint.status) },
    { key: 'in-progress', label: 'In Progress', completed: ['in-progress', 'resolved'].includes(complaint.status) },
    { key: 'resolved', label: 'Resolved', completed: complaint.status === 'resolved' },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          to="/my-complaints"
          className="inline-flex items-center text-blue-600 hover:text-blue-500 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to My Complaints
        </Link>
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{complaint.title}</h1>
            <p className="mt-2 text-gray-600">Complaint #{complaint.id}</p>
          </div>
          <div className="mt-4 sm:mt-0">
            <StatusBadge status={complaint.status} priority={complaint.priority} />
          </div>
        </div>
      </div>

      {/* Status Timeline */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Status Timeline</h2>
        <div className="flex items-center justify-between">
          {statusSteps.map((step, index) => (
            <div key={step.key} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step.completed 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {index + 1}
                </div>
                <span className={`mt-2 text-sm font-medium ${
                  step.completed ? 'text-blue-600' : 'text-gray-500'
                }`}>
                  {step.label}
                </span>
              </div>
              {index < statusSteps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-4 ${
                  step.completed ? 'bg-blue-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Description */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Complaint Details</h2>
            <div className="prose max-w-none">
              <p className="text-gray-700 whitespace-pre-wrap">{complaint.description}</p>
            </div>
          </div>

          {/* Messages/Updates */}
          {complaint.messages.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Updates & Messages</h2>
                {complaint.assignedAgent && (
                  <Link
                    to={`/complaint/${complaint.id}/chat`}
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-100 rounded-md hover:bg-blue-200 transition-colors"
                  >
                    <MessageSquare className="h-4 w-4 mr-1" />
                    Open Chat
                  </Link>
                )}
              </div>
              
              <div className="space-y-4">
                {complaint.messages.map((message) => (
                  <div key={message.id} className={`flex ${message.senderRole === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.senderRole === 'user'
                        ? 'bg-blue-600 text-white'
                        : message.type === 'status-update'
                        ? 'bg-gray-100 text-gray-700 border border-gray-200'
                        : 'bg-gray-200 text-gray-900'
                    }`}>
                      <p className="text-sm">{message.content}</p>
                      <p className={`text-xs mt-1 ${
                        message.senderRole === 'user' ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {message.senderName} • {format(new Date(message.timestamp), 'MMM d, h:mm a')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Complaint Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Complaint Information</h3>
            <div className="space-y-4">
              <div className="flex items-start">
                <Package className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Product/Service</p>
                  <p className="text-sm text-gray-600">{complaint.product}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <Calendar className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Purchase Date</p>
                  <p className="text-sm text-gray-600">{format(new Date(complaint.purchaseDate), 'MMM d, yyyy')}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <MapPin className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Address</p>
                  <p className="text-sm text-gray-600">{complaint.address}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <Phone className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Contact Info</p>
                  <p className="text-sm text-gray-600">{complaint.contactInfo}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Timestamps */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-900">Submitted</p>
                <p className="text-sm text-gray-600">{format(new Date(complaint.createdAt), 'MMM d, yyyy h:mm a')}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Last Updated</p>
                <p className="text-sm text-gray-600">{format(new Date(complaint.updatedAt), 'MMM d, yyyy h:mm a')}</p>
              </div>
            </div>
          </div>

          {/* Attachments */}
          {complaint.attachments && complaint.attachments.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Attachments</h3>
              <div className="space-y-2">
                {complaint.attachments.map((attachment, index) => (
                  <div key={index} className="flex items-center p-2 bg-gray-50 rounded-md">
                    <span className="text-sm text-gray-700">{attachment}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ComplaintDetailPage;