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
        let attachements = data.data.map(issue => {
            return {
                text: `<${issue.html_url}|#${issue.number}> ${issue.title}`
            }
        })
        if (SLACK_API_TOKEN) {
            let web = new SlackClient(SLACK_API_TOKEN);
            yield web.chat.postMessage(SLACK_CHANNEL, null, {username:'本日のNo Milestone',attachments:attachements});
        }
    }
}).catch(e => {
    console.log(e);
    process.exit(1);
});
