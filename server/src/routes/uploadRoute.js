import { Router } from 'express';
import parse_npm from '../parsers/npm.js';
import buildGraph from '../controllers/packageGraph.js';

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

uploadRouter.post('/pkg', async (req, res) => {
    const pkgName = req.body.pkgName;
    const graph = await buildGraph(pkgName);
    console.log(graph.nodes.length);
    console.log(graph.edges.length);
    console.log(graph);
    res.status(200).json({ msg : 'ok' });
})

uploadRouter.post('/save', () => {

});

export default uploadRouter;