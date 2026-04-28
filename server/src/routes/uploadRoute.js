import { Router } from 'express';
import parse_npm from '../parsers/npm.js';

const uploadRouter = Router();

uploadRouter.post('/', async (req, res) => {
    const fileContent = req.file.buffer.toString('utf-8');
    const packages = parse_npm(fileContent);

    console.log(req.file.originalname);
    console.log(packages.nodes.length);
    console.log(packages.edges.length);
    console.log(packages);
    res.status(200).json({ msg : 'ok' });
});

uploadRouter.post('/save', () => {

});

export default uploadRouter;