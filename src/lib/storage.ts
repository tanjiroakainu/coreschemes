// localStorage-based storage service to replace Supabase

export interface User {
  id: string;
  email: string;
  password?: string; // In a real app, this would be hashed
  role: 'admin' | 'staffer' | 'client' | 'section-head' | 'regular-staff';
  name?: string;
  position?: string; // Store position for redirect purposes
  avatar?: string; // Profile image
}

export interface AuthSession {
  user: User;
  expiresAt: number;
}

// Storage keys
const STORAGE_KEYS = {
  USERS: 'app_users',
  SESSION: 'app_session',
  EVENTS: 'events',
  STAFFERS: 'app_staffers',
  REQUESTS: 'app_requests',
  ASSIGNMENTS: 'app_assignments',
  TEAMS: 'app_teams',
  INVITATIONS: 'app_invitations',
  SCHEDULE_NOTES: 'app_schedule_notes',
  CLIENT_AVAILABILITY: 'client_availability',
} as const;

// Initialize default users if none exist
const initializeDefaultUsers = (): User[] => {
  const defaultUsers: User[] = [
    {
      id: '1',
      email: 'admin@gmail.com',
      password: 'admin123', // In production, this should be hashed
      role: 'admin',
      name: 'Admin User',
    },
    {
      id: '2',
      email: 'staffer@example.com',
      password: 'staffer123',
      role: 'staffer',
      name: 'Staffer User',
    },
    {
      id: '3',
      email: 'client@example.com',
      password: 'client123',
      role: 'client',
      name: 'Client User',
    },
    {
      id: '4',
      email: 'sectionhead@example.com',
      password: 'section123',
      role: 'section-head',
      name: 'Section Head User',
    },
  ];

  if (typeof window !== 'undefined') {
    const existingUsers = localStorage.getItem(STORAGE_KEYS.USERS);
    if (!existingUsers) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(defaultUsers));
      return defaultUsers;
    }
  }
  return defaultUsers;
};

// Migrate old admin email to new one
const migrateUsers = (users: User[]): User[] => {
  const updatedUsers = users.map((user) => {
    // Update old admin email to new one
    if (user.email === 'admin@example.com' && user.role === 'admin') {
      return { ...user, email: 'admin@gmail.com' };
    }
    return user;
  });
  
  // If admin user doesn't exist, add it
  const hasAdmin = updatedUsers.some((u) => u.email === 'admin@gmail.com' && u.role === 'admin');
  if (!hasAdmin) {
    updatedUsers.push({
      id: '1',
      email: 'admin@gmail.com',
      password: 'admin123',
      role: 'admin',
      name: 'Admin User',
    });
  }
  
  return updatedUsers;
};

// Get all users from localStorage
export const getUsers = (): User[] => {
  if (typeof window === 'undefined') return [];
  
  const usersJson = localStorage.getItem(STORAGE_KEYS.USERS);
  if (!usersJson) {
    return initializeDefaultUsers();
  }
  
  try {
    const users = JSON.parse(usersJson);
    const migratedUsers = migrateUsers(users);
    
    // Save migrated users back to localStorage
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(migratedUsers));
    
    return migratedUsers;
  } catch {
    return initializeDefaultUsers();
  }
};

// Get user by email
export const getUserByEmail = (email: string): User | null => {
  const users = getUsers();
  return users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
};

// Create a new user
export const createUser = (user: Omit<User, 'id'>): User => {
  const users = getUsers();
  const newUser: User = {
    ...user,
    id: Date.now().toString(),
  };
  users.push(newUser);
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  return newUser;
};

// Update user
export const updateUser = (userId: string, updates: Partial<User>): User | null => {
  const users = getUsers();
  const userIndex = users.findIndex((u) => u.id === userId);
  
  if (userIndex === -1) return null;
  
  users[userIndex] = { ...users[userIndex], ...updates };
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  
  // Update session if this is the current user
  const session = getSession();
  if (session && session.user.id === userId) {
    const updatedSession: AuthSession = {
      user: { ...session.user, ...updates, password: undefined }, // Don't store password in session
      expiresAt: session.expiresAt,
    };
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(updatedSession));
  }
  
  return users[userIndex];
};

