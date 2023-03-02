import { Request, Response } from 'express';
import posts from '../../posts';
import privileges from '../../privileges';
import api from '../../api';
import * as helpers from '../helpers';
import * as apiHelpers from '../../api/helpers';

export interface PostsRequest extends Request {
  body: {
    delta?: number;
    tid?: number;
  }
  uid: number;
}

export async function get(req: Request, res: Response) {
    await helpers.formatApiResponse(200, res, await api.posts.get(req, { pid: req.params.pid }));
}

export async function edit(req: PostsRequest, res: Response) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const editResult = await api.posts.edit(req, {
        ...req.body,
        pid: req.params.pid,
        uid: req.uid,
        req: apiHelpers.buildReqObject(req),
    });

    await helpers.formatApiResponse(200, res, editResult);
}

export async function purge(req: Request, res: Response) {
    await api.posts.purge(req, { pid: req.params.pid });
    await helpers.formatApiResponse(200, res);
}

export async function restore(req: Request, res: Response) {
    await api.posts.restore(req, { pid: req.params.pid });
    await helpers.formatApiResponse(200, res);
}

export async function _delete(req: Request, res: Response) {
    await api.posts.delete(req, { pid: req.params.pid });
    await helpers.formatApiResponse(200, res);
}

export { _delete as delete };

export async function move(req: PostsRequest, res: Response) {
    await api.posts.move(req, {
        pid: req.params.pid,
        tid: req.body.tid,
    });
    await helpers.formatApiResponse(200, res);
}

async function mock(req: Request) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
    const tid: number = await posts.getPostField(req.params.pid, 'tid');
    return { pid: req.params.pid, room_id: `topic_${tid}` };
}

export async function vote(req: PostsRequest, res: Response) {
    const data = await mock(req);
    if (req.body.delta > 0) {
        await api.posts.upvote(req, data);
    } else if (req.body.delta < 0) {
        await api.posts.downvote(req, data);
    } else {
        await api.posts.unvote(req, data);
    }

    await helpers.formatApiResponse(200, res);
}

export async function unvote(req: Request, res: Response) {
    const data = await mock(req);
    await api.posts.unvote(req, data);
    await helpers.formatApiResponse(200, res);
}

export async function bookmark(req: Request, res: Response) {
    const data = await mock(req);
    await api.posts.bookmark(req, data);
    await helpers.formatApiResponse(200, res);
}

export async function unbookmark(req: Request, res: Response) {
    const data = await mock(req);
    await api.posts.unbookmark(req, data);
    await helpers.formatApiResponse(200, res);
}

export async function endorse(req: Request, res: Response) {
    const data = await mock(req);
    await api.posts.endorse(req, data);
    await helpers.formatApiResponse(200, res);
}

export async function unendorse(req: Request, res: Response) {
    const data = await mock(req);
    await api.posts.unendorse(req, data);
    await helpers.formatApiResponse(200, res);
}

export async function getDiffs(req: Request, res: Response) {
    await helpers.formatApiResponse(200, res, await api.posts.getDiffs(req, { ...req.params }));
}

export async function loadDiff(req: Request, res: Response) {
    await helpers.formatApiResponse(200, res, await api.posts.loadDiff(req, { ...req.params }));
}

export async function restoreDiff(req: Request, res: Response) {
    await helpers.formatApiResponse(200, res, await api.posts.restoreDiff(req, { ...req.params }));
}

export async function deleteDiff(req: PostsRequest, res: Response) {
    if (!parseInt(req.params.pid, 10)) {
        throw new Error('[[error:invalid-data]]');
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-assignment
    const cid = await posts.getCidByPid(req.params.pid);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const [isAdmin, isModerator]: boolean[] = await Promise.all([
        privileges.users.isAdministrator(req.uid),
        privileges.users.isModerator(req.uid, cid),
    ]);

    if (!(isAdmin || isModerator)) {
        return helpers.formatApiResponse(403, res, new Error('[[error:no-privileges]]'));
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call
    await posts.diffs.delete(req.params.pid, req.params.timestamp, req.uid);

    await helpers.formatApiResponse(200, res, await api.posts.getDiffs(req, { ...req.params }));
}
