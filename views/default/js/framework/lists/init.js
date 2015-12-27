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

	$(document).on('showLoader.spinner', '.elgg-list,.elgg-gallery', function () {
		if (require.defined('elgg/spinner')) {
			require(['elgg/spinner'], function (spinner) {
				spinner.start();
			});
		} else {
			$('body').addClass(this.options.classLoading);
		}
	}).on('hideLoader.spinner', '.elgg-list,.elgg-gallery', function () {
		if (require.defined('elgg/spinner')) {
			require(['elgg/spinner'], function (spinner) {
				spinner.stop();
			});
		} else {
			$('body').removeClass(this.options.classLoading);
		}
	});

	$('.elgg-list,.elgg-gallery').trigger('initialize');
});
