define(function (require) {

	var $ = require('jquery');
	
	$(document).on('initialize', '.elgg-list,.elgg-gallery', function () {
		var $list = $(this);
		var $container = $list.parent('.elgg-list-container');
		if (!$container.length) {
			return;
		}

		var options = $container.data();
		require(['hypeList'], function () {
			$list.hypeList(options);
		});
	});

	$('.elgg-list,.elgg-gallery').trigger('initialize');
});
