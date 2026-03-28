import { useState, useEffect } from "react";
import { getClassMembers, Member } from "@/lib/api/class";
import { getAssignmentsForClass, Assignment } from "@/lib/api/assignment";
import { getAllSubmissionsForAssignment, OwnerSubmission } from "@/lib/api/submission";

export interface AssignmentStats {
    assignment: Assignment;
    submissions: OwnerSubmission[];
    latestPerUser: Map<number, OwnerSubmission>;
    totalSubmissions: number;
    pendingCount: number;
    avgScore: number | null;
}

export function useClassStats(classId: string, isOwner: boolean, options = { skip: false }) {
    const [members, setMembers] = useState<Member[]>([]);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [stats, setStats] = useState<AssignmentStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (options.skip) return;

        if (!isOwner) {
            setLoading(false);
            return;
        }

        let isMounted = true;
        setLoading(true);

        (async () => {
            try {
                const [membersData, assignmentsData] = await Promise.all([
                    getClassMembers(classId),
                    getAssignmentsForClass(classId),
                ]);

                if (!isMounted) return;

                const m = membersData || [];
                const a = assignmentsData || [];

                setMembers(m);
                setAssignments(a);

                const enriched = await Promise.all(
                    a.map(async (assign: Assignment) => {
                        const subs = await getAllSubmissionsForAssignment(assign.id).catch(() => [] as OwnerSubmission[]);
                        const latestPerUser = new Map<number, OwnerSubmission>();
                        for (const s of subs) {
                            const prev = latestPerUser.get(s.user_id);
                            if (!prev || new Date(s.created_at) > new Date(prev.created_at)) {
                                latestPerUser.set(s.user_id, s);
                            }
                        }

                        const latest = Array.from(latestPerUser.values());
                        const scores = latest.filter((s) => s.score !== null).map((s) => s.score as number);
                        const avgScore = scores.length ? Math.round((scores.reduce((sum, score) => sum + score, 0) / scores.length) * 10) / 10 : null;

                        return {
                            assignment: assign,
                            submissions: subs,
                            latestPerUser,
                            totalSubmissions: latest.length,
                            pendingCount: m.length - latest.length,
                            avgScore,
                        };
                    })
                );

                if (!isMounted) return;
                setStats(enriched);
            } catch (err: any) {
                if (isMounted) setError(err);
            } finally {
                if (isMounted) setLoading(false);
            }
        })();

        return () => {
            isMounted = false;
        };
    }, [classId, isOwner, options.skip]);

    return { members, assignments, stats, loading, error };
}
