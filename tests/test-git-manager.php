<?php
/**
 * Simple test file for GitManager functionality
 * This is a basic test to verify the GitManager class works correctly
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Simple test class for GitManager
 */
class QA_Assistant_GitManager_Test
{
    private $gitManager;
    private $testResults = [];

    public function __construct()
    {
        // Only run tests if we're in admin and user has proper permissions
        if (!is_admin() || !function_exists('current_user_can') || !current_user_can('manage_options')) {
            return;
        }

        if (file_exists(QA_ASSISTANT_PATH . '/includes/GitManager.php')) {
            require_once QA_ASSISTANT_PATH . '/includes/GitManager.php';
            $this->gitManager = new QaAssistant\GitManager();
        }
    }

    /**
     * Run all tests
     */
    public function runTests()
    {
        if (!$this->gitManager) {
            return ['error' => 'GitManager not initialized'];
        }

        $this->testResults = [];

        // Test 1: Check if GitManager can be instantiated
        $this->testResults['instantiation'] = $this->testInstantiation();

        // Test 2: Test isGitRepository method
        $this->testResults['git_repository_check'] = $this->testGitRepositoryCheck();

        // Test 3: Test getCurrentBranch method
        $this->testResults['current_branch'] = $this->testGetCurrentBranch();

        // Test 4: Test getBranches method
        $this->testResults['get_branches'] = $this->testGetBranches();

        return $this->testResults;
    }

    /**
     * Test GitManager instantiation
     */
    private function testInstantiation()
    {
        try {
            return [
                'status' => 'pass',
                'message' => 'GitManager instantiated successfully',
                'class' => get_class($this->gitManager)
            ];
        } catch (Exception $e) {
            return [
                'status' => 'fail',
                'message' => 'Failed to instantiate GitManager: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Test isGitRepository method
     */
    private function testGitRepositoryCheck()
    {
        try {
            // Test with a non-git directory
            $nonGitPath = WP_CONTENT_DIR;
            $isNotGit = $this->gitManager->isGitRepository($nonGitPath);

            // Test with plugin directory (might or might not be git)
            $pluginPath = QA_ASSISTANT_PATH;
            $isPluginGit = $this->gitManager->isGitRepository($pluginPath);

            return [
                'status' => 'pass',
                'message' => 'Git repository check working',
                'non_git_result' => $isNotGit,
                'plugin_git_result' => $isPluginGit
            ];
        } catch (Exception $e) {
            return [
                'status' => 'fail',
                'message' => 'Git repository check failed: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Test getCurrentBranch method
     */
    private function testGetCurrentBranch()
    {
        try {
            $pluginPath = QA_ASSISTANT_PATH;
            $currentBranch = $this->gitManager->getCurrentBranch($pluginPath);

            return [
                'status' => 'pass',
                'message' => 'getCurrentBranch method working',
                'current_branch' => $currentBranch,
                'is_git_repo' => $this->gitManager->isGitRepository($pluginPath)
            ];
        } catch (Exception $e) {
            return [
                'status' => 'fail',
                'message' => 'getCurrentBranch test failed: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Test getBranches method
     */
    private function testGetBranches()
    {
        try {
            $pluginPath = QA_ASSISTANT_PATH;
            $branches = $this->gitManager->getBranches($pluginPath);

            return [
                'status' => 'pass',
                'message' => 'getBranches method working',
                'branches' => $branches,
                'branch_count' => count($branches)
            ];
        } catch (Exception $e) {
            return [
                'status' => 'fail',
                'message' => 'getBranches test failed: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Display test results in admin
     */
    public function displayTestResults()
    {
        if (!is_admin() || !function_exists('current_user_can') || !current_user_can('manage_options')) {
            return;
        }

        $results = $this->runTests();

        echo '<div class="notice notice-info">';
        echo '<h3>QA Assistant - GitManager Test Results</h3>';
        
        foreach ($results as $testName => $result) {
            $status = $result['status'] ?? 'unknown';
            $statusClass = $status === 'pass' ? 'notice-success' : 'notice-error';
            
            echo '<div class="' . $statusClass . '" style="margin: 10px 0; padding: 10px;">';
            echo '<strong>' . ucfirst(str_replace('_', ' ', $testName)) . ':</strong> ';
            echo $result['message'];
            
            if (isset($result['current_branch'])) {
                echo '<br><em>Current Branch: ' . ($result['current_branch'] ?: 'Not a Git repository') . '</em>';
            }
            
            if (isset($result['branches']) && is_array($result['branches'])) {
                echo '<br><em>Available Branches: ' . implode(', ', $result['branches']) . '</em>';
            }
            
            echo '</div>';
        }
        
        echo '</div>';
    }
}

// Initialize and run tests if in admin (safely)
if (is_admin()) {
    add_action('admin_notices', function() {
        if (function_exists('current_user_can') && current_user_can('manage_options') &&
            isset($_GET['qa_assistant_test']) && $_GET['qa_assistant_test'] === '1') {
            $test = new QA_Assistant_GitManager_Test();
            $test->displayTestResults();
        }
    });
}