// Authentication functions
export const signInWithPassword = async (
  email: string,
  password: string
): Promise<{ data: { user: User } | null; error: Error | null }> => {
  try {
    // First check users
    let user = getUserByEmail(email);
    
    // If not found in users, check staffers
    if (!user) {
      const staffers = getStaffers();
      const staffer = staffers.find((s) => s.email.toLowerCase() === email.toLowerCase());
      
      if (staffer && staffer.password === password) {
        // Create user account from staffer if it doesn't exist
        const role = getRoleFromPosition(staffer.position);
        user = createUser({
          email: staffer.email,
          password: staffer.password,
          role: role,
          name: `${staffer.firstName} ${staffer.lastName}`,
          position: staffer.position,
        });
      }
    } else {
      // If user exists but doesn't have position, try to get it from staffers
      if (!user.position) {
        const staffers = getStaffers();
        const staffer = staffers.find((s) => s.email.toLowerCase() === email.toLowerCase());
        if (staffer) {
          user = updateUser(user.id, { position: staffer.position }) || user;
        }
      }
    }
    
    if (!user) {
      return {
        data: null,
        error: new Error('Invalid email or password'),
      };
    }
    
    // Check password - handle both cases where password might be undefined
    if (!user.password || user.password !== password) {
      // If user password doesn't match, also check staffer password as fallback
      const staffers = getStaffers();
      const staffer = staffers.find((s) => s.email.toLowerCase() === email.toLowerCase());
      
      if (staffer && staffer.password === password) {
        // Update user password to match staffer
        updateUser(user.id, { password: staffer.password });
        user.password = staffer.password;
      } else {
        return {
          data: null,
          error: new Error('Invalid email or password'),
        };
      }
    }
    
    // Ensure user has all necessary fields from staffer if available
    const staffers = getStaffers();
    const matchingStaffer = staffers.find((s) => s.email.toLowerCase() === email.toLowerCase());
    
    if (matchingStaffer) {
      // Update user with staffer data to ensure consistency
      user = updateUser(user.id, {
        email: matchingStaffer.email,
        name: `${matchingStaffer.firstName} ${matchingStaffer.lastName}`,
        position: matchingStaffer.position,
      }) || user;
    }
    
    // Create session with position included - ensure email is always set
    const session: AuthSession = {
      user: { 
        ...user, 
        email: user.email || matchingStaffer?.email || email,
        password: undefined // Don't store password in session
      },
      expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    };
    
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
    
    return {
      data: { user: session.user },
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Authentication failed'),
    };
  }
};

// Get current session
export const getSession = (): AuthSession | null => {
  if (typeof window === 'undefined') return null;
  
  const sessionJson = localStorage.getItem(STORAGE_KEYS.SESSION);
  if (!sessionJson) return null;
  
  try {
    const session: AuthSession = JSON.parse(sessionJson);
    
    // Check if session is expired
    if (session.expiresAt < Date.now()) {
      localStorage.removeItem(STORAGE_KEYS.SESSION);
      return null;
    }
    
    return session;
  } catch {
    return null;
  }
};

// Get current user
export const getCurrentUser = (): User | null => {
  const session = getSession();
  return session?.user || null;
};

// Sign out
export const signOut = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEYS.SESSION);
  }
};

// Get user role
export const getUserRole = (userId: string): string | null => {
  const user = getUsers().find((u) => u.id === userId);
  return user?.role || null;
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  return getSession() !== null;
};

// Reset users to defaults (useful for testing or fixing issues)
export const resetUsers = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEYS.USERS);
    localStorage.removeItem(STORAGE_KEYS.SESSION);
    initializeDefaultUsers();
  }
};

// Staffer management interfaces
export interface Staffer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  position: string;
  section: 'executives' | 'scribes' | 'creatives' | 'managerial' | 'clients';
  avatar?: string;
  createdAt?: string;
  updatedAt?: string;
  classification?: string; // For client registration
  segment?: string; // For client registration
  othersSpecify?: string; // For client registration
}

// Map staffer position to user role
const getRoleFromPosition = (position: string): User['role'] => {
  const positionLower = position.toLowerCase();
  
  if (positionLower.includes('editor-in-chief')) return 'admin';
  if (positionLower.includes('associate editor')) return 'staffer';
  if (positionLower.includes('managing editor')) return 'staffer';
  if (positionLower.includes('executive secretary')) return 'staffer';
  if (positionLower.includes('section head')) return 'section-head';
  if (positionLower.includes('regular staff')) return 'regular-staff';
  if (positionLower.includes('client')) return 'client';
  
  // Default to staffer for all other positions
  return 'staffer';
};

// Get redirect path based on position
export const getRedirectPathFromPosition = (position: string): string => {
  const positionLower = position.toLowerCase();
  
  if (positionLower.includes('editor-in-chief')) return '/editor-in-chief/my-team';
  if (positionLower.includes('associate editor')) return '/associate-editor/my-team';
  if (positionLower.includes('managing editor')) return '/managing-editor/my-team';
  if (positionLower.includes('executive secretary')) return '/executive-secretary/my-team';
  if (positionLower.includes('section head')) return '/section-head/assignment';
  if (positionLower.includes('client')) return '/client/calendar';
  
  // Check for other specific positions
  if (positionLower.includes('scribe') || positionLower.includes('writer')) return '/scribe/dashboard';
  if (positionLower.includes('creative') || positionLower.includes('graphic')) return '/creative/dashboard';
  if (positionLower.includes('managerial') || positionLower.includes('manager')) return '/managerial/dashboard';
  if (positionLower.includes('regular staff')) return '/regular-staff/dashboard';
  
  // Default to staffer path
  return '/staffer/assignment';
};

