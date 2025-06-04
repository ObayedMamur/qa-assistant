<?php

namespace QaAssistant;

use CzProject\GitPhp\Git;
use CzProject\GitPhp\GitException;

/**
 * Git operations manager class
 * Handles all Git-related operations with proper error handling and validation
 */
class GitManager
{
    /**
     * Git instance
     *
     * @var Git
     */
    protected $git;

    /**
     * Class constructor
     */
    public function __construct()
    {
        $this->git = new Git();
    }

    /**
     * Get current branch for a given path
     *
     * @param string $path Repository path
     * @return string|false Current branch name or false on failure
     */
    public function getCurrentBranch($path)
    {
        if (!$this->isGitRepository($path)) {
            return false;
        }

        try {
            $git_head_file = $path . '/.git/HEAD';
            if (file_exists($git_head_file)) {
                $contents = file_get_contents($git_head_file);
                if (strpos($contents, 'ref:') === 0) {
                    return trim(str_replace('ref: refs/heads/', '', $contents));
                }
            }
        } catch (\Exception $e) {
            // Silently handle error - branch detection failed
        }

        return false;
    }

    /**
     * Get all branches for a repository
     *
     * @param string $path Repository path
     * @param bool $fetch Whether to fetch from remote first
     * @return array Array of branch names
     */
    public function getBranches($path, $fetch = true)
    {
        if (!$this->isGitRepository($path)) {
            return [];
        }

        try {
            $repo = $this->git->open($path);

            // Fetch latest branches from remote first
            if ($fetch) {
                try {
                    $repo->execute(['fetch', '--all', '--prune']);
                } catch (GitException $e) {
                    // Fetch might fail (no remote, network issues), continue anyway
                }
            }

            // Get all branches (local and remote)
            $allBranches = $repo->getBranches();
            $localBranches = [];
            $remoteBranches = [];

            foreach ($allBranches as $branch) {
                if (strpos($branch, 'remotes/origin/') === 0) {
                    // Extract branch name from remote reference
                    $branchName = str_replace('remotes/origin/', '', $branch);
                    // Skip HEAD reference
                    if ($branchName !== 'HEAD') {
                        $remoteBranches[] = $branchName;
                    }
                } else {
                    $localBranches[] = $branch;
                }
            }

            // Combine local branches with remote branches that don't have local counterparts
            $combinedBranches = $localBranches;
            foreach ($remoteBranches as $remoteBranch) {
                if (!in_array($remoteBranch, $localBranches)) {
                    $combinedBranches[] = $remoteBranch;
                }
            }

            return $combinedBranches;
        } catch (GitException $e) {
            // Silently handle error - return empty array
            return [];
        }
    }

