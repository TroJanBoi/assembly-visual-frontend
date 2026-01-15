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
    const user = db.get('users').find({ email: email }).value();

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
    const existing = db.get('users').find({ email: email }).value();
    if (existing) {
        return res.status(409).json({ error: 'Email already exists' });
    }

    // 2. Create User
    const newId = (db.get('users').value().length || 0) + 1;
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

    db.get('users').push(newUser).write();

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

// Custom route: POST /api/v2/playgrounds/me (find or create)
server.post('/api/v2/playgrounds/me', (req, res) => {
    const { assignment_id } = req.body;
    const user_id = getUserIdFromRequest(req);
    const db = router.db; // Access lowdb instance

    console.log(`[Mock API] Finding playground for Assignment: ${assignment_id}, User: ${user_id}`);

    // Find existing playground
    const playground = db.get('playgrounds')
        .find({ assignment_id: assignment_id, user_id: user_id })
        .value();

    if (playground) {
        console.log('[Mock API] Found existing playground:', playground.id);
        res.json(playground);
    } else {
        console.log('[Mock API] Playground not found for assignment_id:', assignment_id);
        // Note: In a real app, this might create one. 
        // For now, we return 404 to let FE handle it (or we could auto-create here)
        res.status(404).json({ error: 'Playground not found' });
    }
});

// Custom route: PUT /api/v2/playgrounds/me (update)
server.put('/api/v2/playgrounds/me', (req, res) => {
    const { assignment_id, item, status } = req.body;
    const user_id = getUserIdFromRequest(req);
    const db = router.db;

    console.log(`[Mock API] Updating playground for Assignment: ${assignment_id}, User: ${user_id}`);

    const playground = db.get('playgrounds')
        .find({ assignment_id: assignment_id, user_id: user_id })
        .value();

    if (playground) {
        // Update existing
        db.get('playgrounds')
            .find({ id: playground.id })
            .assign({
                item: item || playground.item,
                status: status || playground.status,
                user_id: user_id // Ensure user_id persists
            })
            .write();

        const updated = db.get('playgrounds').find({ id: playground.id }).value();
        console.log('[Mock API] Updated playground:', playground.id);
        res.json({ id: playground.id, ...updated });
    } else {
        // Option: Auto-create if not found on PUT? 
        // Usually PUT implies existence, but for convenience we could create.
        // Let's stick to 404 to be strict, or create if we want to be nice.
        // Let's create proper new entry.

        const newId = (db.get('playgrounds').value().length || 0) + 1;
        const newPlayground = {
            id: newId,
            assignment_id,
            user_id,
            item: item || {},
            status: status || 'in_progress',
            attempt_no: 1
        };

        db.get('playgrounds').push(newPlayground).write();
        console.log('[Mock API] Created new playground via PUT:', newId);
        res.json(newPlayground);
    }
});

// Custom route: POST /api/v2/playgrounds/:id/execute
server.post('/api/v2/playgrounds/:id/execute', (req, res) => {
    const playgroundId = parseInt(req.params.id);
    console.log('[Mock API] Executing playground:', playgroundId);

    // Return mock execution result
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

// Custom route: GET /api/v2/classes/public
server.get('/api/v2/classes/public', (req, res) => {
    const db = router.db;
    const classes = db.get('classes').value();
    console.log('[Mock API] Serving public classes');
    res.json(classes);
});

// Custom route: GET /api/v2/profile/
server.get('/api/v2/profile/', (req, res) => {
    const user_id = getUserIdFromRequest(req);
    const db = router.db;

    const user = db.get('users').find({ id: user_id }).value();

    if (user) {
        res.json({
            id: user.id,
            email: user.email,
            name: user.name, // Now using 'name' not 'username'
            role: user.role,
            tel: user.tel,
            picture_path: user.picture_path
        });
    } else {
        res.status(404).json({ error: 'User not found' });
    }
});

// Custom route: GET /api/v2/classes/:id/members
server.get('/api/v2/classes/:id/members', (req, res) => {
    // Return mock members
    res.json([
        { id: 1, email: "student1@example.com", name: "Student One", role: "student" },
        { id: 2, email: "teacher1@example.com", name: "Teacher One", role: "teacher" }
    ]);
});

// Custom route: GET /api/v2/classes (to fix 304/404 issues if any)
server.get('/api/v2/classes', (req, res) => {
    const db = router.db;
    const classes = db.get('classes').value();
    res.json(classes);
});

// Custom route: GET /api/v2/classes/:classId/assignments/:assignmentId
server.get('/api/v2/classes/:classId/assignments/:assignmentId', (req, res) => {
    const classId = parseInt(req.params.classId);
    const assignmentId = parseInt(req.params.assignmentId);
    const db = router.db;

    const assignment = db.get('assignments')
        .find({ id: assignmentId, class_id: classId })
        .value();

    if (assignment) {
        res.json(assignment);
    } else {
        res.status(404).json({ error: 'Assignment not found' });
    }
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
