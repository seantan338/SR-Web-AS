import {
  db,
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
} from '@/src/lib/firebase';
import type { CandidateProfile, WorkExperienceEntry, EducationEntry } from '@/src/types';

export async function getCandidateProfile(uid: string): Promise<CandidateProfile | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  return snap.data() as CandidateProfile;
}

export async function updateCandidateProfile(uid: string, data: Partial<CandidateProfile>): Promise<void> {
  await updateDoc(doc(db, 'users', uid), data as Record<string, unknown>);
}

export async function getWorkExperience(uid: string): Promise<WorkExperienceEntry[]> {
  const snap = await getDocs(collection(db, 'users', uid, 'workExperience'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as WorkExperienceEntry));
}

export async function addWorkExperience(uid: string, entry: Omit<WorkExperienceEntry, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db, 'users', uid, 'workExperience'), entry);
  return ref.id;
}

export async function updateWorkExperience(uid: string, entryId: string, data: Partial<WorkExperienceEntry>): Promise<void> {
  await updateDoc(doc(db, 'users', uid, 'workExperience', entryId), data as Record<string, unknown>);
}

export async function deleteWorkExperience(uid: string, entryId: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid, 'workExperience', entryId));
}

export async function getEducation(uid: string): Promise<EducationEntry[]> {
  const snap = await getDocs(collection(db, 'users', uid, 'education'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as EducationEntry));
}

export async function addEducation(uid: string, entry: Omit<EducationEntry, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db, 'users', uid, 'education'), entry);
  return ref.id;
}

export async function updateEducation(uid: string, entryId: string, data: Partial<EducationEntry>): Promise<void> {
  await updateDoc(doc(db, 'users', uid, 'education', entryId), data as Record<string, unknown>);
}

export async function deleteEducation(uid: string, entryId: string): Promise<void> {
  await deleteDoc(doc(db, 'users', uid, 'education', entryId));
}

export async function updateSkills(uid: string, skills: string[]): Promise<void> {
  await updateDoc(doc(db, 'users', uid), { skills });
}

export async function uploadResume(uid: string, file: File): Promise<string> {
  try {
    const { getStorage, ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
    const { getApp } = await import('firebase/app');
    const storage = getStorage(getApp());
    const storageRef = ref(storage, `resumes/${uid}/resume.pdf`);
    const snapshot = await uploadBytes(storageRef, file);
    const url = await getDownloadURL(snapshot.ref);
    await updateDoc(doc(db, 'users', uid), { resumeUrl: url });
    return url;
  } catch (error) {
    console.warn('Resume upload failed — Firebase Storage may not be configured:', error);
    throw error;
  }
}

export async function getResumeUrl(uid: string): Promise<string | null> {
  const profile = await getCandidateProfile(uid);
  return profile?.resumeUrl ?? null;
}

export function getProfileCompleteness(params: {
  displayName?: string;
  profilePhoto?: string;
  bio?: string;
  workExperienceCount: number;
  educationCount: number;
  skillsCount: number;
  resumeUrl?: string | null;
}): number {
  let score = 0;
  if (params.displayName) score += 10;
  if (params.profilePhoto) score += 10;
  if (params.bio) score += 15;
  if (params.workExperienceCount >= 1) score += 20;
  if (params.educationCount >= 1) score += 15;
  if (params.skillsCount >= 3) score += 15;
  if (params.resumeUrl) score += 15;
  return score;
}
