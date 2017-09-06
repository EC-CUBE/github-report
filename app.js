const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const SLACK_API_TOKEN = process.env.SLACK_API_TOKEN;
const SLACK_CHANNEL = process.env.SLACK_CHANNEL;

const GitHub = require('github-api');
const SlackClient = require('@slack/client').WebClient;
const gh = new GitHub({'token': GITHUB_TOKEN});
const co = require('co');

co(function*() {
    let data = yield gh.getIssues('EC-CUBE', 'ec-cube').listIssues({"milestone":"none", "state":"open"});
    if (data.data.length) {
        let issueUrls = data.data.map(issue => issue.html_url);

        if (SLACK_API_TOKEN) {
            let web = new SlackClient(SLACK_API_TOKEN);
            yield web.chat.postMessage(SLACK_CHANNEL, issueUrls.join('\n'), {username:'本日のNo Milestone'});
        }
    }
}).catch(e => {
    console.log(e);
    process.exit(1);
});
