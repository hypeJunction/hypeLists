define(function (require) {

	var $ = require('jquery');

	$(document).on('initialize', '.elgg-list,.elgg-gallery,.elgg-no-results', function () {
		var $list = $(this);
		var $container = $list.parent('.elgg-list-container:not(.elgg-state-ready)');
		if (!$container.length) {
			return;
		}

		var options = $container.data();
		require(['hypeList'], function () {
			$list.hypeList(options);
			$container.addClass('elgg-state-ready');
		});
	});
});