// Sync staffers to user accounts (migration function)
const syncStaffersToUsers = (staffers: Staffer[]): void => {
  staffers.forEach((staffer) => {
    const existingUser = getUserByEmail(staffer.email);
    if (!existingUser && staffer.password) {
      const role = getRoleFromPosition(staffer.position);
      createUser({
        email: staffer.email,
        password: staffer.password,
        role: role,
        name: `${staffer.firstName} ${staffer.lastName}`,
        position: staffer.position,
      });
    } else if (existingUser && !existingUser.position) {
      // Update existing user with position if missing
      updateUser(existingUser.id, {
        position: staffer.position,
      });
    }
  });
};

// Get all staffers from localStorage
export const getStaffers = (): Staffer[] => {
  if (typeof window === 'undefined') return [];
  
  const staffersJson = localStorage.getItem(STORAGE_KEYS.STAFFERS);
  if (!staffersJson) {
    // Initialize with default staffers from mock
    const defaultStaffers = initializeDefaultStaffers();
    localStorage.setItem(STORAGE_KEYS.STAFFERS, JSON.stringify(defaultStaffers));
    // Sync default staffers to users
    syncStaffersToUsers(defaultStaffers);
    return defaultStaffers;
  }
  
  try {
    const staffers = JSON.parse(staffersJson);
    // Sync staffers to users on load
    syncStaffersToUsers(staffers);
    return staffers;
  } catch {
    const defaultStaffers = initializeDefaultStaffers();
    localStorage.setItem(STORAGE_KEYS.STAFFERS, JSON.stringify(defaultStaffers));
    // Sync default staffers to users
    syncStaffersToUsers(defaultStaffers);
    return defaultStaffers;
  }
};

// Initialize default staffers
const initializeDefaultStaffers = (): Staffer[] => {
  return [
    {
      id: 'e1',
      firstName: 'Alex',
      lastName: 'Reyes',
      email: 'alex.reyes@example.com',
      password: 'temp123',
      position: 'Editor-in-Chief',
      section: 'executives',
      avatar: 'https://randomuser.me/api/portraits/men/45.jpg',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'e2',
      firstName: 'Maria',
      lastName: 'Santos',
      email: 'maria.santos@example.com',
      password: 'temp123',
      position: 'Associate Editor',
      section: 'executives',
      avatar: 'https://randomuser.me/api/portraits/women/32.jpg',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'e3',
      firstName: 'Julius',
      lastName: 'Cruz',
      email: 'julius.cruz@example.com',
      password: 'temp123',
      position: 'Managing Editor',
      section: 'executives',
      avatar: 'https://randomuser.me/api/portraits/men/12.jpg',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'e4',
      firstName: 'Kristine',
      lastName: 'Uy',
      email: 'kristine.uy@example.com',
      password: 'temp123',
      position: 'Executive Secretary',
      section: 'executives',
      avatar: 'https://randomuser.me/api/portraits/women/28.jpg',
      createdAt: new Date().toISOString(),
    },
  ];
};

// Create a new staffer and corresponding user account
export const createStaffer = (staffer: Omit<Staffer, 'id' | 'createdAt' | 'updatedAt'>): Staffer => {
  // Validate required fields
  if (!staffer.email || !staffer.password || !staffer.firstName || !staffer.lastName || !staffer.position) {
    throw new Error('Missing required fields: email, password, firstName, lastName, or position');
  }
  
  const staffers = getStaffers();
  const stafferId = Date.now().toString();
  const newStaffer: Staffer = {
    ...staffer,
    id: stafferId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  staffers.push(newStaffer);
  localStorage.setItem(STORAGE_KEYS.STAFFERS, JSON.stringify(staffers));
  // Dispatch custom event for same-tab updates
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('stafferUpdated'));
  }
  
  // Also create a user account for login
  const role = getRoleFromPosition(staffer.position);
  const existingUser = getUserByEmail(staffer.email);
  
  if (!existingUser) {
    const newUser = createUser({
      email: staffer.email,
      password: staffer.password, // Ensure password is saved
      role: role,
      name: `${staffer.firstName} ${staffer.lastName}`,
      position: staffer.position,
    });
    // Verify the user was created with password
    if (!newUser.password) {
      console.error('Warning: User created without password');
      updateUser(newUser.id, { password: staffer.password });
    }
  } else {
    // Update existing user if email matches - always update password
    updateUser(existingUser.id, {
      email: staffer.email,
      password: staffer.password, // Always update password when creating staffer
      role: role,
      name: `${staffer.firstName} ${staffer.lastName}`,
      position: staffer.position,
    });
  }
  
  return newStaffer;
};

