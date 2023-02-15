import { Request, Response } from 'express';
import posts from '../../posts';
import privileges from '../../privileges';
import api from '../../api';
import helpers from '../helpers';
// The next line calls a function in a module that has not been updated to TS yet
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call

interface RequestWithEndorse extends Request {
    uid: string,
    params: any
}

type params = {
    pid: any,
}

type Post = {
    timestamp: number,
    uid: string,
    cid: string,
    pid: string,
}

// The next line calls a function in a module that has not been updated to TS yet
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
export async function post(req: RequestWithEndorse, res: Response): Promise<void>
{
    const postData: Post = await api.posts.get(req, {pid: req.params.pid});
    helpers.formatApiResponse(200, res, postData);
}

// The next line calls a function in a module that has not been updated to TS yet
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
async function mock(req: Request) {
    const tid = await posts.getPostField(req.params.pid, 'tid');
    return { pid: req.params.pid, room_id: `topic_${tid}` };
}

// The next line calls a function in a module that has not been updated to TS yet
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
export async function endorse(req: RequestWithEndorse, res: Response) {
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


