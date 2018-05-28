import { execSync } from 'child_process';

export function clone(source: string, destination: string, branch: string) {
  execSync(`git clone ${source} ${destination} -b ${branch}`);
}

export function pull(cwd: string) {
  execSync(`git pull`, { cwd });
}

export function checkout(cwd: string, branch: string) {
  execSync(`git checkout ${branch}`, { cwd });
}