// Update staffer and corresponding user account
export const updateStaffer = (stafferId: string, updates: Partial<Staffer>): Staffer | null => {
  const staffers = getStaffers();
  const stafferIndex = staffers.findIndex((s) => s.id === stafferId);
  
  if (stafferIndex === -1) return null;
  
  const oldStaffer = staffers[stafferIndex];
  
  // If password is provided and not empty, use it. Otherwise, keep the existing password
  const passwordToUse = updates.password && updates.password.trim() !== '' 
    ? updates.password 
    : oldStaffer.password;
  
  // Allow position and section to be changed - use updates if provided, otherwise keep existing
  const safeUpdates = {
    ...updates,
    position: updates.position !== undefined ? updates.position : oldStaffer.position,
    section: updates.section !== undefined ? updates.section : oldStaffer.section,
    password: passwordToUse,
    updatedAt: new Date().toISOString(),
  };
  
  staffers[stafferIndex] = {
    ...oldStaffer,
    ...safeUpdates,
  };
  localStorage.setItem(STORAGE_KEYS.STAFFERS, JSON.stringify(staffers));
  // Dispatch custom event for same-tab updates
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('stafferUpdated'));
  }
  
  // Update corresponding user account with new position/section
  const updatedStaffer = staffers[stafferIndex];
  const existingUser = getUserByEmail(updatedStaffer.email);
  
  if (existingUser) {
    const role = getRoleFromPosition(updatedStaffer.position);
    const updatedUser = updateUser(existingUser.id, {
      email: updatedStaffer.email,
      password: updatedStaffer.password || existingUser.password, // Use staffer password or keep existing
      role: role,
      name: `${updatedStaffer.firstName} ${updatedStaffer.lastName}`,
      position: updatedStaffer.position, // This will now reflect the updated position
    });
    
    // Dispatch event to update current session if this is the logged-in user
    if (updatedUser) {
      const session = getSession();
      if (session && session.user.id === existingUser.id) {
        const updatedSession: AuthSession = {
          ...session,
          user: {
            ...session.user,
            ...updatedUser,
            position: updatedStaffer.position,
            name: `${updatedStaffer.firstName} ${updatedStaffer.lastName}`,
          },
        };
        localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(updatedSession));
        window.dispatchEvent(new CustomEvent('profileUpdated'));
      }
    }
  } else {
    // Create user if it doesn't exist
    const role = getRoleFromPosition(updatedStaffer.position);
    createUser({
      email: updatedStaffer.email,
      password: updatedStaffer.password || '', // Ensure password is set
      role: role,
      name: `${updatedStaffer.firstName} ${updatedStaffer.lastName}`,
      position: updatedStaffer.position,
    });
  }
  
  return updatedStaffer;
};

// Delete staffer and corresponding user account
export const deleteStaffer = (stafferId: string): boolean => {
  const staffers = getStaffers();
  const staffer = staffers.find((s) => s.id === stafferId);
  const filteredStaffers = staffers.filter((s) => s.id !== stafferId);
  
  if (filteredStaffers.length === staffers.length) return false;
  
  localStorage.setItem(STORAGE_KEYS.STAFFERS, JSON.stringify(filteredStaffers));
  // Dispatch custom event for same-tab updates
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('stafferUpdated'));
  }
  
  // Also delete corresponding user account if it exists
  if (staffer) {
    const user = getUserByEmail(staffer.email);
    if (user) {
      const users = getUsers();
      const filteredUsers = users.filter((u) => u.id !== user.id);
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(filteredUsers));
    }
  }
  
  return true;
};

// Get staffer by ID
export const getStafferById = (stafferId: string): Staffer | null => {
  const staffers = getStaffers();
  return staffers.find((s) => s.id === stafferId) || null;
};

// Get staffers by section
export const getStaffersBySection = (section: Staffer['section']): Staffer[] => {
  const staffers = getStaffers();
  return staffers.filter((s) => s.section === section);
};

// Request management interfaces
export interface ClientRequest {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  personToContact: string;
  contactInfo: string;
  serviceNeeded: string;
  attachedFile?: string; // Base64 or file path
  fileName?: string;
  status: 'pending' | 'approved' | 'denied';
  clientEmail?: string;
  clientName?: string;
  approvedBy?: string; // Admin name who approved
  deniedBy?: string; // Admin name who denied
  dateApproved?: string; // ISO date string
  dateDenied?: string; // ISO date string
  reasonOfDenial?: string; // Reason for denial
  createdAt: string;
  updatedAt?: string;
}

// Get all requests from localStorage
export const getRequests = (): ClientRequest[] => {
  if (typeof window === 'undefined') return [];
  
  const requestsJson = localStorage.getItem(STORAGE_KEYS.REQUESTS);
  if (!requestsJson) {
    return [];
  }
  
  try {
    return JSON.parse(requestsJson);
  } catch {
    return [];
  }
};

// Get requests by status
export const getRequestsByStatus = (status: ClientRequest['status']): ClientRequest[] => {
  const requests = getRequests();
  return requests.filter((r) => r.status === status);
};

// Get request by ID
export const getRequestById = (requestId: string): ClientRequest | null => {
  const requests = getRequests();
  return requests.find((r) => r.id === requestId) || null;
};

// Create a new request
export const createRequest = (request: Omit<ClientRequest, 'id' | 'createdAt' | 'updatedAt'>): ClientRequest => {
  const requests = getRequests();
  const newRequest: ClientRequest = {
    ...request,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  requests.push(newRequest);
  localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(requests));
  // Dispatch custom event for same-tab updates
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('requestUpdated'));
  }
  return newRequest;
};

// Update request
export const updateRequest = (requestId: string, updates: Partial<ClientRequest>): ClientRequest | null => {
  const requests = getRequests();
  const requestIndex = requests.findIndex((r) => r.id === requestId);
  
  if (requestIndex === -1) return null;
  
  requests[requestIndex] = {
    ...requests[requestIndex],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(requests));
  // Dispatch custom event for same-tab updates
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('requestUpdated'));
  }
  return requests[requestIndex];
};

