;(function($) {

    $(document).ready(function() {
        $('.qa-assistant-select2').select2();

        $(document).on('click', '.qa_assistant_git-branch-list-items', function() {
            let elementId = $(this).attr('id');
            let pluginDir = getPluginSlug(elementId);
            let branchId = elementId.split('_').pop();

            let $this = $(this);

            // Remove any existing loaders first
            $this.find('.qa-loader').remove();

            // Add loader inside the <a> tag
            let loader = $('<span class="qa-loader" style="margin-left: 5px;">⏳</span>');
            $this.children().first().append(loader);

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
                        location.reload();
                    } else {
                        alert('Something Went Wrong! ❌');
                    }
                },
                complete: function() {
                    // Remove loader after request is complete
                    loader.remove();
                }
            });
        });

        function getPluginSlug(elementId) {
            let parts = elementId.split("_"); 
            return parts[2]; // Extract the plugin slug
        }

    });

})(jQuery);
