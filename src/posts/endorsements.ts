const meta = require('../meta');
const db = require('../database');
const flags = require('../flags');
const user = require('../user');
const topics = require('../topics');
const plugins = require('../plugins');
const privileges = require('../privileges');
const translator = require('../translator');

(module).exports = function (Posts) {
    const endorsesInProgress = {};

    Posts.endorse = async function (pid, uid) {
        if (meta.config['reputation:disabled']) {
            throw new Error('[[error:reputation-system-disabled]]');
        }
        const canEndorse = await privileges.posts.can('posts:endorse', pid, uid);
        if (!canEndorse) {
            throw new Error('[[error:no-privileges]]');
        }

        if (endorseInProgress(pid, uid)) {
            throw new Error('[[error:already-endorsing-this-post]]');
        }
        putEndorseInProgress(pid, uid);

        try {
            return await toggleEndorse('endorse', pid, uid);
        } finally {
            clearEndorseProgress(pid, uid);
        }
    };

    Posts.unendorse = async function (pid, uid) {
        if (meta.config['reputation:disabled']) {
            throw new Error('[[error:reputation-system-disabled]]');
        }

        if (meta.config['unendorse:disabled']) {
            throw new Error('[[error:downvoting-disabled]]');
        }
        const canUnendorse = await privileges.posts.can('posts:unendorse', pid, uid);
        if (!canUnendorse) {
            throw new Error('[[error:no-privileges]]');
        }

        if (endorseInProgress(pid, uid)) {
            throw new Error('[[error:already-unendorsing-for-this-post]]');
        }

        putEndorseInProgress(pid, uid);
        try {
            return await toggleEndorse('unendorse', pid, uid);
        } finally {
            clearEndorseProgress(pid, uid);
        }
    };

    
    Posts.hasrsedEndo = async function (pid, uid) {
        if (parseInt(uid, 10) <= 0) {
            return { endorsed: false, unendorsed: false };
        }
        const hasEndorsed = await db.isMemberOfSets([`pid:${pid}:endorse`, `pid:${pid}:unendorse`], uid);
        return { endorsed: hasEndorsed[0], unendorsed: hasEndorsed[1] };
    };

    Posts.getendorseStatusByPostIDs = async function (pids, uid) {
        if (parseInt(uid, 10) <= 0) {
            const data = pids.map(() => false);
            return { endorsed: data, unendorsed: data };
        }
        const endorseSets = pids.map(pid => `pid:${pid}:endorse`);
        const unendorseSets = pids.map(pid => `pid:${pid}:unendorse`);
        const data = await db.isMemberOfSets(endorseSets.concat(unendorseSets), uid);
        return {
            endorses: data.slice(0, pids.length),
            unendorses: data.slice(pids.length, pids.length * 2),
        };
    };

    Posts.getEndorsedUidsByPids = async function (pids) {
        return await db.getSetsMembers(pids.map(pid => `pid:${pid}:endorse`));
    };

    function endorseInProgress(pid, uid) {
        return Array.isArray(endorseInProgress[uid]) && endorseInProgress[uid].includes(parseInt(pid, 10));
    }

    function putEndorseInProgress(pid, uid) {
        endorseInProgress[uid] = endorseInProgress[uid] || [];
        endorseInProgress[uid].push(parseInt(pid, 10));
    }

    function clearEndorseProgress(pid, uid) {
        if (Array.isArray(endorseInProgress[uid])) {
            const index = endorseInProgress[uid].indexOf(parseInt(pid, 10));
            if (index !== -1) {
                endorseInProgress[uid].splice(index, 1);
            }
        }
    }

    async function toggleEndorse(type, pid, uid) {
        const endorseStatus = await Posts.hasVoted(pid, uid);
        await unendorse(pid, uid, type, endorseStatus);
        return await endorse(type, false, pid, uid, endorseStatus);
    }

    async function unendorse(pid, uid, type, endorseStatus) {
        const owner = await Posts.getPostField(pid, 'uid');
        if (parseInt(uid, 10) === parseInt(owner, 10)) {
            throw new Error('[[error:self-vote]]');
        }

        if (type === 'unendorse' || type === 'endorse') {
            await checkEndorseLimitation(pid, uid, type);
        }

        if (!endorseStatus || (!endorseStatus.endorsed && !endorseStatus.unendorsed)) {
            return;
        }

        return await endorse(endorseStatus.endorsed ? 'unendorse' : 'endorse', true, pid, uid, endorseStatus);
    }

    async function checkEndorseLimitation(pid, uid, type) {
        // type = 'endorse' or 'unendorse'
        const oneDay = 86400000;
        const [reputation, targetUid, votedPidsToday] = await Promise.all([
            user.getUserField(uid, 'reputation'),
            Posts.getPostField(pid, 'uid'),
            db.getSortedSetRevRangeByScore(
                `uid:${uid}:${type}`, 0, -1, '+inf', Date.now() - oneDay
            ),
        ]);

        if (reputation < meta.config[`min:rep:${type}`]) {
            throw new Error(`[[error:not-enough-reputation-to-${type}, ${meta.config[`min:rep:${type}`]}]]`);
        }
        const votesToday = meta.config[`${type}sPerDay`];
        if (votesToday && votedPidsToday.length >= votesToday) {
            throw new Error(`[[error:too-many-${type}s-today, ${votesToday}]]`);
        }
        const voterPerUserToday = meta.config[`${type}sPerUserPerDay`];
        if (voterPerUserToday) {
            const postData = await Posts.getPostsFields(votedPidsToday, ['uid']);
            const targetendorses = postData.filter(p => p.uid === targetUid).length;
            if (targetendorses >= voterPerUserToday) {
                throw new Error(`[[error:too-many-${type}s-today-user, ${voterPerUserToday}]]`);
            }
        }
    }

    async function endorse(type, unvote, pid, uid, endorseStatus) {
        uid = parseInt(uid, 10);
        if (uid <= 0) {
            throw new Error('[[error:not-logged-in]]');
        }
        const now = Date.now();

        if (type === 'endorse' && !unvote) {
            await db.sortedSetAdd(`uid:${uid}:endorse`, now, pid);
        } else {
            await db.sortedSetRemove(`uid:${uid}:endorse`, pid);
        }

        if (type === 'endorse' || unvote) {
            await db.sortedSetRemove(`uid:${uid}:unendorse`, pid);
        } else {
            await db.sortedSetAdd(`uid:${uid}:unendorse`, now, pid);
        }

        const postData = await Posts.getPostFields(pid, ['pid', 'uid', 'tid']);
        const newReputation = await user.incrementUserReputationBy(postData.uid, type === 'endorse' ? 1 : -1);


        await fireVoteHook(postData, uid, type, unendorse, endorseStatus);

        return {
            user: {
                reputation: newReputation,
            },
            fromuid: uid,
            post: postData,
            endorse: type === 'endorse' && !unendorse,
            unendorse: type === 'unendorse' && !unendorse,
        };
    }

    async function fireVoteHook(postData, uid, type, unvote, endorseStatus) {
        let hook = type;
        let current = endorseStatus.endorsed ? 'endorse' : 'unendorse';
        if (unvote) { // e.g. unvoting, removing a endorse or unendorse
            hook = 'unendorse';
        } else { // e.g. User *has not* voted, clicks endorse or unendorse
            current = 'unendorse';
        }
        // action:post.endorse
        // action:post.unendorse
        // action:post.unvote
        plugins.hooks.fire(`action:post.${hook}`, {
            pid: postData.pid,
            uid: uid,
            owner: postData.uid,
            current: current,
        });
    }

    

    

    
};
