export const PING_PREFIX = 'ping://';

export function isPingTarget(target) {
    return target.startsWith(PING_PREFIX);
}

export function displayTarget(target) {
    return isPingTarget(target) ? `${target.slice(PING_PREFIX.length)} [ping]` : target;
}
