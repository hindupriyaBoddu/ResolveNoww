import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getComplaintById, addMessage } from '../services/complaintService';
import { Complaint, Message } from '../types';
import { ArrowLeft, Send } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const ChatPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    scrollToBottom();
  }, [complaint?.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || !complaint || !user || sending) {
      return;
    }

    setSending(true);
    
    try {
      const result = await addMessage(
        complaint.id,
        user.id,
        user.fullName,
        user.role as 'user' | 'agent',
        message.trim()
      );
      
      if (result.success && result.message) {
        setComplaint(prev => prev ? {
          ...prev,
          messages: [...prev.messages, result.message!]
        } : null);
        setMessage('');
      } else {
        toast.error('Failed to send message');
      }
    } catch (error) {
      toast.error('An error occurred while sending the message');
    } finally {
      setSending(false);
    }
  };

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

  if (!complaint.assignedAgent) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Chat Not Available</h1>
          <p className="text-gray-600 mb-6">This complaint hasn't been assigned to an agent yet.</p>
          <Link
            to={`/complaint/${complaint.id}`}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            View Complaint Details
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          to={`/complaint/${complaint.id}`}
          className="inline-flex items-center text-blue-600 hover:text-blue-500 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Complaint Details
        </Link>
        
        <div className="bg-white rounded-lg shadow p-4">
          <h1 className="text-xl font-semibold text-gray-900">{complaint.title}</h1>
          <p className="text-sm text-gray-600">Complaint #{complaint.id} • Assigned Agent</p>
        </div>
      </div>

      {/* Chat Container */}
      <div className="bg-white rounded-lg shadow flex flex-col h-96">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {complaint.messages.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            complaint.messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.senderRole === user?.role ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  msg.senderRole === user?.role
                    ? 'bg-blue-600 text-white'
                    : msg.type === 'status-update'
                    ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                    : 'bg-gray-200 text-gray-900'
                }`}>
                  <p className="text-sm">{msg.content}</p>
                  <p className={`text-xs mt-1 ${
                    msg.senderRole === user?.role ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {msg.senderName} • {format(new Date(msg.timestamp), 'MMM d, h:mm a')}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="border-t border-gray-200 p-4">
          <form onSubmit={handleSendMessage} className="flex space-x-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={!message.trim() || sending}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {sending ? (
                <LoadingSpinner size="sm" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-700">
          💡 <strong>Tip:</strong> You can communicate directly with your assigned agent here. 
          Messages are delivered in real-time and you'll be notified of any updates to your complaint.
        </p>
      </div>
    </div>
  );
};

export default ChatPage;