// Delete request
export const deleteRequest = (requestId: string): boolean => {
  const requests = getRequests();
  const filteredRequests = requests.filter((r) => r.id !== requestId);
  
  if (filteredRequests.length === requests.length) return false;
  
  localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(filteredRequests));
  // Dispatch custom event for same-tab updates
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('requestUpdated'));
  }
  return true;
};

// Assignment management interfaces
export interface Assignment {
  id: string;
  requestId?: string; // Optional - assignments can be created without requests
  assignedTo: string; // Staffer ID or email
  assignedToId?: string; // Persistent staffer ID
  assignedToEmail?: string; // Staffer email for matching
  assignedToName: string; // Staffer name
  section: 'executives' | 'scribes' | 'creatives' | 'managerial' | 'clients';
  assignedBy?: string; // Admin or Executive name
  assignedByEmail?: string; // Admin or Executive email
  assignedAt: string;
  taskDate?: string; // Date for the task (when created without request)
  taskTime?: string; // Optional time for the task
  taskTitle?: string; // Title for the task (when created without request)
  taskLocation?: string; // Location for the task (optional)
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  approvedBy?: string; // Executive or Section Head who approved
  approvedByEmail?: string; // Email of approver
  approvedAt?: string; // Approval timestamp
  rejectedBy?: string; // Executive or Section Head who rejected
  rejectedByEmail?: string; // Email of rejector
  rejectedAt?: string; // Rejection timestamp
  rejectionReason?: string; // Reason for rejection
  notes?: string;
}

// Get all assignments from localStorage
export const getAssignments = (): Assignment[] => {
  if (typeof window === 'undefined') return [];
  
  const assignmentsJson = localStorage.getItem(STORAGE_KEYS.ASSIGNMENTS);
  if (!assignmentsJson) {
    return [];
  }
  
  try {
    return JSON.parse(assignmentsJson);
  } catch {
    return [];
  }
};

// Get assignments by status
export const getAssignmentsByStatus = (status: Assignment['status']): Assignment[] => {
  const assignments = getAssignments();
  return assignments.filter((a) => a.status === status);
};

// Get assignment by request ID
export const getAssignmentByRequestId = (requestId: string): Assignment | null => {
  const assignments = getAssignments();
  return assignments.find((a) => a.requestId === requestId) || null;
};

// Helper to normalize identifiers for assignment recipient matching
const buildAssignmentIdentifierSet = (
  identifiers: (string | null | undefined)[]
): Set<string> => {
  const staffers = getStaffers();
  const stafferById = new Map(staffers.map((staffer) => [staffer.id, staffer]));
  const stafferByEmail = new Map(
    staffers
      .filter((staffer) => Boolean(staffer.email))
      .map((staffer) => [staffer.email!.toLowerCase(), staffer])
  );
  const normalized = new Set<string>();

  const addIdentifier = (value: string | null | undefined) => {
    if (!value) return;
    const lowerValue = value.toLowerCase();
    if (normalized.has(lowerValue)) return;
    normalized.add(lowerValue);

    const staffer = stafferById.get(value) || stafferByEmail.get(lowerValue);
    if (staffer) {
      addIdentifier(staffer.id);
      addIdentifier(staffer.email);
    }
  };

  identifiers.forEach(addIdentifier);
  return normalized;
};

// Get assignments by staffer (matches on ID or email)
export const getAssignmentsByStaffer = (
  ...identifiers: (string | null | undefined)[]
): Assignment[] => {
  const assignments = getAssignments();
  const identifierSet = buildAssignmentIdentifierSet(identifiers);

  if (identifierSet.size === 0) {
    return [];
  }

  const matchesRecipient = (assignment: Assignment): boolean => {
    const recipients = [
      assignment.assignedTo,
      assignment.assignedToId,
      assignment.assignedToEmail,
    ]
      .filter((value): value is string => Boolean(value))
      .map((value) => value.toLowerCase());

    return recipients.some((recipient) => identifierSet.has(recipient));
  };

  return assignments.filter(matchesRecipient);
};

// Check if a user can approve assignments (executives and section-heads, NOT scribes/creatives/managerial)
export const canApproveAssignment = (user: User | null, staffer?: Staffer | null): boolean => {
  if (!user) return false;
  
  // Admin can always approve
  if (user.role === 'admin') return true;
  
  // Section heads can approve
  if (user.role === 'section-head') return true;
  
  // Executives can approve (check by position or section)
  if (user.position) {
    const positionLower = user.position.toLowerCase();
    if (positionLower.includes('editor-in-chief') || 
        positionLower.includes('associate editor') || 
        positionLower.includes('managing editor') || 
        positionLower.includes('executive secretary')) {
      return true;
    }
  }
  
  // Check by staffer section if provided
  if (staffer) {
    if (staffer.section === 'executives') return true;
  }
  
  // Scribes, creatives, managerial, and regular-staff cannot approve
  return false;
};

