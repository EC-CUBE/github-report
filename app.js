const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const SLACK_API_TOKEN = process.env.SLACK_API_TOKEN;
const SLACK_CHANNEL = process.env.SLACK_CHANNEL;

const GitHub = require('github-api');
const SlackClient = require('@slack/client').WebClient;
const gh = new GitHub({'token': GITHUB_TOKEN});
const co = require('co');
const START_DATE = process.env.START_DATE || new Date(new Date().setDate(-31)).toISOString();

co(function*() {
    let org = gh.getOrganization('EC-CUBE')
    let startDate = new Date(START_DATE);
    console.log(`FROM: ${startDate}`);
    let repos = yield org._requestAllPages(`/orgs/EC-CUBE/repos`, {direction: 'desc', type:'public'});
    console.log(`|Repository|Base|PR|Date|Title|User|`)
    console.log(`|---|---|---|---|---|---|`)
    for (let repo of repos.data) {
        let prs = yield gh.getRepo('EC-CUBE', repo.name).listPullRequests({'state':'closed', 'sort': 'updated', 'direction':'desc', 'per_page':100})
        for (let pr of prs.data) {
            if (pr.merged_at) {
                let merged_at = new Date(pr.merged_at)
                if (merged_at > startDate) {
                    console.log(`|${repo.name}|${pr.base.ref}|[#${pr.number}](${pr.html_url})|${merged_at.getFullYear()}-${merged_at.getMonth()+1}-${merged_at.getDate()}|${pr.title}|${pr.user.login}|`)
                }
            }
        }
    }
}).catch(e => {
    console.log(e);
    process.exit(1);
});
