// mock/server.js
const jsonServer = require('json-server');
const server = jsonServer.create();
const router = jsonServer.router('mock/db.json');
const middlewares = jsonServer.defaults();

const PORT = 3001;

// Middleware for logging
server.use((req, res, next) => {
    console.log(`[Mock API] ${req.method} ${req.path}`);
    if (req.body && Object.keys(req.body).length > 0) {
        console.log('[Mock API] Body:', JSON.stringify(req.body, null, 2));
    }
    next();
});

server.use(middlewares);
server.use(jsonServer.bodyParser);

// Mock Authentication - Development Only
server.post('/api/v2/auth/login', (req, res) => {
    const { email, password } = req.body;
    const db = router.db;

    console.log('[Mock Auth] Login attempt:', email);

    // 1. Find user by email
    const user = db.get('user').find({ email: email }).value();

    if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
    }

    // 2. Validate password (MOCK: check if hash exists, ignore real verify for dev)
    // In real app: await bcrypt.compare(password, user.password_hash)
    // Here: just accept if user exists and sends any password
    // Better: Check if password length > 0
    if (!password) {
        return res.status(400).json({ error: 'Password required' });
    }

    // Generate token
    const fakeToken = 'mock_jwt_' + Buffer.from(JSON.stringify({
        user_id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        exp: Date.now() + (24 * 60 * 60 * 1000)
    })).toString('base64');

    res.json({
        token: fakeToken,
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            tel: user.tel,
            picture_path: user.picture_path
        }
    });
});

server.post('/api/v2/auth/sign-up', (req, res) => {
    const { email, password, name, tel } = req.body;
    const db = router.db;

    console.log('[Mock Auth] Signup attempt:', email);

    // 1. Check existing
    const existing = db.get('user').find({ email: email }).value();
    if (existing) {
        return res.status(409).json({ error: 'Email already exists' });
    }

    // 2. Create User
    const newId = (db.get('user').value().length || 0) + 1;
    // Mock password hashing
    const mockHash = '$2b$10$mockhash' + Math.random().toString(36).substring(7);

    const newUser = {
        id: newId,
        email,
        password_hash: mockHash,
        name: name || email.split('@')[0],
        tel: tel || null,
        picture_path: null,
        role: 'student', // Default role
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        deleted_at: null
    };

    db.get('user').push(newUser).write();

    res.status(201).json({
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        message: 'Signup successful'
    });
});


// Helper to extract user_id from Mock JWT
const getUserIdFromRequest = (req) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return 1; // Default to user 1 if no header

    try {
        const token = authHeader.split(' ')[1];
        if (token && token.startsWith('mock_jwt_')) {
            const payload = token.replace('mock_jwt_', '');
            // Simple base64 decode for mock token
            const decoded = JSON.parse(Buffer.from(payload, 'base64').toString());
            return decoded.user_id || 1;
        }
    } catch (e) {
        console.warn('[Mock API] Failed to parse mock token:', e);
    }
    return 1;
};

// Custom route: POST /api/v2/playground/me (find or create)
server.post('/api/v2/playground/me', (req, res) => {
    const { assignment_id } = req.body;
    const user_id = getUserIdFromRequest(req);
    const db = router.db; // Access lowdb instance

    console.log(`[Mock API] Finding playground for Assignment: ${assignment_id}, User: ${user_id}`);

    // Find existing playground
    const playground = db.get('playground')
        .find({ assignment_id: assignment_id, user_id: user_id })
        .value();

    if (playground) {
        console.log('[Mock API] Found existing playground:', playground.id);
        res.json(playground);
    } else {
        console.log('[Mock API] Playground not found for assignment_id:', assignment_id);

        // Fetch assignment to get constraints
        const assignment = db.get('assignment').find({ id: assignment_id }).value();

        let initialRegisters = {};
        // Default to 8 registers if not specified
        const regCount = assignment?.condition?.execution_constraints?.register_count || 8;
        for (let i = 0; i < regCount; i++) {
            initialRegisters[`R${i}`] = 0;
        }

        const newId = (db.get('playground').value().length || 0) + 1;
        const newPlayground = {
            id: newId,
            assignment_id,
            user_id,
            item: {
                items: [],
                react_flow: { nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1 } },
                cpu_state: {
                    registers: initialRegisters,
                    memory: assignment?.condition?.initial_state?.memory || [],
                    variables: []
                },
                meta_data: {
                    last_saved: new Date().toISOString(),
                    version: "1.0"
                }
            },
            status: 'in_progress',
            attempt_no: 1
        };

        db.get('playground').push(newPlayground).write();
        console.log('[Mock API] Created new playground:', newId);
        res.status(201).json(newPlayground);
    }
});

