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
}

export interface Application {
  id: string;
  jobId: string;
  candidateUid: string;
  status: 'pending' | 'reviewed' | 'interviewing' | 'hired' | 'rejected';
  resumeUrl?: string;
  coverLetter?: string;
  createdAt: string;
}
