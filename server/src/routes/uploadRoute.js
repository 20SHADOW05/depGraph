import { Router } from 'express';
import { parse_npm, buildGraph_npmParse } from '../parsers/npm.js';
import buildGraph from '../controllers/packageGraph.js';
import normalizeGraph from '../controllers/normalizeGraph.js';
import { authenticateToken } from '../config/auth.js';
import { Graph } from '../models/graphModel.js'
import multer from 'multer';
import { Types } from "mongoose";

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 7 * 1024 * 1024 },
    fileFilter: (req, file, callBack) => {
    const allowed = [
        'package-lock.json',
        // 'requirements.txt',
        // 'poetry.lock',
        // 'Cargo.lock',
        // 'go.mod',
        // 'go.sum'
    ]
    if (allowed.includes(file.originalname)) {
        callBack(null, true)
    } else {
        callBack(new Error('Unsupported file type'))
    }
  }
});

const uploadRouter = Router();

uploadRouter.post('/',  upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'package-lock.json file is required' });
    }

    const fileContent = req.file.buffer.toString('utf-8');
    const packages = await buildGraph_npmParse(fileContent);
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

uploadRouter.post('/save', authenticateToken, async (req, res, next) => {
    try {
        const { source, rootName, fileName, nodes, edges } = req.body;

        if (!rootName || !Array.isArray(nodes) || !Array.isArray(edges)) {
            return res.status(400).json({ message: 'Invalid graph data' });
        }

        const objectId = new Types.ObjectId(req.user.sub);
        const graph = await Graph.create({
            user: objectId,
            source,
            rootName,
            fileName: fileName || null,
            nodes,
            edges
        });

        return res.status(201).json({ message: 'Graph saved', graph });
    } catch (err) {
        next(err);
    }
});

uploadRouter.get('/saved', authenticateToken, async (req, res) => {
    const graphs = await Graph.find({ user: req.user.sub }).sort({ createdAt: -1 });
     return res.json({ graphs });
});

export default uploadRouter;
