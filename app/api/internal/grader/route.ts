import { NextRequest, NextResponse } from "next/server";
import { runTestSuite, TestSuite, TestSuiteResult } from "@/lib/playground/test_runner";
import { ProgramItem } from "@/lib/api/playground";
import { CPUState } from "@/lib/playground/cpu";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {

    // 1. Security Check
    const authHeader = req.headers.get("authorization");
    const secret = process.env.GRADER_API_SECRET;

    if (!secret || authHeader !== `Bearer ${secret}`) {
        return NextResponse.json(
            { error: "Unauthorized: Invalid or missing token" },
            { status: 401 }
        );
    }

    try {
        const body = await req.json();
        const {
            program,
            test_suite,
            default_state,
        } = body;

        if (!program || !test_suite) {
            return NextResponse.json(
                { error: "Missing required fields: program, test_suite" },
                { status: 400 }
            );
        }

        // 2. Execution logic reused from frontend lib
        // The test runner handles both visible and hidden cases blindly
        const result: TestSuiteResult = await runTestSuite(
            test_suite as TestSuite,
            program as ProgramItem[],
            default_state || { registers: {}, flags: {}, memory: [], ports: {} } as CPUState
        );

        // 3. Return Raw Result
        return NextResponse.json(result);

    } catch (error: any) {
        console.error("[Grader API] Error:", error);
        return NextResponse.json(
            { error: "Internal Grader Error", details: error.message },
            { status: 500 }
        );
    }
}
