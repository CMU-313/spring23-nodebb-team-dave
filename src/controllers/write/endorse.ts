import { Request, Response } from 'express';
import posts from '../../posts';
import privileges from '../../privileges';
import api from '../../api';
import helpers from '../helpers';
// The next line calls a function in a module that has not been updated to TS yet
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call

interface RequestWithEndorse extends Request {
    uid: string,
    params: {
        pid: string,
    }
}

type Post = {
    timestamp: number,
    uid: string,
    cid: string,
    pid: string,
}

type Mock = {
    pid: string;
    room_id: string;
}

interface PostField {
    tid: string,
}



export async function post(req: RequestWithEndorse, res: Response): Promise<void> {
    // The next line calls a function in a module that has not been updated to TS yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const postData: Post = await api.posts.get<Post>(req, { pid: req.params.pid });
    try {
        await helpers.formatApiResponse(200, res, postData);
    } catch (err) {
        console.log('error');
    }
}

async function mock(req: RequestWithEndorse): Promise<Mock> {
    // The next line calls a function in a module that has not been updated to TS yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    const { tid }: PostField = await posts.getPostField(req.params.pid, 'tid') as PostField;
    return { pid: req.params.pid, room_id: `topic_${tid}` };
}


export async function endorse(req: RequestWithEndorse, res: Response) {
    const data = await mock(req);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    await api.posts.endorse(req, data);
    await helpers.formatApiResponse(200, res);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    const cid: string = await posts.getCidByPid(req.params.pid) as string;
    // The next line calls a function in a module that has not been updated to TS yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const [isAdmin, isModerator]: [boolean, boolean] = await Promise.all([
        privileges.users.isAdministrator(req.uid),
        privileges.users.isModerator(req.uid, cid),
    ]);

    if (!(isAdmin || isModerator)) {
        return helpers.formatApiResponse(403, res, new Error('[[error:no-privileges]]'));
    }
}


