import { RequestHandler } from 'express';
import { MetricsDB, initializeMetricsDB } from '../MetricsDB';

export const getProjectsHandler: RequestHandler = async (req, res) => {
    if (!req.isAuthenticated()) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    try {
        await initializeMetricsDB();
        const result = await MetricsDB.query('SELECT DISTINCT project_name FROM pull_request ORDER BY project_name');
        
        res.json(result.map((row: any) => row.project_name));
    } catch (error) {
        console.error('Error fetching projects:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getRepositoriesHandler: RequestHandler = async (req, res) => {
    if (!req.isAuthenticated()) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    const projectName = req.query.project_name;

    try {
        await initializeMetricsDB();
        const result = await MetricsDB.query(
            `SELECT DISTINCT (repository_name) 
             FROM pull_request 
             WHERE pull_request.integrity_errors IS NULL 
             AND ($1::text IS NULL OR project_name IN($1::text)) 
             ORDER BY repository_name`,
            [projectName]
        );

        res.json(result.map((row: any) => row.repository_name));
    } catch (error) {
        console.error('Error fetching repositories:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};