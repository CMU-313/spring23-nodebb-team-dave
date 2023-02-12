'use strict';

const db = require('../database');
const plugins = require('../plugins');

module.exports = function (Posts) {
    Posts.endorse = async function (pid) {
        return await toggleEndorsement('endorse', pid);
    };

    Posts.unendorse = async function (pid) {
        return await toggleEndorsement('unendorse', pid);
    };

    async function toggleEndorsement(type, pid) {
        const isEndorsing = type === 'endorse';

        const [postData, hasEndorsed] = await Promise.all([
            Posts.getPostFields(pid, ['pid', 'endorsed']),
            Posts.hasEndorsed(pid),
        ]);

        if (isEndorsing && hasEndorsed) {
            throw new Error('[[error:already-endorsed]]');
        }

        if (!isEndorsing && !hasEndorsed) {
            throw new Error('[[error:already-unendorsed]]');
        }

        postData.endorsed = (postData.endorsed === "true") ? "false" : "true";
        await Posts.setPostField(pid, 'endorsed', postData.endorsed);

        plugins.hooks.fire(`action:post.${type}`, {
            pid: pid,
            current: hasEndorsed ? 'endorsed' : 'unendorsed',
        });

        return {
            post: postData,
            isEndorsed: isEndorsing,
        };
    }

    Posts.hasEndorsed = async function (pid) {
        return ((await db.getObjectField(`post:${pid}`, 'endorsed')) === 'true');
    };
};