// Custom route: PUT /api/v2/playground/me (update)
server.put('/api/v2/playground/me', (req, res) => {
    const { assignment_id, item, status } = req.body;
    const user_id = getUserIdFromRequest(req);
    const db = router.db;

    console.log(`[Mock API] Updating playground for Assignment: ${assignment_id}, User: ${user_id}`);

    const playground = db.get('playground')
        .find({ assignment_id: assignment_id, user_id: user_id })
        .value();

    if (playground) {
        // Update existing
        db.get('playground')
            .find({ id: playground.id })
            .assign({
                item: item || playground.item,
                status: status || playground.status,
                user_id: user_id
            })
            .write();

        const updated = db.get('playground').find({ id: playground.id }).value();
        console.log('[Mock API] Updated playground:', playground.id);
        res.json({ id: playground.id, ...updated });
    } else {

        const newId = (db.get('playground').value().length || 0) + 1;
        const newPlayground = {
            id: newId,
            assignment_id,
            user_id,
            item: item || {},
            status: status || 'in_progress',
            attempt_no: 1
        };

        db.get('playground').push(newPlayground).write();
        console.log('[Mock API] Created new playground via PUT:', newId);
        res.json(newPlayground);
    }
});

// Custom route: POST /api/v2/playground/:id/execute
server.post('/api/v2/playground/:id/execute', (req, res) => {
    const playgroundId = parseInt(req.params.id);
    console.log('[Mock API] Executing playground:', playgroundId);

    res.json({
        execution_state: {
            registers: {
                R0: 10,
                R1: 5,
                R2: 15,
                R3: 0
            },
            flags: {
                Z: 0,
                C: 0,
                V: 0,
                O: 0
            },
            memory_sparse: {
                "0": 100,
                "1": 200,
                "10": 42
            },
            halted: true,
            error: null
        }
    });
});

// Custom route: GET /api/v2/class/public
server.get('/api/v2/class/public', (req, res) => {
    const db = router.db;
    const classes = db.get('class').value();
    const users = db.get('user').value();
    const members = db.get('member').value();

    const publicClasses = classes
        .filter(c => c.status === 0)
        .map(c => {
            const owner = users.find(u => u.id === c.owner);
            const memberCount = members.filter(m => m.classroom_id === c.id).length;
            return {
                ...c,
                owner_name: owner ? owner.name : "Unknown Instructor",
                member_count: memberCount
            };
        });

    console.log('[Mock API] Serving public classes', publicClasses.length);
    res.json(publicClasses);
});

// Custom route: GET /api/v2/profile/
server.get('/api/v2/profile/', (req, res) => {
    const user_id = getUserIdFromRequest(req);
    const db = router.db;

    const user = db.get('user').find({ id: user_id }).value();

    if (user) {
        res.json({
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            tel: user.tel,
            picture_path: user.picture_path
        });
    } else {
        res.status(404).json({ error: 'User not found' });
    }
});

// Custom route: GET /api/v2/class/:id/members
server.get('/api/v2/class/:id/members', (req, res) => {
    const classId = parseInt(req.params.id);
    const db = router.db;

    // Find all memberships for this class
    const memberships = db.get('member')
        .filter({ classroom_id: classId })
        .value();

    if (!memberships || memberships.length === 0) {
        return res.json([]);
    }

    // Get user details for each member
    const users = db.get('user').value();
    const classMembers = memberships.map(m => {
        const user = users.find(u => u.id === m.user_id);
        if (user) {
            // Return safe user info (exclude password, etc. if needed, but mock is fine)
            return {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                joined_at: m.joined_at
            };
        }
        return null;
    }).filter(u => u !== null);

    res.json(classMembers);
});