    /**
     * Get repository status
     *
     * @param string $path Repository path
     * @return array Status information
     */
    public function getRepositoryStatus($path)
    {
        if (!$this->isGitRepository($path)) {
            return [
                'valid' => false,
                'error' => 'Not a Git repository'
            ];
        }

        try {
            $repo = $this->git->open($path);
            $currentBranch = $this->getCurrentBranch($path);
            $hasChanges = $repo->hasChanges();
            
            return [
                'valid' => true,
                'current_branch' => $currentBranch,
                'has_changes' => $hasChanges,
                'branches' => $this->getBranches($path)
            ];
        } catch (GitException $e) {
            return [
                'valid' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Switch to a different branch
     *
     * @param string $path Repository path
     * @param string $branch Target branch name
     * @param bool $force Force checkout (discard local changes)
     * @return array Operation result
     */
    public function switchBranch($path, $branch, $force = false)
    {
        if (!$this->isGitRepository($path)) {
            return [
                'success' => false,
                'error' => 'Not a Git repository'
            ];
        }

        try {
            $repo = $this->git->open($path);

            // Fetch latest branches and validate branch exists
            $branches = $this->getBranches($path, true);
            if (!in_array($branch, $branches)) {
                return [
                    'success' => false,
                    'error' => "Branch '{$branch}' does not exist. Try refreshing to see latest branches."
                ];
            }

            // Check for uncommitted changes
            if ($repo->hasChanges() && !$force) {
                return [
                    'success' => false,
                    'error' => 'You have uncommitted changes. Please commit or stash them first.',
                    'has_changes' => true
                ];
            }

            // Force reset if requested
            if ($force && $repo->hasChanges()) {
                $repo->execute(['reset', '--hard']);
            }

            // Check if this is a local branch or needs to be created from remote
            $localBranches = [];
            try {
                $localBranches = $repo->execute(['branch', '--list', $branch]);
            } catch (GitException $e) {
                // Continue if command fails
            }

            if (empty($localBranches)) {
                // Branch doesn't exist locally, create it from remote
                try {
                    $repo->execute(['checkout', '-b', $branch, "origin/{$branch}"]);
                } catch (GitException $e) {
                    // If that fails, try regular checkout (might be a local branch)
                    $repo->checkout($branch);
                }
            } else {
                // Local branch exists, just checkout
                $repo->checkout($branch);

                // Try to pull latest changes if there's a remote
                try {
                    $repo->execute(['pull', 'origin', $branch]);
                } catch (GitException $e) {
                    // Pull might fail if no remote or other issues, but checkout succeeded
                    // Silently continue
                }
            }

            return [
                'success' => true,
                'message' => "Successfully switched to branch '{$branch}'",
                'current_branch' => $branch
            ];

        } catch (GitException $e) {
            return [
                'success' => false,
                'error' => 'Git operation failed: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Check if a path is a valid Git repository
     *
     * @param string $path Path to check
     * @return bool True if valid Git repository
     */
    public function isGitRepository($path)
    {
        return is_dir($path . '/.git');
    }

    /**
     * Fetch latest changes from remote
     *
     * @param string $path Repository path
     * @return array Operation result
     */
    public function fetchChanges($path)
    {
        if (!$this->isGitRepository($path)) {
            return [
                'success' => false,
                'error' => 'Not a Git repository'
            ];
        }

        try {
            $repo = $this->git->open($path);
            $repo->execute(['fetch', '--all', '--prune']);

            return [
                'success' => true,
                'message' => 'Successfully fetched latest changes and branches'
            ];
        } catch (GitException $e) {
            return [
                'success' => false,
                'error' => 'Failed to fetch changes: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Refresh branches by fetching from remote and returning updated list
     *
     * @param string $path Repository path
     * @return array Operation result with branches
     */
    public function refreshBranches($path)
    {
        if (!$this->isGitRepository($path)) {
            return [
                'success' => false,
                'error' => 'Not a Git repository'
            ];
        }

        // Fetch latest changes first
        $fetchResult = $this->fetchChanges($path);
        if (!$fetchResult['success']) {
            // Even if fetch fails, try to get local branches
        }

        // Get updated branch list
        $branches = $this->getBranches($path, false); // Don't fetch again
        $currentBranch = $this->getCurrentBranch($path);

        return [
            'success' => true,
            'message' => 'Branches refreshed successfully',
            'branches' => $branches,
            'current_branch' => $currentBranch,
            'fetch_result' => $fetchResult
        ];
    }

    /**
     * Get branch comparison info (ahead/behind)
     *
     * @param string $path Repository path
     * @param string $branch Branch to compare
     * @return array Comparison info
     */
    public function getBranchComparison($path, $branch)
    {
        if (!$this->isGitRepository($path)) {
            return ['error' => 'Not a Git repository'];
        }

        try {
            $repo = $this->git->open($path);

            // Fetch latest changes first
            try {
                $repo->execute(['fetch', 'origin']);
            } catch (GitException $e) {
                // Fetch might fail, continue anyway
                // Silently continue
            }

            // Get ahead/behind counts
            try {
                $ahead = $repo->execute(['rev-list', '--count', "origin/{$branch}..{$branch}"]);
                $behind = $repo->execute(['rev-list', '--count', "{$branch}..origin/{$branch}"]);

                $aheadCount = intval(trim($ahead[0] ?? '0'));
                $behindCount = intval(trim($behind[0] ?? '0'));

                return [
                    'ahead' => $aheadCount,
                    'behind' => $behindCount,
                    'up_to_date' => ($aheadCount === 0 && $behindCount === 0),
                    'has_remote' => true
                ];
            } catch (GitException $e) {
                // If comparison fails, assume no remote or other issue
                return [
                    'ahead' => 0,
                    'behind' => 0,
                    'up_to_date' => true,
                    'has_remote' => false,
                    'error' => 'Unable to compare with remote'
                ];
            }
        } catch (GitException $e) {
            return ['error' => $e->getMessage()];
        }
    }

    /**
     * Pull latest changes for current branch
     *
     * @param string $path Repository path
     * @return array Operation result
     */
    public function pullCurrentBranch($path)
    {
        if (!$this->isGitRepository($path)) {
            return [
                'success' => false,
                'error' => 'Not a Git repository'
            ];
        }

        try {
            $repo = $this->git->open($path);
            $currentBranch = $this->getCurrentBranch($path);

            if (!$currentBranch) {
                return [
                    'success' => false,
                    'error' => 'Unable to determine current branch'
                ];
            }

            // Check for uncommitted changes
            if ($repo->hasChanges()) {
                return [
                    'success' => false,
                    'error' => 'You have uncommitted changes. Please commit or stash them before pulling.',
                    'has_changes' => true
                ];
            }

            // Pull from origin
            $output = $repo->execute(['pull', 'origin', $currentBranch]);

            return [
                'success' => true,
                'message' => "Successfully pulled latest changes for branch '{$currentBranch}'",
                'output' => implode("\n", $output),
                'branch' => $currentBranch
            ];

        } catch (GitException $e) {
            return [
                'success' => false,
                'error' => 'Pull operation failed: ' . $e->getMessage()
            ];
        }
    }
}
