import { Complaint, Message } from '../types';
import { format } from 'date-fns';

// Simulate complaint database
let complaints: Complaint[] = [
  {
    id: '1',
    userId: '3',
    title: 'Product not delivered on time',
    description: 'I ordered a laptop on December 15th and it was supposed to be delivered within 3 business days. It has been over a week now and I still haven\'t received my order.',
    product: 'Gaming Laptop - Model XYZ',
    purchaseDate: '2024-12-15',
    address: '123 Main Street, New York, NY 10001',
    contactInfo: '+1 (555) 123-4567',
    status: 'assigned',
    priority: 'high',
    assignedAgent: '2',
    createdAt: '2024-12-20T10:30:00Z',
    updatedAt: '2024-12-21T14:20:00Z',
    attachments: [],
    messages: [
      {
        id: '1',
        senderId: '3',
        senderName: 'John Doe',
        senderRole: 'user',
        content: 'I really need this laptop for work. Can you please expedite the delivery?',
        timestamp: '2024-12-21T09:15:00Z',
        type: 'message',
      },
      {
        id: '2',
        senderId: '2',
        senderName: 'Support Agent',
        senderRole: 'agent',
        content: 'I understand your concern. I\'ve contacted our logistics team and your order is now being prioritized. You should receive it by tomorrow.',
        timestamp: '2024-12-21T14:20:00Z',
        type: 'message',
      },
    ],
  },
  {
    id: '2',
    userId: '3',
    title: 'Defective smartphone screen',
    description: 'The smartphone I purchased has a defective screen with dead pixels. This is affecting my daily usage and I would like a replacement.',
    product: 'Smartphone Pro Max 256GB',
    purchaseDate: '2024-12-10',
    address: '123 Main Street, New York, NY 10001',
    contactInfo: '+1 (555) 123-4567',
    status: 'pending',
    priority: 'medium',
    createdAt: '2024-12-22T08:45:00Z',
    updatedAt: '2024-12-22T08:45:00Z',
    attachments: [],
    messages: [],
  },
];

let messageCounter = 3;

export const submitComplaint = async (complaintData: Omit<Complaint, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'messages'>): Promise<{ success: boolean; complaint?: Complaint; message?: string }> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  const newComplaint: Complaint = {
    ...complaintData,
    id: Date.now().toString(),
    status: 'pending',
    priority: determinePriority(complaintData.description),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messages: [],
  };
  
  complaints.push(newComplaint);
  
  return {
    success: true,
    complaint: newComplaint,
  };
};

export const getUserComplaints = async (userId: string): Promise<Complaint[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return complaints.filter(c => c.userId === userId).sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
};

export const getAllComplaints = async (): Promise<Complaint[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return complaints.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
};

export const getAgentComplaints = async (agentId: string): Promise<Complaint[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return complaints.filter(c => c.assignedAgent === agentId).sort((a, b) => 
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
};

export const assignComplaint = async (complaintId: string, agentId: string): Promise<{ success: boolean; message?: string }> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const complaint = complaints.find(c => c.id === complaintId);
  if (!complaint) {
    return { success: false, message: 'Complaint not found' };
  }
  
  complaint.assignedAgent = agentId;
  complaint.status = 'assigned';
  complaint.updatedAt = new Date().toISOString();
  
  // Add system message
  complaint.messages.push({
    id: (messageCounter++).toString(),
    senderId: 'system',
    senderName: 'System',
    senderRole: 'admin',
    content: 'Complaint has been assigned to an agent',
    timestamp: new Date().toISOString(),
    type: 'status-update',
  });
  
  return { success: true };
};

export const updateComplaintStatus = async (complaintId: string, status: Complaint['status'], agentId: string): Promise<{ success: boolean; message?: string }> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 600));
  
  const complaint = complaints.find(c => c.id === complaintId);
  if (!complaint) {
    return { success: false, message: 'Complaint not found' };
  }
  
  if (complaint.assignedAgent !== agentId) {
    return { success: false, message: 'Unauthorized' };
  }
  
  complaint.status = status;
  complaint.updatedAt = new Date().toISOString();
  
  // Add system message
  complaint.messages.push({
    id: (messageCounter++).toString(),
    senderId: agentId,
    senderName: 'Agent',
    senderRole: 'agent',
    content: `Status updated to: ${status.replace('-', ' ').toUpperCase()}`,
    timestamp: new Date().toISOString(),
    type: 'status-update',
  });
  
  return { success: true };
};

export const addMessage = async (complaintId: string, senderId: string, senderName: string, senderRole: 'user' | 'agent', content: string): Promise<{ success: boolean; message?: Message }> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 400));
  
  const complaint = complaints.find(c => c.id === complaintId);
  if (!complaint) {
    return { success: false };
  }
  
  const newMessage: Message = {
    id: (messageCounter++).toString(),
    senderId,
    senderName,
    senderRole,
    content,
    timestamp: new Date().toISOString(),
    type: 'message',
  };
  
  complaint.messages.push(newMessage);
  complaint.updatedAt = new Date().toISOString();
  
  return { success: true, message: newMessage };
};

export const deleteComplaint = async (complaintId: string, userId: string): Promise<{ success: boolean; message?: string }> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 600));
  
  const complaintIndex = complaints.findIndex(c => c.id === complaintId);
  if (complaintIndex === -1) {
    return { success: false, message: 'Complaint not found' };
  }
  
  const complaint = complaints[complaintIndex];
  if (complaint.userId !== userId) {
    return { success: false, message: 'Unauthorized' };
  }
  
  if (complaint.status !== 'pending') {
    return { success: false, message: 'Cannot delete complaint that has been assigned' };
  }
  
  complaints.splice(complaintIndex, 1);
  return { success: true };
};

const determinePriority = (description: string): 'low' | 'medium' | 'high' => {
  const urgentKeywords = ['urgent', 'emergency', 'critical', 'immediate', 'asap'];
  const highKeywords = ['defective', 'broken', 'not working', 'damaged', 'serious'];
  
  const lowerDescription = description.toLowerCase();
  
  if (urgentKeywords.some(keyword => lowerDescription.includes(keyword))) {
    return 'high';
  }
  
  if (highKeywords.some(keyword => lowerDescription.includes(keyword))) {
    return 'high';
  }
  
  return 'medium';
};

export const getComplaintById = async (complaintId: string): Promise<Complaint | null> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  return complaints.find(c => c.id === complaintId) || null;
};