// Custom route: GET /api/v2/class (to fix 304/404 issues if any)
server.get('/api/v2/class', (req, res) => {
    const db = router.db;
    const classes = db.get('class').value();
    res.json(classes);
});

// Custom route: GET /api/v2/class/my - Get classes owned by current user
server.get('/api/v2/class/my', (req, res) => {
    const user_id = getUserIdFromRequest(req);
    const db = router.db;
    const users = db.get('user').value();
    const members = db.get('member').value();

    const myClasses = db.get('class')
        .filter({ owner: user_id })
        .value()
        .map(c => {
            const owner = users.find(u => u.id === c.owner);
            const memberCount = members.filter(m => m.classroom_id === c.id).length;
            return {
                ...c,
                owner_name: owner ? owner.name : "Unknown Instructor",
                member_count: memberCount
            };
        })
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at)); // Sort by newest first

    res.json(myClasses);
});

// Custom route: GET /api/v2/class/joined - Get classes user has joined (but doesn't own)
server.get('/api/v2/class/joined', (req, res) => {
    const user_id = getUserIdFromRequest(req);
    const db = router.db;
    const users = db.get('user').value();
    const members = db.get('member').value();

    // Find all memberships for this user (with joined_at info)
    const userMemberships = members.filter(m => m.user_id === user_id);

    // Get classes where user is a member but not the owner
    const joinedClasses = db.get('class')
        .value()
        .filter(c => userMemberships.some(m => m.classroom_id === c.id) && c.owner !== user_id)
        .map(c => {
            const owner = users.find(u => u.id === c.owner);
            const memberCount = members.filter(m => m.classroom_id === c.id).length;
            const membership = userMemberships.find(m => m.classroom_id === c.id);
            return {
                ...c,
                owner_name: owner ? owner.name : "Unknown Instructor",
                member_count: memberCount,
                joined_at: membership?.joined_at // Include joined_at for sorting
            };
        })
        .sort((a, b) => new Date(b.joined_at) - new Date(a.joined_at)); // Sort by most recently joined

    res.json(joinedClasses);
});

// Custom route: GET /api/v2/class/:classId/assignment
server.get('/api/v2/class/:classId/assignment', (req, res) => {
    const classId = parseInt(req.params.classId);
    const db = router.db;

    const assignments = db.get('assignment')
        .filter({ class_id: classId })
        .value();

    res.json(assignments || []);
});

// Custom route: GET /api/v2/class/:classId/assignment/:assignmentId
server.get('/api/v2/class/:classId/assignment/:assignmentId', (req, res) => {
    const classId = parseInt(req.params.classId);
    const assignmentId = parseInt(req.params.assignmentId);
    const db = router.db;

    const assignment = db.get('assignment')
        .find({ id: assignmentId, class_id: classId })
        .value();

    if (assignment) {
        res.json(assignment);
    } else {
        res.status(404).json({ error: 'Assignment not found' });
    }
});

