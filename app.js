const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const SLACK_API_TOKEN = process.env.SLACK_API_TOKEN;
const SLACK_CHANNEL = process.env.SLACK_CHANNEL;

const GitHub = require('github-api');
const SlackClient = require('@slack/client').WebClient;
const gh = new GitHub({'token': GITHUB_TOKEN});

function postToSlack(message, opts) {
    if (SLACK_API_TOKEN) {
        let web = new SlackClient(SLACK_API_TOKEN);
        web.chat.postMessage(SLACK_CHANNEL, message, opts);
    }
}

gh.getIssues('EC-CUBE', 'ec-cube').listIssues({"milestone":"none", "state":"open"}).then(function(data) {
    if (data.data) {
        let issueUrls = data.data.map(function(issue) {
            return issue.html_url
        });
        postToSlack(issueUrls.join('\n'), {username:'本日のNo Milestone'});
    }
}).catch(function(e) {
    console.log(e);
    process.exit(1);
});
