const express = require('express');
const mysql = require('mysql2/promise');
const bodyParser = require('body-parser');
const cors = require('cors'); // Import CORS package

const app = express();
const PORT = 3000;

// MySQL connection pool setup
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    database: 'samartha_recruitment',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Middleware
app.use(bodyParser.json());
app.use(cors()); // Use CORS middleware

// Route to fetch all requested candidates with candidate and interviewer details
app.get('/requested_candidates', async (req, res) => {
    try {
        const sql = `
            SELECT rc.requested_candidate_id, rc.request_id, rc.candidate_id,
                   rc.type_of_interview, rc.mode_of_interview, rc.stage_of_interview, rc.scheduled_interview_timing,
                   c.candidate_name, c.candidate_email,
                   u.user_name AS interviewer_name
            FROM requested_candidate rc
            INNER JOIN candidate c ON rc.candidate_id = c.candidate_id
            INNER JOIN request r ON rc.request_id = r.request_id
            INNER JOIN user u ON r.user_id = u.user_id
        `;
        const [rows] = await pool.query(sql);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching requested candidates:', error);
        res.status(500).json({ error: 'Failed to fetch requested candidates.' });
    }
});

// Route to update requested candidate details
app.put('/requested_candidates/:id', async (req, res) => {
    const requestedCandidateId = req.params.id;
    const { type_of_interview, mode_of_interview, stage_of_interview, scheduled_interview_timing } = req.body;

    try {
        // Check if compulsory fields are provided
        if (!type_of_interview || !mode_of_interview || !stage_of_interview || !scheduled_interview_timing) {
            return res.status(400).json({ error: 'Mandatory fields (type_of_interview, mode_of_interview, stage_of_interview, scheduled_interview_timing) are required.' });
        }

        const sql = `
            UPDATE requested_candidate
            SET type_of_interview = ?, mode_of_interview = ?, stage_of_interview = ?, scheduled_interview_timing = ?
            WHERE requested_candidate_id = ?
        `;
        const values = [type_of_interview, mode_of_interview, stage_of_interview, scheduled_interview_timing, requestedCandidateId];

        const [result] = await pool.query(sql, values);
        console.log('Updated:', result);

        res.json({ message: 'Requested candidate updated successfully.' });
    } catch (error) {
        console.error('Error updating requested candidate:', error);
        res.status(500).json({ error: 'Failed to update requested candidate.' });
    }
});

// Route to create a new requested candidate
app.post('/requested_candidates', async (req, res) => {
    const { request_id, candidate_id, type_of_interview, mode_of_interview, stage_of_interview, scheduled_interview_timing } = req.body;

    try {
        const sql = `
            INSERT INTO requested_candidate (request_id, candidate_id, type_of_interview, mode_of_interview, stage_of_interview, scheduled_interview_timing)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        const values = [request_id, candidate_id, type_of_interview, mode_of_interview, stage_of_interview, scheduled_interview_timing];
        const [result] = await pool.query(sql, values);
        console.log('Inserted:', result);

        res.status(201).json({ message: 'Requested candidate created successfully.' });
    } catch (error) {
        console.error('Error inserting requested candidate:', error);
        res.status(500).json({ error: 'Failed to create requested candidate.' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