// Custom route: POST /api/v2/class/:classId/assignment
server.post('/api/v2/class/:classId/assignment', (req, res) => {
    const classId = parseInt(req.params.classId);
    const db = router.db;
    const assignments = db.get('assignment').value() || [];

    const newId = assignments.length > 0 ? Math.max(...assignments.map(a => a.id)) + 1 : 1001;

    const newAssignment = {
        id: newId,
        class_id: classId,
        title: req.body.title || "Untitled Assignment",
        description: req.body.description || "",
        due_date: req.body.due_date || null,
        max_attempts: req.body.max_attempts || 0,
        grade: req.body.grade || 100,
        settings: req.body.settings || {},
        condition: req.body.condition || {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        deleted_at: null
    };

    db.get('assignment').push(newAssignment).write();
    res.status(201).json({ id: newId });
});

// Custom route: POST /api/v2/class/:id/join
server.post('/api/v2/class/:id/join', (req, res) => {
    const classId = parseInt(req.params.id);
    const user_id = getUserIdFromRequest(req);
    const db = router.db;

    // Check if class exists
    const classItem = db.get('class').find({ id: classId }).value();
    if (!classItem) {
        return res.status(404).json({ error: "Class not found" });
    }

    // Check if already a member
    const existingMember = db.get('member')
        .find({ classroom_id: classId, user_id: user_id })
        .value();

    if (existingMember) {
        return res.status(400).json({ message: "You are already a member of this class." });
    }

    // Add to members
    db.get('member')
        .push({
            classroom_id: classId,
            user_id: user_id,
            joined_at: new Date().toISOString()
        })
        .write();

    res.json({ message: "Successfully joined the class!" });
});

// Custom route: POST /api/v2/class/:classId/assignment/:assignmentId/test-suite
server.post('/api/v2/class/:classId/assignment/:assignmentId/test-suite', (req, res) => {
    const assignmentId = parseInt(req.params.assignmentId);
    const db = router.db;

    const testSuites = db.get('test_suite').value() || [];
    const newSuiteId = testSuites.length > 0 ? Math.max(...testSuites.map(ts => ts.id)) + 1 : 1;

    const newSuite = {
        id: newSuiteId,
        assignment_id: assignmentId,
        name: req.body.name || "Untitled Suite",
        description: req.body.description || "",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };

    db.get('test_suite').push(newSuite).write();
    res.status(201).json({ id: newSuiteId });
});

// Custom route: POST /api/v2/class/:classId/assignment/:assignmentId/test-suite/:testSuiteId/test-case
server.post('/api/v2/class/:classId/assignment/:assignmentId/test-suite/:testSuiteId/test-case', (req, res) => {
    const testSuiteId = parseInt(req.params.testSuiteId);
    const db = router.db;

    const testCases = db.get('test_case').value() || [];
    const newTestCaseId = testCases.length > 0 ? Math.max(...testCases.map(tc => tc.id)) + 1 : 1;

    const newTestCase = {
        id: newTestCaseId,
        test_suite_id: testSuiteId,
        name: req.body.name || "Untitled Case",
        args: req.body.args || [],
        stdin: req.body.stdin || "",
        init: req.body.init || [],
        assert: req.body.assert || [],
        _meta: {
            hidden: req.body.hidden || false
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };

    db.get('test_case').push(newTestCase).write();
    res.status(201).json({ id: newTestCaseId });
});

// Custom route: POST /api/v2/class/:id/bookmark
server.post('/api/v2/class/:id/bookmark', (req, res) => {
    const classId = parseInt(req.params.id);
    const user_id = getUserIdFromRequest(req); // Helper to get user ID
    const db = router.db;

    const existingBookmark = db.get('bookmark')
        .find({ user_id: user_id, class_id: classId })
        .value();

    if (existingBookmark) {
        // Remove bookmark
        db.get('bookmark')
            .remove({ id: existingBookmark.id })
            .write();
        res.json({ bookmarked: false, message: "Bookmark removed" });
    } else {
        // Add bookmark
        const newId = (db.get('bookmark').value().length || 0) + 1;
        db.get('bookmark')
            .push({ id: newId, user_id: user_id, class_id: classId })
            .write();
        res.json({ bookmarked: true, message: "Bookmark added" });
    }
});

// Custom route: GET /api/v2/class/:id (Enriched Data)
server.get('/api/v2/class/:id', (req, res) => {
    const classId = parseInt(req.params.id);
    const user_id = getUserIdFromRequest(req);
    const db = router.db;

    const classItem = db.get('class').find({ id: classId }).value();

    if (!classItem) {
        // Fallback to router handler if not found (though this intercepts it)
        return res.status(404).json({});
    }

    const users = db.get('user').value();
    const members = db.get('member').value();
    const bookmarks = db.get('bookmark').value();

    const owner = users.find(u => u.id === classItem.owner);
    const memberCount = members.filter(m => m.classroom_id === classId).length;
    const isBookmarked = bookmarks.some(b => b.user_id === user_id && b.class_id === classId);

    res.json({
        ...classItem,
        owner_name: owner ? owner.name : "Unknown Instructor",
        member_count: memberCount,
    });
});

// Custom route: POST /api/v2/class
server.post('/api/v2/class', (req, res) => {
    const db = router.db;
    const classes = db.get('class').value() || [];

    const newId = classes.length > 0 ? Math.max(...classes.map(c => c.id)) + 1 : 101;

    // Generate random 6-char code
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    // Simple collision check loop could be added, but for mock random is fine
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const newClass = {
        id: newId,
        owner: req.body.owner,
        code: code,
        topic: req.body.topic,
        description: req.body.description,
        status: req.body.status || 0,
        google_course_id: null,
        google_course_link: null,
        google_synced_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };

    db.get('class').push(newClass).write();
    return res.status(201).json(newClass);
});

// ==================== TEST SUITES & TEST CASES API ====================

// GET /api/v2/test_suite?assignment_id=X
server.get('/api/v2/test_suite', (req, res) => {
    const db = router.db;
    const { assignment_id } = req.query;

    let suites = db.get('test_suite').value() || [];

    if (assignment_id) {
        suites = suites.filter(s => s.assignment_id === parseInt(assignment_id));
    }

    return res.json(suites);
});

// GET /api/v2/test_suite/:id
server.get('/api/v2/test_suite/:id', (req, res) => {
    const db = router.db;
    const id = parseInt(req.params.id);

    const suite = db.get('test_suite').find({ id }).value();

    if (!suite) {
        return res.status(404).json({ error: 'Test suite not found' });
    }

    return res.json(suite);
});

// POST /api/v2/test_suite
server.post('/api/v2/test_suite', (req, res) => {
    const db = router.db;
    const suites = db.get('test_suite').value() || [];

    // Generate new ID
    const newId = suites.length > 0 ? Math.max(...suites.map(s => s.id)) + 1 : 1;

    const newSuite = {
        id: newId,
        assignment_id: req.body.assignment_id,
        name: req.body.name,
        created_at: req.body.created_at || new Date().toISOString()
    };

    db.get('test_suite').push(newSuite).write();

    return res.status(201).json(newSuite);
});

// PUT /api/v2/test_suite/:id
server.put('/api/v2/test_suite/:id', (req, res) => {
    const db = router.db;
    const id = parseInt(req.params.id);

    const updated = db.get('test_suite')
        .find({ id })
        .assign(req.body)
        .write();

    if (!updated) {
        return res.status(404).json({ error: 'Test suite not found' });
    }

    return res.json(updated);
});

// DELETE /api/v2/test_suite/:id
server.delete('/api/v2/test_suite/:id', (req, res) => {
    const db = router.db;
    const id = parseInt(req.params.id);

    const removed = db.get('test_suite').remove({ id }).write();

    if (removed.length === 0) {
        return res.status(404).json({ error: 'Test suite not found' });
    }

    return res.status(204).send();
});

// GET /api/v2/test_case?test_suite_id=X
server.get('/api/v2/test_case', (req, res) => {
    const db = router.db;
    const { test_suite_id } = req.query;

    let cases = db.get('test_case').value() || [];

    if (test_suite_id) {
        cases = cases.filter(c => c.test_suite_id === parseInt(test_suite_id));
    }

    return res.json(cases);
});

// GET /api/v2/test_case/:id
server.get('/api/v2/test_case/:id', (req, res) => {
    const db = router.db;
    const id = parseInt(req.params.id);

    const testCase = db.get('test_case').find({ id }).value();

    if (!testCase) {
        return res.status(404).json({ error: 'Test case not found' });
    }

    return res.json(testCase);
});

// POST /api/v2/test_case
server.post('/api/v2/test_case', (req, res) => {
    const db = router.db;
    const cases = db.get('test_case').value() || [];

    // Generate new ID
    const newId = cases.length > 0 ? Math.max(...cases.map(c => c.id)) + 1 : 1;

    const newCase = {
        id: newId,
        test_suite_id: req.body.test_suite_id,
        name: req.body.name,
        init: req.body.init,
        assert: req.body.assert,
        created_at: req.body.created_at || new Date().toISOString()
    };

    db.get('test_case').push(newCase).write();

    return res.status(201).json(newCase);
});

// PUT /api/v2/test_case/:id
server.put('/api/v2/test_case/:id', (req, res) => {
    const db = router.db;
    const id = parseInt(req.params.id);

    const updated = db.get('test_case')
        .find({ id })
        .assign(req.body)
        .write();

    if (!updated) {
        return res.status(404).json({ error: 'Test case not found' });
    }

    return res.json(updated);
});

// DELETE /api/v2/test_case/:id
server.delete('/api/v2/test_case/:id', (req, res) => {
    const db = router.db;
    const id = parseInt(req.params.id);

    const removed = db.get('test_case').remove({ id }).write();

    if (removed.length === 0) {
        return res.status(404).json({ error: 'Test case not found' });
    }

    return res.status(204).send();
});

// ==================== SUBMISSION API ====================

// POST /api/v2/submission - Submit assignment
server.post('/api/v2/submission', (req, res) => {
    const db = router.db;
    const submissions = db.get('submission').value() || [];

    const newId = submissions.length > 0 ? Math.max(...submissions.map(s => s.id)) + 1 : 1;

    // Count attempts for this user+assignment
    const userAttempts = submissions.filter(
        s => s.user_id === req.body.user_id && s.assignment_id === req.body.assignment_id
    );
    const attemptNumber = userAttempts.length + 1;

    const newSubmission = {
        id: newId,
        user_id: req.body.user_id,
        assignment_id: req.body.assignment_id,
        playground_id: req.body.playground_id || null,
        attempt_number: attemptNumber,
        item_snapshot: req.body.item_snapshot,
        client_result: req.body.client_result,
        server_result: req.body.server_result || null,
        score: req.body.score || 0,
        status: req.body.status || 'submitted',
        is_verified: req.body.is_verified || false,
        duration_ms: req.body.duration_ms || 0,
        feedback: req.body.feedback || null,
        created_at: new Date().toISOString()
    };

    db.get('submission').push(newSubmission).write();

    console.log(`[API] ✓ Created submission ${newId} (Attempt #${attemptNumber}, Score: ${newSubmission.score})`);

    return res.status(201).json(newSubmission);
});

// GET /api/v2/submission?assignment_id=X&user_id=Y
server.get('/api/v2/submission', (req, res) => {
    const db = router.db;
    const { assignment_id, user_id } = req.query;

    let submissions = db.get('submission').value() || [];

    if (assignment_id) {
        submissions = submissions.filter(s => s.assignment_id === parseInt(assignment_id));
    }
    if (user_id) {
        submissions = submissions.filter(s => s.user_id === parseInt(user_id));
    }

    // Sort by created_at desc (newest first)
    submissions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return res.json(submissions);
});

// GET /api/v2/submission/:id
server.get('/api/v2/submission/:id', (req, res) => {
    const db = router.db;
    const id = parseInt(req.params.id);

    const submission = db.get('submission').find({ id }).value();

    if (!submission) {
        return res.status(404).json({ error: 'Submission not found' });
    }

    return res.json(submission);
});

// PUT /api/v2/submission/:id (Allow specific fields update like feedback)
server.put('/api/v2/submission/:id', (req, res) => {
    const db = router.db;
    const id = parseInt(req.params.id);

    const submission = db.get('submission').find({ id }).value();
    if (!submission) {
        return res.status(404).json({ error: 'Submission not found' });
    }

    const updated = db.get('submission')
        .find({ id })
        .assign(req.body)
        .write();

    return res.json(updated);
});

// Mount json-server router with /api/v2 prefix
server.use('/api/v2', router);

server.listen(PORT, () => {
    console.log(`\n🚀 Mock API Server is running!`);
    console.log(`📍 URL: http://localhost:${PORT}`);
    console.log(`📊 Mock Data: mock/db.json`);
    console.log(`\nTo use with frontend:`);
    console.log(`  NEXT_PUBLIC_API_URL=http://localhost:${PORT} npm run dev\n`);
});