// Create a new assignment
export const createAssignment = (
  assignment: Omit<Assignment, 'id' | 'assignedAt' | 'status'> & Partial<Pick<Assignment, 'status'>>
): Assignment => {
  const assignments = getAssignments();
  const currentUser = getCurrentUser();
  const resolvedAssignedTo = assignment.assignedTo;
  const inferredAssignedToId = assignment.assignedToId || resolvedAssignedTo;
  const inferredAssignedToEmail =
    assignment.assignedToEmail ||
    (resolvedAssignedTo && resolvedAssignedTo.includes('@') ? resolvedAssignedTo : undefined);
  
  const newAssignment: Assignment = {
    ...assignment,
    id: Date.now().toString(),
    assignedAt: new Date().toISOString(),
    assignedByEmail: currentUser?.email || assignment.assignedByEmail,
    status: assignment.status || 'pending', // Default to pending unless explicitly provided
    assignedToId: inferredAssignedToId,
    assignedToEmail: inferredAssignedToEmail,
  };
  assignments.push(newAssignment);
  localStorage.setItem(STORAGE_KEYS.ASSIGNMENTS, JSON.stringify(assignments));
  // Dispatch custom event for same-tab updates
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('assignmentUpdated'));
  }
  return newAssignment;
};

// Update assignment
export const updateAssignment = (assignmentId: string, updates: Partial<Assignment>): Assignment | null => {
  const assignments = getAssignments();
  const assignmentIndex = assignments.findIndex((a) => a.id === assignmentId);
  
  if (assignmentIndex === -1) return null;
  const currentAssignment = assignments[assignmentIndex];
  const nextAssignedTo = updates.assignedTo ?? currentAssignment.assignedTo;
  const nextAssignedToId = updates.assignedToId || currentAssignment.assignedToId || nextAssignedTo;
  const nextAssignedToEmail =
    updates.assignedToEmail ||
    currentAssignment.assignedToEmail ||
    (nextAssignedTo && nextAssignedTo.includes('@') ? nextAssignedTo : undefined);
  
  assignments[assignmentIndex] = {
    ...currentAssignment,
    ...updates,
    assignedTo: nextAssignedTo,
    assignedToId: nextAssignedToId,
    assignedToEmail: nextAssignedToEmail,
  };
  localStorage.setItem(STORAGE_KEYS.ASSIGNMENTS, JSON.stringify(assignments));
  // Dispatch custom event for same-tab updates
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('assignmentUpdated'));
  }
  return assignments[assignmentIndex];
};

// Approve assignment (only executives and section-heads can approve)
export const approveAssignment = (assignmentId: string, approverEmail?: string, approverName?: string): Assignment | null => {
  const currentUser = getCurrentUser();
  const assignments = getAssignments();
  const assignmentIndex = assignments.findIndex((a) => a.id === assignmentId);
  
  if (assignmentIndex === -1) return null;
  
  const assignment = assignments[assignmentIndex];
  
  // Check if user can approve
  if (!canApproveAssignment(currentUser)) {
    throw new Error('You do not have permission to approve assignments');
  }
  
  assignments[assignmentIndex] = {
    ...assignment,
    status: 'approved',
    approvedBy: approverName || currentUser?.name || 'Approver',
    approvedByEmail: approverEmail || currentUser?.email || '',
    approvedAt: new Date().toISOString(),
  };
  
  localStorage.setItem(STORAGE_KEYS.ASSIGNMENTS, JSON.stringify(assignments));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('assignmentUpdated'));
  }
  return assignments[assignmentIndex];
};

// Reject assignment (only executives and section-heads can reject)
export const rejectAssignment = (assignmentId: string, reason: string, rejectorEmail?: string, rejectorName?: string): Assignment | null => {
  const currentUser = getCurrentUser();
  const assignments = getAssignments();
  const assignmentIndex = assignments.findIndex((a) => a.id === assignmentId);
  
  if (assignmentIndex === -1) return null;
  
  const assignment = assignments[assignmentIndex];
  
  // Check if user can approve/reject
  if (!canApproveAssignment(currentUser)) {
    throw new Error('You do not have permission to reject assignments');
  }
  
  assignments[assignmentIndex] = {
    ...assignment,
    status: 'rejected',
    rejectedBy: rejectorName || currentUser?.name || 'Rejector',
    rejectedByEmail: rejectorEmail || currentUser?.email || '',
    rejectedAt: new Date().toISOString(),
    rejectionReason: reason,
  };
  
  localStorage.setItem(STORAGE_KEYS.ASSIGNMENTS, JSON.stringify(assignments));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('assignmentUpdated'));
  }
  return assignments[assignmentIndex];
};

// Delete assignment
export const deleteAssignment = (assignmentId: string): boolean => {
  const assignments = getAssignments();
  const filteredAssignments = assignments.filter((a) => a.id !== assignmentId);
  
  if (filteredAssignments.length === assignments.length) return false;
  
  localStorage.setItem(STORAGE_KEYS.ASSIGNMENTS, JSON.stringify(filteredAssignments));
  // Dispatch custom event for same-tab updates
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('assignmentUpdated'));
  }
  return true;
};

