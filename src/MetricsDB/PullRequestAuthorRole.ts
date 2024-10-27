export enum PullRequestAuthorRole {
    /** The author is the owner of the repository. */
    OWNER = "OWNER",

    /** The author is a member of the organization that owns the repository. */
    MEMBER = "MEMBER",

    /** The author has write access to the repository. */
    COLLABORATOR = "COLLABORATOR",

    /** The author is making their first contribution to any repository in the organization. */
    FIRST_TIMER = "FIRST_TIMER",

    /** The author is contributing to this particular repository for the first time. */
    FIRST_TIME_CONTRIBUTOR = "FIRST_TIME_CONTRIBUTOR",

    /** The author has previously committed to the repository but is not necessarily a member or collaborator. */
    CONTRIBUTOR = "CONTRIBUTOR",

    /** The author is a placeholder for a previously deleted user. */
    MANNEQUIN = "MANNEQUIN",

    /** The author has no affiliation with the repository. */
    NONE = "NONE"
}