export interface Patient {
    id?: number;
    name: string;
    uid: string;
    phone: string;
    email: string;
    age: number;
    gender: string;
    bloodGroup: string;
    address: string;
    medicalHistory: string;
    photoUrl?: string;
    createdAt?: string;
}