// Team management interfaces
export interface TeamMember {
  id: string;
  stafferId: string;
  stafferName: string;
  section: 'executives' | 'scribes' | 'creatives' | 'managerial' | 'clients';
  addedBy: string; // Executive ID or email who added them
  addedByName: string; // Executive name who added them
  addedAt: string;
}

// Get all team members
export const getTeamMembers = (): TeamMember[] => {
  if (typeof window === 'undefined') return [];
  
  const teamsJson = localStorage.getItem(STORAGE_KEYS.TEAMS);
  if (!teamsJson) {
    return [];
  }
  
  try {
    return JSON.parse(teamsJson);
  } catch {
    return [];
  }
};

// Get team members by executive (who added them)
export const getTeamMembersByExecutive = (executiveId: string): TeamMember[] => {
  const members = getTeamMembers();
  return members.filter((m) => m.addedBy === executiveId);
};

// Add team member
export const addTeamMember = (member: Omit<TeamMember, 'id' | 'addedAt'>): TeamMember => {
  const members = getTeamMembers();
  // Check if already added
  const exists = members.find(m => m.stafferId === member.stafferId && m.addedBy === member.addedBy);
  if (exists) {
    return exists;
  }
  
  const newMember: TeamMember = {
    ...member,
    id: Date.now().toString(),
    addedAt: new Date().toISOString(),
  };
  members.push(newMember);
  localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(members));
  // Dispatch custom event
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('teamUpdated'));
  }
  return newMember;
};

// Remove team member
export const removeTeamMember = (memberId: string): boolean => {
  const members = getTeamMembers();
  const filtered = members.filter((m) => m.id !== memberId);
  
  if (filtered.length === members.length) return false;
  
  localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(filtered));
  // Dispatch custom event
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('teamUpdated'));
  }
  return true;
};

// Invitation management interfaces
export interface AssignmentInvitation {
  id: string;
  assignmentId: string;
  requestId: string;
  invitedTo: string; // Staffer ID
  invitedToName: string; // Staffer name
  invitedBy: string; // Executive ID or email
  invitedByName: string; // Executive name
  status: 'pending' | 'accepted' | 'declined';
  sentAt: string;
  respondedAt?: string;
}

// Get all invitations
export const getInvitations = (): AssignmentInvitation[] => {
  if (typeof window === 'undefined') return [];
  
  const invitationsJson = localStorage.getItem(STORAGE_KEYS.INVITATIONS);
  if (!invitationsJson) {
    return [];
  }
  
  try {
    return JSON.parse(invitationsJson);
  } catch {
    return [];
  }
};

// Get invitations by staffer
export const getInvitationsByStaffer = (stafferId: string): AssignmentInvitation[] => {
  const invitations = getInvitations();
  return invitations.filter((i) => i.invitedTo === stafferId);
};

// Get invitations by executive
export const getInvitationsByExecutive = (executiveId: string): AssignmentInvitation[] => {
  const invitations = getInvitations();
  return invitations.filter((i) => i.invitedBy === executiveId);
};

// Create invitation
export const createInvitation = (invitation: Omit<AssignmentInvitation, 'id' | 'sentAt'>): AssignmentInvitation => {
  const invitations = getInvitations();
  const newInvitation: AssignmentInvitation = {
    ...invitation,
    id: Date.now().toString(),
    sentAt: new Date().toISOString(),
  };
  invitations.push(newInvitation);
  localStorage.setItem(STORAGE_KEYS.INVITATIONS, JSON.stringify(invitations));
  // Dispatch custom event
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('invitationUpdated'));
  }
  return newInvitation;
};

// Update invitation status
export const updateInvitation = (invitationId: string, status: AssignmentInvitation['status']): AssignmentInvitation | null => {
  const invitations = getInvitations();
  const index = invitations.findIndex((i) => i.id === invitationId);
  
  if (index === -1) return null;
  
  invitations[index] = {
    ...invitations[index],
    status,
    respondedAt: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEYS.INVITATIONS, JSON.stringify(invitations));
  // Dispatch custom event
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('invitationUpdated'));
  }
  return invitations[index];
};

// Schedule Notes management interfaces
export interface ScheduleNote {
  id: string;
  stafferId: string;
  day: string; // Monday, Tuesday, etc.
  timeSlot: string; // 07:00AM-07:30AM, etc.
  notes: string;
  semester: '1st' | '2nd';
  addedBy: string; // Executive email
  addedByName: string; // Executive name
  addedByPosition: string; // Executive position
  createdAt: string;
  updatedAt?: string;
}

// Get all schedule notes
export const getScheduleNotes = (): ScheduleNote[] => {
  if (typeof window === 'undefined') return [];
  
  const notesJson = localStorage.getItem(STORAGE_KEYS.SCHEDULE_NOTES);
  if (!notesJson) {
    return [];
  }
  
  try {
    return JSON.parse(notesJson);
  } catch {
    return [];
  }
};

