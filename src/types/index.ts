export interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'user' | 'agent' | 'admin';
  createdAt: string;
}

export interface Complaint {
  id: string;
  userId: string;
  title: string;
  description: string;
  product: string;
  purchaseDate: string;
  address: string;
  contactInfo: string;
  status: 'pending' | 'assigned' | 'in-progress' | 'resolved';
  priority: 'low' | 'medium' | 'high';
  assignedAgent?: string;
  createdAt: string;
  updatedAt: string;
  attachments?: string[];
  messages: Message[];
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'user' | 'agent' | 'admin';
  content: string;
  timestamp: string;
  type: 'message' | 'status-update';
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}