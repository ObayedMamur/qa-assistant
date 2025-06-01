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
            error_log('QA Assistant - Error getting current branch: ' . $e->getMessage());
        }

        return false;
    }

    /**
     * Get all branches for a repository
     *
     * @param string $path Repository path
     * @return array Array of branch names
     */
    public function getBranches($path)
    {
        if (!$this->isGitRepository($path)) {
            return [];
        }

        try {
            $repo = $this->git->open($path);
            return $repo->getBranches();
        } catch (GitException $e) {
            error_log('QA Assistant - Error getting branches: ' . $e->getMessage());
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
            error_log('QA Assistant - Error getting repository status: ' . $e->getMessage());
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
            
            // Validate branch exists
            $branches = $repo->getBranches();
            if (!in_array($branch, $branches)) {
                return [
                    'success' => false,
                    'error' => "Branch '{$branch}' does not exist"
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

            // Checkout the branch
            $repo->checkout($branch);

            // Try to pull latest changes
            try {
                $repo->execute(['pull', 'origin', $branch]);
            } catch (GitException $e) {
                // Pull might fail if no remote or other issues, but checkout succeeded
                error_log('QA Assistant - Warning during pull: ' . $e->getMessage());
            }

            return [
                'success' => true,
                'message' => "Successfully switched to branch '{$branch}'",
                'current_branch' => $branch
            ];

        } catch (GitException $e) {
            error_log('QA Assistant - Error switching branch: ' . $e->getMessage());
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
            $repo->execute(['fetch', '--all']);
            
            return [
                'success' => true,
                'message' => 'Successfully fetched latest changes'
            ];
        } catch (GitException $e) {
            error_log('QA Assistant - Error fetching changes: ' . $e->getMessage());
            return [
                'success' => false,
                'error' => 'Failed to fetch changes: ' . $e->getMessage()
            ];
        }
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
                error_log('QA Assistant - Warning during fetch: ' . $e->getMessage());
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
            error_log('QA Assistant - Error getting branch comparison: ' . $e->getMessage());
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
            error_log('QA Assistant - Error pulling changes: ' . $e->getMessage());
            return [
                'success' => false,
                'error' => 'Pull operation failed: ' . $e->getMessage()
            ];
        }
    }
}
