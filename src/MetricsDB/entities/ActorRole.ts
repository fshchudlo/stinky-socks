export enum ActorRole {
    /** The author is a member of the team that owns the repository. */
    MEMBER = "MEMBER",

    /** The author is not a member of the team that owns the repository. */
    CONTRIBUTOR = "CONTRIBUTOR",

    /** The author affiliation is unknown. */
    UNKNOWN = "UNKNOWN"
}