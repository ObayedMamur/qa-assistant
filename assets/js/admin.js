;(function($) {

    $(document).ready(function() {
        $('.qa-assistant-select2').select2();

        $(document).on('click', '.qa_assistant_git-branch-list-items', function() {
            let elementId = $(this).attr('id');

            let pluginDir = getPluginSlug(elementId);
            
            let branchId = elementId.split('_').pop();

            $.ajax({
                url: qaAssistant.ajaxUrl,
                method: "POST",
                data: {
                    action: "qa_assistant_get_branch_data",
                    nonce: qaAssistant.nonce,
                    branch: branchId,
                    plugin_dir: pluginDir
                },
                success: function(response) {
                    if (response.success) {
                        // reload the page
                        location.reload();
                    } else {
                        alert('Something Went Wrong! ❌');
                    }
                }
            });
        });

        function getPluginSlug(elementId) {
            let parts = elementId.split("_"); 
            return parts[2]; // Extract the plugin slug
        }

    });


})(jQuery);
