# SourceJS team developers agreements

## Single feature (issue, etc.) development step-by-step guide.

1. Create new branch which is forked from current Release Candidate branch.
1. Name it according to the next template: `[developer second name | nickname]/[issue | task | feature | changeslist name]`. E.g. `smith/search-redesign`.
1. Develop and test your code changes. Atomic commits and informative commit messages are required.
1. Merge RC branch into yours, if your changes are implemented.
1. Create Pull Request from your branch into Release Candidate branch. Please don't forget that PR description should be useful and informative. It is very important for release notes.
1. Approved PR should be merged into current RC branch. Squashed commits are possible but they aren't preferable.
1. Merged feature branch should be removed from remote repo.

## Common points of work with repo.
1. Branch naming template: `[developers second name | nickname]/[issue | task | feature | changes list name]`.
1. Atomic commits and informative commit messages.
1. Version bumps according to [specification](http://semver.org/).
1. Using Pull Requests to apply changes.
1. PR description should be useful and informative. It is very important for release notes.
1. Release candidate branches usage for changes and tests. 
1. Github releases and tags usage for each changes list (for RC branches).

Example:
 - Current version is `0.4.0` (branch: `master`)
 - Upcoming version is `0.4.1` (branch: `rc0.4.1`, initially forked from master).
 - Several developers create their own feature-branches (`rc0.4.1` forks) to implement some features (resolve a couple of issues, etc.).E.g. `smith/code-linting`, `somePerson/middleware-polishing`.
 - Then changes are implemented they create PR from `nickname/feature` branch to `rc0.4.1`. Last commit in each of brunches is the merge of the RC branch into current one.
 - Accepted PRs are merged into rc0.4.1. After that merged features are removed from remote repo.
 - Then the RC branch is ready it becomes a kind of beta, which can be tested or used to create some demos, etc. Some fixes are possible if needed.
 - New release should be marked by tag with release notes. Release notes text can be formed from PR descriptions.
