<?php

namespace QaAssistant;

use CzProject\GitPhp\Git;

/**
 * Ajax handler class
 */
class Ajax {

    protected $git;
    /**
     * Class constructor
     */
    function __construct() {
        //qa_assistant_get_branch_data
        add_action('wp_ajax_qa_assistant_get_branch_data', [ $this, 'get_branch_data' ]);
        $this->git = new Git();

    }

    public function get_branch_data() {
        // $plugin_dir = $_POST['plugin_dir'];
        // $branches = $_POST['branches'];
        // $alias = $_POST['alias'];
        // $color = $_POST['color'];
        $plugin_dir = sanitize_text_field($_POST['plugin_dir']);
        $path = WP_PLUGIN_DIR . '/' . $plugin_dir; // static for now. get from post data
        
        $branch = sanitize_text_field($_POST['branch']);

        // create repo object
        $repo = $this->git->open($path);
        // gets name of current branch
        // $branches = $repo->getBranches();
        $repo->pull(['origin', $branch]);
        $repo->checkout($branch);

        $response = [
            // 'plugin_dir' => $plugin_dir,
            // 'branches' => $branches,
            // 'alias' => $alias,
            'branch' => $branch,
        ];

        wp_send_json_success($response);
    }
    
}