// Get schedule notes by staffer
export const getScheduleNotesByStaffer = (stafferId: string, semester?: '1st' | '2nd'): ScheduleNote[] => {
  const notes = getScheduleNotes();
  let filtered = notes.filter((n) => n.stafferId === stafferId);
  
  if (semester) {
    filtered = filtered.filter((n) => n.semester === semester);
  }
  
  return filtered;
};

// Get schedule note by day and time slot
export const getScheduleNoteByDayAndTime = (
  stafferId: string,
  day: string,
  timeSlot: string,
  semester: '1st' | '2nd'
): ScheduleNote | null => {
  const notes = getScheduleNotes();
  return notes.find(
    (n) =>
      n.stafferId === stafferId &&
      n.day === day &&
      n.timeSlot === timeSlot &&
      n.semester === semester
  ) || null;
};

// Create or update schedule note
export const saveScheduleNote = (
  note: Omit<ScheduleNote, 'id' | 'createdAt' | 'updatedAt'>
): ScheduleNote => {
  const notes = getScheduleNotes();
  const currentUser = getCurrentUser();
  
  // Check if note already exists for this day/time/semester
  const existingNote = notes.find(
    (n) =>
      n.stafferId === note.stafferId &&
      n.day === note.day &&
      n.timeSlot === note.timeSlot &&
      n.semester === note.semester
  );
  
  if (existingNote) {
    // Update existing note
    const updatedNote: ScheduleNote = {
      ...existingNote,
      notes: note.notes,
      addedBy: note.addedBy || currentUser?.email || '',
      addedByName: note.addedByName || currentUser?.name || '',
      addedByPosition: note.addedByPosition || currentUser?.position || '',
      updatedAt: new Date().toISOString(),
    };
    
    const index = notes.findIndex((n) => n.id === existingNote.id);
    notes[index] = updatedNote;
    localStorage.setItem(STORAGE_KEYS.SCHEDULE_NOTES, JSON.stringify(notes));
    
    // Dispatch custom event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('scheduleNoteUpdated'));
    }
    
    return updatedNote;
  } else {
    // Create new note
    const newNote: ScheduleNote = {
      ...note,
      id: Date.now().toString(),
      addedBy: note.addedBy || currentUser?.email || '',
      addedByName: note.addedByName || currentUser?.name || '',
      addedByPosition: note.addedByPosition || currentUser?.position || '',
      createdAt: new Date().toISOString(),
    };
    
    notes.push(newNote);
    localStorage.setItem(STORAGE_KEYS.SCHEDULE_NOTES, JSON.stringify(notes));
    
    // Dispatch custom event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('scheduleNoteUpdated'));
    }
    
    return newNote;
  }
};

// Delete schedule note
export const deleteScheduleNote = (noteId: string): boolean => {
  const notes = getScheduleNotes();
  const filtered = notes.filter((n) => n.id !== noteId);
  
  if (filtered.length === notes.length) return false;
  
  localStorage.setItem(STORAGE_KEYS.SCHEDULE_NOTES, JSON.stringify(filtered));
  
  // Dispatch custom event
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('scheduleNoteUpdated'));
  }
  
  return true;
};

// Client Availability Management
export interface ClientAvailability {
  date: string; // YYYY-MM-DD format
  available: boolean; // true = available, false = not available
  notes?: string; // Optional notes about availability
}

// Get all client availability dates
export const getClientAvailability = (): ClientAvailability[] => {
  if (typeof window === 'undefined') return [];
  
  const availabilityJson = localStorage.getItem(STORAGE_KEYS.CLIENT_AVAILABILITY);
  if (!availabilityJson) return [];
  
  try {
    return JSON.parse(availabilityJson);
  } catch (error) {
    console.error('Error parsing client availability:', error);
    return [];
  }
};

// Get availability for a specific date
export const getClientAvailabilityByDate = (date: string): ClientAvailability | null => {
  const availability = getClientAvailability();
  return availability.find(a => a.date === date) || null;
};

// Set availability for a date
export const setClientAvailability = (date: string, available: boolean, notes?: string): ClientAvailability => {
  const availability = getClientAvailability();
  const existingIndex = availability.findIndex(a => a.date === date);
  
  const newAvailability: ClientAvailability = {
    date,
    available,
    notes,
  };
  
  if (existingIndex >= 0) {
    availability[existingIndex] = newAvailability;
  } else {
    availability.push(newAvailability);
  }
  
  // Sort by date
  availability.sort((a, b) => a.date.localeCompare(b.date));
  
  localStorage.setItem(STORAGE_KEYS.CLIENT_AVAILABILITY, JSON.stringify(availability));
  
  // Dispatch custom event
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('clientAvailabilityUpdated'));
  }
  
  return newAvailability;
};

// Delete availability for a date
export const deleteClientAvailability = (date: string): boolean => {
  const availability = getClientAvailability();
  const filtered = availability.filter(a => a.date !== date);
  
  if (filtered.length === availability.length) return false;
  
  localStorage.setItem(STORAGE_KEYS.CLIENT_AVAILABILITY, JSON.stringify(filtered));
  
  // Dispatch custom event
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('clientAvailabilityUpdated'));
  }
  
  return true;
};
