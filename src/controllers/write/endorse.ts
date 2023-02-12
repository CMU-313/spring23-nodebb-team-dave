import { Request, Response } from 'express';
import posts from '../../posts';
import privileges from '../../privileges';
import api from '../../api';
import helpers from '../helpers';


type pid = {
    pid: "string";
}


export async function post(req: Request, res: Response) {
    helpers.formatApiResponse(200, res, await api.posts.get(req, { pid: req.params.pid }));
}

async function mock(req: Request) {
    const tid = await posts.getPostField(req.params.pid, 'tid');
    return { pid: req.params.pid, room_id: `topic_${tid}` };
}

export async function endorse(req: Request, res: Response) {
    const data = await mock(req);
    await api.posts.endorse(req, data);
    helpers.formatApiResponse(200, res);

    const cid = await posts.getCidByPid(req.params.pid);
    const [isAdmin, isModerator] = await Promise.all([
        privileges.users.isAdministrator(req.uid),
        privileges.users.isModerator(req.uid, cid),
    ]);

    if (!(isAdmin || isModerator)) {
        return helpers.formatApiResponse(403, res, new Error('[[error:no-privileges]]'));
    }
}


