import type { ReactNode } from 'react';
export default function StatCard({ label, value, note, icon }: {label:string;value:string|number;note:string;icon:ReactNode}) { return <article className="stat-card"><div className="stat-top"><span>{label}</span><div className="stat-icon">{icon}</div></div><strong className="stat-value">{value}</strong><span className="stat-note">{note}</span></article>; }
