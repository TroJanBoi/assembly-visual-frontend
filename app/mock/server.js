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
    console.log('[Mock Auth] Login attempt:', req.body.email);

    // Generate a fake JWT token (not cryptographically valid, but works for dev)
    const fakeToken = 'mock_jwt_' + Buffer.from(JSON.stringify({
        user_id: 1,
        email: req.body.email,
        exp: Date.now() + (24 * 60 * 60 * 1000) // 24 hours from now
    })).toString('base64');

    res.json({
        token: fakeToken,
        user: {
            id: '1',
            email: req.body.email,
            name: 'Mock User'
        }
    });
});

server.post('/api/v2/auth/sign-up', (req, res) => {
    console.log('[Mock Auth] Signup attempt:', req.body.email);
    res.json({
        id: '1',
        email: req.body.email,
        name: req.body.name,
        message: 'Mock signup successful'
    });
});


// Custom route: POST /api/v2/playgrounds/me (find or create)
server.post('/api/v2/playgrounds/me', (req, res) => {
    const { assignment_id } = req.body;
    const db = router.db; // Access lowdb instance

    // Find existing playground
    const playground = db.get('playgrounds')
        .find({ assignment_id: assignment_id })
        .value();

    if (playground) {
        console.log('[Mock API] Found existing playground:', playground.id);
        res.json(playground);
    } else {
        console.log('[Mock API] Playground not found for assignment_id:', assignment_id);
        // Return null or 404 to trigger FE to create new one
        res.status(404).json({ error: 'Playground not found' });
    }
});

// Custom route: PUT /api/v2/playgrounds/me (update)
server.put('/api/v2/playgrounds/me', (req, res) => {
    const { assignment_id, item, status } = req.body;
    const db = router.db;

    const playground = db.get('playgrounds')
        .find({ assignment_id: assignment_id })
        .value();

    if (playground) {
        // Update existing
        db.get('playgrounds')
            .find({ id: playground.id })
            .assign({
                item: item || playground.item,
                status: status || playground.status
            })
            .write();

        const updated = db.get('playgrounds').find({ id: playground.id }).value();
        console.log('[Mock API] Updated playground:', playground.id);
        res.json({ id: playground.id, ...updated });
    } else {
        res.status(404).json({ error: 'Playground not found' });
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
    // Return mock user profile
    res.json({
        id: 1,
        username: "student1",
        email: "student1@example.com",
        role: "student"
    });
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
