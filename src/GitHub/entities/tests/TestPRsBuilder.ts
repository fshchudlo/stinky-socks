import { ImportParams } from "../ImportParams";

export class TestPRsBuilder {
    pullRequest(): ImportParams {
        return {
            teamName: "Test team",
            botUserNames: ["dependabot"],
            pullRequest: {
                created_at: "2021-01-01T00:00:00Z",
                updated_at: "2021-01-01T00:01:00Z",
                merged_at: "2021-01-01T00:03:00Z",
                user: {
                    login: "TestUser",
                    type: "User",
                    html_url: "https://github.com/TestUser"
                },
                author_association: "OWNER",
                html_url: "https://github.com/TestOwner/TestRepo/pull/1",
                number: 1,
                requested_reviewers: [],
                assignees: [],
                base: {
                    ref: "main",
                    repo: {
                        owner: {
                            login: "TestOwner",
                            type: "Organization",
                            html_url: "https://github.com/TestOwner"
                        },
                        name: "TestRepo"
                    }
                }
            },
            activities: [],
            files: []
        };
    }
}