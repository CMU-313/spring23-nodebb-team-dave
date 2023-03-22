import _ from 'lodash';
import db from '../database';
import utils from '../utils' ;
import slugify from '../slugify';
import plugins from '../plugins';
import analytics from '../analytics';
import user from '../user';
import meta from '../meta';
import posts from '../posts';
import privileges from '../privileges';
import categories from '../categories';
import translator from '../translator';

interface TopicData {
    timestamp?: number;
    tid: number;
    uid: number;
    cid: number;
    content: boolean;
    title: string;
    tags?: string;
    scheduled: boolean;
    fromQueue: boolean;
    ip?: string; 
    req?: any; 
    deleted: boolean;
    locked:boolean;
    isMain: boolean;
    
}

interface Topic {
    tid: number;
    deleted: boolean;
    locked: boolean;
    uid: number;
    cid: number;
    mainPid: number;
    title: string;
    slug: string;
    content: boolean;
    timestamp: number;
    fromQueue: boolean;
    lastposttime: number;
    postcount: number;
    viewcount: number;
    tags?: string;
    scheduled: boolean;
    ip?: string; 
    req?: any;
    isMain:boolean;
    // add other properties of the topic object here
  }

interface TopicsModel {
    create(data:TopicData):Promise<number>;
    post(data:TopicData):Promise<TopicData>;
    createTags(tags:string, tid:number, timestamp: number);
    scheduled: {
        pin(tid: number, topicData: TopicData): Promise<void>;
        // add other scheduled methods here
      };
    checkTitle(title:string);
    validateTags(tags:string, cid:number, uid:number);
    filterTags(tags:string, cid:number);
    checkContent(content: boolean);
    onNewPost(postData: TopicData, data:TopicData);
    reply(data:TopicData):Promise<TopicData>;
    getTopicData(tid:number);
    canReply(data:TopicData, topic:TopicData);
    
}




