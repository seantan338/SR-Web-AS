export type UserRole = 'admin' | 'recruiter' | 'partner' | 'candidate';

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  salary?: string;
  description: string;
  createdAt: string;
  // New fields for Google Sheets sync
  partnerInCharge?: string;
  commissionRange?: string;
  clientRequirements?: string;
  contactDetails?: string;
  workingDay?: string;
  workingHours?: string;
}

export interface Application {
  id: string;
  jobId: string;
  candidateUid: string;
  candidateName?: string;
  jobTitle?: string;
  company?: string;
  status: 'pending' | 'reviewed' | 'interviewing' | 'hired' | 'rejected';
  resumeUrl?: string;
  coverLetter?: string;
  createdAt: string;
  referredBy?: string;
}

export interface PartnerClient {
  id?: string;
  companyName: string;
  industry: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface JobOrder {
  id?: string;
  clientCompany: string;
  jobTitle: string;
  jobDescription: string;
  salaryRange: string;
  headcount: number;
  urgency: 'low' | 'medium' | 'high';
  notes: string;
  submittedBy: string;
  partnerName: string;
  status: 'pending' | 'in-progress' | 'filled';
  createdAt: string;
}
