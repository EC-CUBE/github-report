const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const SLACK_API_TOKEN = process.env.SLACK_API_TOKEN;
const SLACK_CHANNEL = process.env.SLACK_CHANNEL;

const GitHub = require('github-api');
const SlackClient = require('@slack/client').WebClient;
const gh = new GitHub({'token': GITHUB_TOKEN});
const co = require('co');
const slack = new SlackClient(SLACK_API_TOKEN);
const IGNORE_REPOS = ['Eccube-Styleguide', 'Eccube-Styleguide-Admin'];

function hasMilestone(issue) {
    return issue.milestone != null;
}

/**
 * マージ待ちかどうかの判定
 * @param issue ISSUE
 * @param fixMeOrDiscussLabelIds fix-me/discussionラベルのIDリスト
 */
function isWaitForMerge(issue, fixMeOrDiscussLabelIds) {
    return issue.pull_request
        && issue.labels.filter(label => fixMeOrDiscussLabelIds.indexOf(label.id) >= 0).length == 0
        && !issue.title.match(/\[WIP\]/);
}

co(function*() {

    let yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    let org = gh.getOrganization('EC-CUBE');

    let repos = yield org._requestAllPages(`/orgs/EC-CUBE/repos`, {direction: 'desc', type:'public'});
    repos.data = repos.data.filter(repo => IGNORE_REPOS.indexOf(repo.name) < 0);

    for (let repo of repos.data) {

        console.log(repo.name);

        let issues = yield gh.getIssues('EC-CUBE', repo.name).listIssues({"state":"open"});

        // fixme/disscussionラベルを取得
        let labels = yield org._requestAllPages(`/repos/EC-CUBE/${repo.name}/labels`);
        let fixMeOrDiscussLabelIds = labels.data.filter(label => label.name.match(/fix-me|discussion/i)).map(label => label.id);

        let nomilestonesCount = 0;
        let waitForMergeCount = 0;
        if (issues.data.length) {
            let attachments = issues.data.map(issue => {
                let labels = [];

                if (!hasMilestone(issue)) {
                    nomilestonesCount++;
                    labels.push('マイルストーンなし');
                }

                if (isWaitForMerge(issue, fixMeOrDiscussLabelIds)) {
                    waitForMergeCount++;
                    labels.push('マージ待ち');
                }

                return labels.length && yesterday < new Date(issue.created_at) ? {
                    text: `<${issue.html_url}|#${issue.number}> ${issue.title}`,
                    author_name: issue.user.login,
                    author_link: issue.user.html_url,
                    author_icon: issue.user.avatar_url,
                    fields: [
                        {
                            title: labels.join(' ')
                        }
                    ]
                } : null;

            }).filter(issue => issue);

            if (nomilestonesCount || waitForMergeCount || attachments.length) {
                let text = '';
                if (nomilestonesCount) text += `マイルストーンなし ${nomilestonesCount}件\n`;
                if (waitForMergeCount) text += `マージ待ち ${waitForMergeCount}件\n`;
                if (attachments.length) text += `新規Issue/PR ${attachments.length}件\n`;
                yield slack.chat.postMessage(SLACK_CHANNEL, text, {'username':`本日の${repo.name}`, attachments:attachments, 'icon_emoji':':ishi-cube:'});
            }
        }
    }

}).catch(e => {
    console.log(e);
    process.exit(1);
});
