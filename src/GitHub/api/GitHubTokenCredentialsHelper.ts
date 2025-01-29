export function fetchNextTokenHeader(tokens: string[]){
    return Promise.resolve(`token ${tokens[0]}`)
}