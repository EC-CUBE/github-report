const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

const GitHub = require('github-api');
const gh = new GitHub({'token': GITHUB_TOKEN});
const co = require('co');

co(function*() {

    console.log(`Repository\tMilestone\tLabel\tPR count`)

    let org = gh.getOrganization('EC-CUBE')
    let repos = yield org._requestAllPages(`/orgs/EC-CUBE/repos`, {direction: 'desc', type:'public'});

    for (let repo of repos.data) {

        let issueWrapper = gh.getIssues('EC-CUBE', repo.name);
        let milestones = yield issueWrapper.listMilestones()

        /*
         * マイルストーンごとのPR数
         */

        let prs = yield gh.getRepo('EC-CUBE', repo.name).listPullRequests()
        let prCountEachMilestone = prs.data.reduce((prev, current) => {
            prev.set(current.milestone.title, prev.get(current.milestone.title) + 1);
            return prev;
        }, milestones.data.reduce((p, c) => { p.set(c.title, 0); return p }, new Map()))

        prCountEachMilestone.forEach((v, k) => console.log(`${repo.name}\t${k}\t\t${v}`))

        /*
         * マイルストーンごとのfixme/discussionラベルのPR数
         */
        let labels = yield org._requestAllPages(`/repos/EC-CUBE/${repo.name}/labels`);
        let targetLabels = labels.data.filter(label => label.name.match(/fix-me|discussion/i));

        for (let milestone of milestones.data) {
            let openIssuesCount = 0;
            if (targetLabels.length) {
                // ラベルごとのPR数
                for (let label of targetLabels) {
                    let labledIessues = yield issueWrapper.listIssues({'milestone':milestone.number, labels:label.name});
                    let labledPRs = labledIessues.data.filter(issue => issue.pull_request)
                    openIssuesCount += labledPRs.length;
                }
                // 重複分を排除
                if (targetLabels.length >=2) {
                    let allLabledIessues = yield issueWrapper.listIssues({'milestone':milestone.number, labels:targetLabels.map(label => label.name).join(',')});
                    let allLabledPRs = allLabledIessues.data.filter(issue => issue.pull_request)
                    openIssuesCount -= allLabledPRs.length;
                }
            }
            console.log(`${repo.name}\t${milestone.title}\tfixme/disscussion\t${openIssuesCount}`)
        }
    }

}).catch(e => {
    console.log(e);
    process.exit(1);
});