const Topics: TopicsModel = {
    create = async function (data: TopicData): Promise<number> {
        // This is an internal method, consider using Topics.post instead
        let timestamp = data.timestamp || Date.now();

        let tid = await db.incrObjectField('global', 'nextTid');

        let topicData: Topic = {
            tid: tid,
            uid: data.uid,
            cid: data.cid,
            deleted: true,
            locked: true,
            mainPid: 0,
            title: data.title,
            slug: `${tid}/${slugify(data.title) || 'topic'}`,
            timestamp: timestamp,
            lastposttime: 0,
            content: true,
            postcount: 0,
            viewcount: 0,
            fromQueue: true,
            isMain: true,
            scheduled: timestamp > Date.now(),
            
            
        };

        if (Array.isArray(data.tags) && data.tags.length) {
            topicData.tags = data.tags.join(',');
        }

        let result = await plugins.hooks.fire('filter:topic.create', { topic: topicData, data: data });
        topicData = result.topic;
        await db.setObject(`topic:${topicData.tid}`, topicData);

        let timestampedSortedSetKeys = [
            'topics:tid',
            `cid:${topicData.cid}:tids`,
            `cid:${topicData.cid}:uid:${topicData.uid}:tids`,
        ];

        let scheduled = timestamp > Date.now();
        if (scheduled) {
            timestampedSortedSetKeys.push('topics:scheduled');
        }

        await Promise.all([
            db.sortedSetsAdd(timestampedSortedSetKeys, timestamp, topicData.tid),
            db.sortedSetsAdd([
                'topics:views', 'topics:posts', 'topics:votes',
                `cid:${topicData.cid}:tids:votes`,
                `cid:${topicData.cid}:tids:posts`,
                `cid:${topicData.cid}:tids:views`,
            ], 0, topicData.tid),
            user.addTopicIdToUser(topicData.uid, topicData.tid, timestamp),
            db.incrObjectField(`category:${topicData.cid}`, 'topic_count'),
            db.incrObjectField('global', 'topicCount'),
            Topics.createTags(data.tags, topicData.tid, timestamp),
            scheduled ? Promise.resolve() : categories.updateRecentTid(topicData.cid, topicData.tid),
        ]);
        if (scheduled) {
            await Topics.scheduled.pin(tid, topicData);
        }

        plugins.hooks.fire('action:topic.save', { topic: _.clone(topicData), data: data });
        return topicData.tid;
    },

    
    post = async function (data: TopicData): Promise<TopicData> {
        data = await plugins.hooks.fire('filter:topic.post', data) as TopicData;
        const { uid } = data;

        data.title = String(data.title).trim();
        data.tags = (data.tags || []) as string; 
        if (data.content) {
            data.content = utils.rtrim(data.content);
        }
        Topics.checkTitle(data.title);
        await Topics.validateTags(data.tags, data.cid, uid);
        data.tags = await Topics.filterTags(data.tags, data.cid);
        if (!data.fromQueue) {
            Topics.checkContent(data.content);
        }

        const [categoryExists, canCreate, canTag] = await Promise.all([
            categories.exists(data.cid),
            privileges.categories.can('topics:create', data.cid, uid),
            privileges.categories.can('topics:tag', data.cid, uid),
        ]);

        if (!categoryExists) {
            throw new Error('[[error:no-category]]');
        }

        if (!canCreate || (!canTag && data.tags.length)) {
            throw new Error('[[error:no-privileges]]');
        }

       

        const tid = await Topics.create(data);

        let postData = data;
        postData.tid = tid;
        postData.ip = data.req ? data.req.ip : null;
        postData.isMain = true;
        postData = await posts.create(postData);
        

        const [settings, topics] = await Promise.all([
            user.getSettings(uid),
           
        ]);

        if (!Array.isArray(topics) || !topics.length) {
            throw new Error('[[error:no-topic]]');
        }

        
        const topicData = topics[0];
        topicData.unreplied = true;
        topicData.mainPost = postData;
        topicData.index = 0;
        

        

        analytics.increment(['topics', `topics:byCid:${topicData.cid}`]);
        plugins.hooks.fire('action:topic.post', { topic: topicData, post: postData, data: data });

       

        return topicData
            
    },

        reply = async function (data: TopicData): Promise<TopicData> {
        data = await plugins.hooks.fire('filter:topic.reply', data);
        const { tid } = data;
        const { uid } = data;

        const topicData = await Topics.getTopicData(tid);

        

        data.cid = topicData.cid;

        
        if (!data.fromQueue) {
            await user.isReadyToPost(uid, data.cid);
            Topics.checkContent(data.content);
        }

        // For replies to scheduled topics, don't have a timestamp older than topic's itself
        if (topicData.scheduled) {
            data.timestamp = topicData.lastposttime + 1;
        }

        data.ip = data.req ? data.req.ip : null;
        let postData = await posts.create(data);
        

        

       
        analytics.increment(['posts', `posts:byCid:${data.cid}`]);
        plugins.hooks.fire('action:topic.reply', { post: _.clone(postData), data: data });

        return postData;
    },


   

    canReply = async function (data:TopicData, topicData:TopicData) {
        if (!topicData) {
            throw new Error('[[error:no-topic]]');
        }
        const { tid, uid } = data;
        const { cid, deleted, locked, scheduled } = topicData;

        const [canReply, canSchedule, isAdminOrMod] = await Promise.all([
            privileges.topics.can('topics:reply', tid, uid),
            privileges.topics.can('topics:schedule', tid, uid),
            privileges.categories.isAdminOrMod(cid, uid),
        ]);

        if (locked && !isAdminOrMod) {
            throw new Error('[[error:topic-locked]]');
        }

        if (!scheduled && deleted && !isAdminOrMod) {
            throw new Error('[[error:topic-deleted]]');
        }

        if (scheduled && !canSchedule) {
            throw new Error('[[error:no-privileges]]');
        }

        if (!canReply) {
            throw new Error('[[error:no-privileges]]');
        }
    }
}
