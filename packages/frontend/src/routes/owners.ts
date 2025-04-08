import { RequestHandler } from 'express';
import { MetricsDB } from '../MetricsDB';

export const getOwnersHandler: RequestHandler = async (req, res, next) => {
    if (!req.isAuthenticated()) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }

    try {
        const dataSource = await MetricsDB.initialize();
        const result = await dataSource.query('SELECT DISTINCT project_name FROM pull_request');
        await dataSource.destroy();
        
        res.json(result.map((row: any) => row.project_name));
    } catch (error) {
        console.error('Error fetching projects:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}; 