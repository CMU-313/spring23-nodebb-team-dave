'use strict';

define('forum/topic/endorsements', [
    'components', 'translator', 'api', 'hooks', 'bootbox', 'alerts',
], function (components, translator, api, hooks, bootbox, alerts) {
    const Endorsements = {};

    Endorsements.addEndorsementHandler = function () {
        components.get('topic').on('click', '[data-pid] [component="post/endorsement"]', toggleEndorsement);
    };

    Endorsements.toggleEndorsement = function (pid) {
        const post = $('[data-pid=' + pid + ']');
        const currentState = post.find('.endorsed').length;
    
        const method = currentState ? 'del' : 'put';
    
        api[method](`/posts/${pid}/endorsement`, function (err) {
            if (err) {
                if (!app.user.uid) {
                    ajaxify.go('login');
                    return;
                }
                return alerts.error(err);
            }
    
            hooks.fire('action:post.toggleEndorsement', {
                pid: pid,
                unendorse: method === 'del',
            });
        });
    
        return false;
    };    

    return Endorsements;
});
