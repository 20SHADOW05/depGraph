import { Router } from 'express';
import parse_npm from '../parsers/npm.js';
import buildGraph from '../controllers/packageGraph.js';
import normalizeGraph from '../controllers/normalizeGraph.js';

const uploadRouter = Router();

uploadRouter.post('/', async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'package-lock.json file is required' });
    }

    const fileContent = req.file.buffer.toString('utf-8');
    const packages = parse_npm(fileContent);
    const graph = normalizeGraph({
        ...packages,
        source: 'lockfile',
        fileName: req.file.originalname
    });

    res.status(200).json({
        msg: 'ok',
        ...graph
    });
});

uploadRouter.post('/pkg', async (req, res) => {
    const pkgName = req.body.pkgName;

    if (!pkgName || typeof pkgName !== 'string') {
        return res.status(400).json({ error: 'pkgName is required' });
    }

    const packages = await buildGraph(pkgName);
    const graph = normalizeGraph({
        ...packages,
        source: 'package-name',
        rootName: pkgName
    });

    res.status(200).json({
        msg: 'ok',
        ...graph
    });
})

uploadRouter.post('/save', (req, res) => {
    res.status(501).json({ error: 'Saving graphs is not implemented yet' });
});

export default uploadRouter;
